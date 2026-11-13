# Hypercube UI: a manual for whoever applies it (person or AI)

This file is the starting point for Claude Code, Codex or any other AI that was asked to "apply Hypercube UI to this app". Read all of it before changing code. It holds for any stack.

Hypercube UI is CSS on tokens (CSS custom properties) plus two browser elements (Web Components). It has no framework, no build step, and it does not need JavaScript to draw. The same HTML markup works in plain HTML, React, Vue, Svelte, Angular, Blazor, Astro, Razor, Django, Rails, Laravel or anything else that outputs HTML.

## Where things are

| Path | What it is |
| --- | --- |
| `src/index.css` | Imports everything in the right order. The only file the app needs to import. |
| `src/tokens.css` | Colour, space, type, radius, shadow, motion. Light on `:root`, dark redefined under `[data-theme='dark']` and `prefers-color-scheme`. |
| `src/base.css` | Reset, type, visible focus, utilities (`.row`, `.col`, `.sp`, `.trunc`, `.muted`, `.faint`, `.mono`, `.num`, `.sr`, `.kbd`). |
| `src/components.css` | Button, icon button, field, select, checkbox, toggle, tabs, segmented control, badge, label, chip, avatar, progress, tooltip, panel, stats. |
| `src/states.css` | Empty, loading (skeleton), error, alert, error page. |
| `src/overlays.css` | Modal, drawer, menu, toast. |
| `src/layout.css` | App shell: sidebar, top bar, page, page header. The sidebar becomes a drawer on phones. |
| `src/screens.css` | Screen patterns: list + content + side, messages, composer, settings, sign-in, a table that turns into cards. |
| `src/hc.css` | Pieces for AI screens: status ring, two-line row, bot question, trail (with substeps and approval), needs you, changes with undo, bottom sheet. |
| `src/boards.css` | Pieces for screens laid out in space or time: node, connected tree, canvas, flow with side panel, file and diff, on/off filters, week calendar, usage timeline. |
| `src/elements.js` | Optional behaviour: `<hc-ask>` (keys 1 to 9), `<hc-sheet>` (bottom sheet), long press. |
| `fonts/` | Instrument Sans (OFL). `tokens.css` reads `../fonts/InstrumentSans.ttf`: keep `fonts/` next to `src/`. |
| `components.json` | Every piece with its name, classes, when to use it and the exact markup. Read this file to know the HTML of each piece. |
| `catalog/pages/template-*.html` | Whole screens: chat, inbox, dashboard, list, bot profile, sign-in, settings, calendar, workflow editor, rate limit planner, root cause. Copy the structure. |
| `catalog/js/` | The scripts that make the templates work (calendar, workflow, usage, root cause, trail). Read them to see the state each screen keeps. |
| `recipes/` | How to install and write the markup in each stack. |
| `AUDIT.md`, `scripts/audit.mjs`, `audit/audit.js` | The adherence checklist and the tools that run its automatic part. |
| `site/` | The built catalog. Open `site/index.html` on a static server to see everything working. |
| `docs/cover-*.webp`, `catalog/cover.html` | The README cover, built from the library pieces by `npm run cover`. |
| `docs/screenshots/` | The README images, taken from `site/` by `npm run screenshots` (every page in light at 1280 px; the main screens also in dark and on an iPhone). Take them again when a page changes. |

## How to apply it to an existing app

Follow the order. Do not skip the check at the end.

1. **Find the stack and the current CSS.** Read `package.json`, `*.csproj`, `angular.json`, `vite.config.*`, `astro.config.*`, `tailwind.config.*`, `requirements.txt`, `Gemfile` and where the global CSS is imported. Note whether Tailwind, Bootstrap, MUI, Chakra, Ant, CSS Modules or styled-components are already there. Open the recipe for the stack in `recipes/`.
2. **Copy the library into the app.** Copy `src/`, `fonts/` and `LICENSE` together into a folder of the app (for example `hypercube-ui/`), always from a tagged version (`git archive v0.2.0`, or the commit the person names), never from unsaved changes. Create `hypercube-ui/VERSION` with the version and the commit (`0.2.0` and the short commit of that tag, `git rev-parse --short v0.2.0`). Do not edit the copied files; changes go back to this repository. To update, copy the whole folder again and read `CHANGELOG.md`.
3. **Give the root the full height.** The shell fills the screen and scrolls inside. `html`, `body` and the framework's root element need `height: 100%`. The library already does this for `#root`, `#app`, `#__next`, `#__nuxt` and `app-root`; if the root has another id, give it `height: 100%`.
4. **Import once, globally.** `hypercube-ui/src/index.css` in the global CSS or layout, and `hypercube-ui/src/elements.js` once on the client, if the app uses `<hc-ask>`, `<hc-sheet>` or long press. Add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` to the HTML if it is missing.
5. **Start with the shell.** Replace the app's skeleton with the library's: `.shell` > `.side` (menu) + `.main` > `.topbar` + `.content` > `.page` > `.ph` (header). Copy it from `catalog/pages/template-dashboard.html` (every template's sidebar is generated by `appMenu` in `scripts/catalog.mjs`; the finished markup is in `site/template-dashboard.html`). The top of the menu holds `.hc-brand` with the product's logo (`<img>` or `<svg>`) and name; when the person works inside a workspace, organisation or product, the top holds the context switcher (`.hc-switch`) instead, as in the templates. On phones the menu becomes a drawer: the `[data-menu-open]` button adds `.mnav` to `.shell` and `.side-scrim` removes it; do that with your framework's state.
6. **Swap screen by screen.** For each screen, find the closest template in `catalog/pages/` and the pieces in `components.json`. Change only markup and classes. Do not change routes, form field names, API calls, business rules, product copy or tests unless asked.
7. **Swap hand-written colours and sizes for tokens.** No loose `#hex`, `rgb()` or colour `px` on screens: use `var(--text)`, `var(--surface)`, `var(--border)`, `var(--accent)` and the others in `tokens.css`. If a token is missing, stop and say so; do not invent a colour.
8. **Draw the states the screen really has**: with content and empty, always; loading (`.sk` or `.hc-loader`) and error (`.empty-state.err` or `.alert.danger`) when the screen reads or writes data on a server. Data already in memory does not get an invented loading or error state.
9. **Audit.** Run the audit in [`AUDIT.md`](AUDIT.md) (`node scripts/audit.mjs --src <app> --url <every screen>`), fix what fails until nothing does, then do its manual checks and write its report. Only then is the app done.

### What to swap for what

| If the app has | Use |
| --- | --- |
| Primary, secondary, link-style, danger button | `.btn.btn-primary`, `.btn.btn-secondary`, `.btn.btn-ghost`, `.btn.btn-danger` (`.btn-sm`, `.btn-xs`, `.btn-lg`, `.btn-block`) |
| Icon-only button | `.ibtn` with `aria-label` and `data-tip` |
| Field with label and error | `.field` > `.label` + `.input`/`.select`/`.textarea` + `.hint` or `.err`; error with `.is-error` and `aria-invalid` |
| Search | `.inwrap` > icon + `.input` |
| Checkbox, radio, switch | `input.check`, `input.radio`, `input.toggle` |
| Tabs | `.tabs` > `.tab.on` (switches content) |
| A choice of up to 4 always-visible options (list/board view, short All/Unread filter) | `.seg[role=group]` > `button.on[aria-pressed]` |
| Categories switched on and off, more than 4, or several at once | `.hc-filters` > `button.hc-filter[aria-pressed]` with `--c` for the dot |
| Card or content box | `.panel` > `.panel-h` (with `h2` and `.acts`) + `.panel-b` |
| KPI row or numbers | `.stats` > `.stat` > `.k` `.v` `.d` (one strip per page) |
| Status, tag, pill | `.badge` (`.green` `.amber` `.red` `.accent` `.gray`), `.lbl` for user labels |
| Filter the person built and can remove | `.chip` with a remove button |
| Table row that opens something | `tr[data-opens]` or `tr[data-href]`, `aria-current` on the open one, `<button class="hc-t-open">` in the first cell for the keyboard |
| Photo or initials | `.av` (`.sm` `.md` `.lg` `.xl`) with `--c`; group in `.avs` |
| Modal / dialog | `.scrim` + `.modal-wrap` > `.modal` > `.modal-h` `.modal-b` `.modal-f` |
| Detail side panel | `.drawer-scrim` + `.drawer` > `.drawer-h` `.drawer-b` |
| Actions dropdown | `.pop` > `.mi` / `.msep` / `.mh`; on phones prefer `<hc-sheet>` |
| Snackbar / toast | `.toasts[role=status]` > `.toast` (`.ta` button for undo; `.out` to leave) |
| A picker of workspace, organisation, product or tenant (a `<select>`, a dropdown in the top bar, a box inside a page) | `button.hc-switch` in `.side-top` (logo, name, up-down chevrons) + `.pop.hc-switch-menu` with `.mi[role=menuitemradio]` per choice, the current one `aria-checked="true"` with `.ck`, then settings / create / invite. The "Context switcher" in `components.json` |
| Text size, "the app looks too small/big" | `<hc-zoom class="hc-zoom">` (Adjust screen) in `.side-bot`; never change the tokens for one person's taste |
| Menu item that does not work yet | `.sitem[aria-disabled=true]` (or remove it, if the person agrees) |
| Table | `table.hc-table` with `td[data-label]` (turns into cards at 640 px) |
| List + detail (email, chat, support) | `.hc-split` > `.hc-list` + `.hc-main` (+ `.hc-aside`) |
| Chat | `.hc-msgs` > `.hc-msgs-in` > `.hc-m` (`.mine` for yours) + `.hc-foot` > `form.hc-composer` |
| Settings | `.hc-set` > `.hc-set-nav` + `.hc-set-in`, rows `.hc-srow` |
| Login | `.hc-auth` > `.hc-auth-card` |
| Long form | `.hc-sectioned` > `.hc-sections` + one section at a time |
| Spinner, loader, "loading…" | `.hc-loader` (14 px) or `.hc-loader.lg` (24 px); in a button, `.is-loading`; never another spinner |
| Screen with AI at work | `hc.css`: `.hc-ring`, `.hc-running`, `<hc-ask>`, `.hc-needs`, `.hc-trail`, `.hc-changes` |
| Agent steps with tool calls inside and a step that waits for a person | `.hc-trail` > `.hc-step` with `.hc-step-tg[aria-expanded]` + `.hc-sub`; approval step `data-state="approval"` with buttons in `.hc-step-x` |
| Workflow, pipeline, decision tree | `.hc-canvas` > `.hc-tree` (nested `ul`/`li`) > `.hc-node`; `ul[data-join]` for OR/AND, `.hc-edge` for a branch label, `li[data-on]` for the followed path, `li[data-off]` for a ruled-out branch, `.hc-add` to add a step |
| Canvas with a settings panel for the selected item | `.hc-flow[data-side]` > canvas + `.hc-flow-side` (`-h`, `-b`, `-f`); it becomes a bottom sheet on phones |
| Investigation or root cause | `.hc-tree` of `.hc-node` with `data-state="out|found|fixed"`, a detail `.panel` with `.hc-file` and `.hc-diff` |
| Code change, patch | `pre.hc-diff` > `span.del` / `span.add`; file name in `.hc-file` (+ `.hc-more`) |
| Week or day calendar | `.hc-cal` (`--start`, `--hours`, `--days`) > `.hc-cal-dh`, `.hc-cal-hours`, `.hc-cal-day` > `.hc-ev` (`--at`, `--len`, `--c`, `--lane`, `--lanes`); `.hc-cal-now`; `.hc-cal-pick` for the day strip on phones |
| Runs or jobs on a day timeline against a limit | `.hc-usage` > `.hc-usage-chart` (the app draws it) + `.hc-usage-runs` > `.hc-run` > `.hc-run-bar` (`--from`, `--len`, `data-over`) |

### When the app already uses another CSS system

- **Bootstrap**: `.btn`, `.badge`, `.row` and `.col` have the same names and another look. Do not load both on the same page. Migrate route by route (each migrated route stops loading Bootstrap) or all at once. Read `recipes/tailwind-bootstrap.md`.
- **Tailwind**: they live together. Import Hypercube UI after Tailwind's `base` layer, point Tailwind's theme colours at the tokens and prefer the library's classes for the pieces. Read `recipes/tailwind-bootstrap.md`.
- **MUI, Chakra, Ant, Mantine**: swap the UI library's components for the pieces here, screen by screen; behaviour (state, validation) stays in your code. Remove the old library's theme when the last screen migrates.

## Overlays: your code opens and closes them

The library draws the modal, drawer, menu, toast and bottom sheet; opening and closing belongs to the app (React, Vue, Blazor state…). The contract:

- **Modal**: render `.scrim` + `.modal-wrap` > `.modal[role=dialog][aria-modal=true][aria-labelledby]` only while open (or with `hidden` while closed). Add the `.enter` class to `.scrim` and `.modal` on open for the entry animation. A click on `.modal-wrap` outside `.modal` closes. Esc closes. On open, focus the first field; on close, focus goes back to the button that opened it.
- **Drawer**: `.drawer-scrim` + `.drawer[role=dialog]`, same rules (`.enter` on `.drawer`). `.drawer-scrim` is transparent and covers the screen to close on a click outside; if the list behind must stay clickable (a click on another row switches the detail), do not render `.drawer-scrim` and close with Esc and the close button.
- **Menu**: `.pop[role=menu]` with `position: fixed`; the app computes `top`/`left` next to the button and closes it with Esc, a click outside, and on choosing a `.mi`. On phones use `<hc-sheet>`.
- **Toast**: one fixed `.toasts[role=status]` on the page; each toast is a `.toast` the app removes after about 3 s (adds `.out`, waits 180 ms, removes).
- **Bottom sheet**: `<hc-sheet open>` with `elements.js`; it closes itself on Esc, a tap on the backdrop and a drag, and gives focus back. With `controlled`, it only announces (`hc-close`) and the app removes `open`.

A working example of each, in a few lines without a framework, is in `catalog/catalog.js` and `catalog/js/ui.js`; the React recipe has the full modal.

## Boards: the app owns the data

Tree, calendar and usage timeline are plain nested markup that you render from your data. CSS draws the lines, places events by hour and bars by fraction; it never computes anything. The templates show the whole loop:

- `catalog/js/workflow.js`: a flow model, select, add, delete with undo, duplicate, save, deploy and a test run that lights the path it takes.
- `catalog/js/calendar.js`: the current week, overlapping events in lanes, filters, add and edit with validation, delete with undo, the now line from the clock.
- `catalog/js/usage.js`: drag runs on the timeline (pointer and arrow keys), the summed chart against the limit, "Spread out" with undo.
- `catalog/js/root-cause.js`: hypotheses that resolve over time, OR/AND joins, "Fix it" and "Retry from here".

## Design rules (for every screen)

- One primary action per area (`.btn-primary`). A verb on the button: "Save", "Invite", not "OK".
- **The work area is white.** `body`, `.main`, `.content` and `.page` sit on `var(--surface)` (white in light). The light grey `var(--bg)` is only for what is behind a card on purpose (the sign-in backdrop, a sunken well), never the page. An app that shows grey behind its pages has `--bg` (or its own grey) on `body`, `.main` or `.content`: change it to `var(--surface)`.
- **One context switcher, at the top of the menu.** When the person works inside a workspace, organisation, product or tenant, they change it with `.hc-switch`, the first row of the menu, exactly like Meetas: logo and name of the current one, a menu with every one (the current checked), then settings, create and invite when they work. Never a `<select>`, a dropdown in the top bar or a box inside a page.
- **One scrollbar per area.** Never a scrolling box inside another scrolling box, and never the window scrolling around the shell. When the main piece of a screen scrolls on its own (calendar, board, long table with a sticky header), put `.fill` on `.content` and `.fill-b` on the piece: the page stops scrolling and the piece takes the height that is left. Do not guess heights with `max-height: calc(100vh - …)`. Side-by-side panes (list + detail) each scroll on their own; that is fine.
- Colour only for state (working, needs you, error, done). Everything else is black, grey and white. Boards and calendars may colour categories with `--c`.
- The lime green (`--accent`) is always a background under black text. Accent text and lines use `--accent-ink`.
- Loading is always `.hc-loader` (the Datacube hexagon), everywhere: a button (`.is-loading` or `.is-busy`), a list, a page (`.hc-loader.lg`), a node that is running. Never another spinner (spinning dot, loader icon, GIF). For the shape of incoming content, use the `.sk` skeleton.
- One animation per area. Nothing changes size between states.
- No piece of information appears twice on the same screen. Page numbers in a single `.stats`. (The `.crumbs` trail at the top may repeat the page title: it says where the person is.)
- Real state only: no invented progress, number or text.
- A button appears only if its action exists and works. What does not work yet does not go on screen. In an existing app, a dead item that was already there does not vanish without the person knowing: leave it disabled (`aria-disabled="true"`) and say so in the report.
- Labels always visible above the field. Errors say how to fix them.
- Lucide icons with a 1.8 stroke, 16 px (13 to 14 px inside small buttons). No decorative icons.
- Icon size lives on the `<svg>` itself (`width`/`height`); the markup in `components.json` has the right size. Inside `.empty-state .glyph` the CSS fixes 22 px.
- Normal pages up to 1160 px, centred (`.page`). Screens whose main content is a table, a canvas, a calendar or a timeline use the full width (`.page.wide`), as in `template-list.html`.
- Colour per person or category comes from `--c` on the element itself (`style="--c: var(--blue)"`). These read `--c`: `.av`, `.lbl i`, `.hc-filter i`, `.hc-ev`, `.hc-run`.
- Short copy, in full sentences, in the app's language.

## Phones (always)

- Everything works at 360 px with no horizontal scroll.
- Up to 900 px the sidebar becomes a drawer, `.hc-split` shows one pane at a time (`data-view="main"` shows the content; `.hc-back` goes back), and the `.hc-flow` side panel becomes a bottom sheet.
- Up to 640 px the modal rises from the bottom, the drawer fills the screen, tables turn into cards, the tree becomes an indented list, the calendar shows one day (`.hc-cal-day[data-show]`, picked in `.hc-cal-pick`) and timeline rows stack. Use `<hc-sheet>` instead of floating menus.
- Buttons in bars get a 40 px touch target. Fields use 16 px text on touch screens (so iPhone does not zoom).
- Respect `env(safe-area-inset-bottom)` in fixed bottom bars.

## Accessibility

- Every icon button has an `aria-label`. Every field has a `label` linked with `for`.
- Tabs use `role="tablist"`/`role="tab"`/`aria-selected`. The current menu item has `aria-current="page"`.
- Modal and drawer use `role="dialog"`, `aria-modal="true"` and `aria-labelledby`; they close with Esc and give focus back.
- A node's title is a real `<button class="hc-node-t">`; a calendar event is a `<button class="hc-ev">`; a draggable run bar is a `<button>` that also moves with the arrow keys.
- Visible focus comes from `base.css`; do not remove it.

## Screen size (Adjust screen)

Sizes in `tokens.css` are the same for everyone. When a person wants the app bigger or smaller, they choose it with `<hc-zoom>` (Adjust screen: − / value / +, 5% steps from 80% to 140%, saved per person). It scales the whole page with CSS `zoom` on `<html>`, so nothing else in the app changes size on its own.

1. Put the control in the sidebar's `.side-bot`, so it is always visible (markup in `components.json`, "Adjust screen").
2. Apply the saved size before the page paints, next to the theme snippet:

```html
<script>try{const z=+localStorage.getItem('hc-zoom');if(z>=50&&z<=200&&z!==100){document.documentElement.style.zoom=z/100;document.documentElement.dataset.zoom=z}}catch{}</script>
```

3. Code that places an element from `getBoundingClientRect()`, `innerWidth` or `innerHeight` (menus, tooltips, drag previews, column resizing) divides those numbers by `zoomFactor()` from `src/elements.js` before writing them to `style`: `pop.style.left = rect.left / zoomFactor() + 'px'`. Comparing a pointer's `clientX` with a rect needs nothing: both are in screen pixels.
4. Desktop shells without browser zoom (Tauri, Electron with zoom off) add the `keys` attribute, so Ctrl/Cmd + `=`, `-` and `0` work too.

## Light and dark theme

With nothing set, it follows the system. To force one, set `data-theme="light"` or `data-theme="dark"` on `<html>`. To keep the choice, save it in `localStorage` and apply it before drawing (see `catalog/theme.js`).

## Checklist (before saying you are done)

The full version, with the automatic checks and the report format, is [`AUDIT.md`](AUDIT.md). In short:


- [ ] `index.css` imported once; `fonts/` next to `src/`; Instrument Sans loads (`document.fonts.check('13px "Instrument Sans"')`).
- [ ] `VERSION` and `LICENSE` copied along.
- [ ] The page scrolls: the framework root has the full height.
- [ ] The work area is white (`var(--surface)`), not grey, in every screen.
- [ ] One vertical scrollbar per area: no scroll inside scroll, the window never scrolls around the shell.
- [ ] Workspace, organisation or product is changed only with `.hc-switch` at the top of the menu; no `<select>` or other picker left.
- [ ] No hand-written colour on the swapped screens (search for `#`, `rgb(`, `hsl(` in CSS and in `style=`).
- [ ] Light and dark checked on every swapped screen.
- [ ] Adjust screen works at 80% and 140%: menus open next to their buttons, nothing spills sideways.
- [ ] 360 px with no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`) on every screen.
- [ ] The menu opens and closes on phones; list + detail goes back with `.hc-back`.
- [ ] Every screen has its empty state; those that fetch data from a server also have loading and error.
- [ ] Loading uses only `.hc-loader` (or `.is-loading` on a button); no other spinner is left.
- [ ] Every visible button really does something.
- [ ] The app's tests still pass; no test was deleted or changed to pass.
- [ ] No business rule, route or field name changed without being asked.

## Changing the library (in this repository)

- Colours and measures only in `src/tokens.css`. A new piece: a class with the `hc-` prefix, tokens only, works without JavaScript.
- Every new piece gets an example in `catalog/pages/` (an `<!-- ex: … -->` block) and, if it is a whole screen, a template.
- Every change in `src/` bumps the version in `package.json` and gets a line in `CHANGELOG.md`; a published version gets a git tag (`v0.2.0`).
- After a change, run `npm run catalog` (builds `site/` and `components.json`), then `npm run audit:catalog`: the catalog must pass the audit with 0 failures. When a page looks different, `npm run screenshots` updates the README images. A new icon in the catalog: `npm install` and `npm run icons`.
- Every new piece or rule updates `AUDIT.md` in the same change: a check in `audit/audit.js` or `scripts/audit.mjs` when it can be measured, otherwise a manual check. See "Keeping this checklist current" in `AUDIT.md`.
- Check in light, in dark, at 1280 px and at 360 px.
- Everything in this repository is in English: docs, catalog, comments, commits and identifiers.
