<div align="center">

<a><picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/cover-dark.webp">
  <img src="docs/cover-light.webp" alt="Hypercube UI: a bot question, a work trail, buttons, an agent node, switches, badges and a toast, all drawn with the library" width="100%">
</picture></a>

# Hypercube UI

Clean, easy screen components for any stack.<br/>
CSS on tokens plus a few custom elements. No framework, no build.

**Version 0.2.0** · Light and dark · Built for phones from the first line

![Version](https://img.shields.io/badge/version-0.2.0-c7ff9f?labelColor=000000)
![License](https://img.shields.io/badge/license-MIT-c7ff9f?labelColor=000000)
![No build](https://img.shields.io/badge/build-none-c7ff9f?labelColor=000000)
![Phones](https://img.shields.io/badge/phones-360%20px-c7ff9f?labelColor=000000)

**[Get started](#getting-started)** · **[Apply it with an AI](#apply-it-with-an-ai)** · **[Pieces](#pieces)** · **[Templates](#templates)** · **[Audit](#audit)** · **[Screenshots](#screenshots)** · **[Changelog](CHANGELOG.md)**

</div>

## Overview

Hypercube UI is the screen library from Hypercube Labs. It is plain CSS on design tokens (CSS custom properties) plus three small browser elements. The same HTML works in plain HTML, React, Vue, Svelte, Angular, Blazor, Astro, Razor, Django, Rails, Laravel or anything else that outputs HTML.

It draws everything without JavaScript. The script is optional and only adds behaviour: number keys on a bot question, a bottom sheet you can drag, long press, and Adjust screen.

**What makes it different:**

- **Any stack, no build.** Copy two folders, import one CSS file. Nothing to compile, no framework to adopt.
- **Made for screens where AI works.** Bot questions, work trails with approvals, "needs you", "working now" and changes with undo are first-class pieces, not add-ons.
- **Written for AI to apply.** [`AGENTS.md`](AGENTS.md), [`components.json`](components.json) and [`llms.txt`](llms.txt) give a coding AI the steps, the exact markup of every piece and the rules.
- **Proof, not promises.** [`AUDIT.md`](AUDIT.md) and `scripts/audit.mjs` check an app screen by screen, at 1280 and 360 px, in light and dark, and say when it is 100% adherent.

## Getting started

Copy `src/`, `fonts/` and `LICENSE` together into your app, always from a tagged version:

```sh
git clone https://github.com/hypercubelabs/hypercube-ui
cd hypercube-ui && git archive v0.2.0 src fonts LICENSE | tar -x -C ../my-app/hypercube-ui
echo "0.2.0 $(git rev-parse --short v0.2.0)" > ../my-app/hypercube-ui/VERSION
```

Import it once, globally:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="hypercube-ui/src/index.css">
<script type="module" src="hypercube-ui/src/elements.js"></script> <!-- optional -->
```

Then write the markup of the pieces. Every piece, with its classes and the exact HTML, is in [`components.json`](components.json) and in the catalog.

```html
<div class="panel">
  <div class="panel-h"><h2>Invoices</h2><div class="acts"><button class="btn btn-primary">Send</button></div></div>
  <div class="panel-b">
    <div class="field">
      <label class="label" for="email">Email</label>
      <input class="input" id="email" type="email">
      <span class="hint">We send the invoice here.</span>
    </div>
  </div>
</div>
```

Do not edit the copied files: changes go back to this repository. To update, copy the whole folder again and read the [changelog](CHANGELOG.md).

## Apply it with an AI

> **Using Claude Code, Codex or another coding AI?** Open your project and ask:
>
> *Apply Hypercube UI (https://github.com/hypercubelabs/hypercube-ui) to this app. Follow AGENTS.md.*

| File | What the AI gets from it |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | The steps in order, a table of what to swap for what, the design rules, phones, accessibility and the checklist before saying it is done |
| [`components.json`](components.json) | Every piece with its name, classes, when to use it and the exact markup |
| [`llms.txt`](llms.txt) | The map of the repository, in the order to read it |
| [`AUDIT.md`](AUDIT.md) | How to prove the app is 100% adherent, and the report to write |
| [`recipes/`](recipes/) | How to install and write the markup in each stack |

The AI changes only markup and classes. Routes, form fields, API calls, business rules, product copy and tests stay as they are.

## What's inside

| Layer | File | What it holds |
| --- | --- | --- |
| Tokens | [`src/tokens.css`](src/tokens.css) | Colour, space, type, radius, shadow, motion. Light on `:root`, dark redefined (not inverted) |
| Base | [`src/base.css`](src/base.css) | Reset, type, visible focus, utilities (`.row`, `.col`, `.sp`, `.trunc`, `.muted`, `.mono`, `.sr`) |
| Components | [`src/components.css`](src/components.css) | Button, icon button, field, select, check, toggle, tabs, segmented, badge, label, chip, avatar, progress, tooltip, panel, stats |
| States | [`src/states.css`](src/states.css) | Empty, loading (skeleton and the hexagon loader), error, alert, error page |
| Overlays | [`src/overlays.css`](src/overlays.css) | Modal, drawer, menu, toast |
| Layout | [`src/layout.css`](src/layout.css) | App shell: sidebar with context switcher, top bar, page, page header. The sidebar becomes a drawer on phones |
| Screens | [`src/screens.css`](src/screens.css) | List + detail, messages and composer, settings, sign in, a table that turns into cards |
| Boards | [`src/boards.css`](src/boards.css) | Node, connected tree, canvas, flow editor, week calendar, on/off filters, usage timeline, file and diff |
| AI | [`src/hc.css`](src/hc.css) | Status ring, two-line row, bot question, trail, needs you, working now, changes with undo, bottom sheet |
| Elements | [`src/elements.js`](src/elements.js) | `<hc-ask>` (keys 1 to 9), `<hc-sheet>` (bottom sheet), `<hc-zoom>` (Adjust screen), long press |

[`src/index.css`](src/index.css) imports all of them in the right order. It is the only file your app imports.

## Pieces

61 pieces on 9 catalog pages. Each one is in [`components.json`](components.json) with its markup.

| Page | Pieces |
| --- | --- |
| Foundations | Surfaces and text, accent and state, type, space and radius, icons (Lucide, stroke 1.8) |
| Buttons | Kinds (primary, secondary, ghost, danger), with an icon, sizes, states, icon button, action group |
| Fields | Text, with an error, search, select, long text, date, check, radio, switch, disabled, full form |
| Navigation | Tabs, segmented control, breadcrumbs, active filter, context switcher, sidebar, Adjust screen |
| Display | Badges, labels, avatars, progress, panel, stats, tooltip |
| States | Empty, no results, loading indicator, skeleton, error, alerts, whole page |
| Overlays | Modal, drawer, menu, toast, bottom sheet |
| AI pieces | Status ring, two-line row, bot question, needs you, working now, typing, changes with undo, message actions, trail, trail with substeps and approval, sections with an index |
| Boards | Node, connected tree with OR/AND joins, file and diff, on/off filter, week calendar, usage timeline |

## Templates

Whole screens to copy. The ones that move have their script in [`catalog/js/`](catalog/js/), which shows the state each screen keeps.

| Template | What it shows |
| --- | --- |
| Chat with a bot | Messages, composer, bot question and work trail |
| Inbox | List + detail with one pane at a time on phones |
| Dashboard | Stats strip, panels, "needs you" and "working now" |
| List with filters | A table that turns into cards at 640 px, with a segmented filter |
| Week calendar | Overlapping events in lanes, the now line, add and edit with validation, delete with undo |
| Workflow editor | Flow with a settings panel, add, delete with undo, duplicate, save, test run that lights the path |
| Rate limit planner | Runs dragged on a day timeline against a limit, "Spread out" with undo |
| Root cause | Hypotheses that resolve over time, OR/AND joins, a diff, "Fix it" and "Retry from here" |
| Sectioned form | A long form one section at a time, with an index |
| Sign in | The sign-in card on its backdrop |
| Settings | Settings navigation and rows |

## Design rules

The full list is in [`AGENTS.md`](AGENTS.md). The ones that shape every screen:

- **One primary action per area**, with a verb on the button: "Save", "Invite", never "OK".
- **The work area is white.** The light grey sits only behind a card on purpose, like the sign-in backdrop.
- **One context switcher**, at the top of the menu, for workspace, organisation or product.
- **One scrollbar per area.** Never a scrolling box inside another one.
- **Colour only for state** (working, needs you, error, done). Everything else is black, grey and white.
- **One loading indicator**: the Datacube hexagon (`.hc-loader`), everywhere.
- **Real state only.** No invented progress, number or text. A button appears only if its action works.
- **Labels always visible** above the field, and errors that say how to fix them.

## Phones, accessibility and screen size

- Everything works at **360 px** with no horizontal scroll. Up to 900 px the sidebar becomes a drawer and list + detail shows one pane at a time. Up to 640 px the modal rises from the bottom, tables turn into cards and the calendar shows one day.
- Touch targets of 40 px in bars, 16 px text in fields on touch screens, and `env(safe-area-inset-bottom)` in fixed bottom bars.
- Every icon button has an `aria-label`, every field a linked label. Modal and drawer are real dialogs that close with Esc and give focus back. Visible focus comes from `base.css`.
- **Light and dark** follow the system, or `data-theme="light"` / `data-theme="dark"` on `<html>`. Dark is redefined, not inverted.
- **Adjust screen** (`<hc-zoom>`) lets each person scale the whole app from 80% to 140%, 5% at a time, saved per person. Sizes in the tokens stay the same for everyone.

## Audit

An app is **100% adherent** when the automatic audit ends with 0 failures, every warning was reviewed, and the manual checks are confirmed. [`AUDIT.md`](AUDIT.md) has the full list and the report format.

```sh
npm i -D playwright && npx playwright install chromium   # once

# start the app, then list every screen
node scripts/audit.mjs --src ../my-app \
  --url http://localhost:5173/ \
  --url http://localhost:5173/settings \
  --json audit-report.json
```

| Kind | Checks | Where |
| --- | --- | --- |
| Static | S01 to S12 | The app's source: imports, copied files, loose colours, other spinners |
| Page | R00 to R25 | Every screen at 1280 and 360 px, in light and dark |
| Manual | M01 to M14 | What only using the app can show, such as every button really working |

No Playwright? Paste [`audit/audit.js`](audit/audit.js) into the browser console and run `await hcAudit()`.

## Recipes

| Stack | Recipe |
| --- | --- |
| Plain HTML | [`recipes/html.md`](recipes/html.md) |
| React (Vite, Next.js, Remix) | [`recipes/react.md`](recipes/react.md) |
| Vue and Nuxt | [`recipes/vue.md`](recipes/vue.md) |
| Svelte and SvelteKit | [`recipes/svelte.md`](recipes/svelte.md) |
| Angular | [`recipes/angular.md`](recipes/angular.md) |
| Blazor | [`recipes/blazor.md`](recipes/blazor.md) |
| Astro | [`recipes/astro.md`](recipes/astro.md) |
| Server-rendered (Razor, Django, Rails, Laravel) | [`recipes/server-rendered.md`](recipes/server-rendered.md) |
| Already on Tailwind or Bootstrap | [`recipes/tailwind-bootstrap.md`](recipes/tailwind-bootstrap.md) |

## Screenshots

Taken from `site/` with `npm run screenshots`.

<a><img src="docs/screenshots/index-light.webp" alt="Hypercube UI catalog, light theme" width="100%"></a>

<a><img src="docs/screenshots/index-dark.webp" alt="Hypercube UI catalog, dark theme" width="100%"></a>

### Main screens

#### Chat with a bot

<a><img src="docs/screenshots/template-chat-light.webp" alt="Chat with a bot, light theme" width="100%"></a>

<a><img src="docs/screenshots/template-chat-dark.webp" alt="Chat with a bot, dark theme" width="100%"></a>

#### Inbox

<a><img src="docs/screenshots/template-inbox-light.webp" alt="Inbox, light theme" width="100%"></a>

<a><img src="docs/screenshots/template-inbox-dark.webp" alt="Inbox, dark theme" width="100%"></a>

#### Dashboard

<a><img src="docs/screenshots/template-dashboard-light.webp" alt="Dashboard, light theme" width="100%"></a>

<a><img src="docs/screenshots/template-dashboard-dark.webp" alt="Dashboard, dark theme" width="100%"></a>

#### On a phone

<p><a><img src="docs/screenshots/template-chat-phone.webp" alt="Chat with a bot on a phone" width="24%"></a> <a><img src="docs/screenshots/template-inbox-phone.webp" alt="Inbox on a phone" width="24%"></a> <a><img src="docs/screenshots/template-dashboard-phone.webp" alt="Dashboard on a phone" width="24%"></a> <a><img src="docs/screenshots/template-list-phone.webp" alt="List with filters on a phone" width="24%"></a></p>

### Pieces

#### Foundations

Colour, type, spacing, radius, shadow and icons.

<a><img src="docs/screenshots/foundations-light.webp" alt="Foundations" width="100%"></a>

#### Buttons

Kinds, sizes, icons and states.

<a><img src="docs/screenshots/buttons-light.webp" alt="Buttons" width="100%"></a>

#### Fields

Text, select, checkbox, switch, search and errors.

<a><img src="docs/screenshots/fields-light.webp" alt="Fields" width="100%"></a>

#### Navigation

Tabs, segmented control, menu, breadcrumbs and Adjust screen.

<a><img src="docs/screenshots/navigation-light.webp" alt="Navigation" width="100%"></a>

#### Display

Badges, labels, avatars, progress, panels, stats and tooltips.

<a><img src="docs/screenshots/display-light.webp" alt="Display" width="100%"></a>

#### States

Empty, loading, error and alerts.

<a><img src="docs/screenshots/states-light.webp" alt="States" width="100%"></a>

#### Overlays

Modal, drawer, menu, toast and bottom sheet.

<a><img src="docs/screenshots/overlays-light.webp" alt="Overlays" width="100%"></a>

#### AI pieces

Status ring, bot question, trail with approval, needs you, changes with undo.

<a><img src="docs/screenshots/ai-light.webp" alt="AI pieces" width="100%"></a>

#### Boards

Connected tree, workflow canvas, week calendar, usage timeline and diff.

<a><img src="docs/screenshots/boards-light.webp" alt="Boards" width="100%"></a>

### More templates

#### List with filters

<a><img src="docs/screenshots/template-list-light.webp" alt="List with filters" width="100%"></a>

#### Week calendar

<a><img src="docs/screenshots/template-calendar-light.webp" alt="Week calendar" width="100%"></a>

#### Workflow editor

<a><img src="docs/screenshots/template-workflow-light.webp" alt="Workflow editor" width="100%"></a>

#### Rate limit planner

<a><img src="docs/screenshots/template-usage-light.webp" alt="Rate limit planner" width="100%"></a>

#### Root cause

<a><img src="docs/screenshots/template-root-cause-light.webp" alt="Root cause" width="100%"></a>

#### Sectioned form

<a><img src="docs/screenshots/template-bot-light.webp" alt="Sectioned form" width="100%"></a>

#### Settings

<a><img src="docs/screenshots/template-settings-light.webp" alt="Settings" width="100%"></a>

#### Sign in

<a><img src="docs/screenshots/template-sign-in-light.webp" alt="Sign in" width="100%"></a>

## Project structure

| Path | Purpose |
| --- | --- |
| `src/` | The library: the only folder an app copies, with `fonts/` |
| `fonts/` | Instrument Sans (OFL). `tokens.css` reads `../fonts/`, so keep it next to `src/` |
| `catalog/` | Source of the catalog: piece pages and templates (`catalog/pages/`), their scripts (`catalog/js/`), the icons and the README cover |
| `site/` | The built catalog. Serve it with any static server |
| `recipes/` | Install and markup per stack |
| `audit/`, `scripts/audit.mjs` | The adherence audit |
| `docs/` | The README cover and screenshots |

## Development

```sh
npm install                 # once
npm run catalog             # build site/ and components.json
npm run audit:catalog       # the catalog must pass with 0 failures
npm run screenshots         # README screenshots, from site/
npm run cover               # README cover, from catalog/cover.html
npx serve site              # or: python3 -m http.server -d site
```

Changing the library:

- Colours and measures only in `src/tokens.css`. A new piece is a class with the `hc-` prefix, uses tokens only and works without JavaScript.
- Every new piece gets an example in `catalog/pages/`, and a template if it is a whole screen.
- Every change in `src/` bumps the version in `package.json`, gets a line in [`CHANGELOG.md`](CHANGELOG.md) and, once published, a git tag.
- Every new rule updates [`AUDIT.md`](AUDIT.md) in the same change.
- Check in light, in dark, at 1280 px and at 360 px.

## Credits

Several AI pieces started from ideas in [affectUI](https://github.com/flohoeller/affectui) (MIT), rewritten in CSS and Web Components. The font is [Instrument Sans](fonts/OFL-InstrumentSans.txt) (OFL 1.1) and the catalog icons are [Lucide](https://lucide.dev) (ISC). Details in [`CREDITS.md`](CREDITS.md).

## License

MIT. See [`LICENSE`](LICENSE).
