# Changes

## 0.2.0 (tagged 2026-11-13)

- Context switcher (`.hc-switch`, `.hc-switch-logo`, `.hc-switch-name`, `.pop.hc-switch-menu`): the one way to pick the workspace, organisation or product, at the top of the menu, as in Meetas. The templates use it.
- Audit: R25 checks the switcher and finds look-alike pickers; R17 accepts `.hc-switch` in place of `.hc-brand`; manual check M14. R23 runs whenever `--surface` is defined.

- README screenshots of every catalog page in light; the main screens also in dark and on a phone (`docs/screenshots/`, taken again with `npm run screenshots`).
- New README with a cover made only of the library's pieces (`catalog/cover.html`, taken again with `npm run cover` into `docs/cover-light.webp` and `docs/cover-dark.webp`).
- The git history starts at this version: earlier commits were squashed into one. A `VERSION` file that names an older commit should name the `v0.2.0` tag instead.

## 0.1.0 (tagged 2026-11-13)

First version.

- Base: tokens, reset, button, field, tabs, segmented, badge, chip, avatar, panel, stats, states, modal, drawer, menu, toast, app shell.
- Screen patterns: list + detail, messages and composer, settings, sign in, a table that turns into cards, sectioned form.
- Pieces for screens where AI works: status ring, two-line row, bot question, trail with substeps and an approval step, needs you, working now, changes with undo, bottom sheet.
- Boards: connected tree with OR/AND joins and branch labels, node, dotted canvas, flow editor with a settings panel, week calendar, on/off filters, usage timeline, file and diff.
- One loading indicator only, the Datacube hexagon (`.hc-loader`).
- Every colour and shadow comes from a token, including the danger button, the switch knob and the drawer shadow (`--on-danger`, `--danger-hover`, `--knob`, `--shadow-press`, `--shadow-knob`, `--shadow-seg`, `--shadow-drawer`).
- The page is white: `body` uses `var(--surface)`; `--bg` stays only behind the sign-in card.
- One scrollbar per area: `.content.fill` + `.fill-b` for screens whose main piece scrolls (the week calendar uses it; it scrolled twice before).
- Adjust screen: `<hc-zoom>` scales the whole app 5% at a time from 80% to 140%, saved per person; `zoomFactor()` for code that positions elements; a size scale note in `tokens.css` and a `--fs-3xs` token so every text size is on the scale.
- Audit: `AUDIT.md` (12 static checks, 20 page checks, 12 manual checks and the report format), `scripts/audit.mjs` (source scan plus Playwright at 1280/360 px, light/dark) and `audit/audit.js` (runs in any browser or test). The catalog passes it with 0 failures.
- Catalog with 10 piece pages and 11 templates (chat, inbox, dashboard, list, week calendar, workflow editor, rate limit planner, root cause, sectioned form, sign in, settings); an AI how-to (AGENTS.md, llms.txt, components.json, recipes).
