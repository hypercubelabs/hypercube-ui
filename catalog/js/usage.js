// Rate limit planner template. Each run has a start, a length and a peak rate; the chart
// adds every run up minute by minute against the limit. Drag a bar (or use the arrow keys
// on it) to move a run; the footer says what to do next. Everything stays on this page.
import { icon } from './icons.js';
import { $, esc, toast, closeLayer } from './ui.js';

const DAY0 = 6 * 60; // the timeline starts at 06:00
const SPAN = 24 * 60; // and runs 24 hours
const NOW = 10 * 60 + 30; // the example's clock: 10:30
const BATCH = 23 * 60; // nightly batch marker
const LIMIT = 120; // thousand tokens per minute
const SAFE = 96; // 80% of the limit
const STEP = 5;
const COLORS = ['violet', 'teal', 'rose', 'blue', 'orange', 'green'];

let runs = [
  { id: 'r1', name: 'Inbox triage', start: 8 * 60, len: 288, peak: 46, color: 'blue', fixed: true },
  { id: 'r2', name: 'Lead research', start: 11 * 60 + 30, len: 216, peak: 82, color: 'violet' },
  { id: 'r3', name: 'Report writer', start: 12 * 60, len: 230, peak: 74, color: 'teal' },
  { id: 'r4', name: 'Code review', start: 13 * 60 + 15, len: 144, peak: 36, color: 'rose' },
];
let selected = 'r4';
let seq = 5;

const hm = m => {
  const x = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
};
const k = v => `${Math.round(v)}k`;

// How hard a run pulls over its length: a quick climb, a short plateau with a dip, then a long tail.
function shape(u) {
  if (u < 0 || u > 1) return 0;
  if (u < 0.1) return 0.5 - 0.5 * Math.cos((u / 0.1) * Math.PI);
  const wobble = 1 - 0.12 * Math.sin(((u - 0.1) / 0.18) * Math.PI) * (u < 0.28 ? 1 : 0);
  return u < 0.28 ? wobble : Math.exp(-(u - 0.28) * 2.6);
}
const rate = (r, t) => r.peak * shape((t - r.start) / r.len);
const sample = (list, t) => list.reduce((s, r) => s + rate(r, t), 0);

function analyse(list, step = 1) {
  let peak = 0;
  let peakAt = DAY0;
  const over = [];
  let open = null;
  for (let t = DAY0; t <= DAY0 + SPAN; t += step) {
    const v = sample(list, t);
    if (v > peak) {
      peak = v;
      peakAt = t;
    }
    if (v > LIMIT && open == null) open = t;
    if (v <= LIMIT && open != null) {
      over.push([open, t]);
      open = null;
    }
  }
  if (open != null) over.push([open, DAY0 + SPAN]);
  return { peak, peakAt, over };
}
const fits = list => analyse(list).peak <= LIMIT;
const latestStart = r => DAY0 + SPAN - r.len;
const earliestStart = () => Math.ceil(NOW / STEP) * STEP;

// The closest start to where the run is now (either way) that keeps the day under the limit.
function nearestFit(r, ceiling = LIMIT) {
  const others = runs.filter(x => x !== r);
  for (let d = 0; d <= SPAN; d += STEP) {
    for (const s of [r.start - d, r.start + d]) {
      if (s < earliestStart() || s > latestStart(r)) continue;
      if (analyse([...others, { ...r, start: s }], 2).peak <= ceiling) return s;
    }
  }
  return null;
}

/* ---------- draw ---------- */
const usage = $('[data-usage]');
const chart = $('[data-chart]');

function drawChart(a) {
  const W = chart.clientWidth - parseFloat(getComputedStyle(chart).paddingLeft) - parseFloat(getComputedStyle(chart).paddingRight);
  const H = 230;
  const top = 46;
  const base = H - 22;
  const outside = parseFloat(getComputedStyle(chart).paddingLeft) > 60;
  const ymax = Math.max(LIMIT * 1.3, a.peak * 1.12);
  const x = t => ((t - DAY0) / SPAN) * W;
  const y = v => base - (v / ymax) * (base - top);
  const pts = (from, to, f) => {
    const p = [];
    for (let t = from; t <= to; t += 4) p.push(`${x(t).toFixed(1)},${y(f(t)).toFixed(1)}`);
    return p.join(' ');
  };
  const total = t => sample(runs, t);
  const sel = runs.find(r => r.id === selected);
  const css = n => `var(--${n})`;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="color-mix(in srgb, var(--red) 8%, transparent)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--red)" stroke-opacity=".45" stroke-width="1.5"/></pattern></defs>`;
  // hours
  for (let t = DAY0; t < DAY0 + SPAN; t += 180) s += `<text x="${x(t)}" y="${H - 4}">${hm(t)}</text>`;
  // over-limit bands
  for (const [f, t] of a.over) s += `<rect x="${x(f)}" y="${top}" width="${Math.max(1, x(t) - x(f))}" height="${base - top}" fill="url(#hatch)"/>`;
  // limit and 80%
  const lx = outside ? -8 : 2;
  const anchor = outside ? 'end' : 'start';
  s += `<line x1="0" x2="${W}" y1="${y(LIMIT)}" y2="${y(LIMIT)}" stroke="var(--red)" stroke-dasharray="4 4"/><text x="${lx}" y="${y(LIMIT) + (outside ? 4 : -4)}" text-anchor="${anchor}" style="fill:var(--red)">${LIMIT}k</text>`;
  s += `<line x1="0" x2="${W}" y1="${y(SAFE)}" y2="${y(SAFE)}" stroke="var(--border-strong)" stroke-dasharray="2 4"/><text x="${lx}" y="${y(SAFE) + (outside ? 4 : -4)}" text-anchor="${anchor}">${SAFE}k</text>`;
  s += `<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--border)"/>`;
  // batch and now
  s += `<line x1="${x(BATCH)}" x2="${x(BATCH)}" y1="20" y2="${base}" stroke="var(--border-strong)" stroke-dasharray="2 3"/><text x="${x(BATCH)}" y="14" text-anchor="middle">Nightly batch ${hm(BATCH)}</text>`;
  s += `<line x1="${x(NOW)}" x2="${x(NOW)}" y1="20" y2="${base}" stroke="var(--text-3)"/><text x="${x(NOW)}" y="14" text-anchor="middle">Now ${hm(NOW)}</text>`;
  // the total: solid before now, dashed after, red where it is over
  s += `<polygon points="${x(NOW)},${base} ${pts(NOW, DAY0 + SPAN, total)} ${x(DAY0 + SPAN)},${base}" fill="var(--text)" fill-opacity=".035"/>`;
  s += `<polyline points="${pts(DAY0, NOW, total)}" fill="none" stroke="var(--text-3)" stroke-width="1.6"/>`;
  s += `<polyline points="${pts(NOW, DAY0 + SPAN, total)}" fill="none" stroke="var(--border-strong)" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  for (const [f, t] of a.over) s += `<polyline points="${pts(f, t, total)}" fill="none" stroke="var(--red)" stroke-width="2"/>`;
  // the chosen run on its own
  if (sel && !sel.fixed) {
    const f = t => rate(sel, t);
    const from = Math.max(DAY0, sel.start);
    const to = Math.min(DAY0 + SPAN, sel.start + sel.len);
    s += `<polygon points="${x(from)},${base} ${pts(from, to, f)} ${x(to)},${base}" fill="${css(sel.color)}" fill-opacity=".12"/><polyline points="${pts(from, to, f)}" fill="none" stroke="${css(sel.color)}" stroke-width="2"/>`;
  }
  // peak
  const over = a.peak > LIMIT;
  const label = `Peak ${k(a.peak)} · ${hm(a.peakAt)}`;
  const lw = label.length * 6.4 + 14;
  const px = Math.min(Math.max(x(a.peakAt) + lw / 2 + 8, lw / 2), W - lw / 2);
  const py = Math.max(top - 6, y(a.peak) - 12);
  s += `<circle cx="${x(a.peakAt)}" cy="${y(a.peak)}" r="3.5" fill="var(--surface)" stroke="${over ? 'var(--red)' : 'var(--text-3)'}" stroke-width="1.5"/>`;
  s += `<rect x="${px - lw / 2}" y="${py - 13}" width="${lw}" height="19" rx="5" fill="${over ? 'var(--red-soft)' : 'var(--surface-2)'}"/><text x="${px}" y="${py}" text-anchor="middle" style="fill:${over ? 'var(--red)' : 'var(--text-2)'};font-weight:500">${label}</text>`;
  chart.innerHTML = `${s}</svg>`;
}

function drawRuns(a) {
  $('[data-runs]').innerHTML = runs
    .map(r => {
      const from = (r.start - DAY0) / SPAN;
      const len = r.len / SPAN;
      // the part of this bar that sits in an over-limit stretch
      let ov = '';
      for (const [f, t] of a.over) {
        const s = Math.max(f, r.start);
        const e = Math.min(t, r.start + r.len);
        if (e > s && rate(r, (s + e) / 2) > 1) {
          ov = ` data-over style="--from:${from};--len:${len};--over-from:${(s - r.start) / r.len};--over-len:${(e - s) / r.len}"`;
          break;
        }
      }
      const style = ov || ` style="--from:${from};--len:${len}"`;
      const cur = r.id === selected ? ' aria-current="true"' : '';
      const bar = r.fixed
        ? `<span class="hc-run-bar"${style}><span>${k(r.peak)}</span></span>`
        : `<button class="hc-run-bar" data-bar="${r.id}"${style} aria-label="${esc(r.name)}, starts ${hm(r.start)}. Arrow keys move it 5 minutes."><span>${k(r.peak)}</span></button>`;
      const x = r.fixed ? '' : `<button class="ibtn ibtn-xs" data-remove="${r.id}" aria-label="Remove ${esc(r.name)}" data-tip="Remove">${icon('x', 13)}</button>`;
      return `<li class="hc-run"${r.fixed ? ' data-fixed' : ''}${cur} style="--c:var(--${r.color})" data-row="${r.id}"><span class="hc-run-n"><i></i><b>${esc(r.name)}</b><time>${r.fixed ? 'Running' : hm(r.start)}</time></span><span class="hc-run-track">${bar}</span><span class="hc-run-x">${x}</span></li>`;
    })
    .join('');
}

function drawText(a) {
  const total = runs.reduce((s, r) => {
    let sum = 0;
    for (let t = r.start; t < r.start + r.len; t += 1) sum += rate(r, t);
    return s + sum;
  }, 0);
  $('[data-usage-sub]').textContent = `${runs.length} run${runs.length === 1 ? '' : 's'} · ${(total / 1000).toFixed(1)}M tokens · ${LIMIT}k / min`;
  const badge = $('[data-usage-badge]');
  if (a.over.length) {
    badge.className = 'badge red';
    badge.textContent = `Over limit · ${hm(a.over[0][0])}–${hm(a.over[0][1])}${a.over.length > 1 ? ` +${a.over.length - 1}` : ''}`;
  } else {
    badge.className = 'badge green';
    badge.textContent = 'Within limit';
  }
  const msg = $('[data-usage-msg]');
  const act = $('[data-usage-act]');
  act.innerHTML = '';
  const sel = runs.find(r => r.id === selected && !r.fixed);
  if (!a.over.length) {
    msg.textContent = `Every run fits. The busiest minute is ${hm(a.peakAt)} at ${k(a.peak)} of ${LIMIT}k.`;
    return;
  }
  if (!sel) {
    msg.textContent = `Over the limit from ${hm(a.over[0][0])}. Pick a run to see where it fits, or try Spread out.`;
    return;
  }
  if (!fits(runs.filter(r => r !== sel))) {
    msg.textContent = `Over the limit even without ${sel.name}. Try Spread out, or move another run.`;
    return;
  }
  if (drag) {
    msg.textContent = `${sel.name} starts at ${hm(sel.start)}. Let go to see where it fits.`;
    return;
  }
  const at = nearestFit(sel);
  if (at == null) {
    msg.textContent = `No time today fits ${sel.name} under the limit. Try Spread out.`;
    return;
  }
  msg.textContent = `${sel.name} takes the day over the limit at ${hm(a.over[0][0])}. It fits at ${hm(at)}.`;
  act.innerHTML = `<button class="btn btn-primary btn-sm" data-move="${sel.id}" data-to="${at}">Move to ${hm(at)}</button>`;
}

function draw() {
  const a = analyse(runs);
  usage.style.setProperty('--now', String((NOW - DAY0) / SPAN));
  drawChart(a);
  drawRuns(a);
  drawText(a);
}

/* ---------- moving runs ---------- */
const snapshot = () => JSON.stringify(runs);
const restore = s => {
  runs = JSON.parse(s);
  draw();
};
function moveTo(r, start) {
  r.start = Math.min(latestStart(r), Math.max(earliestStart(), Math.round(start / STEP) * STEP));
}

let drag = null;
document.addEventListener('pointerdown', e => {
  const bar = e.target.closest('[data-bar]');
  if (!bar) return;
  const r = runs.find(x => x.id === bar.dataset.bar);
  selected = r.id;
  const track = bar.parentElement.getBoundingClientRect();
  drag = { r, x0: e.clientX, s0: r.start, w: track.width, before: snapshot(), moved: false };
  bar.setPointerCapture(e.pointerId);
  draw();
  $(`[data-bar="${r.id}"]`)?.focus({ preventScroll: true });
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  const dm = ((e.clientX - drag.x0) / drag.w) * SPAN;
  if (Math.abs(dm) >= STEP) drag.moved = true;
  moveTo(drag.r, drag.s0 + dm);
  draw();
});
document.addEventListener('pointerup', () => {
  if (!drag) return;
  const { r, before, moved } = drag;
  drag = null;
  draw();
  if (moved) toast(`Moved ${r.name} to ${hm(r.start)}`, () => restore(before));
});
document.addEventListener('keydown', e => {
  const bar = e.target.closest?.('[data-bar]');
  if (!bar || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const r = runs.find(x => x.id === bar.dataset.bar);
  selected = r.id;
  moveTo(r, r.start + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 30 : STEP));
  draw();
  $(`[data-bar="${r.id}"]`).focus();
});

document.addEventListener('click', e => {
  const t = e.target;
  const row = t.closest('[data-row]');
  const rm = t.closest('[data-remove]');
  if (rm) {
    const before = snapshot();
    const r = runs.find(x => x.id === rm.dataset.remove);
    runs = runs.filter(x => x !== r);
    selected = null;
    draw();
    return toast(`Removed ${r.name}`, () => restore(before));
  }
  const mv = t.closest('[data-move]');
  if (mv) {
    const before = snapshot();
    const r = runs.find(x => x.id === mv.dataset.move);
    r.start = +mv.dataset.to;
    draw();
    return toast(`Moved ${r.name} to ${hm(r.start)}`, () => restore(before));
  }
  if (t.closest('[data-spread]')) return spread();
  if (row && !t.closest('[data-bar]') && !row.hasAttribute('data-fixed')) {
    selected = row.dataset.row;
    draw();
  }
});

// Spread out: in start order, push each run later until the day stays under 80% of the limit,
// or to the time that keeps the peak lowest if nothing gets that low.
function spread() {
  const before = snapshot();
  const movable = runs.filter(r => !r.fixed).sort((a, b) => a.start - b.start);
  const placed = runs.filter(r => r.fixed);
  let moved = 0;
  for (const r of movable) {
    let best = r.start;
    let bestPeak = Infinity;
    for (let s = Math.max(r.start, earliestStart()); s <= latestStart(r); s += STEP) {
      const p = analyse([...placed, { ...r, start: s }], 2).peak;
      if (p < bestPeak) {
        bestPeak = p;
        best = s;
      }
      if (p <= SAFE) break;
    }
    if (best !== r.start) moved++;
    r.start = best;
    placed.push(r);
  }
  draw();
  const a = analyse(runs);
  if (!moved) return toast('Nothing to move: the runs are already spread out');
  toast(`Spread out ${moved} run${moved === 1 ? '' : 's'}. Peak is now ${k(a.peak)} at ${hm(a.peakAt)}`, () => restore(before));
}

/* ---------- add a run ---------- */
const form = $('[data-run-form]');
form.addEventListener('submit', e => {
  e.preventDefault();
  const [h, m] = form.at.value.split(':').map(Number);
  let start = h * 60 + m;
  if (start < DAY0) start += 1440;
  const r = { id: `r${seq++}`, name: form.name.value.trim(), start, len: +form.len.value, peak: +form.peak.value, color: COLORS[(seq - 2) % COLORS.length] };
  moveTo(r, start);
  runs.push(r);
  selected = r.id;
  closeLayer(form.closest('[data-layer]'));
  form.reset();
  draw();
  toast(`Added ${r.name} at ${hm(r.start)}`);
});

draw();
addEventListener('resize', () => drawChart(analyse(runs)));
