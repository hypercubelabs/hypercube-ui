/* ============================================================
   HYPERCUBE UI — optional behaviour, as custom elements (Web Components)
   No framework needed: works in plain JavaScript, React, Blazor and Astro. Without this file
   the markup from src/hc.css is still complete; only the behaviour below goes away.

   <hc-ask keys>        keys 1 to 9 pick the .hc-ask-opt with the same number (outside text fields).
   <hc-sheet open>      bottom sheet on phones: Esc, a tap on the backdrop or a drag down closes it.
                        Fires "hc-close" (bubbles). With the "controlled" attribute the app decides when
                        to remove "open" (useful when the screen is redrawn from its own state).
   [data-hc-longpress]  a long press (480 ms) fires "hc-longpress" (bubbles) and sets [data-hc-pressed].
   <hc-zoom>            "Adjust screen": the buttons inside ([data-zoom="out" | "reset" | "in"]) scale the
                        whole page in steps (step="5", min="80", max="140", in %), save the choice per
                        person (storage key "hc-zoom") and fire "hc-zoom" with { value }. With the "keys"
                        attribute, Ctrl/Cmd + = - 0 do the same (for desktop shells without browser zoom).
                        value-label="Screen size {v}%" and reset-hint="Back to 100%" translate the
                        name the value button gets.
                        Apply the saved value before the page paints with the snippet in AGENTS.md.
   zoomFactor()         the page's current scale (1.1 at 110%). Code that places an element from
                        getBoundingClientRect() or innerWidth divides by it: rect.left / zoomFactor().
   ============================================================ */

const editable = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const visible = el => !!el && el.isConnected && el.getClientRects().length > 0;

/* ---------- <hc-ask> ---------- */
const asks = new Set();
function onAskKey(e) {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || editable(document.activeElement)) return;
  const n = Number(e.key);
  if (!Number.isInteger(n) || n < 1 || n > 9) return;
  // The newest question on screen answers; older ones stay quiet.
  const ask = [...asks].reverse().find(a => a.hasAttribute('keys') && visible(a));
  const opt = ask?.querySelectorAll('.hc-ask-opt')[n - 1];
  if (!opt || opt.disabled) return;
  e.preventDefault();
  opt.click();
}
class HcAsk extends HTMLElement {
  connectedCallback() {
    if (!asks.size) document.addEventListener('keydown', onAskKey);
    asks.add(this);
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
  }
  disconnectedCallback() {
    asks.delete(this);
    if (!asks.size) document.removeEventListener('keydown', onAskKey);
  }
}

/* ---------- <hc-sheet> ---------- */
class HcSheet extends HTMLElement {
  static get observedAttributes() {
    return ['open'];
  }
  connectedCallback() {
    this.setAttribute('role', this.getAttribute('role') || 'dialog');
    this.setAttribute('aria-modal', 'true');
    this._key = e => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        e.stopPropagation();
        this.close();
      }
    };
    this._click = e => {
      if (e.target.closest('.hc-sheet-bg')) this.close();
    };
    this._down = e => {
      const grab = e.target.closest('.hc-sheet-grab');
      if (!grab) return;
      this._y = e.clientY;
    };
    this._up = e => {
      if (this._y != null && e.clientY - this._y > 60) this.close();
      this._y = null;
    };
    document.addEventListener('keydown', this._key, true);
    this.addEventListener('click', this._click);
    this.addEventListener('pointerdown', this._down);
    this.addEventListener('pointerup', this._up);
    if (this.hasAttribute('open')) this._focusIn();
  }
  disconnectedCallback() {
    document.removeEventListener('keydown', this._key, true);
  }
  attributeChangedCallback(name, was, now) {
    if (name === 'open' && now != null && was == null && this.isConnected) this._focusIn();
  }
  _focusIn() {
    if (!this.contains(document.activeElement)) this._back = document.activeElement;
    // A screen redrawn from its own state recreates the sheet: focus already inside stays where it is.
    requestAnimationFrame(() => {
      if (this.isConnected && !this.contains(document.activeElement))
        this.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')?.focus({ preventScroll: true });
    });
  }
  close() {
    this.dispatchEvent(new CustomEvent('hc-close', { bubbles: true }));
    if (!this.hasAttribute('controlled')) this.removeAttribute('open');
    if (this._back?.isConnected) this._back.focus({ preventScroll: true });
  }
}

/* ---------- long press ---------- */
let timer = 0;
let pressed = null;
let fired = false;
let start = null;
function clearPress() {
  clearTimeout(timer);
  pressed?.removeAttribute('data-hc-pressed');
  pressed = null;
}
function onTouchStart(e) {
  const el = e.target.closest?.('[data-hc-longpress]');
  if (!el || e.touches.length > 1) return;
  fired = false;
  start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  pressed = el;
  timer = setTimeout(() => {
    fired = true;
    el.setAttribute('data-hc-pressed', '');
    navigator.vibrate?.(8);
    el.dispatchEvent(new CustomEvent('hc-longpress', { bubbles: true }));
    setTimeout(clearPress, 600);
  }, 480);
}
function onTouchMove(e) {
  if (!start) return;
  const t = e.touches[0];
  if (Math.abs(t.clientX - start.x) > 8 || Math.abs(t.clientY - start.y) > 8) clearPress();
}
function onTouchEnd(e) {
  clearTimeout(timer);
  start = null;
  // The finger lifting after a long press must not also click what is under it.
  if (fired) e.preventDefault();
}
function onContextMenu(e) {
  if (e.target.closest?.('[data-hc-longpress]') && (fired || matchMedia('(hover: none)').matches)) e.preventDefault();
}

/* ---------- <hc-zoom> ---------- */
const ZOOM_KEY = 'hc-zoom';
export function zoomFactor() {
  if (typeof document === 'undefined') return 1;
  const z = parseFloat(document.documentElement.style.zoom);
  return z > 0 ? z : 1;
}
export function setZoom(percent) {
  const v = Math.round(percent);
  const root = document.documentElement;
  if (v === 100) {
    root.style.removeProperty('zoom');
    delete root.dataset.zoom;
  } else {
    root.style.zoom = String(v / 100);
    root.dataset.zoom = String(v);
  }
  try {
    if (v === 100) localStorage.removeItem(ZOOM_KEY);
    else localStorage.setItem(ZOOM_KEY, String(v));
  } catch {
    /* no storage: the choice lasts until the page closes */
  }
  for (const z of document.querySelectorAll('hc-zoom')) z.render?.();
  window.dispatchEvent(new CustomEvent('hc-zoom', { detail: { value: v } }));
  return v;
}
class HcZoom extends HTMLElement {
  get min() { return Number(this.getAttribute('min')) || 80; }
  get max() { return Number(this.getAttribute('max')) || 140; }
  get step() { return Number(this.getAttribute('step')) || 5; }
  get value() { return Math.round(zoomFactor() * 100); }
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this._click = e => {
      const b = e.target.closest('[data-zoom]');
      if (!b || !this.contains(b) || b.disabled) return;
      this.go(b.dataset.zoom);
    };
    this._key = e => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = { '=': 'in', '+': 'in', '-': 'out', _: 'out', 0: 'reset' }[e.key];
      if (!k) return;
      e.preventDefault();
      this.go(k);
    };
    this.addEventListener('click', this._click);
    if (this.hasAttribute('keys')) document.addEventListener('keydown', this._key);
    this.render();
  }
  disconnectedCallback() {
    this.removeEventListener('click', this._click);
    document.removeEventListener('keydown', this._key);
  }
  go(dir) {
    const v = this.value;
    const next = dir === 'reset' ? 100 : Math.min(this.max, Math.max(this.min, v + (dir === 'in' ? this.step : -this.step)));
    if (next !== v) setZoom(next);
  }
  render() {
    const v = this.value;
    const out = this.querySelector('[data-zoom="out"]');
    const inn = this.querySelector('[data-zoom="in"]');
    const reset = this.querySelector('[data-zoom="reset"]');
    if (out) out.disabled = v <= this.min;
    if (inn) inn.disabled = v >= this.max;
    if (reset) {
      reset.textContent = `${v}%`;
      // value-label and reset-hint carry the app's own language ({v} is the value)
      const label = (this.getAttribute('value-label') || 'Screen size {v}%').replace('{v}', v);
      const hint = this.getAttribute('reset-hint') || 'Back to 100%';
      reset.setAttribute('aria-label', v === 100 ? label : `${label}. ${hint}`);
      reset.toggleAttribute('data-changed', v !== 100);
    }
  }
}

export function defineHypercubeUI() {
  if (typeof window === 'undefined' || !window.customElements) return;
  if (!customElements.get('hc-ask')) customElements.define('hc-ask', HcAsk);
  if (!customElements.get('hc-sheet')) customElements.define('hc-sheet', HcSheet);
  if (!customElements.get('hc-zoom')) customElements.define('hc-zoom', HcZoom);
  // Without the snippet in <head>, apply the saved size now (the first paint may still be at 100%).
  if (!document.documentElement.style.zoom) {
    try {
      const z = Number(localStorage.getItem(ZOOM_KEY));
      if (z >= 50 && z <= 200 && z !== 100) setZoom(z);
    } catch {
      /* no storage */
    }
  }
  if (!window.__hcLongpress) {
    window.__hcLongpress = true;
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', clearPress);
    document.addEventListener('contextmenu', onContextMenu);
  }
}
defineHypercubeUI();
