# Angular

1. Copy `src/` and `fonts/` into `src/hypercube-ui/`.
2. In `angular.json`, under `styles`: `"src/hypercube-ui/src/index.css"`. In `main.ts`: `import './hypercube-ui/src/elements.js';`.
3. In components that use `<hc-ask>` or `<hc-sheet>`, add `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
4. Markup is the same as HTML. Presence attributes: `[attr.data-unread]="unread ? '' : null"`. Event: `(hc-close)="open = false"`.
5. Icons: `lucide-angular` with `[strokeWidth]="1.8"` and `class="i"`.
