// Root cause template. An investigation is a tree of hypotheses joined by OR (any one explains
// the failure) and AND (all of them together do). This script plays the rest of one
// investigation from where the static page stops, and makes Fix it and Retry from here work.
import { icon } from './icons.js';
import { $, esc, toast, busy } from './ui.js';

// outcome: what checking this hypothesis ends with. at: the clock when it got there.
const H = {
  h0: { title: 'Checkout tests failing', glyph: 'square-terminal', file: 'checkout.test.ts', root: true, join: 'OR', kids: ['h1', 'h2', 'h3'] },
  h1: { title: 'Coupon ignored', glyph: 'scroll-text', file: 'coupon.ts', more: 1, join: 'AND', kids: ['h11', 'h12'], outcome: 'confirmed', state: 'checking',
    why: 'Orders with a coupon are charged full price, but only in the checkout tests. Both checks below have to hold for this to explain it.' },
  h11: { title: 'Sent as amount', glyph: 'scroll-text', file: 'coupon.ts', path: 'app/checkout/coupon.ts', outcome: 'root', state: 'root', at: 205,
    why: 'The coupon goes out as 20 and Stripe reads that as $20 off, not 20%.',
    diff: ['- discounts: [{ coupon: code, amount_off: value }]', '+ discounts: [{ coupon: code, percent_off: value }]'] },
  h12: { title: 'Reaches Stripe as is', glyph: 'plug', file: 'stripe.ts', more: 1, outcome: 'confirmed', state: 'checking',
    why: 'Checking that nothing between the cart and Stripe rewrites the discount.' , done: 'Nothing between the cart and Stripe touches the discount: it reaches Stripe exactly as sent.' },
  h2: { title: 'Stripe errors', glyph: 'plug', file: 'stripe.log', outcome: 'out', state: 'out', at: 177, why: 'No Stripe errors during the failing runs: every call came back 200.' },
  h3: { title: 'Stale fixtures', glyph: 'database', file: 'prices.json', outcome: 'out', state: 'out', at: 189, why: 'The fixtures match the price list from today; reloading them changes nothing.' },
};
const ORDER = ['h2', 'h3', 'h11', 'h12', 'h1'];
let clock = 205;
let selected = 'h11';
let fixed = false;
let timer = 0;

const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const parentOf = id => Object.keys(H).find(p => H[p].kids?.includes(id));
const pathTo = id => {
  const p = [];
  for (let n = id; n; n = parentOf(n)) p.unshift(n);
  return p;
};
const subtree = id => [id, ...(H[id].kids || []).flatMap(subtree)];

function status(id) {
  const h = H[id];
  if (h.root) {
    if (fixed) return `<span class="badge green">${icon('circle-check', 12)}Passing</span>12 of 12`;
    const found = H.h1.state === 'confirmed';
    return `<span class="badge red">${icon('triangle-alert', 12)}Failed</span>4 of 12 · ${found ? 'Cause found' : 'Investigating'}`;
  }
  switch (h.state) {
    case 'checking': return '<span class="hc-loader" aria-hidden="true"></span>Checking';
    case 'out': return `${icon('x', 12)}Ruled out · ${mmss(h.at)}`;
    case 'confirmed': return `${icon('check', 12)}Confirmed · ${mmss(h.at)}`;
    case 'root': return fixed ? `<span class="badge green">${icon('check', 12)}Fixed</span>` : '<span class="badge red"><span class="dot"></span>Root cause</span>';
    default: return '';
  }
}
function nodeHtml(id) {
  const h = H[id];
  const st = h.state === 'out' ? 'out' : h.state === 'root' ? (fixed ? 'fixed' : 'found') : '';
  return `<div class="hc-node" data-id="${id}"${st ? ` data-state="${st}"` : ''}${id === selected ? ' aria-current="true"' : ''} style="--node-w:210px">
    <div class="hc-node-h">${icon(h.glyph, 15)}<button class="hc-node-t" data-pick>${esc(h.title)}</button></div>
    <div class="hc-node-r"><span class="hc-file">${icon('file', 12)}${esc(h.file)}</span>${h.more ? `<span class="hc-more">+${h.more}</span>` : ''}</div>
    <div class="hc-node-r"><span class="hc-node-s">${status(id)}</span></div>
  </div>`;
}
function liHtml(id, path) {
  const h = H[id];
  const attr = path.includes(id) && !h.root ? ' data-on' : h.state === 'out' ? ' data-off' : '';
  const kids = h.kids ? `<ul data-join="${h.join}">${h.kids.map(k => liHtml(k, path)).join('')}</ul>` : '';
  return `<li${attr}>${nodeHtml(id)}${kids}</li>`;
}

function draw() {
  $('[data-rc-tree]').innerHTML = `<ul>${liHtml('h0', pathTo(selected))}</ul>`;
  const hyps = Object.keys(H).filter(k => !H[k].root);
  const out = hyps.filter(k => H[k].state === 'out').length;
  $('[data-rc-sub]').textContent = `${hyps.length} hypotheses · ${out} ruled out`;
  const badge = $('[data-rc-badge]');
  const checking = hyps.some(k => H[k].state === 'checking');
  if (fixed) {
    badge.className = 'badge green';
    badge.removeAttribute('style');
    badge.innerHTML = `${icon('circle-check', 12)}Fixed`;
  } else if (checking) {
    badge.className = 'badge';
    badge.style.color = 'var(--blue)';
    badge.innerHTML = '<span class="hc-loader" aria-hidden="true"></span>Investigating';
  } else {
    badge.className = 'badge red';
    badge.removeAttribute('style');
    badge.innerHTML = `<span class="dot"></span>Root cause found`;
  }
  $('[data-rc-clock]').textContent = mmss(clock);
  detail();
}

function detail() {
  const h = H[selected];
  $('[data-d-title]').textContent = h.title;
  const meta = { out: 'Ruled out', root: fixed ? 'Fixed' : 'Root cause', confirmed: 'Confirmed', checking: 'Checking' }[h.state] || 'Investigating';
  $('[data-d-meta]').textContent = h.at ? `${meta} · ${mmss(h.at)}` : meta;
  $('[data-rc-detail] .panel-h svg')?.replaceWith(document.createRange().createContextualFragment(icon(h.glyph, 15)));
  let body = `<p style="margin:0">${esc(h.state === 'confirmed' && h.done ? h.done : h.why || 'The failing run: 4 of 12 checkout tests fail on orders that use a coupon.')}</p>`;
  body += `<span><span class="hc-file">${icon('file', 12)}${esc(h.path || h.file)}</span></span>`;
  if (h.diff) {
    body += `<div class="eyebrow">Diff · ${esc(h.path)}</div><pre class="hc-diff">${h.diff.map(l => `<span class="${l[0] === '-' ? 'del' : 'add'}">${esc(l)}</span>`).join('')}</pre>`;
    if (fixed) body += `<div class="alert ok">${icon('circle-check', 15)}<span>Fix applied. The checkout tests pass: 12 of 12.</span></div>`;
  }
  const acts = [];
  if (!h.root && h.state !== 'checking') acts.push(`<button class="btn btn-secondary btn-sm" data-retry>${icon('rotate-ccw', 13)}Retry from here</button>`);
  if (h.diff && !fixed) acts.push(`<button class="btn btn-primary btn-sm" data-fix>${icon('wrench', 13)}Fix it</button>`);
  if (acts.length) body += `<div class="row" style="justify-content:flex-end;gap:8px">${acts.join('')}</div>`;
  $('[data-d-body]').innerHTML = body;
}

// Resolve the next hypothesis that is still being checked, in order, until none is left.
function play() {
  clearInterval(timer);
  let wait = 0;
  timer = setInterval(() => {
    clock++;
    wait++;
    const next = ORDER.find(k => H[k].state === 'checking' && !(H[k].kids || []).some(c => H[c].state === 'checking'));
    if (!next) {
      clearInterval(timer);
      draw();
      return;
    }
    if (wait >= 2) {
      const h = H[next];
      if (h.kids && h.join === 'AND') h.state = h.kids.every(c => ['root', 'confirmed'].includes(H[c].state)) ? 'confirmed' : 'out';
      else if (h.kids) h.state = h.kids.some(c => ['root', 'confirmed'].includes(H[c].state)) ? 'confirmed' : 'out';
      else h.state = h.outcome;
      h.at = clock;
      wait = 0;
    }
    draw();
  }, 1000);
}

document.addEventListener('click', async e => {
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    selected = pick.closest('.hc-node').dataset.id;
    return draw();
  }
  if (e.target.closest('[data-retry]')) {
    fixed = false;
    for (const id of subtree(selected)) {
      if (!H[id].root) {
        H[id].state = 'checking';
        H[id].at = null;
      }
    }
    // the hypotheses above it are open again too
    for (let p = parentOf(selected); p && !H[p].root; p = parentOf(p)) H[p].state = 'checking';
    draw();
    toast(`Checking ${H[selected].title} again`);
    return play();
  }
  const fix = e.target.closest('[data-fix]');
  if (fix) {
    await busy(fix, 1500);
    fixed = true;
    draw();
    toast('Fix applied to app/checkout/coupon.ts. Tests pass: 12 of 12');
  }
});

draw();
play();
