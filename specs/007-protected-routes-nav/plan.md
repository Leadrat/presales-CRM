# Implementation Plan — Spec 7: Protected Routes & App Navigation

## 1. Backend dependencies (confirm only)
- Confirm `/api/me` endpoint returns `id`, `email`, and `role` for the authenticated user.
- Confirm JWT auth middleware is enabled (Spec 5) and used by `/api/me`.

## 2. Frontend auth state
- Add `AuthContext` with `user` and `status` (`checking`/`authenticated`/`unauthenticated`).
- Implement `AuthProvider` that calls `/api/me` on mount via `fetchWithAuth` and populates state.
- Export `useAuth` hook for components to consume auth state.

## 3. Protected route group
- Create `(protected)` route group.
- Implement `AuthGate` component that:
  - Shows loading while `status === "checking"`.
  - Redirects to `/login` when `status === "unauthenticated"`.
  - Renders children when `status === "authenticated"`.
- Wrap `(protected)` layout with `AuthGate`.

## 4. Role-based landing page
- Implement `src/app/page.tsx` as a client component.
- Use `useAuth` to:
  - Redirect unauthenticated users to `/login`.
  - Redirect Admin users to `/accounts`.
  - Redirect Basic users to `/dashboard`.
- Show a simple "Redirecting…" state while deciding.

## 5. Admin guard & not-authorized flow
- Implement `AdminGuard` component using `useAuth`.
- Wrap admin content (e.g., Accounts) with `AdminGuard`.
- Add `/not-authorized` page for blocked users.

## 6. Navigation wiring
- Ensure login flow:
  - Calls login API.
  - Stores tokens.
  - Calls `/api/me` and updates `AuthContext`.
  - Navigates to `/` to let landing page handle role-based redirect.
- Ensure Basic dashboard exists under `(protected)/dashboard`.

## 7. Testing
- Manual test matrix for:
  - Unauthenticated → protected page → redirected to `/login`.
  - Admin login → lands on `/accounts`.
  - Basic login → lands on `/dashboard`.
  - Basic user cannot access `/accounts`.
- Document known edge cases (token expiry, refresh behaviour).
