# React (Vite, Next.js, Remix)

## Install

1. Copy `src/` and `fonts/` into `hypercube-ui/` inside the project (for example `src/hypercube-ui/src` and `src/hypercube-ui/fonts`).
2. Import the CSS once, at the entry point:
   - Vite: in `main.tsx`, `import './hypercube-ui/src/index.css'`.
   - Next.js (app): in `app/layout.tsx`, `import '../hypercube-ui/src/index.css'`.
3. The custom elements only exist in the browser. Load `elements.js` once on the client:

```tsx
// Vite: in main.tsx
import './hypercube-ui/src/elements.js';

// Next.js: in a client component mounted in the layout
'use client';
import { useEffect } from 'react';
export function HypercubeElements() {
  useEffect(() => {
    import('../hypercube-ui/src/elements.js');
  }, []);
  return null;
}
```

4. The root (`#root`, `#__next`) already gets `height: 100%` from the library. If the app mounts somewhere else, give that element `height: 100%`, or the page will not scroll.

## Writing the markup

- `class` becomes `className`; `for` becomes `htmlFor`; `style` becomes an object (`style={{ '--c': 'var(--blue)' } as React.CSSProperties}`).
- Presence attributes: the CSS only checks whether they exist (`[data-unread]`, `[data-complete]`, `[data-on]`). Pass `data-unread={unread || undefined}`; `false` would become the text "false" and count as present.
- State with `data-state`: `<span className="hc-ring round" data-state={working ? 'working' : undefined}>`.
- Icons: `lucide-react` with `strokeWidth={1.8}` and `className="i"`, 16 px.
- Boards (tree, calendar, usage timeline) are plain nested markup: render it from your data, like `catalog/js/workflow.js` and `catalog/js/calendar.js` do with template strings.

## A modal with Esc, click outside and focus

```tsx
function Modal({ title, open, onClose, children, footer }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      back?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <>
      <div className="scrim enter" />
      <div className="modal-wrap" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div ref={box} className="modal sm enter" role="dialog" aria-modal="true" aria-labelledby="modal-t">
          <div className="modal-h"><h2 id="modal-t">{title}</h2><button className="ibtn" aria-label="Close" onClick={onClose}>×</button></div>
          <div className="modal-b">{children}</div>
          <div className="modal-f"><span className="sp" />{footer}</div>
        </div>
      </div>
    </>
  );
}
```

The drawer is the same, with `.drawer-scrim` + `.drawer` (see "Overlays" in AGENTS.md).

## The `<hc-ask>` and `<hc-sheet>` elements

**React 18**: on custom tags (`hc-*`) use `class`, not `className` (React 18 would write a literal `className` attribute), and pass attributes as text (`open=""`, `controlled=""`). Events (`hc-close`, `hc-longpress`) only through a ref and `addEventListener`.

**React 19** treats custom elements like any tag, with `className`. To listen to `hc-close`, use a ref:

```tsx
function Sheet({ open, onClose, children }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.addEventListener('hc-close', onClose);
    return () => el?.removeEventListener('hc-close', onClose);
  }, [onClose]);
  return (
    <hc-sheet ref={ref} open={open ? '' : undefined} controlled="" aria-label="Actions">
      <div className="hc-sheet-bg" />
      <div className="hc-sheet-b"><div className="hc-sheet-grab" /><div className="hc-sheet-in">{children}</div></div>
    </hc-sheet>
  );
}
```

TypeScript: declare the tags once.

```ts
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hc-ask': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { keys?: string };
      'hc-sheet': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { open?: string; controlled?: string };
    }
  }
}
```

## Components

Make thin components that only return the library markup (`<Button variant="primary">` returns `<button className="btn btn-primary">`). Do not copy the CSS into CSS Modules or styled-components: the global CSS is the source.
