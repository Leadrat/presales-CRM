---
title: Plan — Session & Token Handling (Frontend)
description: Implementation plan for secure token storage, refresh, and protected routes.
---

# Plan — Session & Token Handling (Frontend)

## Overview
Implement a frontend token service and request interceptor to securely store JWTs, automatically refresh them, and protect routes. We will use httpOnly cookies for access tokens (recommended) with an in-memory fallback, and a Next.js API route for refresh.

## Architecture

### 1. Token Storage Strategy
- **Primary:** httpOnly cookie set by a Next.js API route `/api/auth/refresh`.
- **Fallback:** In-memory variable (React Context/Zustand) for environments where cookies are impractical.
- **Avoid:** localStorage.

### 2. Refresh Flow
- Login receives `accessToken` and `refreshToken`.
- Frontend immediately calls `/api/auth/refresh` (Next.js route) which:
  - Validates the `refreshToken` with the backend.
  - On success, sets an httpOnly cookie with the new `accessToken`.
  - Returns the new `accessToken` (optional, for in-memory fallback).
- On any 401, retry once via `/api/auth/refresh`.
- If refresh fails, clear tokens and redirect to `/login`.

### 3. Request Interceptor
- Create a thin wrapper around `fetch` (`fetchWithAuth`) that:
  - Reads the httpOnly cookie automatically (browser does this).
  - For in-memory fallback, adds `Authorization: Bearer <token>`.
  - Retries on 401 using the refresh flow.
  - Propagates errors after retry.

### 4. Protected Routes
- A `<ProtectedRoute>` component wraps children.
- On mount, it checks for a valid token (via a `/api/me` call or cookie presence).
- If invalid/missing, redirects to `/login`.
- Apply this in a layout under `app/(protected)`.

## Implementation Steps

### Phase 1: Token Service
- Create `src/lib/auth/tokenService.ts`.
- Implement:
  - `setTokens(accessToken, refreshToken)`
  - `getAccessToken()` (reads cookie or returns in-memory)
  - `refreshTokens()` (calls `/api/auth/refresh`)
  - `clearTokens()`

### Phase 2: Refresh API Route
- Create `src/app/api/auth/refresh/route.ts`.
- On POST:
  - Read `refreshToken` from request body.
  - Call backend `/api/auth/refresh`.
  - Set httpOnly cookie with new `accessToken`.
  - Return JSON with new `accessToken` (optional).

### Phase 3: Fetch Wrapper
- Create `src/lib/api/fetchWithAuth.ts`.
- Wrap `fetch`:
  - Attach `Authorization` header if using in-memory fallback.
  - On 401, call `tokenService.refreshTokens()`, then retry once.
  - Handle 403/404 as needed.

### Phase 4: Protected Route Component
- Create `src/components/auth/ProtectedRoute.tsx`.
- Use `useEffect` to verify token (via `/api/me` or presence).
- Redirect to `/login` if invalid.

### Phase 5: Apply to Layout
- Create `src/app/(protected)/layout.tsx`.
- Wrap children with `<ProtectedRoute>`.
- Move pages like `/dashboard`, `/admin`, `/notes` under this route group.

### Phase 6: Update Existing API Calls
- Refactor `src/lib/api.ts` to use `fetchWithAuth`.
- Ensure login/signup do not use the wrapper (they don’t have a token yet).

## Edge Cases & Error Handling

- Network failure during refresh: logout and redirect.
- Multiple tabs: use `BroadcastChannel` or `localStorage` events to sync logout.
- Concurrent 401s: debounce refresh to avoid multiple calls.
- Cookie settings: Secure; SameSite=Strict; HttpOnly.

## Testing Strategy

- Unit tests for `tokenService`.
- Integration tests for `/api/auth/refresh`.
- E2E tests for protected route redirects.
- Manual testing:
  - Login, wait for expiry, ensure silent refresh.
  - Open protected page in new tab.
  - Logout in one tab, verify others redirect.

## Migration Notes

- Existing pages using direct `fetch` will be migrated to `fetchWithAuth`.
- Login/signup pages will continue to use direct `fetch` and then call `setTokens`.

## Security Checklist

- [ ] httpOnly cookie for accessToken.
- [ ] Secure; SameSite=Strict.
- [ ] No localStorage usage for tokens.
- [ ] Refresh endpoint validates refreshToken with backend.
- [ ] Frontend clears tokens on logout/refresh failure.

---

**Status:** Draft  
**Next:** Create tasks.md.
