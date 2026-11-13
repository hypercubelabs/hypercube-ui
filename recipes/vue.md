# Vue 3 (Vite, Nuxt)

1. Copy `src/` and `fonts/` into `src/hypercube-ui/`.
2. In `main.ts`: `import './hypercube-ui/src/index.css'` and `import './hypercube-ui/src/elements.js'`. Nuxt: CSS in `nuxt.config.ts` (`css: ['~/hypercube-ui/src/index.css']`) and `elements.js` in a `.client.ts` plugin.
3. Tell Vue that `hc-*` are custom elements, in `vite.config.ts`:

```ts
vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('hc-') } } })
```

4. Markup is the same as HTML. Presence attributes: `:data-unread="unread || undefined"`. Event: `<hc-sheet :open="open ? '' : undefined" controlled @hc-close="open = false">`.
5. Icons: `lucide-vue-next` with `:stroke-width="1.8"` and `class="i"`.
