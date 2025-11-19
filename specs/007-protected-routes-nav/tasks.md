# Tasks — Spec 7: Protected Routes & App Navigation

> All tasks use the checklist format: `- [ ] T001 [P] [US1] Description with file path`

## Phase 1 — Setup

- [ ] T001 Confirm backend `/api/me` endpoint exists and returns `id`, `email`, `role` in `c:/Users/shash/Desktop/Pre- Sales/backend/Controllers/MeController.cs` (or equivalent).
- [ ] T002 Verify `fetchWithAuth` helper is available for authenticated requests in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/lib/api/fetchWithAuth.ts`.

## Phase 2 — Foundational (Auth state & context)

- [ ] T010 Create `AuthContext` and `AuthProvider` with `status` and `user` state in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/context/AuthContext.tsx`.
- [ ] T011 Export `useAuth` hook from `c:/Users/shash/Desktop/Pre- Sales/frontend/src/context/AuthContext.tsx`.
- [ ] T012 Integrate `AuthProvider` into root layout in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/layout.tsx` so all app routes can read auth state.

## Phase 3 — User Story 1 (US1): Protect authenticated areas

- [ ] T020 [US1] Create `(protected)` route group and layout wrapper in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(protected)/layout.tsx`.
- [ ] T021 [US1] Implement `AuthGate` component that redirects unauthenticated users to `/login` in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(protected)/guard.tsx`.
- [ ] T022 [US1] Wrap `(protected)` layout with `AuthGate` in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(protected)/layout.tsx`.
- [ ] T023 [US1] Add Basic user dashboard placeholder page at `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(protected)/dashboard/page.tsx`.

## Phase 4 — User Story 2 (US2): Role-aware navigation after login

- [ ] T030 [US2] Implement role-based landing page logic in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/page.tsx` (Admin → `/accounts`, Basic → `/dashboard`, unauthenticated → `/login`).
- [ ] T031 [US2] Ensure landing page shows a simple "Redirecting..." state while `status === "checking"` in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/page.tsx`.

## Phase 5 — User Story 3 (US3): Admin-only areas & not-authorized

- [ ] T040 [US3] Implement `AdminGuard` component using `useAuth` in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(admin)/guard.tsx`.
- [ ] T041 [US3] Wrap admin Accounts route group `(admin)/accounts` with `AdminGuard` in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(admin)/accounts/layout.tsx`.
- [ ] T042 [US3] Implement `/not-authorized` page to show a clear message for authenticated non-admins in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/not-authorized/page.tsx`.

## Phase 6 — Login flow wiring

- [ ] T050 Wire login page to call `POST /api/auth/login` and handle errors in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(auth)/login/page.tsx`.
- [ ] T051 After successful login, store tokens via `tokenService.setTokens` in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(auth)/login/page.tsx`.
- [ ] T052 After tokens are stored, call `/api/me` and update `AuthContext` (e.g., via a helper or context method) in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(auth)/login/page.tsx`.
- [ ] T053 Navigate to `/` after login so the landing page can apply role-based redirects in `c:/Users/shash/Desktop/Pre- Sales/frontend/src/app/(auth)/login/page.tsx`.

## Phase 7 — QA / Verification & Polish

- [ ] T060 [P] Manually test unauthenticated access to `/dashboard` and `/accounts` results in redirect to `/login` using a fresh browser session.
- [ ] T061 [P] Manually test Admin login flow (`admin@leadrat.com`) results in landing on `/accounts` in the browser.
- [ ] T062 [P] Manually test Basic login flow (`user@leadrat.com`) results in landing on `/dashboard` in the browser.
- [ ] T063 [P] Verify Basic user access to `/accounts` results in the `/not-authorized` experience and never shows admin UI.
- [ ] T064 [P] Verify hard refresh (F5) on `/dashboard` and `/accounts` while authenticated does not redirect to `/login` unless tokens are invalid/expired.
