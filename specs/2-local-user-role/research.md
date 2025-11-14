# Research — A2 Local User & Role

## Decisions

- Decision: Use uuid-ossp `uuid_generate_v4()` for GUID PKs
  - Rationale: Matches environment preference and user request
  - Alternatives: pgcrypto `gen_random_uuid()` (requires extension install)

- Decision: Enforce case-insensitive email uniqueness for non-deleted users via partial unique index on `lower(Email)` with `WHERE IsDeleted = FALSE`
  - Rationale: Allows re-registration after soft-delete; prevents duplicates among active users; matches clarified AC
  - Alternatives: Unique across all rows (prevents re-registration), app-only enforcement (error-prone)

- Decision: Store and compare emails in lowercase
  - Rationale: Prevents casing duplicates; simplifies lookups
  - Alternatives: Preserve case and compare case-insensitively only

- Decision: Do not issue tokens on signup; require explicit login
  - Rationale: Cleaner security boundaries; better audit trail
  - Alternatives: Auto-login on signup (complexity, risk)

- Decision: Disallow client `RoleId` on signup; always assign Basic
  - Rationale: Avoids privilege escalation; admin-only role changes
  - Alternatives: Allow RoleId with allowlist

- Decision: Password policy — min 8 chars, ≥1 letter and ≥1 number
  - Rationale: Baseline security with minimal UX friction
  - Alternatives: Weaker (6 chars), Stronger (12+ with classes), zxcvbn-based

- Decision: HTTP status for duplicate email is 409 Conflict
  - Rationale: Resource conflict matches REST semantics and existing A1 style
  - Alternatives: 400 Bad Request (less specific)

## Notes

- Column sizing per user request:
  - Users.FullName VARCHAR(100) NOT NULL
  - Users.Email VARCHAR(100) NOT NULL (stored lowercase)
  - Users.PasswordHash VARCHAR(255) NOT NULL
  - Users.Phone VARCHAR(15) NULL
- Timestamps use TIMESTAMPTZ with DEFAULT now()
