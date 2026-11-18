# Changes

## 0.5.0

- **Breaking: bot characters left the library.** `.hc-bot`, `src/bots.css` and the `--bot-*` tokens are gone: the characters are the picture of the bots of one product (Meetas), so they now live in that product. In the library a bot without a photo is an `.av` with its initials, like a person. An app that used `.hc-bot` keeps the character in its own CSS (copy `src/bots.css` and the `--bot-*` tokens from 0.4.1 under the app's own class name) or switches to `.av`.
- Status ring: new state `error` (`.hc-ring[data-state="error"]`, red, still), for a bot that stopped on an error and will not go on by itself. The state dot follows it.
- Audit: R27 now checks the status ring (`data-state` is `working`, `needs` or `error`); R30 no longer mentions the character. S05 accepts colours in the custom properties of the app's own `tokens.css`, the one file for what belongs to a product alone (its brand, the palette of its own character); manual check M15 now reviews that file.
- Catalog: the "Bot character" and "Bot shapes and colours" examples are gone, the bot profile template shows initials again, and the status ring example shows the error state.

## 0.4.1

- Tooltip: two positions for an element next to an edge of the screen, `data-tip-pos="start"` and `data-tip-pos="end"` (below, lined up with the left or the right side of the element), on any `[data-tip]` and on the status ring. A centred tip on the first picture of a header was cut by the edge of the work area. Found in Meetas, on the bot's picture at the top of its conversation.

## 0.4.0

- Work block (`.hc-works` > `.hc-trail.hc-work`, in `src/hc.css`): the reply each bot is working on now, in the conversation, under the messages. The header says who and the state in one line (`.hc-work-s`), the plan shows the last actions under the current step, a step someone asked for in the middle says whose request it is (`.hc-step-by`), and a bot waiting in line shows only the header with a button to where it is busy (`.hc-work-x`). The chat template uses it. Found in Meetas, whose conversation drew it locally.
- Chat event (`.hc-event`, in `src/screens.css`): one line in the conversation for something that happened and is not a message (a routine ran, a setting changed), with what the person can do about it and the time. `.hc-sys` stays for a sentence with nothing to do about it. Found in Meetas.
- What the bot is doing, on hover: `data-tip` now works on the status ring (`.hc-ring`), also with `data-tip-pos`. The ring draws its state with `::after`, so its tip uses `::before`; before, a tip on a ring with a state replaced the ring on hover. It also shows on keyboard focus of the button or link the ring sits in.
- Audit: R28 (work block), R29 (chat event) and R30 (tip on the ring, never on `.hc-bot`); manual check M16 (the block, the event and the tip show only what really happened).

## 0.3.3

- Bot characters: new state `thinking`, for a bot that is about to answer or to start (writing a reply, queued, waiting on something other than the person). The eyes look up and wander slowly; reduced motion keeps them still, looking up. In `.hc-typing`, a bot without a photo shows its character thinking in place of the loader. Audit R27 accepts `thinking`. Asked in Meetas: a bot about to reply should look busy too.

## 0.3.2

- Bot characters come alive: an idle character blinks now and then (each colour at another moment, so a list never blinks together) and a character that needs the person gives two little hops and rests, so the one calling is seen even at menu size. Working still looks left and right. Reduced motion stops all of it. Found in Meetas, where no bot moved while none was working.

## 0.3.1

- Bot characters: the face now reads at menu size. Small characters (`.sm` and the default size) get eyes 30% bigger; `working` looks left, holds, looks right and the body leans with the eyes (it moved less than 1 px before); `needs` has big round eyes with a bright catchlight and a small open mouth, so it no longer looks like the idle face. With reduced motion the working face stays still, looking to the side. Found in Meetas, where the person could not see the states in the bots menu.

## 0.3.0 (tagged 2026-11-15)

- Bot characters (`.hc-bot`, `src/bots.css`): the default picture of a bot that has no photo. 12 shapes (`data-shape`: hex, block, ball, pill, diamond, peak, penta, clover, dome, drop, octa, cloud) and 9 colours (`data-color`: lime, teal, sky, blue, violet, pink, coral, orange, amber), so 108 characters. Each is a small prism seen at 30 degrees, like the cube of the brand, lit from the top. The face shows the state (`data-state`: none when idle, `working` moves the eyes, `needs` opens them wide, `off` closes them and turns the colour grey). Drawn by CSS only (mask and drop shadows), sizes like `.av`. Same colours in light and dark, from the new `--bot-*` tokens. The bot profile template uses it.
- Audit: R27 checks every `.hc-bot` (known shape and colour, valid state, named or hidden, no text inside); manual check M15 (no initials for a bot without a photo, the same face everywhere, the photo wins).

## 0.2.1 (tagged 2026-11-15)

- Scoped theme and accent: `data-theme` and `data-accent` work on any element, not only on `<html>`, so a theme preview, a dark panel in a light page or a row of accent swatches is drawn from the tokens (`[data-accent='hypercube']` restores the lime). Audit R08 compares colours inside such an element with that theme's tokens. Found in Meetas, whose theme cards used literal colours.
- Audit: R17 accepts `aria-current="page"` on the top bar button that opened the page (search results have no menu item).
- Audit: R06 accepts `role="progressbar"` on the library's own `.prog`; R15 skips an editable grid (`table[role="grid"]`) and code laid out in a table (`table[role="presentation"]`, a diff), which are not data tables.
- State dot (`.hc-ring[data-state] .hc-dot`): a dot in the corner of the status ring, in the ring's colour, for small avatars in tight rows such as a menu item, where the ring alone is hard to read. Audit R26 checks it only appears inside a ring with a state. Found in Meetas, whose bots menu drew it locally.
- Audit: S13 fails when an app uses the lime accent as a text colour (`color: var(--accent)` in CSS or `style=""`); links and accent text use `--accent-ink`. Found in Meetas, where task links in comments were lime.
- Needs you (`.hc-need`): the answers sit under the question instead of in a third column. Long answers no longer squeeze the question into a narrow column, and answer buttons wrap their text instead of spilling out of the card on phones.

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
