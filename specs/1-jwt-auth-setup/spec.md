# Feature Specification: JWT Authentication Setup

**Feature Branch**: `1-jwt-auth-setup`
**Created**: 2025-11-12
**Status**: Draft
**Input**: User description: "Speckit.specify for A1 JWT Authentication Setup: secure login using JWT auth with access and refresh tokens; endpoints include POST /api/auth/login; user credentials validated against Users; outputs include AccessToken (15m), RefreshToken (7d, stored in RefreshTokens), and User object with UserId, Email, RoleId; acceptance criteria include valid/invalid login behavior, BCrypt hashing, JWT includes UserId, Email, RoleId, token validated on protected routes; dependencies: Users table (A2), RefreshTokens (A6). JTBD: When I log in, I want secure access via company credentials, so my sessions and data remain protected."

## Personas

- Primary: End User (Sales, Presales) needing access to the app.
- Secondary: Admin who manages roles and may verify audit logs for auth events.

## Scope

- In-scope: Login, token issuance, refresh, token validation on protected routes, audit logging.
- Out-of-scope: Registration, password reset, SSO, MFA (covered in separate specs).

## Inputs

- API Inputs:
  - `POST /api/auth/login` body: `{ email: string, password: string }`
  - `POST /api/auth/refresh` body: `{ refreshToken: string }` or secure cookie variant
- UI Inputs:
  - Login form fields: Email, Password
- System Inputs:
  - ActivityLogs emission; clock/time source for token expiry

## Outputs

- API Responses:
  - Login success: `{ data: { accessToken, refreshToken, user: { id, email, roles[] } }, meta }`
  - Login failure: `{ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } }`
  - Refresh success: `{ data: { accessToken, refreshToken } }`
- Events/Logs:
  - ActivityLogs entries for login success/failure and refresh attempts

## Data Model

- Tables:
  - Users: Id UUID PK, Email UNIQUE, PasswordHash, IsActive, CreatedAt, UpdatedAt, IsDeleted, DeletedAt
  - RefreshTokens: Id UUID PK, UserId FK Users(Id), TokenHash, ExpiresAt, RevokedAt, CreatedAt
  - ActivityTypes: e.g., Authenticated
  - ActivityLogs: ActorUserId, EntityType="Auth", ActivityTypeId, Message, CorrelationId, CreatedAt
- Lookups:
  - DemoStatuses (unrelated here), ActivityTypes

## API Contract

- Endpoints:
  - `POST /api/auth/login`
    - Request: `{ email: string, password: string }`
    - Responses:
      - 200: `{ data: { accessToken: string, refreshToken: string, user: { id: string, email: string, roles: string[] } } }`
      - 401: `{ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } }`
  - `POST /api/auth/refresh`
    - Request: `{ refreshToken: string }`
    - Responses:
      - 200: `{ data: { accessToken: string, refreshToken: string } }`
      - 401: `{ error: { code: "TOKEN_INVALID", message: "Refresh token invalid or expired" } }`
- Error Handling:
  - Standard error shape `{ error: { code, message, details? } }` and correlation id header

## Acceptance Criteria

- ✅ Valid credentials generate signed JWT and refresh token
- ✅ Invalid credentials return 401 Unauthorized
- ✅ Passwords hashed using BCrypt
- ✅ JWT includes UserId, Email, RoleId claims
- ✅ Token validated on protected routes

## Versioning

- Current: v1.0.0
- Backward compatibility: additive; no breaking changes anticipated
- Change log: v1.0.0 initial login and refresh flows

## Dependencies

- Phases: A (Auth baseline), F (Activity Logs), B (RBAC for role mapping)
- Services: Token signing service, password hashing service
- External integrations: None

## Security

- AuthN: Email/password; passwords hashed using BCrypt; no plaintext storage
- AuthZ (RBAC): Roles resolved via UserRoles; access enforced server-side
- JWT: HS256 signing; claims include `sub`, `iat`, `exp`, `jti`, `email`, `roleId`; 15m access expiry
- Data protection: Hash refresh tokens at rest; HTTPS/TLS; no tokens/PII in logs

## Observability

- Logs: Structured logs for login attempts, outcomes, and refresh events
- Metrics: Login success rate, failure rate, refresh success rate
- Traces: Correlate auth flows across API calls via Correlation-Id

## Testing Strategy

- Unit: password verification, token creation/validation, claims content
- Integration: login and refresh flows with Testcontainers Postgres (Users, RefreshTokens)
- E2E: UI login against staged backend; protected route access with/without token
- Test data: seeded user with known password hash; expired and valid refresh tokens

## Migration & Rollout

- Migrations: create Users (if not existing baseline), RefreshTokens, ActivityTypes entries
- Backfill: none required for initial rollout
- Feature flags: optional flag to enable refresh endpoint
- Rollback plan: disable login route and feature flag, revoke token families issued post-deploy

## Risks & Mitigations

- Risk: Algorithm mismatch between constitution and acceptance criteria → Mitigation: decide standard (Argon2id vs BCrypt) and document
- Risk: Token leakage via logs → Mitigation: never log tokens/PII; redact sensitive values
- Risk: Brute-force attacks → Mitigation: rate limiting and cooldown after repeated failures

## JTBD Reference

- Link: When I log in, I want secure access via company credentials, so my sessions and data remain protected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login with valid credentials (Priority: P1)

As a User, I can authenticate with email and password to receive an access token and refresh token.

**Why this priority**: Core capability enabling any authenticated use of the system.

**Independent Test**: Provide valid test user credentials; expect HTTP 200 with JWT access token (≈15m exp), refresh token persisted with expiry ≈7d, and minimal user object.

**Acceptance Scenarios**:

1. Given a registered active User with a stored password hash, When they POST /api/auth/login with correct email and password, Then API returns 200 with AccessToken, sets/persists RefreshToken, and returns User summary.
2. Given a valid AccessToken, When used to call a protected endpoint, Then request is authorized and returns 200.

---

### User Story 2 - Invalid credentials (Priority: P1)

As a User, I get a clear error when credentials are invalid.

**Why this priority**: Security and UX; prevents information leakage and ensures proper handling.

**Independent Test**: Attempt login with wrong password or unknown email; expect 401 with no token issuance.

**Acceptance Scenarios**:

1. Given an existing email with wrong password, When POST /api/auth/login, Then API returns 401 Unauthorized with generic error.
2. Given a non-existent email, When POST /api/auth/login, Then API returns 401 Unauthorized with generic error.

---

### User Story 3 - Refresh access token (Priority: P2)

As a User, I can exchange a valid refresh token for a new access token to maintain session.

**Why this priority**: Session continuity without re-authentication.

**Independent Test**: Use valid refresh token to call POST /api/auth/refresh; expect new access token and rotated refresh token.

**Acceptance Scenarios**:

1. Given a valid, unrevoked refresh token, When POST /api/auth/refresh, Then API returns 200 with new AccessToken and rotates RefreshToken.
2. Given a revoked or expired refresh token, When POST /api/auth/refresh, Then API returns 401 and does not issue new tokens.

---

### Edge Cases

- Throttling after N failed attempts to mitigate brute-force.
- Inactive user (IsActive = false) cannot log in; returns 401.
- Password reset required flag (if present) blocks login until completed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate via email and password at `POST /api/auth/login`.
- **FR-002**: On success, System MUST return an AccessToken (JWT) exp ≈15 minutes and persist a RefreshToken with exp ≈7 days.
- **FR-003**: System MUST persist refresh tokens hashed at rest with expiry and revocation metadata.
- **FR-004**: System MUST validate AccessToken on protected endpoints and enforce RBAC server-side.
- **FR-005**: System MUST return 401 for invalid credentials without revealing which field is wrong.
- **FR-006**: System MUST include claims: `sub` (UserId GUID), `iat`, `exp`, `jti`. It SHOULD include `roles` or `roleId` for caching but enforce authZ via DB.
- **FR-007**: System MUST emit ActivityLogs for login success and failure with correlation id.
- **FR-008**: System MUST support refresh at `POST /api/auth/refresh` with rotation and family tracking.

### Clarifications Resolved

- Hashing Algorithm: Use BCrypt (per user rule) with strong cost factor.
- JWT Claims: Include `sub` (UserId GUID), `iat`, `exp`, `jti`, `email`, and `roleId` (per user rule); authorization enforced server-side.
- Users Schema: Use Constitution-standard TitleCase with `Id UUID` PK and prescribed columns.

### Key Entities *(include if feature involves data)*

- **Users**: Id (UUID), Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt, UpdatedAt, IsDeleted, DeletedAt.
- **RefreshTokens**: Id (UUID), UserId, TokenHash, ExpiresAt, RevokedAt, CreatedAt.
- **Roles**: Id, Name; via UserRoles for assignment.
- **ActivityLogs**: Id, ActorUserId, EntityType="Auth", ActivityTypeId, Message, CorrelationId, CreatedAt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of valid logins complete in <300ms p95 (excluding network).
- **SC-002**: 100% of protected endpoints reject missing/invalid tokens with 401/403.
- **SC-003**: 0 plaintext secrets; 100% tokens signed and validated.
- **SC-004**: Audit entries present for 100% of login success/failure events.

