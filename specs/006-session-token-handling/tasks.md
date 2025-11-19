# Tasks — Session & Token Handling (Frontend)

## Dependencies
- Backend `/api/auth/refresh` endpoint must be available.
- Login/signup endpoints return `accessToken` and `refreshToken`.

## Tasks

### 1. Create Token Service
**File:** `src/lib/auth/tokenService.ts`
- Implement `setTokens(accessToken, refreshToken)` (stores refreshToken in memory/secure storage).
- Implement `getAccessToken()` (reads from httpOnly cookie or returns in-memory token).
- Implement `refreshTokens()` (POST to `/api/auth/refresh` with refreshToken; store new accessToken).
- Implement `clearTokens()` (clear cookie/in-memory token).
- Export a singleton instance.

### 2. Create Refresh API Route
**File:** `src/app/api/auth/refresh/route.ts`
- Accept POST with JSON `{ refreshToken }`.
- Call backend `/api/auth/refresh` with the refreshToken.
- On success:
  - Set httpOnly cookie: `accessToken` (Secure; HttpOnly; SameSite=Strict; Path=/).
  - Return JSON `{ accessToken }`.
- On failure: return 401.
- Use fetch with proper error handling.

### 3. Create Auth Fetch Wrapper
**File:** `src/lib/api/fetchWithAuth.ts`
- Export a function `fetchWithAuth(url, options)` that:
  - Reads accessToken via `tokenService.getAccessToken()`.
  - If token exists, add `Authorization: Bearer <token>` to headers.
  - Perform fetch.
  - If response is 401:
    - Call `tokenService.refreshTokens()`.
    - Retry the original request once with new token.
    - If refresh fails, clear tokens and redirect to `/login`.
  - Return response or throw error.

### 4. Create Protected Route Component
**File:** `src/components/auth/ProtectedRoute.tsx`
- Accept `children: React.ReactNode`.
- On mount:
  - Attempt to read current user via `/api/auth/me` using `fetchWithAuth`.
  - If 401/403, redirect to `/login`.
  - If success, render children.
- Show loading spinner while checking.
- Use `useRouter` for redirect.

### 5. Create Protected Layout
**File:** `src/app/(protected)/layout.tsx`
- Wrap `{children}` with `<ProtectedRoute>`.
- Export as default.

### 6. Move Protected Pages Under (protected)
- Move `src/app/dashboard/page.tsx` → `src/app/(protected)/dashboard/page.tsx`.
- Move `src/app/admin/page.tsx` → `src/app/(protected)/admin/page.tsx`.
- Move `src/app/notes/page.tsx` → `src/app/(protected)/notes/page.tsx`.
- Update any internal links to these pages (if hardcoded).

### 7. Update API Client to Use fetchWithAuth
**File:** `src/lib/api.ts`
- Replace direct `fetch` calls with `fetchWithAuth` for:
  - `me()`
  - Any future protected endpoints.
- Keep `signup()` and `login()` using direct `fetch` (no token yet).

### 8. Update Login/Signup to Store Tokens
**Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- After successful login/signup, call `tokenService.setTokens(accessToken, refreshToken)`.
- For signup, after calling login API, store tokens.
- Ensure tokens are stored before redirecting.

### 9. Add Logout Functionality
**File:** `src/lib/auth/tokenService.ts` (add `logout()`)
- Call `clearTokens()`.
- Optionally call backend `/api/auth/logout` if it exists.
- Redirect to `/login`.

### 10. Add Logout UI (Optional)
- Add a logout button/link in a persistent header or user menu.
- Wire it to `tokenService.logout()`.

### 11. Cross-Tab Sync (Optional MVP)
- Use `BroadcastChannel` or `localStorage` events to notify other tabs on logout.
- In `tokenService`, listen for events and trigger logout.

### 12. Testing
- Manual:
  - Login, navigate to protected page, refresh.
  - Wait for token expiry (or manually expire).
  - Ensure silent refresh works.
  - Open protected page in new tab.
  - Logout in one tab, verify others redirect.
- Unit tests for `tokenService`.
- Integration test for `/api/auth/refresh`.

## Order of Execution

1. Token Service
2. Refresh API Route
3. Auth Fetch Wrapper
4. Protected Route Component
5. Protected Layout
6. Move Protected Pages
7. Update API Client
8. Update Login/Signup to Store Tokens
9. Add Logout
10. Add Logout UI (optional)
11. Cross-Tab Sync (optional)
12. Testing

---

**Status:** Draft  
**Next:** Review with user, then begin implementation.
