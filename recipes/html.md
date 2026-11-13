# Plain HTML (or any static page)

1. Copy `src/` and `fonts/` into the site's public folder, for example `hypercube-ui/src` and `hypercube-ui/fonts`.
2. In the `<head>` of each page:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="/hypercube-ui/src/index.css">
<script type="module" src="/hypercube-ui/src/elements.js"></script>
```

3. Write the markup from `components.json` and from the templates in `catalog/pages/`.
4. Whatever needs state (opening the menu on phones, opening a modal, switching a tab) is yours: see `catalog/catalog.js`, which does it in a few lines with `data-*` and `hidden`, and `catalog/js/` for the templates that move. Copy only what you use.
