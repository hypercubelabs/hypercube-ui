// Workflow editor template. The page ships static markup (it reads fine without JavaScript);
// this script keeps the workflow in memory and redraws the tree from it, the way your app
// would draw it from the server. Nothing leaves the page.
import { icon } from './icons.js';
import { $, $$, esc, toast, busy } from './ui.js';

const KIND = {
  trigger: { label: 'Trigger', icon: 'play', glyph: 'mail', body: 'Event', field: 'Event' },
  agent: { label: 'Agent', icon: 'sparkles', glyph: 'sparkles', body: 'Instructions', field: 'Instructions' },
  action: { label: 'Action', icon: 'zap', glyph: 'file-text', body: 'Action', field: 'What it does' },
  approval: { label: 'Human step', icon: 'hand', glyph: 'user-check', body: 'Request', field: 'Request message' },
};

const flow = {
  root: 'n1',
  nodes: {
    n1: { kind: 'trigger', title: 'Invoice received', text: 'An invoice lands in ap@example.com or comes in through the ERP webhook.', stats: [['runs', '1,284/wk'], ['p95', '0.3s']], children: ['n2'] },
    n2: {
      kind: 'agent',
      title: 'Match & reconcile',
      text: 'Extract line items, run a 3-way match against the PO and goods receipt, and explain any variance.',
      tools: ['erp.lookup_po', 'erp.get_receipt', 'ocr.extract'],
      stats: [['cost', '$0.04/run'], ['p95', '6.2s']],
      children: ['n3', 'n4'],
    },
    n3: { kind: 'action', edge: 'variance ≤ 2%', title: 'Post to ledger', text: 'Create the bill in the ERP, attach the PDF, and post a note to #ap-ops.', stats: [['auto-posted', '91%'], ['p95', '1.4s']], children: [] },
    n4: {
      kind: 'approval',
      edge: 'variance > 2%',
      title: 'Approval gate',
      text: "Send the match diff and the agent's reasoning to Finance Controllers, then wait for a decision.",
      brief: 'Summarize the variance, cite the mismatched lines, and recommend approve or reject with a confidence score.',
      who: 'Finance Controllers · 4 people',
      att: ['Invoice PDF', 'Match diff', 'Agent reasoning'],
      wait: 'Escalate to AP manager after 4h',
      stats: [['pending', '6'], ['median wait', '52m']],
      children: [],
    },
  },
};

// On phones the panel is a sheet over the canvas, so it starts closed.
let selected = matchMedia('(max-width: 900px)').matches ? null : 'n4';
let changes = 3;
let version = 12;
let seq = 5;
let run = {}; // node id -> 'running' | 'done' | 'waiting'
let testCount = 0;

const tree = $('[data-tree]');
const flowEl = $('.hc-flow');
const form = $('[data-node-form]');

const parentOf = id => Object.keys(flow.nodes).find(p => flow.nodes[p].children.includes(id));
const pathTo = id => {
  const path = [];
  for (let n = id; n; n = parentOf(n)) path.unshift(n);
  return path;
};

/* ---------- draw ---------- */
function nodeHtml(id) {
  const n = flow.nodes[id];
  const k = KIND[n.kind];
  const r = run[id];
  const runMark = r === 'running' ? '<span class="hc-node-run"><span class="hc-loader" aria-hidden="true"></span>Running</span>'
    : r === 'done' ? `<span class="hc-node-run">${icon('circle-check', 13)}Done</span>`
    : r === 'waiting' ? '<span class="hc-node-run"><span class="badge amber">Waiting</span></span>' : '';
  const acts = id === flow.root ? '' : `<div class="hc-node-acts"><button class="ibtn ibtn-sm" data-del="${id}" aria-label="Delete ${esc(n.title)}" data-tip="Delete" data-tip-pos="right">${icon('trash-2', 14)}</button><button class="ibtn ibtn-sm" data-dup="${id}" aria-label="Duplicate ${esc(n.title)}" data-tip="Duplicate" data-tip-pos="right">${icon('copy', 14)}</button></div>`;
  return `<div class="hc-node" data-id="${id}"${id === selected ? ' aria-current="true"' : ''}${r ? ` data-run="${r}"` : ''}>
    <div class="hc-node-k">${icon(k.icon, 12)}${k.label}</div>
    <div class="hc-node-h">${icon(k.glyph, 15)}<button class="hc-node-t" data-pick>${esc(n.title)}</button>${runMark}</div>
    <div class="hc-node-b"><span class="hc-node-l">${k.body}</span>${esc(n.text)}</div>
    ${n.tools?.length ? `<div class="hc-node-b"><span class="hc-node-l">Tools</span>${n.tools.map(t => `<code>${esc(t)}</code>`).join('')}</div>` : ''}
    ${n.stats ? `<div class="hc-node-f">${n.stats.map(([l, v]) => `<span>${l}: <b>${esc(v)}</b></span>`).join('')}</div>` : ''}
    ${acts}
  </div>`;
}
function liHtml(id, onPath) {
  const n = flow.nodes[id];
  const on = onPath.includes(id) ? ' data-on' : '';
  const kids = n.children.length
    ? `<ul>${n.children.map(c => liHtml(c, onPath)).join('')}</ul>`
    : `<button class="hc-add" data-add="${id}" aria-label="Add a step after ${esc(n.title)}">${icon('plus', 13)}</button>`;
  return `<li${on}>${n.edge ? `<span class="hc-edge">${esc(n.edge)}</span>` : ''}${nodeHtml(id)}${kids}</li>`;
}
function draw() {
  const onPath = selected ? pathTo(selected) : Object.keys(run);
  tree.innerHTML = `<ul>${liHtml(flow.root, onPath)}</ul>`;
  const d = $('[data-draft]');
  if (changes) {
    d.classList.replace('green', 'amber');
    d.innerHTML = `<span class="dot"></span>Draft · ${changes} change${changes === 1 ? '' : 's'}`;
  } else {
    d.classList.replace('amber', 'green');
    d.innerHTML = `<span class="dot"></span>Live · v${version}`;
  }
  $('[data-deploy]').disabled = !changes;
}

/* ---------- side panel ---------- */
function fill() {
  if (!selected) {
    delete flowEl.dataset.side;
    return;
  }
  flowEl.dataset.side = '';
  const n = flow.nodes[selected];
  $('#side-t').textContent = n.title;
  $('[data-side-icon]').innerHTML = icon(KIND[n.kind].glyph, 16);
  form.kind.value = n.kind;
  form.title.value = n.title;
  form.text.value = n.text;
  form.brief.value = n.brief || '';
  form.who.value = n.who || form.who.options[0].value;
  form.wait.value = n.wait || form.wait.options[0].value;
  $$('[name=att]', form).forEach(c => (c.checked = (n.att || []).includes(c.value)));
  kindChanged();
}
function kindChanged() {
  const kind = form.kind.value;
  $('[data-text-label]').textContent = KIND[kind].field;
  $$('[data-only]', form).forEach(el => (el.hidden = el.dataset.only !== kind));
}
form.kind.addEventListener('change', kindChanged);

function select(id) {
  selected = id;
  run = {};
  draw();
  fill();
}

/* ---------- edits ---------- */
const snapshot = () => JSON.stringify({ flow, selected, changes });
function restore(s) {
  const o = JSON.parse(s);
  flow.nodes = o.flow.nodes;
  selected = o.selected;
  changes = o.changes;
  draw();
  fill();
}
const log = text => {
  $('[data-activity]').insertAdjacentHTML('afterbegin', `<li><div class="hc-act" data-now><div class="hc-act-row">${icon('pencil', 13)}<span class="hc-act-t">${text}</span><time>now</time></div></div></li>`);
  $('[data-edited]').textContent = 'Edited just now by you';
};

function addAfter(parent) {
  const id = `n${seq++}`;
  flow.nodes[id] = { kind: 'action', title: 'New step', text: 'Describe what this step does.', stats: null, children: [] };
  flow.nodes[parent].children.push(id);
  changes++;
  select(id);
  log(`You added <b>New step</b>`);
  form.title.focus();
  form.title.select();
}

document.addEventListener('click', e => {
  const t = e.target;
  const pick = t.closest('[data-pick]');
  if (pick) return select(pick.closest('.hc-node').dataset.id);
  const add = t.closest('[data-add]');
  if (add) return addAfter(add.dataset.add);
  if (t.closest('[data-add-node]')) {
    let at = selected || flow.root;
    while (flow.nodes[at].children.length) at = flow.nodes[at].children[flow.nodes[at].children.length - 1];
    return addAfter(selected && !flow.nodes[selected].children.length ? selected : at);
  }
  const del = t.closest('[data-del]');
  if (del) {
    const before = snapshot();
    const id = del.dataset.del;
    const title = flow.nodes[id].title;
    const gone = [];
    const walk = x => (gone.push(x), flow.nodes[x].children.forEach(walk));
    walk(id);
    const p = parentOf(id);
    flow.nodes[p].children = flow.nodes[p].children.filter(c => c !== id);
    gone.forEach(g => delete flow.nodes[g]);
    changes++;
    selected = p;
    draw();
    fill();
    return toast(gone.length > 1 ? `Deleted ${title} and ${gone.length - 1} step${gone.length > 2 ? 's' : ''} after it` : `Deleted ${title}`, () => restore(before));
  }
  const dup = t.closest('[data-dup]');
  if (dup) {
    const src = flow.nodes[dup.dataset.dup];
    const id = `n${seq++}`;
    flow.nodes[id] = { ...structuredClone(src), title: `${src.title} copy`, edge: undefined, children: [] };
    const p = flow.nodes[parentOf(dup.dataset.dup)];
    p.children.splice(p.children.indexOf(dup.dataset.dup) + 1, 0, id);
    changes++;
    log(`You duplicated <b>${esc(src.title)}</b>`);
    return select(id);
  }
  if (t.closest('[data-side-close]')) {
    selected = null;
    draw();
    return fill();
  }
  if (t.closest('[data-discard]')) {
    fill();
    return toast('Changes to this node discarded');
  }
  if (t.closest('[data-save]')) {
    const n = flow.nodes[selected];
    const next = {
      kind: form.kind.value,
      title: form.title.value.trim() || n.title,
      text: form.text.value.trim(),
      brief: form.brief.value.trim(),
      who: form.who.value,
      wait: form.wait.value,
      att: $$('[name=att]:checked', form).map(c => c.value),
    };
    if (next.kind !== 'approval') ['brief', 'who', 'wait', 'att'].forEach(k => delete next[k]);
    Object.assign(n, next);
    changes++;
    log(`You changed <b>${esc(n.title)}</b>`);
    draw();
    fill();
    return toast(`Saved ${n.title} to the draft`);
  }
  const v = t.closest('[data-var]');
  if (v) {
    const field = lastText || form.text;
    const tok = `{{${v.dataset.var}}}`;
    const at = field.selectionStart ?? field.value.length;
    field.value = field.value.slice(0, at) + tok + field.value.slice(field.selectionEnd ?? at);
    field.focus();
    field.selectionStart = field.selectionEnd = at + tok.length;
    return;
  }
  const dep = t.closest('[data-deploy]');
  if (dep) return deploy(dep);
  const test = t.closest('[data-test-run]');
  if (test) return testRun(test);
  if (t.closest('[data-open="#wf-code"]')) {
    const out = {};
    const walk = id => {
      const { children, stats, ...rest } = flow.nodes[id];
      return { id, ...rest, next: children.map(walk) };
    };
    out.workflow = { id: 'wf_7c21e9b0', name: 'AP exception triage', version: changes ? `draft of v${version + 1}` : `v${version}`, start: walk(flow.root) };
    $('[data-code]').textContent = JSON.stringify(out, null, 2);
  }
  if (t.closest('[data-copy-code]')) {
    navigator.clipboard?.writeText($('[data-code]').textContent).then(
      () => toast('Copied'),
      () => toast('Select the text and copy it'),
    );
  }
});

let lastText = null;
document.addEventListener('focusin', e => {
  if (e.target.matches('[data-node-form] textarea')) lastText = e.target;
});

// Guardrails count follows the switches.
document.addEventListener('change', e => {
  if (!e.target.matches('[data-guard]')) return;
  $('[data-guard-count]').textContent = $$('[data-guard]:checked').length;
  changes++;
  log(`You turned ${e.target.checked ? 'on' : 'off'} <b>${esc(e.target.getAttribute('aria-label'))}</b>`);
  draw();
});

async function deploy(btn) {
  await busy(btn, 1200);
  version++;
  changes = 0;
  draw();
  toast(`Deployed version ${version}`);
}

// A test run walks the tree with a sample invoice. Odd runs take the approval branch.
async function testRun(btn) {
  btn.disabled = true;
  selected = null;
  fill();
  testCount++;
  const variance = testCount % 2 ? 3.4 : 1.2;
  run = {};
  let id = flow.root;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  while (id) {
    run[id] = 'running';
    draw();
    await wait(700);
    const n = flow.nodes[id];
    if (n.kind === 'approval') {
      run[id] = 'waiting';
      draw();
      toast(`Test run paused at ${n.title}: variance ${variance}% is over 2%. It waits for ${(n.who || 'a person').split(' ·')[0]}.`);
      break;
    }
    run[id] = 'done';
    const kids = n.children;
    if (!kids.length) {
      draw();
      toast(`Test run finished at ${n.title}`);
      break;
    }
    id = kids.length === 1 ? kids[0] : kids.find(k => (variance > 2 ? />/ : /≤/).test(flow.nodes[k].edge || '')) || kids[0];
  }
  btn.disabled = false;
}

draw();
fill();
