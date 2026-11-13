# Svelte and SvelteKit

1. Copy `src/` and `fonts/` into `src/lib/hypercube-ui/`.
2. In `src/routes/+layout.svelte`: `import '$lib/hypercube-ui/src/index.css';` and, on the client, `onMount(() => import('$lib/hypercube-ui/src/elements.js'))`.
3. Markup is the same as HTML. Presence attributes: `data-unread={unread || undefined}`.
4. The sheet's event: Svelte 5 `<hc-sheet onhc-close={() => (open = false)}>`; Svelte 4 `on:hc-close`.
5. Icons: `lucide-svelte` with `strokeWidth={1.8}` and `class="i"`.
