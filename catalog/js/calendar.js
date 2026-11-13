// Week calendar template. The page ships a static week; this script moves it to the real
// current week, draws the now line from the clock and lets you add, edit, move between
// weeks and filter. Events live in memory on this page only.
import { icon } from './icons.js';
import { zoomFactor } from '../hc/elements.js';
import { $, $$, esc, toast, openLayer, closeLayer } from './ui.js';

const START = 6;
const END = 22;
const COLORS = { math: 'violet', art: 'blue', physics: 'teal', sport: 'orange', computer: 'green' };
const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monday = d => addDays(d, -((d.getDay() + 6) % 7));
const hm = h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
const toH = s => {
  const [a, b] = s.split(':').map(Number);
  return a + b / 60;
};
const toTime = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

const thisMonday = monday(new Date());
let week = 0;
let showDay = (new Date().getDay() + 6) % 7;
let filter = new Set();
let editing = null;
let seq = 20;

// The sample week, placed on the real current week.
const seed = [
  [1, 'Math exam', 7, 7 + 40 / 60, 'math'],
  [1, 'Art exam', 7.5, 9, 'art'],
  [1, 'Physics exam', 10, 10 + 40 / 60, 'physics'],
  [1, 'Sport day', 10 + 50 / 60, 12 + 10 / 60, 'sport', true],
  [0, 'Art review', 13, 14, 'art'],
  [2, 'Physics lab', 8, 9.5, 'physics'],
  [3, 'Math exam', 9, 9 + 40 / 60, 'math'],
  [3, 'Computer exam', 9.75, 11.25, 'computer', true],
  [4, 'Math tutoring', 11, 12, 'math'],
];
const events = seed.map(([d, title, from, to, cat, confirmed], i) => ({ id: `e${i}`, date: iso(addDays(thisMonday, d)), title, from, to, cat, confirmed: !!confirmed }));

const cal = $('[data-cal]');

// Overlapping events share the column: each gets a lane and the number of lanes in its group.
function lanes(list) {
  list.sort((a, b) => a.from - b.from || b.to - a.to);
  const out = new Map();
  let group = [];
  let end = -1;
  const flush = () => {
    const used = [];
    for (const e of group) {
      let lane = used.findIndex(t => t <= e.from);
      if (lane < 0) lane = used.length;
      used[lane] = e.to;
      out.set(e.id, lane);
    }
    for (const e of group) out.set(e.id + ':n', used.length);
  };
  for (const e of list) {
    if (e.from >= end && group.length) {
      flush();
      group = [];
    }
    group.push(e);
    end = Math.max(end, e.to);
  }
  if (group.length) flush();
  return out;
}

function draw() {
  const mon = addDays(thisMonday, week * 7);
  const today = iso(new Date());
  const days = [...Array(7)].map((_, i) => addDays(mon, i));
  const sun = days[6];
  $('[data-week-title]').textContent =
    mon.getMonth() === sun.getMonth() ? `${MONTH[mon.getMonth()]} ${mon.getDate()} – ${sun.getDate()}, ${sun.getFullYear()}` : `${MONTH[mon.getMonth()]} ${mon.getDate()} – ${MONTH[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;
  const inWeek = events.filter(e => days.some(d => iso(d) === e.date));
  const shown = inWeek.filter(e => !filter.size || filter.has(e.cat));
  $('[data-week-sub]').textContent = !inWeek.length ? 'Nothing this week yet' : filter.size ? `${shown.length} of ${inWeek.length} events shown` : `${inWeek.length} event${inWeek.length === 1 ? '' : 's'} this week`;

  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  let html = '<div class="hc-cal-dh" aria-hidden="true"></div>';
  days.forEach((d, i) => {
    html += `<button class="hc-cal-dh" data-pick-day="${i}"${iso(d) === today ? ' aria-current="date"' : ''}${i === showDay ? ' data-show' : ''}>${DAY[i]} <b>${d.getDate()}</b></button>`;
  });
  html += `<div class="hc-cal-hours" aria-hidden="true">${[...Array(END - START)].map((_, i) => `<span style="--h:${START + i}">${String(START + i).padStart(2, '0')}:00</span>`).join('')}</div>`;
  days.forEach((d, i) => {
    const list = shown.filter(e => e.date === iso(d));
    const lane = lanes(list);
    const isToday = iso(d) === today;
    let inner = isToday && nowH >= START && nowH < END ? `<div class="hc-cal-now" style="--at:${nowH.toFixed(3)}"><span>${hm(nowH)}</span></div>` : '';
    for (const e of list) {
      inner += `<button class="hc-ev" data-ev="${e.id}"${editing === e.id ? ' aria-current="true"' : ''} style="--at:${e.from.toFixed(3)};--len:${(e.to - e.from).toFixed(3)};--c:var(--${COLORS[e.cat]});--lane:${lane.get(e.id)};--lanes:${lane.get(e.id + ':n')}" aria-label="${esc(e.title)}, ${hm(e.from)} to ${hm(e.to)}"><b>${esc(e.title)}</b><span>${hm(e.from)} – ${hm(e.to)}</span>${e.confirmed ? `<span class="badge">${icon('circle-check', 11)}Confirmed</span>` : ''}</button>`;
    }
    html += `<div class="hc-cal-day" data-day="${i}" data-date="${iso(d)}"${isToday ? ' data-today' : ''}${i === showDay ? ' data-show' : ''} aria-label="${DAY[i]} ${d.getDate()}">${inner}</div>`;
  });
  cal.innerHTML = html;

  $('[data-day-pick]').innerHTML = days
    .map((d, i) => `<button class="hc-filter" data-pick-day="${i}" aria-pressed="${i === showDay}">${DAY[i]} ${d.getDate()}</button>`)
    .join('');
}

/* ---------- the event form ---------- */
const layer = $('#ev-modal');
const form = $('[data-ev-form]');
function edit(e, from) {
  editing = e.id || null;
  $('#ev-t').textContent = e.id ? 'Edit event' : 'New event';
  form.title.value = e.title || '';
  form.date.value = e.date;
  form.from.value = toTime(e.from);
  form.to.value = toTime(e.to);
  form.cat.value = e.cat || [...filter][0] || 'math';
  form.confirmed.checked = !!e.confirmed;
  $('[data-ev-del]').hidden = !e.id;
  $('[data-ev-err]').hidden = true;
  openLayer(layer, from);
}
form.addEventListener('submit', ev => {
  ev.preventDefault();
  const from = toH(form.from.value);
  const to = toH(form.to.value);
  const err = $('[data-ev-err]');
  if (to <= from || from < START || to > END) {
    err.querySelector('span').textContent = to <= from ? 'The end has to be after the start.' : `Pick a time between ${START}:00 and ${END}:00.`;
    err.hidden = false;
    return;
  }
  const data = { title: form.title.value.trim(), date: form.date.value, from, to, cat: form.cat.value, confirmed: form.confirmed.checked };
  if (editing) Object.assign(events.find(e => e.id === editing), data);
  else events.push({ id: `e${seq++}`, ...data });
  // Show the week and day of what was just saved.
  const d = new Date(`${data.date}T00:00`);
  week = Math.round((monday(d) - thisMonday) / 6048e5);
  showDay = (d.getDay() + 6) % 7;
  toast(editing ? `Saved ${data.title}` : `Added ${data.title}`);
  editing = null;
  closeLayer(layer);
  draw();
});

document.addEventListener('click', e => {
  const t = e.target;
  const f = t.closest('[data-cal-filters] .hc-filter');
  if (f) {
    const cat = f.dataset.cat;
    if (!cat) filter.clear();
    else filter.has(cat) ? filter.delete(cat) : filter.add(cat);
    $$('[data-cal-filters] .hc-filter').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat ? filter.has(b.dataset.cat) : !filter.size)));
    return draw();
  }
  const w = t.closest('[data-week]');
  if (w) {
    week = +w.dataset.week === 0 ? 0 : week + +w.dataset.week;
    if (+w.dataset.week === 0) showDay = (new Date().getDay() + 6) % 7;
    return draw();
  }
  const p = t.closest('[data-pick-day]');
  if (p) {
    showDay = +p.dataset.pickDay;
    return draw();
  }
  const evb = t.closest('[data-ev]');
  if (evb) {
    const ev = events.find(x => x.id === evb.dataset.ev);
    return edit(ev, evb);
  }
  const day = t.closest('.hc-cal-day');
  if (day) {
    // A click on an empty slot starts an event there, on the half hour.
    const r = day.getBoundingClientRect();
    const hh = parseFloat(getComputedStyle(cal).getPropertyValue('--hh')) || 52;
    const at = Math.max(START, Math.min(END - 1, Math.floor(((e.clientY - r.top) / zoomFactor() / hh) * 2) / 2 + START));
    return edit({ date: day.dataset.date, from: at, to: at + 1 }, day);
  }
  if (t.closest('[data-new-event]')) {
    const now = new Date();
    const at = Math.max(START, Math.min(END - 1, now.getHours() + 1));
    return edit({ date: iso(now), from: at, to: at + 1 }, t.closest('button'));
  }
  if (t.closest('[data-ev-del]')) {
    const i = events.findIndex(x => x.id === editing);
    const [gone] = events.splice(i, 1);
    editing = null;
    closeLayer(layer);
    draw();
    toast(`Deleted ${gone.title}`, () => {
      events.splice(i, 0, gone);
      draw();
    });
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') editing = null;
});

draw();
// Keep the now line moving.
setInterval(draw, 60000);
// Start the scroll a little before now, so the morning is in view.
const wrap = $('.hc-cal-wrap');
const nowLine = $('.hc-cal-now');
if (nowLine) wrap.scrollTop = Math.max(0, nowLine.offsetTop - 120);
