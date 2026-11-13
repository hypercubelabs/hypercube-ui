# Blazor (Server, WebAssembly, United)

1. Copy `src/` and `fonts/` into `wwwroot/hypercube-ui/`.
2. In `App.razor` (or `index.html` / `_Host.cshtml`):

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="hypercube-ui/src/index.css">
<script type="module" src="hypercube-ui/src/elements.js"></script>
```

3. Markup is the same as HTML, in `.razor`. Presence attributes: `data-unread="@(unread ? "" : null)"` (Blazor leaves the attribute out when the value is `null`).
4. Sidebar state on phones: `<div class="shell @(menuOpen ? "mnav" : "")">` and `@onclick` on the button and on `.side-scrim`.
5. The sheet's `hc-close` event: register it with `JSRuntime` (an `addEventListener` that calls a `[JSInvokable]` method), or use the sheet without `controlled` and read its `open` attribute when you need it.
6. Icons: inline Lucide SVG in an `Icon.razor` component with `stroke-width="1.8"` and `class="i"`.
7. Isolated CSS (`.razor.css`) still works for what belongs to one screen only; library pieces are not copied there.
