/**
 * components/Tabs.js — Accessible ARIA tablist.
 *
 * Implements the WAI-ARIA Authoring Practices tab pattern:
 *   https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Keyboard behaviour:
 *   Left/Right arrows — move between tabs (roving tabindex)
 *   Home / End        — jump to first / last tab
 *   Tab               — move focus INTO the active panel content
 *   Shift+Tab         — return focus to the active tab
 *
 * Props:
 * @typedef {Object} TabDef
 * @property {string}             id      — unique tab identifier
 * @property {string}             label   — visible tab label
 * @property {string|HTMLElement} panel   — panel HTML string or element
 *
 * @typedef {Object} TabsProps
 * @property {TabDef[]}           tabs
 * @property {string}             [active]    — id of initially active tab
 * @property {(id: string)=>void} [onChange]
 *
 * Instance API:
 * @typedef {Object} TabsInstance
 * @property {(id: string) => void} setActive — programmatically change active tab
 * @property {() => string}         getActive — returns current tab id
 * @property {() => void}           destroy
 *
 * @example
 * const tabs = createTabs(containerEl, {
 *   tabs: [
 *     { id: 'details', label: 'Details & Materials', panel: '<ul>...</ul>' },
 *     { id: 'care',    label: 'Care',                panel: '<ul>...</ul>' },
 *     { id: 'shipping',label: 'Shipping & Returns',  panel: '<p>...</p>'  },
 *   ],
 *   active: 'details',
 *   onChange: (id) => console.log('switched to', id),
 * });
 */

/**
 * @param {HTMLElement} container  — element that receives the tabs markup
 * @param {TabsProps}   props
 * @returns {TabsInstance}
 */
export function createTabs(container, props) {
  const { tabs, active: initialActive, onChange } = props;

  if (!tabs?.length) throw new Error('Tabs requires at least one tab definition');
  if (!container)    throw new Error('Tabs requires a container element');

  const baseId    = `tabs-${Date.now()}`;
  let   activeId  = initialActive ?? tabs[0].id;

  /* ── Render ──────────────────────────────────────────────────────── */

  container.className = (container.className + ' tabs').trim();

  const tablistEl = document.createElement('div');
  tablistEl.setAttribute('role', 'tablist');
  tablistEl.className = 'tabs__list';

  const panelEls = new Map();

  tabs.forEach(tab => {
    /* Tab button */
    const btn = document.createElement('button');
    btn.id          = `${baseId}-tab-${tab.id}`;
    btn.className   = 'tabs__tab';
    btn.textContent = tab.label;
    btn.setAttribute('role',         'tab');
    btn.setAttribute('aria-selected', String(tab.id === activeId));
    btn.setAttribute('aria-controls', `${baseId}-panel-${tab.id}`);
    btn.tabIndex    = tab.id === activeId ? 0 : -1;

    btn.addEventListener('click', () => _activate(tab.id));
    btn.addEventListener('keydown', _onKeydown);
    tablistEl.appendChild(btn);

    /* Panel */
    const panel = document.createElement('div');
    panel.id         = `${baseId}-panel-${tab.id}`;
    panel.className  = 'tabs__panel';
    panel.setAttribute('role',             'tabpanel');
    panel.setAttribute('aria-labelledby',  `${baseId}-tab-${tab.id}`);
    panel.setAttribute('aria-hidden',      String(tab.id !== activeId));
    panel.tabIndex   = 0; /* so Tab from the tablist moves into panel */

    if (tab.panel instanceof HTMLElement) {
      panel.appendChild(tab.panel);
    } else {
      panel.innerHTML = tab.panel;
    }

    container.appendChild(panel);
    panelEls.set(tab.id, panel);
  });

  /* Tablist goes before panels in DOM order */
  container.insertBefore(tablistEl, container.firstChild);

  /* ── Activation ──────────────────────────────────────────────────── */

  function _activate(id) {
    if (id === activeId) return;

    /* Deactivate current */
    const prevTab   = tablistEl.querySelector(`#${baseId}-tab-${activeId}`);
    const prevPanel = panelEls.get(activeId);
    if (prevTab)   { prevTab.setAttribute('aria-selected', 'false'); prevTab.tabIndex = -1; }
    if (prevPanel) prevPanel.setAttribute('aria-hidden', 'true');

    /* Activate new */
    activeId        = id;
    const nextTab   = tablistEl.querySelector(`#${baseId}-tab-${id}`);
    const nextPanel = panelEls.get(id);
    if (nextTab)   { nextTab.setAttribute('aria-selected', 'true'); nextTab.tabIndex = 0; nextTab.focus(); }
    if (nextPanel) nextPanel.setAttribute('aria-hidden', 'false');

    onChange?.(id);
  }

  /* ── Keyboard ────────────────────────────────────────────────────── */

  function _onKeydown(e) {
    const btns = [...tablistEl.querySelectorAll('[role="tab"]')];
    const idx  = btns.indexOf(e.currentTarget);

    const keys = {
      ArrowRight: () => _activate(tabs[(idx + 1) % tabs.length].id),
      ArrowLeft:  () => _activate(tabs[(idx - 1 + tabs.length) % tabs.length].id),
      Home:       () => _activate(tabs[0].id),
      End:        () => _activate(tabs[tabs.length - 1].id),
    };

    if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
  }

  /* ── Instance API ────────────────────────────────────────────────── */

  function setActive(id) {
    if (!tabs.find(t => t.id === id)) {
      console.warn(`Tabs.setActive: unknown tab id "${id}"`);
      return;
    }
    _activate(id);
  }

  function getActive() { return activeId; }

  function destroy() {
    container.innerHTML = '';
    container.classList.remove('tabs');
  }

  return { setActive, getActive, destroy };
}
