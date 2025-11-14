# Research & Decisions — A1 JWT Authentication Setup

## Decision: Token Algorithm (HS256 vs RS/ES)
- Chosen: HS256 (MVP)
- Rationale: Simpler key management and faster to implement for single service.
- Alternatives: RS256/ES256 enable key rotation and trust delegation across services.
- Follow-up: Plan upgrade to RS256 with `kid` header and rotating keys in Phase N.

## Decision: JWT Claims Shape
- Chosen: `sub` (UserId GUID), `iat`, `exp`, `jti`, `email`, `roleId`
- Rationale: Matches user request; convenient UI caching. Authorization still enforced server-side.
- Alternatives: Minimal claims with `roles[]` only; no email to reduce PII exposure.
- Safeguards: Avoid logging tokens/PII; keep expiration short; consider moving to `roles[]` later.

## Decision: Token Storage (Frontend)
- Chosen: HTTP-only secure cookie for refresh; access token in memory.
- Alternatives: localStorage (higher XSS risk), both cookies (CSRF mitigations required).
- Safeguards: SameSite=Lax/Strict, CSRF token for state-changing requests if needed.

## Decision: Password Hashing
- Chosen: BCrypt (as specified)
- Alternatives: Argon2id (constitution-preferred) pending environment verification.
- Safeguards: Use strong cost factor; enforce breach checks; never store plaintext.

## Decision: Database Schema Field Names
- Chosen: Constitution-conformant TitleCase with GUID PKs.
  - Users(Id, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
  - RefreshTokens(Id, UserId, TokenHash, ExpiresAt, RevokedAt, CreatedAt)
- Rationale: Align with constitution; Token is stored as hash → `TokenHash`.
- Mapping: Spec input that mentions `UserId`, `TokenId`, `Token` is normalized to above.

## Decision: Logout Behavior
- Chosen: `POST /api/auth/logout` revokes current refresh token (and token family optional).
- Rationale: Immediate session invalidation.

## Decision: Rate Limiting & Lockouts
- Chosen: Throttle failed logins with exponential backoff per IP+Email. Optional temporary lockouts.
- Rationale: Brute-force mitigation.

