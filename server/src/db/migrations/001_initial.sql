-- ================================================================
-- DG Studio — Initial Schema
-- Run: psql $DATABASE_URL -f 001_initial.sql
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram search on product names

-- ── auto-update updated_at trigger ───────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── users ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── products ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id                  SERIAL       PRIMARY KEY,
  slug                VARCHAR(255) UNIQUE NOT NULL,
  name                VARCHAR(255) NOT NULL,
  category            VARCHAR(50)  NOT NULL,
  subcategory         VARCHAR(50),
  description         TEXT,
  short_description   TEXT,
  -- prices stored as cents to avoid floating-point issues
  price_cents         INTEGER      NOT NULL CHECK (price_cents > 0),
  sale_price_cents    INTEGER      CHECK (sale_price_cents > 0),
  badge               VARCHAR(50),
  is_new              BOOLEAN      DEFAULT FALSE,
  is_bestseller       BOOLEAN      DEFAULT FALSE,
  rating              NUMERIC(3,2) DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count        INTEGER      DEFAULT 0,
  active              BOOLEAN      DEFAULT TRUE,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_products_category    ON products(category) WHERE active;
CREATE INDEX idx_products_is_new      ON products(is_new)   WHERE active AND is_new;
CREATE INDEX idx_products_bestseller  ON products(is_bestseller) WHERE active AND is_bestseller;
CREATE INDEX idx_products_slug        ON products(slug);
CREATE INDEX idx_products_name_trgm   ON products USING gin(name gin_trgm_ops);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── product_images ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL  PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT    NOT NULL,
  position   SMALLINT DEFAULT 0
);

CREATE INDEX idx_product_images_product ON product_images(product_id, position);

-- ── product_variants (each size × color combination) ─────────────

CREATE TABLE IF NOT EXISTS product_variants (
  id         SERIAL       PRIMARY KEY,
  product_id INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       VARCHAR(20)  NOT NULL,
  color_name VARCHAR(50)  NOT NULL,
  color_hex  CHAR(7)      NOT NULL,
  stock      INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku        VARCHAR(100) UNIQUE NOT NULL
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ── product_details & product_care (ordered lists) ───────────────

CREATE TABLE IF NOT EXISTS product_details (
  id         SERIAL  PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  detail     TEXT    NOT NULL,
  position   SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_care (
  id          SERIAL  PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  instruction TEXT    NOT NULL,
  position    SMALLINT DEFAULT 0
);

-- ── product_related (undirected pairs) ───────────────────────────

CREATE TABLE IF NOT EXISTS product_related (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, related_id),
  CHECK (product_id <> related_id)
);

-- ── carts ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  session_id  VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_carts_session  ON carts(session_id);
CREATE INDEX idx_carts_user     ON carts(user_id);
CREATE INDEX idx_carts_expires  ON carts(expires_at);

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── cart_items ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID     NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  INTEGER  NOT NULL REFERENCES products(id),
  variant_id  INTEGER  NOT NULL REFERENCES product_variants(id),
  quantity    SMALLINT NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  price_cents INTEGER  NOT NULL,  -- snapshot at time of add
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cart_id, variant_id)    -- one row per variant per cart
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ── orders ────────────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
);

CREATE TABLE IF NOT EXISTS orders (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         REFERENCES users(id) ON DELETE SET NULL,
  email            VARCHAR(255) NOT NULL,
  status           order_status DEFAULT 'pending',
  subtotal_cents   INTEGER      NOT NULL,
  shipping_cents   INTEGER      NOT NULL,
  discount_cents   INTEGER      DEFAULT 0,
  total_cents      INTEGER      NOT NULL,
  shipping_method  VARCHAR(50)  DEFAULT 'standard',
  promo_code       VARCHAR(50),
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_orders_email   ON orders(email);
CREATE INDEX idx_orders_user    ON orders(user_id);
CREATE INDEX idx_orders_status  ON orders(status);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── order_items ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER      REFERENCES products(id) ON DELETE SET NULL,
  variant_id   INTEGER      REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity     SMALLINT     NOT NULL,
  price_cents  INTEGER      NOT NULL,
  -- denormalized snapshot — survives product edits/deletes
  product_name VARCHAR(255) NOT NULL,
  product_slug VARCHAR(255) NOT NULL,
  size         VARCHAR(20)  NOT NULL,
  color_name   VARCHAR(50)  NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── shipping_addresses ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID         NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  address1    VARCHAR(255) NOT NULL,
  address2    VARCHAR(255),
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  zip         VARCHAR(20)  NOT NULL,
  country     CHAR(2)      DEFAULT 'US'
);

-- ── promo_codes ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promo_codes (
  code          VARCHAR(50)  PRIMARY KEY,
  discount_rate NUMERIC(4,3) NOT NULL CHECK (discount_rate BETWEEN 0 AND 1),
  max_uses      INTEGER,     -- NULL = unlimited
  uses_count    INTEGER      DEFAULT 0,
  min_order_cents INTEGER    DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  active        BOOLEAN      DEFAULT TRUE
);

-- ── initial promo codes ───────────────────────────────────────────

INSERT INTO promo_codes (code, discount_rate, max_uses, min_order_cents) VALUES
  ('WELCOME10', 0.10, NULL,  0),
  ('DG20',      0.20, 500,   10000),
  ('VOID15',    0.15, NULL,  5000)
ON CONFLICT (code) DO NOTHING;
