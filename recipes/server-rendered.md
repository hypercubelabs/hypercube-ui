# Server-rendered HTML (Django, Rails, Laravel, Razor Pages, PHP, Go)

1. Copy `src/` and `fonts/` into the static files folder (`static/`, `public/`, `wwwroot/`).
2. In the base layout, the three lines from `recipes/html.md`.
3. Build the shell (`.shell`, `.side`, `.topbar`, `.page`) once in the base layout, and repeated pieces as partials (`_button.html`, `partials/field.blade.php`…), always returning the markup from `components.json`.
4. Forms: `.field` + `.label` + `.input` + `.err`, with the error coming from server validation and `aria-invalid="true"` on the field.
