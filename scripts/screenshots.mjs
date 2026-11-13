// Takes the README screenshots from the built catalog (site/) into docs/screenshots/, as WebP.
//   node scripts/catalog.mjs && node scripts/screenshots.mjs
// Few images on purpose: every page in light at 1280 px (pieces as the whole section), the main
// screens also in dark, and the main templates on an iPhone 13. At 2x so they stay sharp. Needs Playwright.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'site');
const out = join(here, '..', 'docs', 'screenshots');
mkdirSync(out, { recursive: true });

async function loadPlaywright() {
  for (const from of [join(here, '..') + '/', process.cwd() + '/']) {
    try {
      return createRequire(from)('playwright');
    } catch {
      /* next */
    }
  }
  try {
    return await import('playwright');
  } catch {
    return null;
  }
}
const pw = await loadPlaywright();
if (!pw) {
  console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
const server = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  if (!p.startsWith(root) || !existsSync(p)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

const pieces = ['foundations', 'buttons', 'fields', 'navigation', 'display', 'states', 'overlays', 'ai', 'boards'];
const templates = ['chat', 'inbox', 'dashboard', 'list', 'calendar', 'workflow', 'usage', 'root-cause', 'bot', 'settings', 'sign-in'].map(t => 'template-' + t);
// the main screens: shown in dark too, and on a phone
const main = ['index', 'template-chat', 'template-inbox', 'template-dashboard'];
const phone = ['template-chat', 'template-inbox', 'template-dashboard', 'template-list'];

const browser = await pw.chromium.launch();
// PNG -> WebP inside the browser (canvas), so no image library is needed.
const conv = await (await browser.newContext()).newPage();
async function save(png, name) {
  const b64 = await conv.evaluate(async data => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.84));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, png.toString('base64'));
  writeFileSync(join(out, name + '.webp'), Buffer.from(b64, 'base64'));
  console.log('  ' + name + '.webp');
}

async function open(page, path, theme) {
  await page.goto(base + path + '.html');
  await page.evaluate(t => (document.documentElement.dataset.theme = t), theme);
  await page.waitForTimeout(600);
}

const desk = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const page = await desk.newPage();
for (const p of ['index', ...templates]) {
  await open(page, p, 'light');
  await save(await page.screenshot(), `${p}-light`);
}
for (const p of main) {
  await open(page, p, 'dark');
  await save(await page.screenshot(), `${p}-dark`);
}
for (const p of pieces) {
  await open(page, p, 'light');
  // let the page grow so the whole section fits in one image
  await page.addStyleTag({ content: 'html,body{height:auto!important;overflow:visible!important}.content{height:auto!important;max-height:none!important;overflow:visible!important}' });
  await page.waitForTimeout(150);
  await save(await page.locator('.content .page, main .page').first().screenshot(), `${p}-light`);
}
await desk.close();

const ph = await browser.newContext({ ...pw.devices['iPhone 13'] });
const pp = await ph.newPage();
for (const p of phone) {
  await open(pp, p, 'light');
  await save(await pp.screenshot(), `${p}-phone`);
}
await ph.close();
await browser.close();
server.close();
