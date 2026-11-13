/* Hypercube UI page audit. Runs in the browser on one rendered page and checks what can be
   measured there: the library is loaded, the font, tokens instead of literal colours, the only
   spinner, no horizontal scroll, labels, dialogs, touch sizes and the pieces' markup.

   Use it three ways:
   - scripts/audit.mjs injects it with Playwright at 1280 and 360 px, light and dark;
   - paste the whole file into the browser console, then run: await hcAudit()
   - load it in a test (Cypress, Playwright, WebdriverIO) and call window.hcAudit().

   hcAudit() resolves to { url, width, theme, results: [{ id, level, title, count, details }] }.
   level is "error", "warn", "pass" or "skip". AUDIT.md explains every id. */
(function (g) {
  const LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
  const SPINNER_CLASS = /(^|[\s_-])(spin|spinner|spinning|loading-?circle|lds-[a-z-]+|sk-(circle|fading|chase)|fa-spin|animate-spin|progress-circular|circularprogress|mat-progress-spinner|ant-spin|chakra-spinner|mantine-loader|loader)([\s_-]|$)/i;
  const LUCIDE_SPINNER = /lucide-(loader|loader-2|loader-circle|loader-pinwheel|refresh-cw)\b/;
  const FOREIGN_UI = /^(Mui|chakra-|ant-|mantine-|v-btn|p-button|el-button|mat-mdc-)/;
  // pieces whose colour is a category colour mixed from --c: their tints are allowed
  const TINTED = '.av, .lbl, .badge, .chip, .hc-filter, .hc-ev, .hc-run, .hc-node, .hc-tree, .hc-diff, .hc-usage-chart, .alert, .hc-needs, .hc-changes, .hc-ring, .tag, svg, .sk, mark';

  const name = el => {
    if (!el || !el.tagName) return String(el);
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
    if (cls.length) s += `.${cls.join('.')}`;
    const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return t ? `${s} "${t}"` : s;
  };
  const shown = el => {
    if (el.closest('[hidden], template, [data-audit-skip]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0;
  };
  const all = sel => [...document.querySelectorAll(sel)].filter(el => !el.closest('[data-audit-skip]'));
  const channels = c => {
    const m = String(c).match(/[\d.]+/g);
    if (!m) return null;
    if (/^color\(/.test(c)) return m.slice(0, 3).map(v => Math.round(+v * 255)).join(',') + (m[3] !== undefined && +m[3] === 0 ? ':0' : '');
    return m.slice(0, 3).map(Math.round).join(',') + (m[3] !== undefined && +m[3] === 0 ? ':0' : '');
  };

  // every colour token the page defines on :root, resolved to rgb in the current theme
  function palette() {
    const names = new Set();
    const walk = rules => {
      for (const r of rules) {
        if (r.styleSheet) { try { walk(r.styleSheet.cssRules); } catch { /* another origin */ } }
        if (r.cssRules && !r.selectorText) walk(r.cssRules);
        if (r.selectorText && /:root|\[data-theme/.test(r.selectorText)) for (const p of r.style) if (p.startsWith('--')) names.add(p);
      }
    };
    for (const sh of document.styleSheets) {
      try { walk(sh.cssRules); } catch { /* another origin: skip */ }
    }
    const probe = document.createElement('i');
    probe.style.display = 'none';
    document.body.append(probe);
    const set = new Set(['0,0,0:0']);
    for (const n of names) {
      probe.style.color = '';
      probe.style.color = `var(${n})`;
      const v = getComputedStyle(probe).color;
      if (probe.style.color && v) set.add(channels(v));
    }
    probe.remove();
    return { set, count: names.size };
  }

  async function hcAudit() {
    const results = [];
    const add = (id, level, title, problems, skip) => results.push({
      id, title, level: skip ? 'skip' : problems.length ? level : 'pass', count: problems.length, details: problems.slice(0, 15),
    });
    const root = getComputedStyle(document.documentElement);
    const loaded = root.getPropertyValue('--hc-loader-run').trim() !== '' && root.getPropertyValue('--surface').trim() !== '';

    // R01 the library's CSS is on the page
    add('R01', 'error', 'Hypercube UI CSS is loaded (src/index.css)', loaded ? [] : ['--hc-loader-run and --surface are not defined on :root']);

    // R02 the font
    try { await document.fonts.ready; } catch { /* old browser */ }
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const fontIssues = [];
    if (!/Instrument Sans/i.test(bodyFont.split(',')[0])) fontIssues.push(`body font-family is ${bodyFont}`);
    if (document.fonts && !document.fonts.check('13px "Instrument Sans"')) fontIssues.push('Instrument Sans did not load: keep fonts/ next to src/');
    add('R02', 'error', 'Text uses Instrument Sans from fonts/', fontIssues);

    // R03 viewport
    const vp = document.querySelector('meta[name="viewport"]');
    add('R03', 'error', 'Viewport meta is set', vp && /width=device-width/.test(vp.content) ? [] : ['<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"> is missing']);

    // R04 no horizontal scroll
    const sw = document.documentElement.scrollWidth;
    const wide = sw > innerWidth + 1 ? [`page is ${sw}px wide in a ${innerWidth}px window`] : [];
    if (wide.length) {
      for (const el of all('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > innerWidth + 1 && shown(el) && !el.closest('.hc-canvas, .hc-cal-wrap, .tabs, .hc-cal-pick, pre, .hc-filters') && el.children.length === 0) wide.push(`${name(el)} ends at ${Math.round(r.right)}px`);
        if (wide.length > 8) break;
      }
    }
    add('R04', 'error', 'No horizontal scroll', wide);

    // R05 the shell fills the window and scrolls inside
    const shell = document.querySelector('.shell');
    const shellIssues = [];
    if (shell) {
      const r = shell.getBoundingClientRect();
      const page = document.scrollingElement || document.documentElement;
      if (page.scrollHeight > innerHeight + 1) shellIssues.push(`the window scrolls (${page.scrollHeight}px in ${innerHeight}px): the shell must scroll inside; give html, body and the framework root height: 100%`);
      else if (Math.abs(r.bottom - innerHeight) > 2) shellIssues.push(`.shell ends at ${Math.round(r.bottom)}px in a ${innerHeight}px window: give the framework root height: 100%`);
      if (!shell.querySelector(':scope > .side')) shellIssues.push('.shell has no .side menu');
      if (!shell.querySelector(':scope > .main')) shellIssues.push('.shell has no .main');
      else if (!shell.querySelector(':scope > .main > .hc-split') && !(shell.querySelector(':scope > .main > .topbar') && shell.querySelector(':scope > .main > .content'))) shellIssues.push('.main needs .topbar + .content (or a .hc-split screen)');
    }
    add('R05', 'error', 'App shell: .shell > .side + .main > .topbar + .content, full height', shellIssues, !shell);

    // R06 the only spinner
    const spin = [];
    for (const el of all('body *')) {
      if (el.closest('.hc-loader, .sk')) continue;
      const cls = typeof el.className === 'string' ? el.className : el.getAttribute('class') || '';
      if (cls && SPINNER_CLASS.test(cls) && !/\b(hc-loader|is-loading|is-busy)\b/.test(cls)) { spin.push(`${name(el)}: spinner class`); continue; }
      if (el.tagName === 'svg' && LUCIDE_SPINNER.test(cls)) { spin.push(`${name(el)}: loader icon`); continue; }
      if (el.tagName === 'IMG' && /(load|spin)[^/]*\.(gif|svg|webp)/i.test(el.getAttribute('src') || '')) { spin.push(`${name(el)}: loader image`); continue; }
      const s = getComputedStyle(el);
      if (s.animationName !== 'none' && s.animationIterationCount === 'infinite' && /rotate|spin/i.test(s.animationName + ' ' + s.transform) && shown(el)) spin.push(`${name(el)}: endless ${s.animationName} animation`);
    }
    if (document.querySelector('[role="progressbar"]:not(.progress):not(.hc-loader)')) spin.push('role="progressbar" outside .progress');
    add('R06', 'error', 'Loading uses only .hc-loader (or .is-loading / .is-busy)', spin);

    // R07 no literal colours in style attributes
    const inline = [];
    for (const el of all('[style]')) {
      if (el.closest('svg') && !el.matches('svg')) continue;
      const st = el.getAttribute('style');
      if (LITERAL.test(st)) inline.push(`${name(el)}: style="${st.slice(0, 80)}"`);
    }
    add('R07', 'error', 'No literal colours in style="" (use var(--token))', inline);

    // R08 every colour on screen comes from a token
    const off = [];
    if (loaded) {
      const { set } = palette();
      const seen = new Set();
      for (const el of all('body *')) {
        if (!shown(el) || el.closest(TINTED)) continue;
        const s = getComputedStyle(el);
        const check = (prop, v) => {
          const c = channels(v);
          if (!c || set.has(c) || c.endsWith(':0') || seen.has(prop + c)) return;
          seen.add(prop + c);
          off.push(`${name(el)}: ${prop} ${v}`);
        };
        if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) check('color', s.color);
        check('background-color', s.backgroundColor);
        if (parseFloat(s.borderTopWidth) > 0) check('border-color', s.borderTopColor);
      }
    }
    add('R08', 'warn', 'Colours on screen match a token (review each one)', off, !loaded);

    // R09 buttons and links have a name
    const unnamed = all('button, a[href], [role="button"], summary').filter(el => shown(el)
      && !(el.textContent || '').trim()
      && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.getAttribute('title')
      && !el.querySelector('img[alt]:not([alt=""])')).map(name);
    add('R09', 'error', 'Every icon button and link has an aria-label', unnamed);

    // R10 fields have a label
    const nolabel = all('input, select, textarea').filter(el => {
      if (/^(hidden|submit|button|reset|image)$/.test(el.type) || !shown(el)) return false;
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label')) return false;
      return !(el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
    }).map(name);
    add('R10', 'error', 'Every field has a label', nolabel);

    // R11 dialogs
    const dlg = [];
    for (const el of all('.modal, .drawer')) {
      if (!shown(el)) continue;
      if (el.getAttribute('role') !== 'dialog') dlg.push(`${name(el)}: role="dialog" is missing`);
      if (el.getAttribute('aria-modal') !== 'true') dlg.push(`${name(el)}: aria-modal="true" is missing`);
      if (!el.getAttribute('aria-labelledby') && !el.getAttribute('aria-label')) dlg.push(`${name(el)}: aria-labelledby is missing`);
    }
    add('R11', 'error', 'Open modals and drawers are labelled dialogs', dlg);

    // R12 one primary action per area
    const areas = new Map();
    for (const b of all('.btn-primary')) {
      if (!shown(b) || b.disabled || b.getAttribute('aria-disabled') === 'true' || b.matches('.is-loading, .is-busy')) continue;
      const area = b.closest('.modal, .drawer, .panel, form, .ph, .topbar, .hc-flow-side, .hc-usage, .hc-auth-card, .hc-srow, section, .page') || document.body;
      areas.set(area, (areas.get(area) || 0) + 1);
    }
    add('R12', 'warn', 'One primary button per area', [...areas].filter(([, n]) => n > 1).map(([a, n]) => `${name(a)} has ${n} primary buttons`));

    // R13 icons: Lucide at stroke 1.8, no icon fonts
    const ic = [];
    for (const s of all('button svg, a svg, .sitem svg, .ibtn svg, .btn svg')) {
      const w = s.getAttribute('stroke-width');
      if (s.getAttribute('stroke') && w && w !== '1.8') ic.push(`${name(s.closest('button, a') || s)}: stroke-width ${w}`);
    }
    for (const i of all('i.fa, i[class*="fa-"], .material-icons, .material-symbols-outlined, .bi, [class^="icon-"]')) ic.push(`${name(i)}: icon font`);
    add('R13', 'warn', 'Icons are Lucide SVG with stroke 1.8', ic);

    // R14 no other UI library on the page
    const foreign = [];
    if (root.getPropertyValue('--bs-body-bg').trim() || root.getPropertyValue('--bs-primary').trim()) foreign.push('Bootstrap CSS is loaded');
    const seenF = new Set();
    for (const el of all('[class]')) {
      const c = (typeof el.className === 'string' ? el.className : '').split(/\s+/).find(x => FOREIGN_UI.test(x));
      if (c && !seenF.has(c.split('-')[0])) { seenF.add(c.split('-')[0]); foreign.push(`${name(el)}: ${c}`); }
    }
    add('R14', 'error', 'No other UI library drawing on the page', foreign);

    // R15 tables
    const tb = [];
    for (const t of all('table')) {
      if (!t.classList.contains('hc-table')) { tb.push(`${name(t)}: use table.hc-table`); continue; }
      const cell = t.querySelector('tbody td:not([data-label]):not(.hc-t-main):not([colspan])');
      if (cell) tb.push(`${name(t)}: td without data-label (phones show it as a card)`);
    }
    add('R15', 'error', 'Tables are .hc-table with td[data-label]', tb, !document.querySelector('table'));

    // R16 phones: touch sizes and 16 px fields
    const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
    const touch = [];
    if (innerWidth <= 640) {
      for (const b of all('.topbar button, .topbar a, .hc-foot button, .modal-h .ibtn, .drawer-h .ibtn')) {
        if (!shown(b)) continue;
        const r = b.getBoundingClientRect();
        if (r.height < 39 && r.width < 39) touch.push(`${name(b)} is ${Math.round(r.width)}×${Math.round(r.height)}px`);
      }
    }
    if (coarse) {
      for (const f of all('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]), select, textarea')) {
        if (shown(f) && parseFloat(getComputedStyle(f).fontSize) < 16) touch.push(`${name(f)}: ${getComputedStyle(f).fontSize} text makes iPhone zoom`);
      }
    }
    add('R16', 'error', 'Phones: 40 px touch targets in bars, 16 px text in fields', touch, innerWidth > 640 && !coarse);

    // R17 navigation
    const nav = [];
    const side = document.querySelector('.side');
    if (side) {
      if (!side.querySelector('.hc-brand, .hc-switch')) nav.push('.side has no .hc-brand with the product logo (or .hc-switch when the app has workspaces, organisations or products)');
      if (!side.querySelector('[aria-current="page"]')) nav.push('no menu item has aria-current="page"');
      for (const a of side.querySelectorAll('a.sitem')) {
        const h = a.getAttribute('href');
        if ((!h || h === '#') && a.getAttribute('aria-disabled') !== 'true') nav.push(`${name(a)} goes nowhere: link it or set aria-disabled="true"`);
      }
    }
    add('R17', 'error', 'Menu: brand or context switcher, current item, no dead items', nav, !side);

    // R18 page header
    const h1 = all('h1').filter(h => !h.closest('[hidden], template, [data-audit-skip]') && getComputedStyle(h).display !== 'none');
    add('R18', 'warn', 'One h1 per screen (class="sr" when the design shows none)', h1.length === 1 ? [] : [`${h1.length} h1 on the page`], !shell);

    // R19 tree, calendar and timeline markup
    const board = [];
    for (const n of all('.hc-node')) if (!n.querySelector('.hc-node-t')) board.push(`${name(n)}: the title must be a button.hc-node-t`);
    for (const e of all('.hc-ev')) if (e.tagName !== 'BUTTON' && e.tagName !== 'A') board.push(`${name(e)}: an event must be a button`);
    for (const ul of all('.hc-tree ul[data-join]')) if (!/^(OR|AND)$/.test(ul.dataset.join)) board.push(`${name(ul)}: data-join is "${ul.dataset.join}", use OR or AND`);
    add('R19', 'error', 'Boards: node titles and events are buttons, joins are OR/AND', board, !document.querySelector('.hc-node, .hc-ev, .hc-tree'));

    // R20 the page is not scaled: no CSS zoom or scale on the root, html at the browser's own size
    const scaled = [];
    for (const el of [document.documentElement, document.body, document.querySelector('#root, #app, #__next, #__nuxt, app-root'), shell].filter(Boolean)) {
      const s = getComputedStyle(el);
      // the person's own choice in <hc-zoom> (html[data-zoom]) is the one zoom allowed
      const chosen = el === document.documentElement && el.dataset.zoom && Math.abs(parseFloat(el.style.zoom) * 100 - Number(el.dataset.zoom)) < 0.5;
      if (s.zoom && s.zoom !== '1' && s.zoom !== 'normal' && !chosen && !(el !== document.documentElement && document.documentElement.dataset.zoom)) scaled.push(`${name(el)}: zoom ${s.zoom}: let the person choose the size with <hc-zoom>`);
      if (s.transform && /^matrix\((?!1, 0, 0, 1,)/.test(s.transform)) scaled.push(`${name(el)}: transform ${s.transform}`);
    }
    const htmlFs = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (htmlFs && htmlFs !== 16 && !document.documentElement.style.fontSize) scaled.push(`html font-size is ${htmlFs}px: leave it at the browser default`);
    add('R20', 'error', 'The page is not scaled by the app (only by the person, with <hc-zoom>)', scaled);

    // R22 the audit itself runs at 100%: browser zoom or a chosen <hc-zoom> size changes every measure
    const bz = [];
    if (outerWidth > 0 && innerWidth > 0) {
      const z = Math.round((outerWidth / innerWidth) * 100);
      if (z > 112 || z < 88) bz.push(`the browser looks zoomed to about ${z}%: press Ctrl+0 (Cmd+0) and run again`);
    }
    if (document.documentElement.dataset.zoom) bz.push(`Adjust screen is at ${document.documentElement.dataset.zoom}%: set it to 100% and run again`);
    add('R22', 'warn', 'The audit runs at 100% size', bz);

    // R23 the work area is white (--surface), never the grey --bg
    const bgIssues = [];
    // needs only --surface, so an app still on its own copy of the tokens is checked too
    const hasSurface = root.getPropertyValue('--surface').trim() !== '';
    if (hasSurface) {
      const probe = document.createElement('i');
      probe.style.cssText = 'display:none;color:var(--surface)';
      document.body.append(probe);
      const surface = channels(getComputedStyle(probe).color);
      probe.remove();
      const behind = el => {
        for (let n = el; n; n = n.parentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if (channels(c) && !channels(c).endsWith(':0') && !/,\s*0\)$/.test(c)) return { n, c };
        }
        return { n: document.documentElement, c: getComputedStyle(document.documentElement).backgroundColor };
      };
      // the sign-in backdrop (.hc-auth) is grey on purpose; its card is checked instead
      const areas = all('.content, main, .page, .ph, .hc-main, .hc-auth-card').filter(el => shown(el) && (!el.closest('.hc-auth') || el.matches('.hc-auth-card')));
      if (!areas.length) areas.push(document.body);
      const seenBg = new Set();
      for (const a of areas) {
        const { n, c } = behind(a);
        if (channels(c) !== surface && !seenBg.has(n)) {
          seenBg.add(n);
          bgIssues.push(`${name(a)} sits on ${c} from ${name(n)}: the work area is var(--surface)`);
        }
      }
    }
    add('R23', 'error', 'The work area is white (var(--surface)), not grey', bgIssues, !hasSurface);

    // R24 one vertical scrollbar per area: no scrolling box inside another scrolling box
    const scrollers = all('body *').filter(el => {
      if (el.matches('textarea, pre, code, select') || !shown(el)) return false;
      const s = getComputedStyle(el);
      return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0;
    });
    const nested = [];
    for (const el of scrollers) {
      const outer = scrollers.find(o => o !== el && o.contains(el));
      if (outer) nested.push(`${name(el)} scrolls inside ${name(outer)}: put .fill on .content and .fill-b on the piece, or let only one of them scroll`);
    }
    const page = document.scrollingElement || document.documentElement;
    if (page.scrollHeight > innerHeight + 1 && scrollers.some(el => el.clientHeight > innerHeight * 0.5)) nested.push(`the window scrolls and ${name(scrollers.find(el => el.clientHeight > innerHeight * 0.5))} scrolls too`);
    add('R24', 'error', 'One vertical scrollbar per area (no scroll inside scroll)', nested);

    // R25 the context switcher (workspace, organisation, product…) is .hc-switch, the first row of the menu
    const ctx = [];
    const switches = all('.hc-switch');
    if (switches.length > 1) ctx.push(`${switches.length} .hc-switch on the page: an app has one context switcher`);
    for (const b of switches) {
      if (b.tagName !== 'BUTTON') ctx.push(`${name(b)}: the switcher is a <button>`);
      if (!b.closest('.side-top')) ctx.push(`${name(b)}: put it in .side-top, the first row of the menu`);
      if (b.getAttribute('aria-haspopup') !== 'menu' || !b.hasAttribute('aria-expanded')) ctx.push(`${name(b)}: needs aria-haspopup="menu" and aria-expanded`);
      if (!b.querySelector('.hc-switch-logo') || !b.querySelector('.hc-switch-name')) ctx.push(`${name(b)}: needs .hc-switch-logo and .hc-switch-name (logo and name of the current one)`);
    }
    for (const m of all('.hc-switch-menu')) {
      const radios = m.querySelectorAll('[role="menuitemradio"]');
      const on = m.querySelectorAll('[role="menuitemradio"][aria-checked="true"]');
      if (!radios.length) ctx.push(`${name(m)}: each choice is a .mi[role="menuitemradio"]`);
      else if (on.length !== 1) ctx.push(`${name(m)}: ${on.length} choices checked; the current one, and only it, has aria-checked="true"`);
    }
    // look-alikes: a <select>, or a button or link that picks the context, outside the library piece
    const ctxWords = /(work ?space|organi[sz]ation|\borg\b|tenant|product|company|account|team|empresa|organiza|produto|conta|equipe)/i;
    const strongWords = /(work ?space|organi[sz]ation|tenant|organiza)/i;
    const pickWords = /(switch|change|select|choose|pick|trocar|alterar|mudar|selecionar|escolher)/i;
    for (const el of all('select, button, a[href], [role="button"], [role="combobox"]')) {
      if (el.closest('.hc-switch, .hc-switch-menu, form, .modal, .drawer, .hc-set-in, .set-in') || !shown(el)) continue;
      const label = [el.getAttribute('aria-label'), el.getAttribute('title'), el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent, el.tagName === 'SELECT' ? '' : el.textContent].filter(Boolean).join(' ').trim();
      if (!ctxWords.test(label)) continue;
      const picker = el.tagName === 'SELECT' || el.getAttribute('role') === 'combobox';
      const inShell = el.closest('.side, .topbar');
      // in the menu or top bar any picker counts; inside a page, only a picker of the workspace or organisation itself
      if (inShell ? picker || pickWords.test(label) : picker && strongWords.test(label)) ctx.push(`${name(el)} picks the ${(label.match(ctxWords) || [''])[0].toLowerCase()}: use .hc-switch in .side-top`);
    }
    add('R25', 'error', 'Context switcher (workspace, organisation, product): .hc-switch, first row of the menu', ctx, !switches.length && !ctx.length);

    // R21 every text size comes from the --fs-* scale
    const scale = new Set(['--fs-3xs', '--fs-2xs', '--fs-xs', '--fs-sm', '--fs', '--fs-md', '--fs-lg', '--fs-xl', '--fs-2xl'].map(t => parseFloat(root.getPropertyValue(t))).filter(Boolean));
    const sizes = new Map();
    if (scale.size) {
      for (const el of all('body *')) {
        if (!shown(el) || el.closest('svg, pre, code, kbd, .kbd, .av, .sr, .hc-diff, .hc-file, .hc-id, .hc-cal-hours, .hc-usage-chart, input, select, textarea')) continue;
        if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const fs = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
        if (!scale.has(fs) && !sizes.has(fs)) sizes.set(fs, name(el));
      }
    }
    add('R21', 'warn', 'Text sizes come from the --fs-* scale', [...sizes].map(([fs, el]) => `${fs}px on ${el}`), !scale.size);

    return { url: location.href, width: innerWidth, theme: document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), results };
  }

  g.hcAudit = hcAudit;
})(typeof window !== 'undefined' ? window : globalThis);
