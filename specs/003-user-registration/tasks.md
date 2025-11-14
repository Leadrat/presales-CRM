# Tasks — Spec 3: User Registration with Domain Restriction

## Phase 1 — Setup

- [ ] T001 Add config key `Signup:AllowedDomains` to backend/appsettings.Development.json
- [ ] T002 Bind options class `SignupOptions` (Signup:AllowedDomains) and register in DI backend/Program.cs
- [ ] T003 Document env var override `Signup__AllowedDomains` in README quickstart specs/003-user-registration/quickstart.md

## Phase 2 — Foundational

- [ ] T004 Ensure Users/Roles schema/index present from Spec A2 (verify migration applied) backend/Migrations/
- [ ] T005 Verify Basic role exists (GUID e452a2c7-2388-4a6e-bd38-5e7b03f34d9d) via seed or DB check backend/Migrations/
- [ ] T006 Confirm password policy baseline documented in spec and contract specs/003-user-registration/contracts/signup.yaml

## Phase 3 — [US1] Register with allowed company email (P1)

Goal: Users on allowed domains can sign up and receive 200 with id/email.
Independent test: `user@leadrat.com` with allowlist containing `leadrat.com` returns 200 with id/email.

- [ ] T007 [US1] Parse allowlist from options (CSV → HashSet) backend/Controllers/AuthController.cs
- [ ] T008 [US1] Validate domain is in allowlist (case-insensitive) backend/Controllers/AuthController.cs
- [ ] T009 [US1] Normalize email to lowercase before checks/persist backend/Controllers/AuthController.cs
- [ ] T010 [US1] Persist user with Basic role; return `{ data: { id, email } }` backend/Controllers/AuthController.cs
- [ ] T011 [P] [US1] Add OpenAPI response example 200 in contracts/signup.yaml specs/003-user-registration/contracts/signup.yaml

## Phase 4 — [US2] Block disallowed personal domains (P2)

Goal: Disallowed domains are rejected.
Independent test: `user@gmail.com` → 403 DOMAIN_NOT_ALLOWED.

- [ ] T012 [US2] Return 403 `{ error: { code: DOMAIN_NOT_ALLOWED } }` for disallowed domains backend/Controllers/AuthController.cs
- [ ] T013 [US2] When allowlist empty/missing, deny all with 403 backend/Controllers/AuthController.cs
- [ ] T014 [P] [US2] Add 403 error response to OpenAPI contract specs/003-user-registration/contracts/signup.yaml

## Phase 5 — [US3] Default role assignment (P3)

Goal: New users get Basic role; client role ignored.
Independent test: RoleId is Basic; any client-supplied role is ignored.

- [ ] T015 [US3] Resolve Basic role by name; ignore any client role fields backend/Controllers/AuthController.cs
- [ ] T016 [P] [US3] ActivityLog `UserCreated` emitted on success backend/Controllers/AuthController.cs

## Phase 6 — [US4] Password hashing and policy enforcement (P2)

Goal: Enforce baseline policy and hash with BCrypt.
Independent test: Weak password → 400 WEAK_PASSWORD; strong password → hashed stored.

- [ ] T017 [US4] Enforce baseline policy (>=8, >=1 letter, >=1 number) backend/Controllers/AuthController.cs
- [ ] T018 [US4] Hash with Identity PasswordHasher<User> before insert backend/Controllers/AuthController.cs
- [ ] T019 [P] [US4] Add 400 error response to OpenAPI contract specs/003-user-registration/contracts/signup.yaml

## Phase 7 — Polish & Docs

- [ ] T020 Update quickstart with allowlist config and sample curl specs/003-user-registration/quickstart.md
- [ ] T021 Add acceptance scenarios to spec as checklist (optional) specs/003-user-registration/spec.md
- [ ] T022 Add Postman collection snippet (optional) specs/003-user-registration/quickstart.md

## Dependencies

- US1 depends on Setup and Foundational.
- US2 depends on US1 validation plumbing.
- US3 can run in parallel with US1 after basic persistence exists.
- US4 can run in parallel with US1 validation changes but must be in same endpoint implementation.

## Parallel Opportunities

- T011, T014, T019 (contract/docs) can be done in parallel to controller work.
- T016 activity log in parallel once T010 is in place (same file caution).

## Implementation Strategy (MVP-first)

- Configure allowlist to `leadrat.com` for MVP.
- Implement controller validations and responses.
- Update OpenAPI contract, quickstart; verify with two curls: allowed vs disallowed.
