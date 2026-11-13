// Builds the static catalog in site/ from catalog/.
// No dependencies: node scripts/catalog.mjs
//
// Every file in catalog/pages/*.html starts with a header comment:
//   <!-- title: Buttons | kind: piece | group: Pieces | order: 2 | icon: square | script: flow.js -->
// kind "piece" goes inside the catalog shell (sidebar); kind "template" is a whole screen.
// "script" (optional) loads catalog/js/<file> on that page only.
// In the body, {{i:name}} or {{i:name:size}} becomes an inline Lucide SVG (catalog/icons.json),
// {{menu:key}} the example app sidebar, {{mark}} or {{mark:32}} the Hypercube mark, {{version}} the version.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site');
const icons = JSON.parse(readFileSync(join(root, 'catalog/icons.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const missing = new Set();

const icon = (name, size = 16) => {
  const inner = icons[name];
  if (!inner) missing.add(name);
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner || ''}</svg>`;
};
const escHtml = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dedent = t => {
  const lines = t.replace(/^\n+|\s+$/g, '').split('\n');
  const pad = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(pad)).join('\n');
};
// <!-- ex: Title | .classes | description | col sunken --> markup <!-- /ex -->
// becomes an example with the live piece and its code right below.
const catalog = [];
let currentPage = null;
const examples = html =>
  html.replace(/<!-- ex:(.*?)-->([\s\S]*?)<!-- \/ex -->/g, (_, head, demo) => {
    const [title, classes = '', note = '', mods = ''] = head.split('|').map(x => x.trim());
    const raw = dedent(demo
        .replace(/\{\{mark(?::(\d+))?\}\}/g, (_, px) => `<img src="your-logo.svg" width="${px || 22}" height="${px || 22}" alt="">`)
        .replace(/\{\{i:([a-z0-9-]+)(?::(\d+))?\}\}/g, (_, n, px) => `<svg class="i" width="${px || 16}" height="${px || 16}"><!-- Lucide ${n}, stroke 1.8 --></svg>`));
    if (currentPage) catalog.push({ page: currentPage.title, name: title, classes, use: note, markup: raw });
    const code = escHtml(raw);
    const id = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `<section class="ex" id="${id}"><div class="ex-h"><h3>${title}</h3>${classes ? `<code class="faint">${escHtml(classes)}</code>` : ''}${note ? `<p>${note}</p>` : ''}</div><div class="ex-demo ${mods}">${demo}</div><details class="ex-code"><summary>{{i:chevron-right:14}}Code</summary><div class="row" style="padding:0 14px 6px"><span class="sp"></span><button class="btn btn-xs btn-ghost" data-copy>Copy</button></div><pre><code>${code}</code></pre></details></section>`;
  });
// {{menu:key}}: the sidebar of an example app, the same on every template, with the key's item on.
const APP = [
  ['home', 'Dashboard', 'layout-dashboard', 'template-dashboard.html'],
  ['inbox', 'Inbox', 'inbox', 'template-inbox.html', 3],
  ['chat', 'Conversations', 'message-circle', 'template-chat.html'],
  ['list', 'Tasks', 'circle-check', 'template-list.html'],
  ['calendar', 'Calendar', 'calendar', 'template-calendar.html'],
  ['bot', 'Bots', 'bot', 'template-bot.html'],
  ['flow', 'Workflows', 'workflow', 'template-workflow.html'],
  ['usage', 'Usage', 'gauge', 'template-usage.html'],
  ['cause', 'Investigations', 'git-fork', 'template-root-cause.html'],
];
const zoomCtl = `<hc-zoom class="hc-zoom" aria-label="Adjust screen"><span class="hc-zoom-l">${icon('scan', 16)}<span>Adjust screen</span></span><button class="ibtn ibtn-xs" data-zoom="out" aria-label="Make the screen smaller">${icon('minus', 13)}</button><button class="hc-zoom-v" data-zoom="reset">100%</button><button class="ibtn ibtn-xs" data-zoom="in" aria-label="Make the screen bigger">${icon('plus', 13)}</button></hc-zoom>`;
const appMenu = on => `<div class="side-scrim" data-menu-close></div>
<nav class="side" aria-label="Menu">
  <div class="side-top"><button class="hc-switch" data-menu="#ws-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Switch workspace: Example"><span class="hc-switch-logo">${MARK()}</span><span class="hc-switch-name"><b>Example</b></span>${icon('chevrons-up-down', 14)}</button></div>
  <div class="side-scroll">${APP.map(
    ([k, t, i, href, n]) =>
      `<a class="sitem${k === on ? ' on' : ''}" href="${href}"${k === on ? ' aria-current="page"' : ''}>${icon(i)}<span>${t}</span>${n ? `<span class="ct dotc">${n}</span>` : ''}</a>`,
  ).join('')}</div>
  <div class="side-bot"><a class="sitem${on === 'settings' ? ' on' : ''}" href="template-settings.html"${on === 'settings' ? ' aria-current="page"' : ''}>${icon('settings')}<span>Settings</span></a>${zoomCtl}</div>
</nav>
<div class="pop hc-switch-menu" id="ws-menu" role="menu" aria-label="Workspaces" hidden>
  <div class="mh">Workspaces</div>
  <button class="mi" role="menuitemradio" aria-checked="true" data-switch="Example"><span class="hc-switch-logo sm">${MARK(20)}</span><span class="grow trunc">Example</span><span class="r">Pro</span><span class="ck">${icon('check', 14)}</span></button>
  <button class="mi" role="menuitemradio" aria-checked="false" data-switch="Acme"><span class="hc-switch-logo sm" style="--c: var(--blue)">A</span><span class="grow trunc">Acme</span><span class="r">Free</span></button>
  <div class="msep"></div>
  <a class="mi" role="menuitem" href="template-settings.html">${icon('settings', 15)}Workspace settings</a>
</div>`;
// {{mark}} or {{mark:32}}: the Hypercube symbol (a brand file, not a style).
const MARK = (px = 22) =>
  `<svg width="${px}" height="${px}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#000"/><circle cx="32" cy="32" r="23" fill="#c7ff9f"/><circle cx="32" cy="32" r="11" fill="#000"/></svg>`;
const fill = html => examples(html).replace(/\{\{mark(?::(\d+))?\}\}/g, (_, px) => MARK(px ? +px : 22)).replace(/\{\{menu:([a-z]+)\}\}/g, (_, k) => appMenu(k)).replace(/\{\{i:([a-z0-9-]+)(?::(\d+))?\}\}/g, (_, n, s) => icon(n, s ? +s : 16)).replace(/\{\{version\}\}/g, pkg.version);

const pages = readdirSync(join(root, 'catalog/pages'))
  .filter(f => f.endsWith('.html'))
  .map(file => {
    const src = readFileSync(join(root, 'catalog/pages', file), 'utf8');
    const m = src.match(/^<!--(.*?)-->\n?/s);
    if (!m) throw new Error(`${file}: missing header`);
    const meta = Object.fromEntries(
      m[1].split('|').map(p => p.split(':').map(s => s.trim())).map(([k, ...v]) => [k, v.join(':')]),
    );
    return { file, body: src.slice(m[0].length), ...meta, order: +(meta.order || 0) };
  })
  .sort((a, b) => a.order - b.order);

const groups = [...new Set(pages.map(p => p.group))];
const nav = current =>
  groups
    .map(
      g =>
        `<div class="sgroup"><div class="sgroup-h">${g}</div>${pages
          .filter(p => p.group === g)
          .map(
            p =>
              `<a class="sitem${p.file === current ? ' on' : ''}" href="${p.file}"${p.file === current ? ' aria-current="page"' : ''}>${icon(p.icon || 'circle', 16)}<span>${p.title}</span></a>`,
          )
          .join('')}</div>`,
    )
    .join('');

const head = (title, extra = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title} · Hypercube UI</title>
<link rel="stylesheet" href="hc/index.css">
<link rel="stylesheet" href="catalog.css">
<script src="theme.js"></script>
${extra}</head>`;

const pageScript = p => (p.script ? `\n<script src="js/${p.script}" type="module"></script>` : '');
const themeBtn = `<button class="ibtn" data-theme-toggle aria-label="Switch between light and dark" title="Light or dark">${icon('sun-moon', 16)}</button>`;

const shell = p => `${head(p.title)}
<body>
<a class="skip" href="#content">Skip to content</a>
<div class="shell" data-shell>
  <div class="side-scrim" data-menu-close></div>
  <nav class="side" aria-label="Catalog">
    <div class="side-top"><a class="hc-brand" href="index.html">${MARK()}<span>Hypercube UI</span><span class="cat-ver">${pkg.version}</span></a></div>
    <div class="side-scroll">${nav(p.file)}</div>
    <div class="side-bot">${zoomCtl}</div>
  </nav>
  <div class="main">
    <header class="topbar">
      <button class="ibtn only-n" data-menu-open aria-label="Open the menu">${icon('menu', 18)}</button>
      <nav class="crumbs" aria-label="You are here"><span>${p.group}</span><span class="sep">/</span><span class="cur">${p.title}</span></nav>
      <span class="sp"></span>
      ${themeBtn}
    </header>
    <main class="content" id="content" tabindex="-1">${fill(p.body)}</main>
  </div>
</div>
<script src="catalog.js" type="module"></script>${pageScript(p)}
</body>
</html>
`;

const model = p => `${head(p.title)}
<body class="template">
<div class="cat-bar"><a href="index.html">${icon('arrow-left', 14)}Catalog</a><span class="sp"></span><span class="faint">Template: ${p.title}</span>${themeBtn}</div>
${fill(p.body)}
<script src="catalog.js" type="module"></script>${pageScript(p)}
</body>
</html>
`;

if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out);
cpSync(join(root, 'src'), join(out, 'hc'), { recursive: true });
cpSync(join(root, 'fonts'), join(out, 'fonts'), { recursive: true });
for (const f of ['catalog.css', 'catalog.js', 'theme.js']) cpSync(join(root, 'catalog', f), join(out, f));
if (existsSync(join(root, 'catalog/js'))) cpSync(join(root, 'catalog/js'), join(out, 'js'), { recursive: true });
// js/icons.js: the same Lucide icons for the template scripts (icon('name', size) returns an SVG string).
mkdirSync(join(out, 'js'), { recursive: true });
writeFileSync(
  join(out, 'js/icons.js'),
  `const icons = ${JSON.stringify(icons)};\nexport const icon = (name, size = 16) => \`<svg class="i" width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${icons[name] || ''}</svg>\`;\n`,
);
for (const p of pages) {
  currentPage = p.kind === 'piece' ? p : null;
  writeFileSync(join(out, p.file), p.kind === 'template' ? model(p) : shell(p));
}
// components.json: every catalog example in a form an AI reads without opening the site.
const templates = pages
  .filter(p => p.kind === 'template')
  .map(p => ({ name: p.title, file: `catalog/pages/${p.file}`, site: `site/${p.file}`, ...(p.script ? { script: `catalog/js/${p.script}` } : {}) }));
writeFileSync(
  join(root, 'components.json'),
  JSON.stringify(
    {
      name: 'Hypercube UI',
      version: pkg.version,
      how_to_use: 'Import src/index.css (and src/elements.js for <hc-ask> and <hc-sheet>). Copy the markup of each piece; change only the text. Icons: Lucide, stroke 1.8. Full rules in AGENTS.md.',
      pieces: catalog,
      templates,
    },
    null,
    2,
  ) + '\n',
);

if (missing.size) {
  console.error(`Icons missing from catalog/icons.json: ${[...missing].join(', ')}`);
  process.exit(1);
}
console.log(`site/: ${pages.length} pages`);
