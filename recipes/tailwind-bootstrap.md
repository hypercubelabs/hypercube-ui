# Projects that already use Tailwind or Bootstrap

## Tailwind

They live together. The class names do not clash with Tailwind's (the library does not use `.hidden`, `.flex`, `.container` and so on).

1. Import after Tailwind's base:

```css
/* Tailwind 4 */
@import 'tailwindcss';
@import './hypercube-ui/src/index.css';

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--text-2);
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --font-sans: var(--font);
}
```

Tailwind 3: `@tailwind base; @tailwind components; @tailwind utilities;` and then the library `@import`; in `tailwind.config.js`, `theme.extend.colors = { surface: 'var(--surface)', border: 'var(--border)', … }`.

2. For the pieces (button, field, panel, tabs…), use the library classes, not utilities. Utilities stay for arrangement (`flex`, `gap-2`, `grid-cols-2`).
3. Dark: the library uses `data-theme` and `prefers-color-scheme`. If Tailwind uses the `dark` class, point the variant at `[data-theme=dark]` (Tailwind 4: `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`).

## Bootstrap

Do not load both on the same page: `.btn`, `.badge`, `.row`, `.col`, `.modal`, `.toast` and `.alert` exist in both with different designs.

1. Migrate by route or by area: the migrated area uses a layout that loads only Hypercube UI; the rest keeps Bootstrap until it is swapped.
2. Bootstrap's grid (`.row`/`.col-*`) becomes CSS grid or `display:flex` with `gap`; the library uses `.row` only as a simple flex row.
3. Bootstrap's JS components (modal, dropdown, toast) become the pieces in `overlays.css`, with the state in your code.
4. When the last screen moves, remove Bootstrap from the project.
