# Astro

1. Copy `src/` and `fonts/` into `src/hypercube-ui/`.
2. In the layout:

```astro
---
import '../hypercube-ui/src/index.css';
---
<script>
  import '../hypercube-ui/src/elements.js';
</script>
```

3. Markup is the same as HTML. Without JavaScript the page shows complete; what opens and closes needs a small `<script>` (see `catalog/catalog.js`) or an island.
