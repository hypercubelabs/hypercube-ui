// Updates catalog/icons.json with the Lucide icons (ISC) used by the catalog pages.
// Needs the lucide package installed (npm install). The catalog itself does not.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as lucide from 'lucide';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'catalog/pages');
const names = new Set(['chevron-right', 'arrow-left', 'sun-moon', 'menu', 'circle', 'layout-dashboard', 'inbox', 'message-circle', 'circle-check', 'calendar', 'bot', 'workflow', 'gauge', 'git-fork', 'settings', 'scan', 'minus', 'plus', 'chevrons-up-down', 'check', 'user-plus']);
const jsDir = join(root, 'catalog/js');
for (const f of readdirSync(dir)) {
  const src = readFileSync(join(dir, f), 'utf8');
  for (const m of src.matchAll(/\{\{i:([a-z0-9-]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/icon:\s*([a-z0-9-]+)/g)) names.add(m[1]);
}
// catalog/js/*.js ask for icons as icon('name')
if (existsSync(jsDir))
  for (const f of readdirSync(jsDir)) for (const m of readFileSync(join(jsDir, f), 'utf8').matchAll(/icon\('([a-z0-9-]+)'/g)) names.add(m[1]);
const pascal = n => n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const attrs = a => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
const out = {};
const missing = [];
for (const n of [...names].sort()) {
  const node = lucide[pascal(n)] || lucide.icons?.[pascal(n)];
  if (!node) {
    missing.push(n);
    continue;
  }
  const children = Array.isArray(node[2]) ? node[2] : node;
  out[n] = children.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
}
writeFileSync(join(root, 'catalog/icons.json'), JSON.stringify(out, null, 0).replace(/","/g, '",\n"') + '\n');
if (missing.length) {
  console.error(`Not in Lucide: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`${Object.keys(out).length} icons`);
