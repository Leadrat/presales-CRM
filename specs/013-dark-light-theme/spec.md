# Feature Specification: Spec 013 – Full Dark/Light Theme System

**Feature Branch**: `013-dark-light-theme`  
**Created**: 2025-11-23  
**Status**: Draft  
**Input**: Global dark/light theme switching across the entire application using TailAdmin-compatible dark mode class logic and a unified ThemeProvider.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch theme from any page (Priority: P1)

A signed-in user can toggle between light and dark themes from the main app header, and the entire UI (admin and basic areas) instantly updates without flicker.

**Why this priority**: Theme switching is the core value of this feature and directly impacts every page and user role.

**Independent Test**: On any dashboard or accounts page, use the header toggle to switch themes and verify that layout, colors, and text update consistently with no reload required.

**Acceptance Scenarios**:

1. **Given** a user on the protected dashboard in light mode, **When** they click the theme toggle once, **Then** the app switches to dark mode and all visible components (header, sidebar, cards, tables, forms) adopt dark styles.
2. **Given** a user on the admin dashboard in dark mode, **When** they click the theme toggle again, **Then** the app switches back to light mode and the same components adopt light styles.

---

### User Story 2 - Persist theme preference across sessions (Priority: P1)

A user’s chosen theme is remembered across page reloads, navigation, new sessions on the same device, and (when they are authenticated) across different devices by syncing with the backend.

**Why this priority**: Without persistence, users are forced to reapply their preference frequently, degrading experience.

**Independent Test**: Switch to dark mode, reload the browser, navigate between multiple pages and tabs, sign out and sign in again (including from another device), and confirm theme remains dark until explicitly changed.

**Acceptance Scenarios**:

1. **Given** a user selects dark mode on any page, **When** they refresh the browser, **Then** the app loads in dark mode without briefly flashing light styles.
2. **Given** a user sets light mode and later signs out and back in on the same browser, **When** they return to any app page, **Then** the UI loads in light mode.
3. **Given** a user sets dark mode on one device, **When** they sign in on another device, **Then** the app loads in dark mode.

---

### User Story 3 - Respect system preference for first-time visitors (Priority: P2)

First-time visitors or new sessions with no stored preference see a theme that matches their system `prefers-color-scheme` setting.

**Why this priority**: Aligning with OS preference provides a polished experience and sensible default before users interact with the toggle.

**Independent Test**: On a clean browser profile with no localStorage theme value, adjust OS appearance (light/dark) and load the app to verify it starts in the matching theme.

**Acceptance Scenarios**:

1. **Given** a user with system dark mode enabled and no stored app preference, **When** they open the app for the first time, **Then** the app loads in dark mode.
2. **Given** a user with system light mode enabled and no stored app preference, **When** they open the app for the first time, **Then** the app loads in light mode.

---

### Edge Cases

- What happens when localStorage is unavailable or throws (e.g., in private mode)? The app MUST fall back to system preference and still allow in-memory theme switching.
- What happens if `prefers-color-scheme` changes while the app is open or between sessions? The app MUST continue honoring the last explicit user-selected theme until the user changes it again.
- How does the system handle server-rendered pages where JavaScript is disabled or slow to hydrate? There MUST be no jarring flash of the wrong theme when possible (minimize FOUC with safe defaults).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-013-001**: System MUST provide a global `ThemeProvider` (React context) that exposes current theme (`"light" | "dark"`) and methods to toggle and set the theme.
- **FR-013-002**: System MUST persist the chosen theme in `localStorage` so that it is restored across page reloads and sessions on the same device.
- **FR-013-003**: System MUST initialize the theme on first load by checking, in order: stored user preference, then system `prefers-color-scheme`, then defaulting to light if neither is available.
- **FR-013-004**: System MUST use Tailwind’s `dark` class strategy (`darkMode: "class"`) and apply or remove the `dark` class on the root `<html>` element based on the active theme.
- **FR-013-005**: System MUST provide a visible theme toggle control in the main app header (AppShellHeader) on all authenticated layouts for both Admin and Basic users.
- **FR-013-006**: The theme toggle control MUST provide clear visual feedback (e.g., sun/moon icon state) to indicate the current theme.
- **FR-013-007**: All primary layouts and components (sidebars, headers, dashboard cards, forms, tables, modals, account details, contact UI, auth pages) MUST support both light and dark variants using Tailwind `dark:` utility classes.
- **FR-013-008**: Existing hard-coded background, border, and text colors MUST be migrated to TailAdmin-consistent palettes, including dark equivalents (e.g., `dark:bg-slate-950`, `dark:bg-gray-900`, `dark:border-gray-800`, `dark:text-gray-100`).
- **FR-013-009**: Theme changes MUST apply without a full page reload and should visually update all rendered components within one interaction (toggle click).
- **FR-013-010**: UI transitions during theme change MUST include smooth background and text color transitions to reduce visual flicker.
- **FR-013-011**: Theme behavior MUST be consistent across all key routes: admin dashboard, admin/accounts, my-accounts, protected dashboard, contacts views, and auth/login & signup.

### Key Entities *(include if feature involves data)*

- **ThemePreference**: Conceptual representation of a user’s theme choice (`"light"`, `"dark"`, or `"system"` as an implementation detail if used). Stored in browser storage and used at app bootstrap to compute the effective theme.
- **ThemeProviderState**: In-memory state held by the ThemeProvider, including current theme value and methods to toggle or explicitly set the theme. Not persisted directly to the backend.
- **ThemedComponent**: Any UI component that consumes theme (directly or indirectly) and uses Tailwind `dark:` variants to adjust backgrounds, borders, and text.

## Clarifications

### Session 2025-11-23

- Q: If a user has already chosen a theme and their OS `prefers-color-scheme` later changes, which should the app honor? → A: Always honor the last user-selected theme until the user changes it again.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-013-001**: After enabling dark mode, reloading the app on any supported page preserves the selected theme 100% of the time in manual QA tests across at least two major browsers.
- **SC-013-002**: On a fresh browser profile with system dark/light mode toggled, the app initially matches the OS theme in at least 95% of test runs without visible flashes of the wrong theme.
- **SC-013-003**: Manual audit confirms that all targeted pages (admin dashboard, admin/accounts, my-accounts, protected dashboard, contacts, login, signup) render with legible text and appropriate contrast in both light and dark modes.
- **SC-013-004**: Theme toggle interaction completes visually (all primary backgrounds and text colors transitioned) within 300ms on a typical development machine and test device.

---

## Implementation Log / Commands (Spec 013)

This section will be maintained during implementation to document how Spec 013 was realized.

### Backend / Infrastructure Steps

- _Planned_: Confirm no backend changes are required beyond potential logging or configuration notes for theme behavior (front-end only feature).

### Frontend Steps

- _Planned_: Create `src/providers/theme-provider.tsx` with React context and theme initialization logic.
- _Planned_: Update `tailwind.config.js` to `darkMode: "class"` and verify TailAdmin presets still work.
- _Planned_: Wrap global layout in `ThemeProvider` and ensure `<html>` receives/removes `dark` class correctly.
- _Planned_: Add theme toggle button (sun/moon icon) into `AppShellHeader` wired to ThemeProvider.
- _Planned_: Update key components (sidebars, headers, dashboard cards, forms, tables, modals, account detail & contact UI, auth pages) with appropriate `dark:` utility classes.
- _Planned_: Add smooth color transition utilities in `globals.css` / base styles.

### Representative Commands

- `git checkout 013-dark-light-theme`
- `npm run dev` *(or)* `yarn dev` – verify theme switching during development.
- `npm run lint` – ensure no lint errors introduced by theme changes.
- `npm run test` – run any existing tests that may cover theme-sensitive components.

> Update this section as implementation progresses to keep Spec 013 traceable to actual changes.
