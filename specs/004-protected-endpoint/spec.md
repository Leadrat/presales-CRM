# Spec 4 — Protected Endpoint (JWT)

**Feature Branch**: `004-protected-endpoint`
**Created**: 2025-11-13
**Status**: Draft

## Summary
Provide a simple protected API endpoint that requires a valid JWT (HS256) obtained from the existing login flow. The endpoint returns the authenticated user's basic profile data and verifies role-based access is enforceable.

## User Scenarios & Testing (mandatory)

- P1 — Access my profile
  - As an authenticated user, I can call a protected endpoint and receive my id/email (and role), confirming my token works.
  - Test: With valid access token in Authorization header, I receive 200 and my profile data.

- P2 — Unauthorized access handling
  - As a caller without a token or with an invalid/expired token, I receive 401 with an error code.
  - Test: Missing/invalid/expired token returns 401 with `UNAUTHORIZED`.

- P3 — Soft-deleted or inactive account behavior
  - As a system, if a token belongs to a soft-deleted or inactive user, the request is rejected.
  - Test: Soft-deleted or inactive user token returns 401 with `UNAUTHORIZED`.

## Acceptance Criteria

- Requests with a valid JWT succeed with 200 and return `{ id, email, role }` of the caller.
- Requests with missing or invalid tokens return 401 with code `UNAUTHORIZED`.
- Requests with expired tokens return 401 with code `TOKEN_EXPIRED`.
- Requests where the user no longer exists, is soft-deleted, or inactive are rejected with 401 `UNAUTHORIZED`.

## Functional Requirements

- FR-001: Provide `GET /api/me` protected by JWT Bearer authentication.
- FR-002: Token validation uses existing HS256 settings (`Jwt:Secret`, `Issuer`, `Audience`), reuse program setup.
- FR-003: On success, return `{ id, email, role }` from the database (fresh lookup by claim `sub`).
- FR-004: If token is missing/invalid → 401 `UNAUTHORIZED`; if expired → 401 `TOKEN_EXPIRED`.
- FR-005: If user not found, soft-deleted, or inactive → reject request with 401 `UNAUTHORIZED`.
- FR-006: Store timestamps in UTC; TitleCase naming; GUID PKs; no enums/jsonb.

## Key Entities

- JWT Claims: `sub` (or `uid`) for User Id, `email`, `role` (Basic/Admin)
- User: Id (UUID), Email (lowercase), RoleId, IsActive, IsDeleted
- Role: Name (Basic/Admin)

## Success Criteria

- 100% of calls with valid tokens return 200 and the correct user data.
- 100% of calls without valid tokens return 401.
- Soft-deleted/inactive user access is blocked consistently per decided policy.

## Edge Cases

- Token valid signature but unknown user id → 401 `UNAUTHORIZED`.
- Token valid but user soft-deleted → reject (policy TBD).
- Token valid but user inactive → reject (policy TBD).
- Token using wrong audience/issuer → 401 `UNAUTHORIZED`.

## Clarifications

- User id claim: `sub`.
- Soft-deleted/inactive response: 401 `UNAUTHORIZED` (do not reveal account state).
- Response fields: limited to `{ id, email, role }`.
