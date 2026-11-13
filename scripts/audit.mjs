#!/usr/bin/env node
// Hypercube UI audit: checks how closely an app follows the library. Two halves:
//   static  (--src): reads the app's source for the copy, literal colours, other spinners,
//                    other UI libraries, fonts and focus rules;
//   runtime (--url / --serve): opens each page with Playwright at 1280 and 360 px, light
//                    and dark, and runs audit/audit.js on it.
// Every id is explained in AUDIT.md. Exit code 1 when any check fails with an error.
//
//   node scripts/audit.mjs --src ../my-app --url http://localhost:5173/ --url http://localhost:5173/settings
//   node scripts/audit.mjs --serve site            (audits the catalog itself)
//   options: --widths 1280,360  --themes light,dark  --json report.json  --wait 600
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, extname, dirname, resolve } from 'node:path';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OWN = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8')).version;

const args = process.argv.slice(2);
const opt = { src: null, urls: [], serve: null, widths: [1280, 360], themes: ['light', 'dark'], json: null, wait: 600 };
for (let i = 0; i < args.length; i++) {
  const a = args[i], v = args[i + 1];
  if (a === '--src') opt.src = resolve(v), i++;
  else if (a === '--url') opt.urls.push(v), i++;
  else if (a === '--serve') opt.serve = resolve(v), i++;
  else if (a === '--widths') opt.widths = v.split(',').map(Number), i++;
  else if (a === '--themes') opt.themes = v.split(','), i++;
  else if (a === '--json') opt.json = v, i++;
  else if (a === '--wait') opt.wait = Number(v), i++;
  else if (a === '-h' || a === '--help') {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(0);
  }
}
if (!opt.src && !opt.urls.length && !opt.serve) {
  console.error('Nothing to audit. Pass --src <app folder> and/or --url <page> (repeatable), or --serve <folder>. See AUDIT.md.');
  process.exit(2);
}

// ---------- static ----------
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.astro', '.output', 'bin', 'obj', 'coverage', '.turbo', '.cache', 'vendor', '__pycache__', '.venv', 'venv', 'target']);
const CODE = new Set(['.css', '.scss', '.sass', '.less', '.styl', '.pcss', '.html', '.htm', '.jsx', '.tsx', '.js', '.ts', '.mjs', '.vue', '.svelte', '.astro', '.cshtml', '.razor', '.erb', '.hbs', '.njk', '.twig', '.php', '.jinja', '.j2', '.liquid', '.mdx']);
const STYLE = new Set(['.css', '.scss', '.sass', '.less', '.styl', '.pcss']);
const LIT = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|oklab|oklch|lab|lch)\(/;
const TW_COLOUR = /\b(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|accent|caret|decoration|shadow|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?\b|\b(?:bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/;
const SPINNER = /\b(?:animate-spin|fa-spin|spinner-border|spinner-grow|lds-[a-z]+|CircularProgress|<Spinner\b|<Spin\b|<Loader\b|Loader2|LoaderCircle|lucide-loader|mat-spinner|mat-progress-spinner|v-progress-circular|ProgressSpinner|ActivityIndicator|ClipLoader|PulseLoader|BeatLoader|react-spinners|ngx-spinner|vue-spinner)\b/;
const UI_PKGS = ['bootstrap', 'react-bootstrap', 'reactstrap', 'bootstrap-vue', '@mui/material', '@material-ui/core', '@chakra-ui/react', 'antd', '@mantine/core', 'vuetify', 'primevue', 'primereact', 'primeng', 'element-plus', 'element-ui', '@angular/material', 'semantic-ui-css', 'semantic-ui-react', 'bulma', 'daisyui', 'flowbite', '@nextui-org/react', '@heroui/react', 'quasar', 'naive-ui', 'MudBlazor', 'Radzen.Blazor', 'Blazorise', 'Syncfusion.Blazor'];
const ICON_PKGS = ['@fortawesome/fontawesome-free', '@fortawesome/react-fontawesome', 'font-awesome', 'react-icons', '@heroicons/react', 'material-icons', '@mui/icons-material', 'bootstrap-icons', '@tabler/icons-react', '@phosphor-icons/react', 'ionicons', 'feather-icons', 'remixicon'];

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) { if (!SKIP_DIRS.has(n) && !n.startsWith('.')) walk(p, out); }
    else out.push(p);
  }
  return out;
}
const isCopy = d => ['index.css', 'tokens.css', 'hc.css', 'components.css'].every(f => existsSync(join(d, 'src', f)));

function staticAudit(src) {
  const results = [];
  const add = (id, level, title, problems, skip) => results.push({ id, title, level: skip ? 'skip' : problems.length ? level : 'pass', count: problems.length, details: problems.slice(0, 25) });
  const files = walk(src);
  const copies = [...new Set(files.filter(f => f.endsWith(join('src', 'hc.css'))).map(f => dirname(dirname(f))).filter(isCopy))];
  const inCopy = f => copies.some(c => f.startsWith(c + '/') || f.startsWith(c + '\\'));
  const app = files.filter(f => !inCopy(f) && CODE.has(extname(f)) && !/\.min\.(js|css)$/.test(f) && !/(^|[\\/])(tests?|__tests__|e2e|spec)[\\/]/.test(f));
  const rel = f => relative(src, f).replace(/\\/g, '/');

  // S01 one copy of the library
  add('S01', 'error', 'One copy of Hypercube UI (src/ + fonts/) is in the app', copies.length === 1 ? [] : copies.length ? copies.map(c => `copy at ${rel(c)}: keep only one`) : ['no folder with src/index.css, src/tokens.css and src/hc.css: copy src/ and fonts/ from a tagged version']);
  const copy = copies[0];

  // S02 VERSION, LICENSE, fonts
  const meta = [];
  let ver = null;
  if (copy) {
    if (existsSync(join(copy, 'VERSION'))) {
      ver = readFileSync(join(copy, 'VERSION'), 'utf8').trim();
      if (!/^\d+\.\d+\.\d+ [0-9a-f]{7,40}$/.test(ver)) meta.push(`VERSION reads "${ver}": write "<version> <commit>", e.g. "0.2.0 1a2b3c4"`);
    } else meta.push('VERSION is missing next to src/');
    if (!existsSync(join(copy, 'LICENSE'))) meta.push('LICENSE is missing next to src/');
    if (!existsSync(join(copy, 'fonts', 'InstrumentSans.ttf'))) meta.push('fonts/InstrumentSans.ttf is missing next to src/');
  }
  add('S02', 'error', 'VERSION, LICENSE and fonts/ copied along', meta, !copy);

  // S03 the copy is unchanged
  const changed = [];
  let s03level = 'error';
  if (copy) {
    const v = ver ? ver.split(' ')[0] : null;
    if (v && v !== OWN) { s03level = 'warn'; changed.push(`the copy is ${v} and this audit is ${OWN}: run the audit from the hypercube-ui tag v${v} to compare files`); }
    else {
      for (const f of readdirSync(join(HERE, 'src'))) {
        const mine = join(copy, 'src', f);
        if (!existsSync(mine)) changed.push(`src/${f} is missing from the copy`);
        else if (readFileSync(mine, 'utf8').replace(/\r\n/g, '\n') !== readFileSync(join(HERE, 'src', f), 'utf8').replace(/\r\n/g, '\n')) changed.push(`src/${f} was edited: changes go back to the hypercube-ui repository`);
      }
    }
  }
  add('S03', s03level, 'The copied src/ is unchanged', changed, !copy);

  // per-line scans of the app's own files
  const lit = [], tw = [], spin = [], fonts = [], focus = [], size = [];
  let imported = 0;
  for (const f of app) {
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    if (text.length > 2_000_000) continue;
    const style = STYLE.has(extname(f));
    if (/hypercube-ui[^'"\s]*\/src\/index\.css|src\/index\.css/.test(text) && copy) imported++;
    let inStyle = false, inSvg = 0;
    text.split(/\r?\n/).forEach((line, i) => {
      const at = `${rel(f)}:${i + 1}`;
      if (/<style[\s>]/i.test(line)) inStyle = true;
      if (/<svg[\s>]/i.test(line)) inSvg++;
      const css = style || inStyle;
      const clean = line.replace(/url\([^)]*\)/g, '').replace(/&#\d+;|&#x[0-9a-f]+;/gi, '');
      if (!/theme-color|msapplication|mask-icon|^\s*(\/\/|\*|\/\*)/.test(line) && LIT.test(clean)) {
        const svgAttr = /\b(fill|stroke|stop-color|flood-color)=["']#/.test(line) || inSvg > 0;
        const inlineStyle = /style\s*=\s*["'{][^"'}]*(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/.test(line) || /\b(color|background|backgroundColor|borderColor|fill|stroke)\s*:\s*['"`](#|rgb|hsl)/.test(line);
        if ((css && !svgAttr) || inlineStyle) lit.push(`${at}  ${line.trim().slice(0, 100)}`);
      }
      if (!style && TW_COLOUR.test(line)) tw.push(`${at}  ${line.trim().slice(0, 100)}`);
      if (SPINNER.test(line) || (css && /@keyframes\s+[\w-]*spin/i.test(line))) spin.push(`${at}  ${line.trim().slice(0, 100)}`);
      if (css && /font-family\s*:/.test(line) && !/var\(--(font|mono)\)|inherit/.test(line)) fonts.push(`${at}  ${line.trim().slice(0, 100)}`);
      if (/fonts\.googleapis\.com|use\.typekit\.net|fonts\.bunny\.net/.test(line)) fonts.push(`${at}  web font link`);
      if (css && /outline\s*:\s*(none|0)\b/.test(line)) focus.push(`${at}  ${line.trim().slice(0, 100)}`);
      if (css && /font-size\s*:\s*\d+(\.\d+)?(px|rem|em)\b/.test(line)) size.push(`${at}  ${line.trim().slice(0, 100)}`);
      if (/<\/style>/i.test(line)) inStyle = false;
      if (/<\/svg>/i.test(line)) inSvg = Math.max(0, inSvg - 1);
    });
  }
  add('S04', 'error', 'src/index.css is imported by the app', copy && !imported ? ['no file imports <copy>/src/index.css'] : [], !copy);
  add('S05', 'error', 'No literal colours in the app\'s CSS or style attributes (use var(--token))', lit);
  add('S06', 'error', 'No Tailwind colour utilities (point the theme at the tokens instead)', tw);
  add('S07', 'error', 'No other spinner in the source', spin);

  // S08 other UI libraries and icon sets
  const deps = new Set();
  for (const f of files.filter(f => !inCopy(f))) {
    const b = f.split(/[\\/]/).pop();
    try {
      if (b === 'package.json') { const p = JSON.parse(readFileSync(f, 'utf8')); for (const k of Object.keys({ ...p.dependencies, ...p.devDependencies })) deps.add(k); }
      else if (/\.(csproj|fsproj)$/.test(b) || b === 'Directory.Packages.props') for (const m of readFileSync(f, 'utf8').matchAll(/Include="([^"]+)"/g)) deps.add(m[1]);
      else if (b === 'libman.json') for (const m of readFileSync(f, 'utf8').matchAll(/"library"\s*:\s*"([^@"]+)/g)) deps.add(m[1]);
    } catch { /* unreadable manifest */ }
  }
  if (files.some(f => /wwwroot[\\/]lib[\\/]bootstrap[\\/]/.test(f))) deps.add('bootstrap');
  add('S08', 'error', 'No other UI library installed', UI_PKGS.filter(p => deps.has(p)).map(p => `${p}: migrate its screens and remove it`));
  add('S09', 'warn', 'Icons are Lucide (no other icon set)', ICON_PKGS.filter(p => deps.has(p)).map(p => `${p}`));
  add('S10', 'warn', 'No other font family (var(--font) and var(--mono) only)', fonts);
  add('S11', 'warn', 'Focus outline is not removed (base.css draws it)', focus);
  add('S12', 'warn', 'Font sizes come from --fs-* tokens', size);
  return { src, copy: copy ? rel(copy) || '.' : null, version: ver, results };
}

// ---------- runtime ----------
function serve(dir) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(dir, p);
    if (!f.startsWith(dir) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function loadPlaywright() {
  for (const from of [process.cwd() + '/', HERE + '/']) {
    try { return createRequire(from)('playwright'); } catch { /* next */ }
  }
  try { return await import('playwright'); } catch { return null; }
}

async function runtimeAudit(urls) {
  const pw = await loadPlaywright();
  if (!pw) {
    console.error('\nPlaywright is not installed, so the page checks did not run. Install it (npm i -D playwright && npx playwright install chromium), or paste audit/audit.js into the browser console and run: await hcAudit()');
    return [{ url: urls.join(', '), width: 0, theme: '-', results: [{ id: 'R00', level: 'error', title: 'Page checks ran', count: 1, details: ['Playwright is missing'] }] }];
  }
  const script = readFileSync(join(HERE, 'audit', 'audit.js'), 'utf8');
  const browser = await pw.chromium.launch();
  const runs = [];
  for (const url of urls) for (const width of opt.widths) for (const theme of opt.themes) {
    const phone = width <= 640;
    const ctx = await browser.newContext({ viewport: { width, height: phone ? 780 : 860 }, isMobile: phone, hasTouch: phone, colorScheme: theme });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(`page error: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`console error: ${m.text().slice(0, 160)}`); });
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      runs.push({ url, width, theme, results: [{ id: 'R00', level: 'error', title: 'Page opens without errors', count: 1, details: [`could not open: ${e.message.split('\n')[0]}`] }] });
      await ctx.close();
      continue;
    }
    await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
    await page.waitForTimeout(opt.wait);
    await page.addScriptTag({ content: script });
    const run = await page.evaluate(() => window.hcAudit());
    run.results.unshift({ id: 'R00', title: 'Page opens without console errors', level: errors.length ? 'error' : 'pass', count: errors.length, details: errors.slice(0, 10) });
    run.theme = theme;
    runs.push(run);
    await ctx.close();
  }
  await browser.close();
  return runs;
}

// ---------- report ----------
const mark = { pass: 'ok  ', warn: 'WARN', error: 'FAIL', skip: '--  ' };
function print(title, results) {
  console.log(`\n${title}`);
  for (const r of results) {
    console.log(`  ${mark[r.level]} ${r.id} ${r.title}${r.count ? ` (${r.count})` : ''}`);
    if (r.level === 'error' || r.level === 'warn') for (const d of r.details) console.log(`         ${d}`);
  }
}

const report = { tool: `hypercube-ui audit ${OWN}`, at: new Date().toISOString(), static: null, pages: [] };
if (opt.src) {
  report.static = staticAudit(opt.src);
  print(`Static checks · ${opt.src}${report.static.copy ? ` · copy at ${report.static.copy} (${report.static.version || 'no VERSION'})` : ''}`, report.static.results);
}
let server;
if (opt.serve) {
  server = await serve(opt.serve);
  const base = `http://127.0.0.1:${server.address().port}/`;
  for (const f of readdirSync(opt.serve).filter(f => f.endsWith('.html')).sort()) opt.urls.push(base + f);
}
if (opt.urls.length) {
  report.pages = await runtimeAudit(opt.urls);
  for (const p of report.pages) {
    const shown = p.results.filter(r => r.level !== 'pass');
    print(`Page · ${p.url} · ${p.width}px · ${p.theme}${shown.length ? '' : ' · all checks pass'}`, shown);
  }
}
server?.close();

const every = [...(report.static?.results || []), ...report.pages.flatMap(p => p.results)];
const count = l => every.filter(r => r.level === l).length;
const scored = every.filter(r => r.level !== 'skip');
report.summary = { errors: count('error'), warnings: count('warn'), passed: count('pass'), skipped: count('skip'), score: scored.length ? Math.round((count('pass') / scored.length) * 1000) / 10 : 0 };
console.log(`\nAutomatic checks: ${report.summary.passed} passed, ${report.summary.errors} failed, ${report.summary.warnings} to review, ${report.summary.skipped} not applicable · ${report.summary.score}%`);
console.log('The app is 100% adherent when nothing fails, every warning was reviewed, and the manual checks M01–M14 in AUDIT.md are confirmed.');
if (opt.json) writeFileSync(opt.json, JSON.stringify(report, null, 2));
process.exit(report.summary.errors ? 1 : 0);
