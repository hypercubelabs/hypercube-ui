// Small helpers shared by the template scripts. Your app has its own versions of these.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A toast in the shared .toasts box. With an undo function, it gets an Undo button.
export function toast(text, undo) {
  let box = $('.toasts');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toasts';
    box.setAttribute('role', 'status');
    document.body.append(box);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  if (undo) {
    const b = document.createElement('button');
    b.className = 'ta';
    b.textContent = 'Undo';
    b.onclick = () => {
      undo();
      t.remove();
    };
    t.append(b);
  }
  box.append(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 180);
  }, undo ? 5000 : 2600);
}

// Busy button: .is-loading while the promise runs.
export async function busy(btn, ms) {
  btn.classList.add('is-loading');
  btn.disabled = true;
  await new Promise(r => setTimeout(r, ms));
  btn.classList.remove('is-loading');
  btn.disabled = false;
}

// Open a [data-layer] (modal or drawer) the same way catalog.js does for data-open.
// Closing (data-close, Esc, a click outside) is handled by catalog.js.
export function openLayer(el, from) {
  el.hidden = false;
  el.querySelectorAll('.modal, .drawer, .scrim, .drawer-scrim').forEach(x => x.classList.add('enter'));
  el._back = from;
  requestAnimationFrame(() => el.querySelector('[autofocus], input, select, textarea')?.focus());
}
export function closeLayer(el) {
  el.hidden = true;
  el._back?.focus();
}
