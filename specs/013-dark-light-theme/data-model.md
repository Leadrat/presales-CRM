# Data Model – Spec 013 Dark/Light Theme

## Entities

### ThemePreference (Backend)
- **userId**: identifier of the authenticated user.
- **theme**: `"light" | "dark"` – last explicit user-selected theme.
- **updatedAt**: timestamp of last change (for troubleshooting/audit).

### ThemePreference (Client Cache)
- **storageKey**: string key in `localStorage` (e.g., `"theme"`).
- **value**: `"light" | "dark" | "system"` (where `"system"` means "follow OS" until user explicitly picks).

### ThemeProviderState (Frontend)
- **theme**: `"light" | "dark"` – effective theme applied to `<html>`.
- **source**: `"backend" | "local" | "system"` – where the current value came from (for debugging and telemetry if needed).
- **setTheme(theme)**: sets theme explicitly and persists to backend/localStorage as appropriate.
- **toggleTheme()**: flips between `"light"` and `"dark"` and persists.

## Relationships

- Each **User** has at most one **ThemePreference** record in the backend.
- The **ThemeProvider** loads from backend/user when authenticated, otherwise from client cache/system preference.

## State Transitions (Theme)

- **Initial**: `theme` computed from resolution order in research.md.
- **On toggle**: `theme` switches `light ↔ dark`, updates backend record (if authenticated) and localStorage cache.
- **On logout**: in-memory `ThemeProviderState` resets to resolved theme for anonymous session (localStorage + system), but backend preference remains stored.
