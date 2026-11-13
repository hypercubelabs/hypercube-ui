// Catalog behaviour. The library itself comes from hc/elements.js; everything here only makes
// the examples really work (open a modal, drawer, menu, toast, switch a tab). Each line shows
// what your own app code does: the library draws, the app opens and closes.
import { zoomFactor } from './hc/elements.js';

const $ = (s, el = document) => el.querySelector(s);
const root = document.documentElement;

/* ---------- light and dark ---------- */
const dark = () => root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
document.addEventListener('click', e => {
  if (!e.target.closest('[data-theme-toggle]')) return;
  const next = dark() ? 'light' : 'dark';
  root.dataset.theme = next;
  markTheme();
  try {
    localStorage.setItem('hc-theme', next);
  } catch {
    /* no storage */
  }
});

// buttons that pick the theme: data-theme-v="auto|light|dark"
const markTheme = () =>
  document.querySelectorAll('[data-theme-v]').forEach(b => {
    const on = b.dataset.themeV === (root.dataset.theme || 'auto');
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-theme-v]');
  if (!b) return;
  const v = b.dataset.themeV;
  if (v === 'auto') delete root.dataset.theme;
  else root.dataset.theme = v;
  try {
    if (v === 'auto') localStorage.removeItem('hc-theme');
    else localStorage.setItem('hc-theme', v);
  } catch {
    /* no storage */
  }
  markTheme();
});
markTheme();

/* ---------- the sidebar becomes a drawer on phones ---------- */
document.addEventListener('click', e => {
  const shell = $('[data-shell]');
  if (!shell) return;
  if (e.target.closest('[data-menu-open]')) shell.classList.add('mnav');
  else if (e.target.closest('[data-menu-close]') || (e.target.closest('.side a') && matchMedia('(max-width: 900px)').matches)) shell.classList.remove('mnav');
});

/* ---------- open and close layers: data-open="#id", data-close ---------- */
let back = null;
function open(el, from) {
  back = from;
  el.hidden = false;
  el.querySelectorAll('.modal, .drawer, .scrim, .drawer-scrim').forEach(x => x.classList.add('enter'));
  requestAnimationFrame(() => el.querySelector('[autofocus], input, button:not([data-close]), [href]')?.focus());
}
function close(el) {
  el.hidden = true;
  if (el.matches('hc-sheet')) el.removeAttribute('open');
  back?.focus();
  back = null;
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-open]');
  if (a) {
    const el = $(a.dataset.open);
    if (el?.matches('hc-sheet')) {
      el.hidden = false;
      el.setAttribute('open', '');
    } else if (el) open(el, a);
    return;
  }
  const f = e.target.closest('[data-close]');
  if (f) close(f.closest('[data-layer]'));
  else if (e.target.matches('.modal-wrap, .drawer-scrim, .scrim')) close(e.target.closest('[data-layer]'));
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const top = [...document.querySelectorAll('[data-layer]:not([hidden])')].pop();
  if (top) close(top);
  closeMenus();
});

/* ---------- dropdown menu: data-menu="#id" ---------- */
function closeMenus() {
  document.querySelectorAll('.pop[data-opened]').forEach(p => {
    p.hidden = true;
    p.removeAttribute('data-opened');
  });
  document.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-menu]');
  const inside = e.target.closest('.pop');
  if (!b && inside && !e.target.closest('.mi')) return;
  const was = b && !$(b.dataset.menu).hidden;
  closeMenus();
  if (!b || was) return;
  const pop = $(b.dataset.menu);
  // Rects and innerWidth are in screen pixels; style values are in page pixels: divide by the zoom.
  const z = zoomFactor();
  const r = b.getBoundingClientRect();
  pop.hidden = false;
  pop.setAttribute('data-opened', '');
  if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'true');
  pop.classList.add('enter');
  const w = pop.offsetWidth;
  pop.style.top = `${Math.min(r.bottom / z + 4, innerHeight / z - pop.offsetHeight - 8)}px`;
  pop.style.left = `${Math.max(8, Math.min(r.left / z, innerWidth / z - w - 8))}px`;
  pop.querySelector('.mi')?.focus();
});

/* ---------- context switcher: .hc-switch opens .hc-switch-menu; a choice becomes the current one ---------- */
// The app would load the chosen workspace; the catalog only shows it on the button and keeps it while you browse.
function showContext(name) {
  const item = document.querySelector(`.hc-switch-menu [data-switch="${CSS.escape(name)}"]`);
  if (!item) return;
  const menu = item.closest('.hc-switch-menu');
  for (const mi of menu.querySelectorAll('[role="menuitemradio"]')) {
    const on = mi === item;
    mi.setAttribute('aria-checked', String(on));
    const ck = mi.querySelector('.ck');
    if (on && !ck) mi.insertAdjacentHTML('beforeend', `<span class="ck">${menu.querySelector('.ck')?.innerHTML || ''}</span>`);
    if (!on && ck) ck.remove();
  }
  const btn = document.querySelector(`.hc-switch[data-menu="#${menu.id}"]`);
  if (!btn) return;
  btn.querySelector('.hc-switch-logo').replaceWith(item.querySelector('.hc-switch-logo').cloneNode(true));
  btn.querySelector('.hc-switch-logo').classList.remove('sm');
  btn.querySelector('.hc-switch-name > b').textContent = name;
  btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(/:.*$/, ': ' + name));
}
document.addEventListener('click', e => {
  const mi = e.target.closest('.hc-switch-menu [data-switch]');
  if (!mi) return;
  showContext(mi.dataset.switch);
  try {
    sessionStorage.setItem('hc-demo-context', mi.dataset.switch);
  } catch {
    /* no storage: the choice lasts until the next page */
  }
});
try {
  const saved = sessionStorage.getItem('hc-demo-context');
  if (saved) showContext(saved);
} catch {
  /* no storage */
}

/* ---------- toast: data-toast="text" ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-toast]');
  if (!b) return;
  let box = $('.toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('role', 'status');
    document.body.append(box);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = b.dataset.toast;
  box.append(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 180);
  }, 2600);
});

/* ---------- groups that switch: tabs and segmented (.tabs, .seg) ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('.tabs > .tab, .seg > button, [data-filters] > *');
  if (!b || b.closest('[data-static]')) return;
  b.parentElement.querySelectorAll(':scope > .on').forEach(x => {
    x.classList.remove('on');
    x.removeAttribute('aria-selected');
  });
  b.classList.add('on');
  if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', 'true');
  if (b.parentElement.matches('.seg')) b.parentElement.querySelectorAll(':scope > button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const target = b.dataset.show;
  if (target) {
    const box = b.closest('[data-tab-panels]');
    box?.querySelectorAll('[data-tab]').forEach(p => (p.hidden = p.dataset.tab !== target));
  }
});

/* ---------- copy the code of an example ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const code = b.closest('.ex').querySelector('.ex-code code');
  try {
    await navigator.clipboard.writeText(code.textContent);
    b.textContent = 'Copied';
  } catch {
    b.textContent = 'Select and copy';
  }
  setTimeout(() => (b.textContent = 'Copy'), 1600);
});

/* ---------- an action in the bottom sheet closes the sheet ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('.hc-sheet-act')) e.target.closest('hc-sheet')?.close();
});

/* ---------- pick an answer in the bot question: marks the option ---------- */
document.addEventListener('click', e => {
  const opt = e.target.closest('.hc-ask-opt');
  if (!opt || opt.closest('[data-static]')) return;
  opt.closest('.hc-ask').querySelectorAll('.hc-ask-opt').forEach(o => o.removeAttribute('aria-pressed'));
  opt.setAttribute('aria-pressed', 'true');
});

/* ---------- templates: list + detail ---------- */
document.addEventListener('click', e => {
  const row = e.target.closest('.hc-list [data-opens]');
  if (row) {
    const split = row.closest('.hc-split');
    split.querySelectorAll('.hc-list [aria-current]').forEach(r => r.removeAttribute('aria-current'));
    row.setAttribute('aria-current', 'true');
    row.removeAttribute('data-unread');
    split.querySelectorAll('[data-item]').forEach(p => (p.hidden = p.dataset.item !== row.dataset.opens));
    split.dataset.view = 'main';
    return;
  }
  if (e.target.closest('.hc-back')) delete e.target.closest('.hc-split').dataset.view;
  const sideBtn = e.target.closest('[data-side-open]');
  if (sideBtn) {
    const aside = sideBtn.closest('.hc-split')?.querySelector('.hc-aside');
    if (aside && matchMedia('(min-width: 1181px)').matches) aside.hidden = !aside.hidden;
    else {
      const s = $(sideBtn.dataset.sideOpen);
      s.hidden = false;
      s.setAttribute('open', '');
    }
  }
});

/* ---------- templates: write and send a message (stays on this page only) ---------- */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && e.target.matches('.hc-composer textarea')) {
    e.preventDefault();
    e.target.form?.requestSubmit();
  }
});
document.addEventListener('submit', e => {
  const form = e.target.closest('form.hc-composer');
  if (!form) return;
  e.preventDefault();
  const ta = form.querySelector('textarea');
  const text = ta.value.trim();
  if (!text) return;
  const list = form.closest('.hc-main').querySelector('.hc-msgs-in');
  const m = document.createElement('div');
  m.className = 'hc-m mine';
  const t = document.createElement('div');
  t.className = 'hc-m-t';
  t.textContent = text;
  m.append(t);
  list.append(m);
  ta.value = '';
  ta.focus();
});

/* ---------- templates: one settings group at a time, and the bot profile one section at a time ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-section]');
  if (!b) return;
  const box = b.closest('[data-sections]');
  box.querySelectorAll('[data-section]').forEach(x => {
    x.classList.toggle('on', x === b);
    if (x === b) x.setAttribute('aria-current', 'true');
    else x.removeAttribute('aria-current');
  });
  box.querySelectorAll('[data-part]').forEach(p => (p.hidden = p.dataset.part !== b.dataset.section));
});

/* ---------- a step that opens and closes its substeps: .hc-step-tg[aria-expanded][aria-controls] ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('.hc-step-tg');
  if (!b) return;
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(open));
  document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
});

/* ---------- on/off filters in the Boards example: "All" or any mix of the others ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-filters-demo] .hc-filter');
  if (!b) return;
  const all = b.parentElement.querySelector('.hc-filter');
  const rest = [...b.parentElement.querySelectorAll('.hc-filter')].slice(1);
  if (b === all) rest.forEach(x => x.setAttribute('aria-pressed', 'false'));
  else b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  all.setAttribute('aria-pressed', String(!rest.some(x => x.getAttribute('aria-pressed') === 'true')));
});
