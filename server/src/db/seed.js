'use strict';

require('dotenv').config();

const { pool, transaction, connectDB } = require('../config/db');

/* ── Product data imported from the frontend catalog ─────────────
   Prices converted from display dollars to integer cents.         */

const PRODUCTS = [
  { slug:'shadow-heavyweight-tee',   name:'Shadow Heavyweight Tee',   category:'tops',        subcategory:'tshirts',     price:7500,  sale:null,  badge:'Bestseller', isNew:false, isBestseller:true,  rating:4.8, reviews:127, shortDesc:'Our signature 320gsm tee, garment-washed for a broken-in feel.', desc:'Constructed from 320gsm ringspun cotton, the Shadow Heavyweight Tee is built to outlast trends.', details:['320gsm 100% ringspun cotton','Relaxed, oversized silhouette','Dropped shoulder construction','Garment-washed finish','Made in Portugal'], care:['Machine wash cold','Tumble dry low','Do not bleach'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Ash',hex:'#9a9a9a'},{name:'Bone',hex:'#e2dcd0'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-1a/600/780','https://picsum.photos/seed/dg-1b/600/780'], relatedSlugs:['void-graphic-tee','arc-pullover-hoodie','void-crewneck'] },
  { slug:'void-graphic-tee',         name:'Void Graphic Tee',         category:'tops',        subcategory:'tshirts',     price:8500,  sale:null,  badge:null,         isNew:false, isBestseller:false, rating:4.6, reviews:84,  shortDesc:'Screen-printed distressed graphic on 280gsm cotton.', desc:'The Void Graphic Tee features original DG Studio artwork screen-printed onto 280gsm cotton.', details:['280gsm 100% cotton','Boxy, slightly cropped fit','Water-based screen print','Made in Portugal'], care:['Machine wash cold, inside out','Tumble dry low','Do not iron on print'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Vintage White',hex:'#ece6d8'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-2a/600/780','https://picsum.photos/seed/dg-2b/600/780'], relatedSlugs:['shadow-heavyweight-tee','ribbed-longsleeve','void-crewneck'] },
  { slug:'ribbed-longsleeve',        name:'Ribbed Long Sleeve',       category:'tops',        subcategory:'longsleeve',  price:9000,  sale:null,  badge:'New',        isNew:true,  isBestseller:false, rating:4.7, reviews:42,  shortDesc:'Slim-cut ribbed cotton, versatile layer for any season.', desc:'Cut from a tight rib knit in 100% cotton, a foundational layering piece.', details:['180gsm ribbed cotton jersey','Slim, fitted silhouette','Crewneck with rib trim','Made in Portugal'], care:['Machine wash cold','Lay flat to dry','Do not bleach'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Slate',hex:'#3d4654'},{name:'Cream',hex:'#f5f0e4'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-3a/600/780','https://picsum.photos/seed/dg-3b/600/780'], relatedSlugs:['shadow-heavyweight-tee','arc-pullover-hoodie','void-crewneck'] },
  { slug:'arc-pullover-hoodie',      name:'Arc Pullover Hoodie',      category:'tops',        subcategory:'hoodies',     price:14500, sale:null,  badge:'Bestseller', isNew:false, isBestseller:true,  rating:4.9, reviews:203, shortDesc:'450gsm loopback fleece. The hoodie that outlasts everything.', desc:'Built from heavyweight 450gsm loopback fleece with oversized hood and kangaroo pocket.', details:['450gsm loopback cotton fleece','Oversized, dropped shoulder fit','Garment-washed for softness','Kangaroo pocket','Made in Portugal'], care:['Machine wash cold','Tumble dry low','Do not bleach'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Graphite',hex:'#3a3a3a'},{name:'Stone',hex:'#8a8474'},{name:'Bone',hex:'#e2dcd0'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-4a/600/780','https://picsum.photos/seed/dg-4b/600/780','https://picsum.photos/seed/dg-4c/600/780'], relatedSlugs:['void-crewneck','shadow-heavyweight-tee','technical-shell-jacket'] },
  { slug:'void-crewneck',            name:'Void Crewneck',            category:'tops',        subcategory:'sweatshirts', price:12500, sale:null,  badge:'Bestseller', isNew:false, isBestseller:true,  rating:4.8, reviews:156, shortDesc:'380gsm French terry crewneck with embroidered DG logo.', desc:'Cut from 380gsm French terry with a tonal embroidered DG logo at the chest.', details:['380gsm French terry cotton','Relaxed fit','Tonal embroidered logo','Ribbed collar, cuffs, and hem','Made in Portugal'], care:['Machine wash cold','Tumble dry low','Do not iron on embroidery'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Slate',hex:'#3d4654'},{name:'Stone',hex:'#8a8474'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-5a/600/780','https://picsum.photos/seed/dg-5b/600/780'], relatedSlugs:['arc-pullover-hoodie','shadow-heavyweight-tee','cargo-wide-pants'] },
  { slug:'satin-overshirt',          name:'Satin Overshirt',          category:'tops',        subcategory:'shirts',      price:17500, sale:14000, badge:'Sale',       isNew:true,  isBestseller:false, rating:4.5, reviews:28,  shortDesc:'Fluid satin overshirt — layered luxury.', desc:'Crafted from a fluid satin weave with an open collar and chest patch pocket.', details:['100% cupro satin','Relaxed, drape fit','Open Cuban collar','Made in Italy'], care:['Dry clean recommended','Hand wash cold if needed','Do not tumble dry'], colors:[{name:'Midnight',hex:'#1a1a2e'},{name:'Champagne',hex:'#c8b89a'}], sizes:['XS','S','M','L','XL'], images:['https://picsum.photos/seed/dg-6a/600/780','https://picsum.photos/seed/dg-6b/600/780'], relatedSlugs:['ribbed-longsleeve','cargo-wide-pants','coach-jacket'] },
  { slug:'cargo-wide-pants',         name:'Cargo Wide-Leg Pants',     category:'bottoms',     subcategory:'pants',       price:18500, sale:null,  badge:'Bestseller', isNew:false, isBestseller:true,  rating:4.8, reviews:189, shortDesc:'Relaxed wide-leg with utility pockets. A collection staple.', desc:'Constructed from heavy cotton twill with mechanical stretch. Four exterior pockets.', details:['98% cotton 2% elastane twill','Wide-leg, relaxed rise','Four utility cargo pockets','Elastic waistband with drawstring','Made in Portugal'], care:['Machine wash cold','Tumble dry low','Do not bleach'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Khaki',hex:'#9a8c78'},{name:'Slate',hex:'#3d4654'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-7a/600/780','https://picsum.photos/seed/dg-7b/600/780'], relatedSlugs:['raw-selvedge-denim','nylon-track-pants','arc-pullover-hoodie'] },
  { slug:'raw-selvedge-denim',       name:'Raw Selvedge Denim',       category:'bottoms',     subcategory:'jeans',       price:22000, sale:null,  badge:null,         isNew:false, isBestseller:false, rating:4.7, reviews:64,  shortDesc:'14oz Japanese selvedge denim. Gets better every wear.', desc:'14oz Japanese selvedge denim from Kojima. Straight leg, raw/un-washed finish.', details:['14oz Japanese selvedge denim','Straight leg, mid-rise','Raw/un-washed finish','Copper rivets','YKK zipper','Made in Japan'], care:['Wash sparingly — cold only','Turn inside out','Hang dry in shade'], colors:[{name:'Raw Indigo',hex:'#2c3e5e'}], sizes:['28','29','30','31','32','33','34','36'], images:['https://picsum.photos/seed/dg-8a/600/780','https://picsum.photos/seed/dg-8b/600/780'], relatedSlugs:['cargo-wide-pants','nylon-track-pants','technical-shell-jacket'] },
  { slug:'nylon-track-pants',        name:'Nylon Track Pants',        category:'bottoms',     subcategory:'pants',       price:13500, sale:null,  badge:'New',        isNew:true,  isBestseller:false, rating:4.6, reviews:37,  shortDesc:'Lightweight nylon with side snap buttons.', desc:'Cut from water-resistant ripstop nylon with full-length side snap buttons.', details:['100% ripstop nylon','Relaxed, tapered leg','Full-length side snap buttons','Water-resistant','Made in Taiwan'], care:['Machine wash cold','Hang dry','Do not iron'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Olive',hex:'#4a5240'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-9a/600/780','https://picsum.photos/seed/dg-9b/600/780'], relatedSlugs:['cargo-wide-pants','woven-mesh-shorts','technical-shell-jacket'] },
  { slug:'woven-mesh-shorts',        name:'Woven Mesh Shorts',        category:'bottoms',     subcategory:'shorts',      price:9500,  sale:7200,  badge:'Sale',       isNew:false, isBestseller:false, rating:4.5, reviews:52,  shortDesc:'Breathable woven mesh, 7" inseam.', desc:'Woven polyester mesh with relaxed athletic silhouette and inner brief lining.', details:['100% woven polyester mesh','7" inseam','Inner brief lining','Back zip pocket','Made in Taiwan'], care:['Machine wash cold','Tumble dry low','Do not iron'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Stone',hex:'#8a8474'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-10a/600/780','https://picsum.photos/seed/dg-10b/600/780'], relatedSlugs:['nylon-track-pants','cargo-wide-pants','six-panel-cap'] },
  { slug:'technical-shell-jacket',   name:'Technical Shell Jacket',   category:'outerwear',   subcategory:'jackets',     price:34500, sale:null,  badge:'Bestseller', isNew:false, isBestseller:true,  rating:4.9, reviews:241, shortDesc:'3-layer waterproof shell with minimal branding.', desc:'3-layer waterproof construction with taped seams, storm flap, and packable hood.', details:['3-layer 20K/20K waterproof rated','Fully taped seams','YKK waterproof zippers','Packable hood','Made in Vietnam'], care:['Machine wash cold, gentle','Tumble dry low to reactivate DWR','Do not dry clean'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Graphite',hex:'#3a3a3a'},{name:'Olive',hex:'#4a5240'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-11a/600/780','https://picsum.photos/seed/dg-11b/600/780','https://picsum.photos/seed/dg-11c/600/780'], relatedSlugs:['coach-jacket','oversized-sherpa-fleece','cargo-wide-pants'] },
  { slug:'coach-jacket',             name:'Coach Jacket',             category:'outerwear',   subcategory:'jackets',     price:28500, sale:null,  badge:null,         isNew:false, isBestseller:false, rating:4.7, reviews:98,  shortDesc:'Nylon ripstop coach jacket with snap closures.', desc:'Lightweight nylon ripstop with snap closure. Packs into its own chest pocket.', details:['100% nylon ripstop shell','Polyester lining','Snap button closure','Packs into chest pocket','Made in Vietnam'], care:['Machine wash cold','Hang dry','Do not iron'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Ivory',hex:'#f5f0e4'},{name:'Cobalt',hex:'#1c3f6e'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-12a/600/780','https://picsum.photos/seed/dg-12b/600/780'], relatedSlugs:['technical-shell-jacket','nylon-track-pants','cargo-wide-pants'] },
  { slug:'oversized-sherpa-fleece',  name:'Oversized Sherpa Fleece',  category:'outerwear',   subcategory:'fleece',      price:26500, sale:null,  badge:'New',        isNew:true,  isBestseller:false, rating:4.7, reviews:44,  shortDesc:'Heavyweight sherpa with interior grid fleece lining.', desc:'Plush sherpa outer with grid fleece interior lining. Zip front, two hand pockets.', details:['Sherpa polyester outer','Grid fleece interior','Full-zip front','Two hand pockets','Made in China'], care:['Machine wash cold, gentle','Tumble dry low','Do not bleach'], colors:[{name:'Ecru',hex:'#e8e0d0'},{name:'Stone',hex:'#8a8474'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-13a/600/780','https://picsum.photos/seed/dg-13b/600/780'], relatedSlugs:['technical-shell-jacket','coach-jacket','arc-pullover-hoodie'] },
  { slug:'quilted-puffer-vest',      name:'Quilted Puffer Vest',      category:'outerwear',   subcategory:'vests',       price:19500, sale:null,  badge:'New',        isNew:true,  isBestseller:false, rating:4.6, reviews:31,  shortDesc:'Baffle-quilted vest with 90/10 duck down fill.', desc:'90/10 duck down fill in a sleeveless silhouette. Baffle-quilt construction.', details:['90/10 duck down fill','20D nylon shell','Two zip hand pockets','Stand collar','Made in China'], care:['Machine wash cold, gentle with down detergent','Tumble dry low with tennis balls'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Olive',hex:'#4a5240'}], sizes:['XS','S','M','L','XL','XXL'], images:['https://picsum.photos/seed/dg-14a/600/780','https://picsum.photos/seed/dg-14b/600/780'], relatedSlugs:['technical-shell-jacket','arc-pullover-hoodie','void-crewneck'] },
  { slug:'six-panel-cap',            name:'Six Panel Cap',            category:'accessories', subcategory:'hats',        price:5500,  sale:null,  badge:'Bestseller', isNew:false, isBestseller:true,  rating:4.9, reviews:312, shortDesc:'Unstructured six-panel with tonal DG embroidery.', desc:'Washed cotton twill cap with tonal DG embroidery and adjustable strapback.', details:['Washed cotton twill','Unstructured, low-profile','Tonal embroidered logo','Adjustable strapback','One size fits most'], care:['Spot clean only','Do not machine wash','Air dry'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Stone',hex:'#8a8474'},{name:'Vintage',hex:'#c0b090'}], sizes:['One Size'], images:['https://picsum.photos/seed/dg-15a/600/780','https://picsum.photos/seed/dg-15b/600/780'], relatedSlugs:['heavy-canvas-tote','wool-rib-beanie','bifold-leather-wallet'] },
  { slug:'heavy-canvas-tote',        name:'Heavy Canvas Tote',        category:'accessories', subcategory:'bags',        price:6500,  sale:null,  badge:null,         isNew:false, isBestseller:false, rating:4.7, reviews:88,  shortDesc:'16oz canvas tote with DG screenprint.', desc:'16oz natural cotton canvas tote with screen-printed DG wordmark.', details:['16oz natural cotton canvas','Screen-printed DG wordmark','Reinforced bottom and handles','18" x 15" x 5"'], care:['Machine wash cold','Hang dry'], colors:[{name:'Natural',hex:'#e8e0cc'},{name:'Onyx',hex:'#1c1c1c'}], sizes:['One Size'], images:['https://picsum.photos/seed/dg-16a/600/780','https://picsum.photos/seed/dg-16b/600/780'], relatedSlugs:['six-panel-cap','wool-rib-beanie','bifold-leather-wallet'] },
  { slug:'wool-rib-beanie',          name:'Wool Rib Beanie',          category:'accessories', subcategory:'hats',        price:4500,  sale:null,  badge:'New',        isNew:true,  isBestseller:false, rating:4.8, reviews:23,  shortDesc:'100% merino wool, fine-rib knit.', desc:'Fine-rib knitted beanie in 100% extra-fine merino wool.', details:['100% extra-fine merino wool','Fine-rib knit construction','Woven DG label','One size'], care:['Hand wash cold','Lay flat to dry','Do not tumble dry'], colors:[{name:'Onyx',hex:'#1c1c1c'},{name:'Ash',hex:'#9a9a9a'},{name:'Cream',hex:'#f5f0e4'}], sizes:['One Size'], images:['https://picsum.photos/seed/dg-17a/600/780','https://picsum.photos/seed/dg-17b/600/780'], relatedSlugs:['six-panel-cap','heavy-canvas-tote','arc-pullover-hoodie'] },
  { slug:'bifold-leather-wallet',    name:'Bifold Leather Wallet',    category:'accessories', subcategory:'wallets',     price:9500,  sale:null,  badge:null,         isNew:false, isBestseller:false, rating:4.7, reviews:47,  shortDesc:'Full-grain vegetable-tanned leather. Slim bifold.', desc:'Full-grain vegetable-tanned leather bifold with four card slots.', details:['Full-grain vegetable-tanned leather','Four card slots','Debossed DG logo interior','Dimensions: 4.3" × 3.5" × 0.3"'], care:['Wipe with a dry cloth','Condition with leather balm quarterly'], colors:[{name:'Tan',hex:'#c8a87a'},{name:'Black',hex:'#1a1a1a'}], sizes:['One Size'], images:['https://picsum.photos/seed/dg-18a/600/780','https://picsum.photos/seed/dg-18b/600/780'], relatedSlugs:['six-panel-cap','heavy-canvas-tote','wool-rib-beanie'] },
  { slug:'logo-chain-necklace',      name:'Logo Chain Necklace',      category:'accessories', subcategory:'jewelry',     price:12500, sale:null,  badge:'New',        isNew:true,  isBestseller:false, rating:4.6, reviews:18,  shortDesc:'Sterling silver chain with oxidized DG pendant.', desc:'925 sterling silver curb-link chain with oxidized DG logo pendant. 22" length.', details:['925 sterling silver','Oxidized finish pendant','22" length','Lobster claw clasp','Comes in branded box'], care:['Avoid contact with water','Polish with soft dry cloth'], colors:[{name:'Oxidized Silver',hex:'#6a6a6a'}], sizes:['One Size'], images:['https://picsum.photos/seed/dg-19a/600/780','https://picsum.photos/seed/dg-19b/600/780'], relatedSlugs:['six-panel-cap','bifold-leather-wallet','wool-rib-beanie'] },
];

async function seed() {
  await connectDB();
  console.log('[seed] seeding products…');

  const slugToId = {};

  await transaction(async (client) => {
    for (const p of PRODUCTS) {
      /* product row */
      const [row] = (await client.query(`
        INSERT INTO products
          (slug, name, category, subcategory, description, short_description,
           price_cents, sale_price_cents, badge, is_new, is_bestseller,
           rating, review_count)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (slug) DO UPDATE SET
          name             = EXCLUDED.name,
          price_cents      = EXCLUDED.price_cents,
          sale_price_cents = EXCLUDED.sale_price_cents,
          updated_at       = NOW()
        RETURNING id
      `, [p.slug, p.name, p.category, p.subcategory, p.desc, p.shortDesc,
          p.price, p.sale, p.badge, p.isNew, p.isBestseller, p.rating, p.reviews])).rows;

      const productId = row.id;
      slugToId[p.slug] = productId;

      /* images */
      await client.query('DELETE FROM product_images WHERE product_id=$1', [productId]);
      for (let i = 0; i < p.images.length; i++) {
        await client.query(
          'INSERT INTO product_images (product_id, url, position) VALUES ($1,$2,$3)',
          [productId, p.images[i], i]
        );
      }

      /* details */
      await client.query('DELETE FROM product_details WHERE product_id=$1', [productId]);
      for (let i = 0; i < p.details.length; i++) {
        await client.query(
          'INSERT INTO product_details (product_id, detail, position) VALUES ($1,$2,$3)',
          [productId, p.details[i], i]
        );
      }

      /* care */
      await client.query('DELETE FROM product_care WHERE product_id=$1', [productId]);
      for (let i = 0; i < p.care.length; i++) {
        await client.query(
          'INSERT INTO product_care (product_id, instruction, position) VALUES ($1,$2,$3)',
          [productId, p.care[i], i]
        );
      }

      /* variants — stock seeded at 50 per variant */
      await client.query('DELETE FROM product_variants WHERE product_id=$1', [productId]);
      for (const color of p.colors) {
        for (const size of p.sizes) {
          const sku = `${p.slug}-${size.toLowerCase().replace(/\s+/g,'-')}-${color.name.toLowerCase().replace(/\s+/g,'-')}`;
          await client.query(`
            INSERT INTO product_variants (product_id, size, color_name, color_hex, stock, sku)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (sku) DO NOTHING
          `, [productId, size, color.name, color.hex, 50, sku]);
        }
      }
    }

    /* product_related — now all slugToId are populated */
    for (const p of PRODUCTS) {
      const productId = slugToId[p.slug];
      if (!productId) continue;
      await client.query('DELETE FROM product_related WHERE product_id=$1', [productId]);
      for (const relSlug of (p.relatedSlugs || [])) {
        const relId = slugToId[relSlug];
        if (!relId) continue;
        await client.query(`
          INSERT INTO product_related (product_id, related_id)
          VALUES ($1,$2) ON CONFLICT DO NOTHING
        `, [productId, relId]);
      }
    }
  });

  console.log(`[seed] inserted ${PRODUCTS.length} products`);
  await pool.end();
}

seed().catch((err) => {
  console.error('[seed] failed:', err.message);
  process.exit(1);
});
