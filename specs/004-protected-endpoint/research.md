# Research — Spec 4: Protected Endpoint (GET /api/me)

## Decisions

- Decision: User id claim = `sub`
  - Rationale: Standard JWT subject; consistent with many libraries
  - Alternatives: `uid` custom claim

- Decision: Soft-deleted or inactive user → 401 `UNAUTHORIZED`
  - Rationale: Avoid revealing account state; uniform failure handling
  - Alternatives: 403 `FORBIDDEN` (rejected for information leakage)

- Decision: Response shape = `{ id, email, role }` only
  - Rationale: Minimal exposure; extensible later without breaking clients
  - Alternatives: Include full profile payload

- Decision: Validate token via existing HS256 settings (`Jwt:Secret`, `Issuer`, `Audience`)
  - Rationale: Reuse existing Program.cs configuration

## Implementation notes

- Extract `sub` from token; parse as Guid; fetch user by Id; ensure `!IsDeleted && IsActive`.
- If token invalid/expired → 401 with code `UNAUTHORIZED` or `TOKEN_EXPIRED`.
