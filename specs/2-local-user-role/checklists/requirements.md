# Spec A2 — Requirements Checklist

## Content Quality
- [ ] Scope defined: Users and Roles tables with FK, signup endpoint
- [ ] Out-of-scope noted: role assignment beyond Basic on signup
- [ ] Data model documented with SQL and indexes
- [ ] API contract specified for POST /api/auth/signup
- [ ] Clarifications recorded (email normalization, role handling, tokens, password policy, soft-deletes)

## Functional Completeness
- [ ] Roles table: GUID PK, Name UNIQUE, timestamps
- [ ] Users table: GUID PK, Email TEXT, PasswordHash, RoleId FK, soft-delete fields
- [ ] Case-insensitive email uniqueness via partial unique index on lower(Email) where IsDeleted = FALSE
- [ ] Basic role default on signup; client RoleId ignored
- [ ] Password policy: min 8, >=1 letter, >=1 number
- [ ] Signup returns 200 with { id, email } only; no tokens
- [ ] Seed Admin and Basic roles (fixed GUIDs)
- [ ] Seed two users with bcrypt hashes (placeholders replaced in migration/seed)

## Security & Compliance
- [ ] Use Identity PasswordHasher<User> (BCrypt) for hashing
- [ ] No plaintext password logging
- [ ] JWT setup leveraged from A1; signup does not auto-login
- [ ] No enums/jsonb; relational only

## Observability & Ops
- [ ] Activity logging integrated for signup event
- [ ] CorrelationId middleware in place
- [ ] Migration applies cleanly in fresh DB

## Testability
- [ ] Duplicate email (case variants) → 409 EMAIL_EXISTS
- [ ] Deleted user email can re-register successfully
- [ ] Weak password rejected per policy
- [ ] Role defaults to Basic on signup
- [ ] Timestamps stored in UTC
