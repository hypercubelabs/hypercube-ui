# Hypercube UI audit: is this app 100% adherent?

This is the checklist an AI (or a person) runs to prove that an app follows Hypercube UI. Part of it is automatic: `scripts/audit.mjs` reads the app's source and opens every screen in a browser. The rest is manual, because only someone using the app can tell whether a button really works. The app is **100% adherent** when:

1. the automatic audit ends with **0 failed** checks;
2. every **warning was reviewed**, and either fixed or written down in the report with the reason it stays;
3. every **manual check M01 to M14** is confirmed, with the evidence in the report.

Nothing less counts as 100%. Do not mark a check as done without running it.

## Prompt to give an AI

> Audit this app against Hypercube UI. Clone https://github.com/hypercubelabs/hypercube-ui at the tag in the app's `hypercube-ui/VERSION`, read `AUDIT.md` and follow it: run `scripts/audit.mjs` with `--src` and a `--url` for every screen, fix what fails, run it again until nothing fails, then do the manual checks M01 to M14 and write the report in the format at the end of `AUDIT.md`. Do not change routes, field names, API calls, business rules or tests.

## 1. Run the automatic audit

Run it from a checkout of hypercube-ui **at the same tag** the app copied (the first word of `VERSION`), so S03 can compare the copied files byte by byte.

```sh
git clone https://github.com/hypercubelabs/hypercube-ui && cd hypercube-ui && git checkout v0.2.0
npm i -D playwright && npx playwright install chromium   # once, for the page checks

# start the app (npm run dev, dotnet run, …), then list EVERY screen:
node scripts/audit.mjs --src ../my-app \
  --url http://localhost:5173/ \
  --url http://localhost:5173/inbox \
  --url http://localhost:5173/settings \
  --json audit-report.json
```

- `--src` is the app's folder (static checks S01–S12). `--url` is one screen; repeat it for every route, and for screens that only exist in a state (an empty list, a record page). Each one is opened at **1280 px and 360 px, in light and dark** (`--widths`, `--themes` change that).
- Pages behind a login: run the audit inside the app's own end-to-end tests instead. Load `audit/audit.js` with `page.addScriptTag({ path })`, sign in, open the screen, then `await page.evaluate(() => hcAudit())`. Do the same with a modal or drawer open, because the page checks only see what is on screen.
- No Playwright: open the screen, paste `audit/audit.js` into the browser console and run `await hcAudit()`. Repeat at 360 px with the device toolbar and in the other theme.
- The exit code is 1 while anything fails, so it can gate CI.
- `node scripts/audit.mjs --serve site` audits this repository's own catalog: it must always pass with 0 failures.

## 2. Automatic checks

`FAIL` is an error and must be fixed. `WARN` must be reviewed. `--` means the check does not apply to that page.

### Static (the app's source)

| Id | Level | Check | How to fix |
| --- | --- | --- | --- |
| S01 | error | One copy of the library (`src/` + `fonts/`) is in the app | Copy `src/`, `fonts/` and `LICENSE` from a tag into one folder, e.g. `hypercube-ui/`. |
| S02 | error | `VERSION` (`0.2.0 1a2b3c4`: the version and its commit), `LICENSE` and `fonts/InstrumentSans.ttf` sit next to `src/` | Copy them along; write the version and the commit in `VERSION`. |
| S03 | error | The copied `src/` is byte-for-byte the tagged one | Undo the edits; changes go back to hypercube-ui as a pull request. A warning means the audit runs from another version. |
| S04 | error | Something imports `<copy>/src/index.css` | Import it once in the global CSS or layout. |
| S05 | error | No literal colour (`#hex`, `rgb()`, `hsl()`, `oklch()`…) in the app's CSS, `<style>` or `style=""` / `style={{}}` | Use `var(--token)` from `tokens.css`. A missing token is a library change, not a local colour. SVG logos are exempt. |
| S06 | error | No Tailwind colour utility (`bg-blue-500`, `text-gray-700`, `bg-[#…]`) | Point Tailwind's theme colours at the tokens (`recipes/tailwind-bootstrap.md`) or use the library's classes. |
| S07 | error | No other spinner in the source (`animate-spin`, `fa-spin`, `spinner-border`, `Loader2`, `CircularProgress`, `<Spin>`, `mat-spinner`, `@keyframes …spin`…) | `.hc-loader`, `.hc-loader.lg`, `.btn.is-loading`, `.is-busy`. |
| S08 | error | No other UI library installed (Bootstrap, MUI, Chakra, Ant, Mantine, Vuetify, PrimeVue, Element, Angular Material, Bulma, daisyUI, MudBlazor, Radzen…) | Migrate the screens that use it, then remove the package. |
| S09 | warn | No other icon set (Font Awesome, react-icons, Heroicons, Material Icons…) | Lucide, stroke 1.8. |
| S10 | warn | No other `font-family` or web font link | `var(--font)` and `var(--mono)` only. |
| S11 | warn | No `outline: none` / `outline: 0` | `base.css` draws the visible focus; keep it. |
| S12 | warn | No hand-written `font-size` | `var(--fs-xs)` … `var(--fs-2xl)`. |

### Page (every screen, 1280 and 360 px, light and dark)

| Id | Level | Check | How to fix |
| --- | --- | --- | --- |
| R00 | error | The page opens with no console error or uncaught exception | Fix the error. |
| R01 | error | The library's CSS is active (`--hc-loader-run`, `--surface` on `:root`) | Import `src/index.css`. |
| R02 | error | Body text is Instrument Sans and the font loaded | Keep `fonts/` next to `src/`; remove fonts that override `--font`. |
| R03 | error | `<meta name="viewport" content="width=device-width, …">` | Add it to the HTML head. |
| R04 | error | No horizontal scroll (`scrollWidth <= innerWidth`) | The details name the elements past the edge: use `.trunc`, `min-width: 0`, `.hide-m`, or the phone layout of the piece. |
| R05 | error | App shell: `.shell` > `.side` + `.main` > `.topbar` + `.content` (or `.hc-split`); the window itself never scrolls, the shell fills it | Give `html`, `body` and the framework root `height: 100%`. |
| R06 | error | No other spinner on screen: spinner classes, Lucide loader icons, loader GIFs, endless rotate animations, stray `role="progressbar"` | `.hc-loader`. |
| R07 | error | No literal colour in any `style=""` | `style="--c: var(--blue)"`. |
| R08 | warn | Every text, background and border colour on screen equals a token in the current theme | Each detail is an off-token colour: swap it for a token. Category tints mixed from `--c` inside library pieces are allowed. |
| R09 | error | Every icon-only button and link has an accessible name | `aria-label` (and `data-tip`). |
| R10 | error | Every field has a label | `<label for>`, or `aria-label` for a search box. |
| R11 | error | Every open `.modal` and `.drawer` has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Add the attributes. Run the audit with each overlay open. |
| R12 | warn | One enabled primary button per area (panel, modal, form, header, section) | Make the others `.btn-secondary` or `.btn-ghost`. |
| R13 | warn | Icons are Lucide SVGs at stroke 1.8; no icon fonts | Swap the icon. |
| R14 | error | No other UI library drawing on the page (`--bs-*` variables, `Mui*`, `chakra-*`, `ant-*`, `mantine-*` classes…) | Migrate the piece. |
| R15 | error | Tables are `table.hc-table` and every body cell has `data-label` (`.hc-t-main` excepted) | Add the class and labels; phones show each row as a card. |
| R16 | error | Phones: buttons in bars at least 40 px; fields at 16 px text on touch screens | Use the library's buttons and fields; do not shrink them. |
| R17 | error | Menu: `.hc-brand` with the product logo (or `.hc-switch` when the app has workspaces, organisations or products), one `aria-current="page"`, no link that goes nowhere | Link it, or `aria-disabled="true"` for what the server does not do yet. |
| R18 | warn | One `h1` per screen | When the design shows no title (a canvas), add `<h1 class="sr">`. |
| R19 | error | Boards: node titles are `button.hc-node-t`, events are buttons, joins are `OR` / `AND` | Fix the markup. |
| R20 | error | The app does not scale the page itself: no `zoom` or `transform` on `html`, `body`, the root or `.shell`, and `html` keeps the browser's font size. The one zoom allowed is the person's own choice in `<hc-zoom>` (`html[data-zoom]`) | Remove the scaling; offer Adjust screen instead. |
| R21 | warn | Every text size on screen is on the `--fs-*` scale (avatars, code and field text excepted) | Use the token; a size in between is a new token, agreed in the library. |
| R22 | warn | The audit itself runs at 100% (no browser zoom, Adjust screen at 100%) | Press Ctrl+0 and set Adjust screen to 100%, then run again. |
| R23 | error | The work area (`.content`, `main`, `.page`, `.ph`, `.hc-main`, the sign-in card) sits on `var(--surface)`, white in light; the grey `var(--bg)` only behind the sign-in card | Set `body`, `.main` and `.content` to `var(--surface)`; remove the app's own grey. |
| R24 | error | One vertical scrollbar per area: no scrolling box inside another (text areas and code blocks excepted), and the window does not scroll while a tall box scrolls inside it | Put `.fill` on `.content` and `.fill-b` on the piece that scrolls; drop guessed `max-height: calc(100vh - …)`. |
| R25 | error | The context the person works in (workspace, organisation, product) is picked with one `button.hc-switch` in `.side-top`, with `aria-haspopup="menu"`, `aria-expanded`, `.hc-switch-logo` and `.hc-switch-name`; its `.hc-switch-menu` has each choice as `.mi[role="menuitemradio"]` and exactly one `aria-checked="true"`. No `<select>` or look-alike button in the menu or top bar picks it, and no `<select>` of the workspace or organisation inside a page | Copy the "Context switcher" markup from `components.json`; remove the old picker. |

`data-audit-skip` on an element leaves it and its children out of the page checks. Use it only for demos, like the catalog does for an error page shown inside a page; never to hide a real problem.

## 3. Manual checks

Do each one on every screen, write what you did as evidence, and mark it only when it holds everywhere.

| Id | Check | How to verify |
| --- | --- | --- |
| M01 | Every visible button, link and menu item does something real, end to end | Click each one. A no-op, an `alert()`, a `console.log` or a fake success fails. |
| M02 | What the server does not do yet is not on screen, or is visibly disabled (`aria-disabled="true"`) and listed in the report | Compare the menu and buttons with the API. |
| M03 | Each screen has its empty state; screens that read or write the server also have loading (`.sk` or `.hc-loader`) and error (`.empty-state.err` or `.alert.danger`) | Empty the data; slow the network and block the API in the browser's dev tools. |
| M04 | No invented data: every number, progress bar, status and sentence comes from real state | Change the data and watch the screen follow it. |
| M05 | Nothing is shown twice on one screen; one `.stats` strip at most | Read the screen top to bottom. |
| M06 | Overlays: a modal or drawer focuses its first field, closes with Esc and a click outside, and gives focus back to the button that opened it; a `.pop` menu closes with Esc, a click outside and a choice; phones use `<hc-sheet>` for menus | Keyboard only, then a phone width. |
| M07 | Phones: the menu drawer opens with the menu button and closes with the backdrop and on choosing an item; list + detail goes back with `.hc-back`; side panels become bottom sheets | 360 px, touch emulation. |
| M08 | Light and dark are both readable on every screen; a saved theme choice survives a reload | Switch the theme, reload. |
| M09 | Copy: buttons are verbs, labels sit above fields, errors say how to fix them, all in the app's language | Read every form and message. |
| M10 | Each screen uses the closest template and the exact markup from `components.json`; no look-alike classes that redraw a library piece | Compare with `catalog/pages/template-*.html`; search the app's CSS for selectors that restyle `.btn`, `.panel`, `.hc-*`. |
| M11 | Only the look changed: routes, form field names, API calls, business rules and tests are the same, and the app's tests pass unchanged | Review the diff; run the test suite. |
| M12 | Loading is the hexagon everywhere, including the places the static scan cannot see (images, third-party widgets, the first paint) | Slow the network and watch every screen load. |
| M13 | Adjust screen: at 80% and at 140% every screen still fits, menus and tooltips open next to what opened them, drag and resize follow the pointer, and the choice survives a reload | Try the extremes on every screen. |
| M14 | The context switcher works like Meetas: the current workspace (organisation, product) shows its logo and name; the menu lists every one the person can open, with the current one checked; choosing one reloads the whole app in it; settings, create and invite appear only if they work; on a phone it is the first row of the drawer | Switch back and forth on every screen, also on a phone. |

## Keeping this checklist current

The checklist changes with the library, not on a calendar:

- **With every library change.** A new piece or rule ships with its check, in the same commit: automatic when it can be measured, manual (a new M row) when it cannot. The catalog must still pass with 0 failures.
- **With every problem found by hand.** When a person or a review finds something the audit let through, it becomes a check before the fix is closed, so it is caught everywhere next time.
- **Once a month, a short review.** Read the reports of the apps audited that month: drop checks that never fail and never matter, sharpen the ones that give false alarms, and turn manual checks that keep repeating into automatic ones. The review ends with a tagged version and a line in `CHANGELOG.md`.

Apps run the audit again whenever they copy a new version of the library, and before any pull request that changes screens.

## 4. The report

Write the report in this shape, in the pull request or in a file next to the app's `VERSION`:

```md
# Hypercube UI audit · <app> · <date>
Library: hypercube-ui <version> (<commit>) · audit run from tag v<version>
Screens audited: <n> (<list of URLs>) at 1280/360 px, light/dark

## Result: 100% adherent | not adherent yet
Automatic: <passed> passed · 0 failed · <warnings> reviewed
Manual: M01–M14 confirmed

## Warnings kept
| Id | Where | Why it stays |

## Manual checks
| Id | Result | Evidence |
| M01 | ok | Clicked the 14 buttons on /inbox, /settings …; each one saved or opened something real |

## Disabled items
| Item | Why |
```

Attach `audit-report.json` from the last run. If anything failed, the result is "not adherent yet", followed by the list of what is left.
