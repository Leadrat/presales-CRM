# Tasks – Spec 013 Dark/Light Theme System

## Phase 1 – Setup

- [ ] T001 Configure Tailwind dark mode to use `class` in `frontend/tailwind.config.js`.
- [ ] T002 Ensure global layout file `frontend/src/app/layout.tsx` is the single place where `<html class="dark">` is managed.
- [ ] T003 [P] Add initial inline script in `frontend/src/app/layout.tsx` to read any stored theme value and set/remove `dark` class on `<html>` before React hydration.

## Phase 2 – Foundational Theme Infrastructure

- [ ] T004 Create `frontend/src/components/theme/ThemeProvider.tsx` with React context exposing `theme`, `setTheme`, and `toggleTheme()` using the resolution order from `research.md`.
- [ ] T005 Wire `ThemeProvider` around the app tree in `frontend/src/app/layout.tsx` so all pages can consume theme context.
- [ ] T006 [P] Implement a small client helper `frontend/src/lib/api/themePreferenceClient.ts` to `GET` and `PUT` `/api/theme-preference` using existing API utilities.
- [ ] T007 Add backend model/field to store per-user theme preference in `backend/Models/User.cs` (or related settings model) following `data-model.md`.
- [ ] T008 Implement backend service logic in `backend/Services/ThemePreferenceService.cs` (or similar) to read/write theme preference for the current user.
- [ ] T009 Add API controller endpoints in `backend/Controllers/ThemePreferenceController.cs` implementing `GET` and `PUT` contracts from `contracts/theme-preference.http`.

## Phase 3 – User Story 1: Switch theme from any page (Priority P1)

- [ ] T010 [US1] Add a visible theme toggle button (sun/moon icon) to the header in `frontend/src/components/layout/AppShellHeader.tsx` wired to `ThemeProvider`.
- [ ] T011 [P] [US1] Ensure the theme toggle is rendered for both admin and protected layouts in `frontend/src/app/(admin)/layout.tsx` and `frontend/src/app/(protected)/layout.tsx` (or equivalent shell components).
- [ ] T012 [US1] Update dashboard summary cards in `frontend/src/app/(protected)/dashboard/page.tsx` to use Tailwind `dark:` variants for backgrounds, borders, and text (no hard-coded colors).
- [ ] T013 [P] [US1] Update key shared UI components used on dashboards (cards, badges, basic panels) under `frontend/src/components/ui/` to support both light and dark with `dark:` classes.

## Phase 4 – User Story 2: Persist theme preference across sessions & devices (Priority P1)

- [ ] T014 [US2] Read backend theme preference on authenticated app initialization in `ThemeProvider.tsx` and map it to effective theme.
- [ ] T015 [P] [US2] On every explicit theme change, call `themePreferenceClient` to persist the new theme for the current user.
- [ ] T016 [US2] Ensure theme state is also cached in `localStorage` so that if backend is unavailable, last per-browser choice is still honored.
- [ ] T017 [P] [US2] Add logic in `ThemeProvider.tsx` to respect clarified rule: once user chooses a theme, OS `prefers-color-scheme` changes must NOT override it.

## Phase 5 – User Story 3: Respect system preference for first-time visitors (Priority P2)

- [ ] T018 [US3] Implement initial theme resolution in `ThemeProvider.tsx` using the ordered sources: backend → localStorage → `prefers-color-scheme` → `light`.
- [ ] T019 [P] [US3] Ensure anonymous visitors with no stored preference see a theme matching their OS preference until they explicitly choose a theme.

## Phase 6 – Cross-Cutting UI Updates & Polish

- [ ] T020 Audit main navigation (sidebar, header containers) in `frontend/src/components/layout/` and update backgrounds, borders, and text to use consistent light/dark TailAdmin utilities.
- [ ] T021 [P] Update auth pages (login, signup) under `frontend/src/app/(auth)/` to support dark mode, following Spec 013 contrast requirements.
- [ ] T022 [P] Update account and contacts-related pages (`frontend/src/app/(protected)/accounts/*` and related components) with `dark:` variants for tables, forms, and modals.
- [ ] T023 Add smooth transition utilities (e.g., `transition-colors duration-200`) to top-level layout containers in `frontend/src/app/layout.tsx` and shared components.
- [ ] T024 [P] Add basic logging or telemetry hook around theme changes in `ThemeProvider.tsx` (e.g., console or future analytics hook) for debugging.

## Dependencies & Execution Order

- Phase 1 must complete before Phase 2.
- Phase 2 must complete before Phases 3–5.
- Phases 3 and 4 are both P1 and can be worked in parallel once foundational work is done, as long as `ThemeProvider` shape remains stable.
- Phase 5 (system preference) depends on the resolution order and infrastructure from earlier phases.
- Phase 6 can run after at least Phase 3 is complete, with some tasks parallelizable as noted by [P].

## MVP Scope

- Minimum viable product is completion of:
  - Phase 1 (Setup)
  - Phase 2 (Foundational Theme Infrastructure)
  - Phase 3 (User Story 1 – interactive toggle + core dashboard theming)

This yields a working theme toggle with persistent behavior on a single device and consistent theming across the main dashboards; later phases add cross-device syncing, system preference alignment, and UI polish.
