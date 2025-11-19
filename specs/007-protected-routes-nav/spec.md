# Feature Specification: Spec 7 — Protected Routes & App Navigation

**Feature Branch**: `[007-protected-routes-nav]`  
**Created**: 2025-11-17  
**Status**: Draft  
**Input**: High-level description: "Implement protected routes, auth-aware layouts, and role-based navigation for the Pre-Sales CRM frontend using Next.js App Router."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Protect authenticated areas (Priority: P1)

As an **authenticated user**, I want app pages that require login (dashboards, admin views) to be protected so that unauthenticated visitors are redirected to the Sign-in page instead of seeing protected content.

**Why this priority**: Prevents data leakage and ensures that all sensitive areas of the app are accessible only to logged-in users.

**Independent Test**: A tester can open a protected URL (e.g., `/dashboard` or `/accounts`) in a fresh browser session and verify that they are redirected to `/login`. After logging in, the same URL should show the expected page.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they try to open `/dashboard` directly, **Then** they are redirected to `/login`.
2. **Given** a user logs in successfully, **When** they navigate to `/dashboard`, **Then** they see the dashboard content and are not redirected.

---

### User Story 2 - Role-aware navigation (Priority: P2)

As an **Admin** or **Basic** user, I want the app to route me to an appropriate landing page after login (Admin → admin workspace, Basic → basic dashboard) so that I immediately see content relevant to my role.

**Why this priority**: Reduces friction after login and ensures different user roles see appropriate content and navigation.

**Independent Test**: Using seeded demo users (Admin and Basic), a tester can log in as each and observe that Admin lands on the admin workspace (Accounts) while Basic lands on the basic dashboard.

**Acceptance Scenarios**:

1. **Given** the seeded Admin user (`admin@leadrat.com`), **When** they log in successfully, **Then** they are redirected to `/accounts` (Admin Accounts page) rather than `/dashboard`.
2. **Given** the seeded Basic user (`user@leadrat.com`), **When** they log in successfully, **Then** they are redirected to `/dashboard` and do not see admin-only navigation.

---

### User Story 3 - Admin-only areas (Priority: P3)

As an **Admin**, I want admin-only pages (e.g., Accounts management) to be accessible only to admins and to show a clear not-authorized experience to non-admins so that sensitive operations cannot be accessed by basic users.

**Why this priority**: Enforces RBAC on the frontend and prevents non-admin users from accessing admin UIs even if they guess URLs.

**Independent Test**: A tester using the Basic user can attempt to access `/accounts` and verify that they are blocked/redirected with a not-authorized experience, while the Admin user can access `/accounts` normally.

**Acceptance Scenarios**:

1. **Given** an authenticated Basic user, **When** they manually navigate to `/accounts`, **Then** they are redirected to a not-authorized page or equivalent and cannot see account management UI.
2. **Given** an authenticated Admin user, **When** they navigate to `/accounts`, **Then** they see the full admin layout with sidebar and Accounts list.

---

### Edge Cases

- Browser refresh on a protected page while authenticated should keep the user on the page (no unexpected redirect to `/login`).
- Token expiry while on a protected page should eventually redirect to `/login` after refresh fails.
- Navigating back/forward using the browser history should not bypass auth guards.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The frontend MUST provide an `AuthContext` that tracks `status` (`checking`, `authenticated`, `unauthenticated`) and the current `user` (id, email, role), backed by the `/api/me` endpoint and JWT tokens stored via `tokenService`.

- **FR-002**: The frontend MUST implement an `AuthGate` component that:
  - Renders a loading state while `status === "checking"`.
  - Redirects to `/login` when `status === "unauthenticated"`.
  - Renders children only when `status === "authenticated"`.
  This gate MUST wrap all routes that require authentication (e.g., the `(protected)` route group).

- **FR-003**: Protected pages (e.g., `/dashboard` and any other authenticated-only pages) MUST be implemented under a `(protected)` route group whose layout wraps children in `AuthGate` so they are inaccessible when not logged in.

- **FR-004**: The app MUST implement a role-based landing page at `/` that:
  - Uses `useAuth()` to read the current user and status.
  - When `status === "authenticated"` and `user.role === "Admin"`, redirects (`router.replace`) to `/accounts`.
  - When `status === "authenticated"` and `user.role !== "Admin"`, redirects to `/dashboard`.
  - Shows a simple "Redirecting" message while redirect is in progress.

- **FR-005**: The login flow MUST:
  - Call the backend `POST /api/auth/login` endpoint.
  - Store `accessToken` and `refreshToken` via `tokenService.setTokens`.
  - Call `/api/me` to populate `AuthContext` with user id/email/role.
  - Navigate client-side to `/` (letting the role-based landing page perform the final redirect).

- **FR-006**: Admin-only pages (e.g., Accounts under the `(admin)` route group) MUST be wrapped in an `AdminGuard` component that:
  - Uses `useAuth()` to check `status` and `user.role`.
  - Allows rendering only when `status === "authenticated"` and `user.role === "Admin"`.
  - Redirects authenticated non-admin users to a `/not-authorized` page (or equivalent), while unauthenticated users are first redirected to `/login` by the surrounding auth gate.

- **FR-007**: The sidebar and header layouts used for admin pages MUST be rendered only inside the admin route group `(admin)` so that Basic users do not see admin navigation when redirected to `/dashboard`.

### Key Entities *(include if feature involves data)*

- **AuthUser (frontend state)**: Represents the authenticated user on the frontend (id, email, role), derived from `/api/me`.

- **AuthStatus**: Enum-like state in the frontend (`checking`, `authenticated`, `unauthenticated`) controlling gating and redirects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test session using a fresh browser profile, accessing any protected URL without a valid login results in a redirect to `/login` in 100% of tested cases.

- **SC-002**: Logging in as the Admin user (`admin@leadrat.com`) always results in a redirect to `/accounts`; logging in as the Basic user (`user@leadrat.com`) always results in a redirect to `/dashboard`.

- **SC-003**: Attempting to access `/accounts` as the Basic user always results in a not-authorized experience (no access to admin UI) while Admin can access `/accounts` successfully.

- **SC-004**: Hard refresh (F5) on `/dashboard` or `/accounts` while authenticated does not force the user back to `/login` except when the token is actually invalid/expired.

## Clarifications

### Session 2025-11-18

- Q: What should happen when an unauthenticated user directly opens an admin-only route like `/accounts`? → A: Treat `/accounts` as a protected route: unauthenticated users are redirected to `/login`, and only after authentication is `/not-authorized` shown for non-admin users.
