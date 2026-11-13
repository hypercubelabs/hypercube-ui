// Takes the README cover from catalog/cover.html into docs/cover-light.webp and docs/cover-dark.webp.
//   node scripts/cover.mjs
// The cover is made only of the library's own pieces and tokens, so it changes when they change.
// 1280 x 640 (the GitHub social preview size) at 2x. Needs Playwright.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const icons = JSON.parse(readFileSync(join(root, 'catalog/icons.json'), 'utf8'));
const icon = (name, size) => {
  if (!icons[name]) throw new Error(`cover: unknown icon ${name} (add it to scripts/icons.mjs)`);
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
};
// the Hypercube symbol (a brand file, not a style), as in scripts/catalog.mjs
const mark = px =>
  `<svg width="${px}" height="${px}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#000"/><circle cx="32" cy="32" r="23" fill="#c7ff9f"/><circle cx="32" cy="32" r="11" fill="#000"/></svg>`;
const html = readFileSync(join(root, 'catalog/cover.html'), 'utf8')
  .replace(/\{\{mark:(\d+)\}\}/g, (_, px) => mark(+px))
  .replace(/\{\{i:([a-z0-9-]+):(\d+)\}\}/g, (_, n, px) => icon(n, +px));

async function loadPlaywright() {
  for (const from of [root + '/', process.cwd() + '/']) {
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

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/cover.html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end(html);
  }
  const p = normalize(join(root, url));
  if (!p.startsWith(root) || !existsSync(p)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

const browser = await pw.chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 })).newPage();
for (const theme of ['light', 'dark']) {
  await page.goto(base + 'cover.html');
  await page.evaluate(t => (document.documentElement.dataset.theme = t), theme);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const png = await page.locator('.cv').screenshot({ animations: 'disabled' });
  // PNG -> WebP inside the browser (canvas), so no image library is needed.
  const b64 = await page.evaluate(async data => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.9));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, png.toString('base64'));
  writeFileSync(join(root, 'docs', `cover-${theme}.webp`), Buffer.from(b64, 'base64'));
  console.log(`  docs/cover-${theme}.webp`);
}
await browser.close();
server.close();
