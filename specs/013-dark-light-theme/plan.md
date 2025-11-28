# Implementation Plan: Spec 013 – Full Dark/Light Theme System

**Branch**: `013-dark-light-theme` | **Date**: 2025-11-23 | **Spec**: `specs/013-dark-light-theme/spec.md`
**Input**: Feature specification for global dark/light theme switching across the entire application using TailAdmin-compatible dark mode class logic and a unified ThemeProvider.

## Summary

Implement a unified dark/light theme system across the existing Next.js application (TailAdmin-based frontend and Node backend) using Tailwind’s `dark` class strategy. A new `ThemeProvider` will control theme state, sync with both localStorage and a per-user backend preference, and ensure consistent styling for all key layouts (admin, protected, auth). A header toggle will let users switch themes with smooth transitions, and their choice will persist across reloads, sessions, and devices.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, Next.js (App Router) on Node.js 18+  
**Primary Dependencies**: Tailwind CSS 3 (with TailAdmin styles), React 18, Next.js routing, existing backend API layer  
**Storage**: Existing application database for per-user theme preference (exact DB abstracted behind current API); browser `localStorage` for client-side preference caching  
**Testing**: Existing test setup (likely Jest / React Testing Library) plus manual UI verification; extend as needed for theme behavior  
**Target Platform**: Web app running in modern desktop browsers (Chrome, Edge, Firefox, Safari)  
**Project Type**: Web application with `frontend/` (Next.js) and `backend/`  
**Performance Goals**: Theme toggle should visually complete within ~300ms; no noticeable extra latency on normal page loads due to theme initialization  
**Constraints**: Must use Tailwind `dark` class (no CSS variable theme engine); avoid layout shift or heavy re-renders on toggle; maintain accessibility contrast in both themes  
**Scale/Scope**: Single product with admin and protected areas; dark/light system applies across all existing pages and key components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Aligns with existing stack (Next.js + Tailwind + TailAdmin); no new frontend framework introduced.
- Uses Tailwind’s native `dark` class mechanism (no custom theming engine), keeping complexity low.
- Backend impact limited to storing a small per-user preference; no major schema or infra changes anticipated.

## Project Structure

### Documentation (this feature)

```text
specs/013-dark-light-theme/
├── spec.md        # Feature specification (already written)
├── plan.md        # This implementation plan
├── research.md    # Phase 0 research decisions for theming
├── data-model.md  # ThemePreference / ThemeProviderState design
├── quickstart.md  # How to run and verify the theme system
└── contracts/     # HTTP contracts for theme preference API
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   └── theme-preference/        # New/updated endpoints for per-user theme
    ├── services/
    │   └── themePreferenceService/  # Reads/writes user theme preference
    └── models/                      # User model extended with theme preference (if needed)

frontend/
└── src/
    ├── app/
    │   ├── layout.tsx                         # Wraps ThemeProvider, manages <html class="dark">
    │   └── (protected|admin)/...             # Pages that must respect theme
    ├── components/
    │   ├── layout/AppShellHeader.tsx         # Theme toggle button
    │   ├── theme/ThemeProvider.tsx           # New ThemeProvider
    │   └── ui/*                              # Cards, forms, tables updated with dark: classes
    └── lib/
        └── api/themePreferenceClient.ts      # Client for backend theme API
```

**Structure Decision**: Web application with clear `backend/` and `frontend/` separation. Theme logic is primarily implemented in `frontend/` with a small `backend/` API/service for persisting per-user theme preference.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
