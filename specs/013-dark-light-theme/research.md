# Research Notes – Spec 013 Dark/Light Theme

## Decisions

- **Tailwind dark mode strategy**: Use `darkMode: "class"` in `tailwind.config.js` and toggle the `dark` class on `<html>`.
- **Client-side preference storage**: Use `localStorage` key (e.g., `theme`) to cache the last user-selected theme per browser.
- **Backend preference storage**: Persist theme preference per authenticated user via a small API (e.g., `GET/PUT /api/theme-preference`).
- **Initial theme resolution order**:
  1. User preference from backend (if authenticated and available).
  2. Local `theme` value from `localStorage`.
  3. `prefers-color-scheme` media query.
  4. Fallback to `light`.
- **Hydration/FOUC mitigation**: Inject an inline script in `layout.tsx` (or equivalent) to read stored preference and set the `dark` class on `<html>` before React hydration.

## Rationale

- Staying with Tailwind `dark` class integrates cleanly with TailAdmin utilities and existing styles.
- Combining backend and localStorage storage gives both cross-device persistence and offline/per-browser resilience.
- The resolution order ensures authenticated users always see their saved preference first, without breaking anonymous visitors.
- Early `<html>` class setting minimizes flashes of the wrong theme during SSR/CSR handoff.

## Alternatives Considered

- **CSS custom properties + data-theme attribute**: More flexibility but conflicts with the explicit "no CSS variable theme engine" requirement.
- **Only localStorage, no backend**: Simpler, but does not satisfy cross-device persistence requested for Spec 013.
- **Auto-follow system preference always**: Good default but contradicts clarified requirement that explicit user choice must override OS changes.
