---
title: Spec 6 — Session & Token Handling (Frontend)
description: Secure token storage, automatic refresh, request interceptors, and protected route guards for the frontend.
---

# Spec 6 — Session & Token Handling (Frontend)

> Architecture note: This spec assumes the global architecture and conventions defined in `specs/000-architecture/spec.md` (Spec 000 — Architecture & Conventions), including the use of `AuthController`, JWT-based auth, `fetchWithAuth`, and the shared error/response shape.

## What / Why
Implement secure token storage, automatic token refresh, and attach JWT access tokens to every protected API request. Frontends commonly break security here — this spec ensures your app behaves like a production SaaS product.

## 📌 Responsibilities in Spec 6

### 1. Store accessToken securely
Use:
- httpOnly cookies (recommended)
- or in-memory storage (fallback)
- **NOT localStorage**.

This prevents:
- XSS token theft
- accidental exposure
- refresh failures

### 2. Refresh token handling
Backend already returns:
- accessToken
- refreshToken

Spec 6 defines how the frontend should:
- silently refresh accessToken before expiry
- retry requests when token is expired
- redirect to /login if refresh fails

### 3. Request Interceptor
Every API call from frontend must attach:
`Authorization: Bearer <accessToken>`

Usually done via:
- Axios interceptors
- custom Next.js fetch wrapper
- React Query fetch client

### 4. Auto-logout when token is invalid
Frontend should detect:
- 401 → try refresh, if fail → logout
- 403 → user allowed, but unauthorized for that resource
- 404 → resource ownership failure (RBAC)

### 5. Token Sync Between Browser Tabs
If user logs out in one tab → all tabs log out.
This is optional in MVP but included in enterprise apps.

## 📦 Outputs / Deliverables

Spec 6 produces:
✔ A token service (Next.js)  
Handles:
- storing accessToken
- renewing sessions
- logout
- reading cookies
- attaching tokens to API calls

✔ A /api/auth/refresh call is used transparently.

✔ A “protected route guard”  
Protect pages like:
- /dashboard
- /admin
- /notes
- /accounts

If token missing → redirect → /login.

## 🎯 Acceptance Criteria

- [ ] Access token is stored securely (httpOnly cookie or in-memory, not localStorage).
- [ ] Frontend automatically refreshes the access token before expiry.
- [ ] All API calls include `Authorization: Bearer <accessToken>`.
- [ ] On 401, the frontend attempts a refresh; if refresh fails, redirect to /login and clear tokens.
- [ ] Protected routes redirect unauthenticated users to /login.
- [ ] Logout in one tab logs out all tabs (cross-tab sync in MVP).

## 🚫 Out of Scope

- Changing backend JWT implementation.
- Adding new API endpoints beyond /refresh.
- UI redesign of login/signup (already done).

## 🛠 Tech Stack

- Next.js (App Router)
- Fetch API or Axios
- httpOnly cookie support via Next.js middleware/API routes
- React Context or Zustand for auth state (optional)

## 📁 Files to Create/Update

- `src/lib/auth/tokenService.ts` — token storage/refresh logic
- `src/lib/api/fetchWithAuth.ts` — request wrapper that adds Bearer
- `src/components/auth/ProtectedRoute.tsx` — route guard component
- `src/app/(protected)/layout.tsx` — wrap protected pages
- `src/app/api/auth/refresh/route.ts` (if using httpOnly cookies)
- Update `src/lib/api.ts` to use the new fetch wrapper

## 🔗 Related Specs

- Spec 1: JWT Auth Setup (backend)
- Spec 2: Local User Role (backend)
- Spec 3: User Registration (frontend)
- Spec 5: RBAC Middleware (backend)

## 📝 Notes

- The backend already issues accessToken (short-lived) and refreshToken (long-lived).
- Frontend should avoid storing tokens in localStorage to reduce XSS risk.
- If using httpOnly cookies, the refresh endpoint can be a Next.js API route that sets the cookie.
- For MVP, in-memory storage + refresh on 401 is acceptable; enterprise builds should prefer httpOnly cookies.

## Clarifications

### Session 2025-11-16

- Q: Which token storage strategy should we use? → A: httpOnly cookie for accessToken, in-memory for refreshToken
- Q: When should we refresh the access token? → A: Proactive refresh 1 minute before expiry
- Q: How should we handle token expiry/invalid tokens? → A: Redirect to /login with a toast message
- Q: Should cross-tab logout sync be in MVP or post-MVP? → A: Include cross-tab sync in MVP

---

**Status:** Draft  
**Next:** Generate plan.md and tasks.md.
