# Tasks — Spec 4: Protected Endpoint (GET /api/me)

## Phase 1 — Setup

- [ ] T001 Ensure JWT bearer auth is configured in backend/Program.cs (reuse existing Jwt settings)
- [ ] T002 Verify Roles seeded and Users table available (Spec A2) backend/Migrations/

## Phase 2 — Foundational

- [ ] T003 Create MeController with route prefix api/me backend/Controllers/MeController.cs
- [ ] T004 Wire [Authorize] attribute and JWT scheme on GET /api/me backend/Controllers/MeController.cs

## Phase 3 — [US1] Access my profile (P1)

Goal: Authenticated user with valid token gets `{ id, email, role }`.
Independent test: With valid Authorization: Bearer <token>, returns 200 and profile.

- [ ] T005 [US1] Extract `sub` claim (Guid) from JWT in controller backend/Controllers/MeController.cs
- [ ] T006 [US1] Query DB for user by Id ensuring `!IsDeleted && IsActive` backend/Controllers/MeController.cs
- [ ] T007 [US1] Join/resolve role name from Roles table backend/Controllers/MeController.cs
- [ ] T008 [US1] Return 200 `{ data: { id, email, role } }` backend/Controllers/MeController.cs
- [ ] T009 [P] [US1] Add OpenAPI contract for GET /api/me specs/004-protected-endpoint/contracts/me.yaml

## Phase 4 — [US2] Unauthorized access handling (P2)

Goal: Missing/invalid/expired token → 401.
Independent test: No/invalid token returns 401 with error code.

- [ ] T010 [US2] Map validation failures to 401 `UNAUTHORIZED` by default Program.cs
- [ ] T011 [P] [US2] Ensure 401 response documented in me.yaml specs/004-protected-endpoint/contracts/me.yaml

## Phase 5 — [US3] Soft-deleted/inactive accounts (P3)

Goal: Tokens for deleted/inactive users return 401.
Independent test: Soft-delete a user; call /api/me; returns 401 `UNAUTHORIZED`.

- [ ] T012 [US3] If user not found/IsDeleted/!IsActive → return 401 `UNAUTHORIZED` backend/Controllers/MeController.cs
- [ ] T013 [P] [US3] Document this case in me.yaml specs/004-protected-endpoint/contracts/me.yaml

## Phase 6 — Polish & Docs

- [ ] T014 Add quickstart with curl examples specs/004-protected-endpoint/quickstart.md
- [ ] T015 Add acceptance scenarios as checklist (optional) specs/004-protected-endpoint/spec.md

## Dependencies

- US1 depends on Setup and Foundational.
- US2 leverages Program.cs JWT pipeline; can be refined in parallel with US1.
- US3 depends on US1 DB lookup pattern.

## Parallel Opportunities

- T009, T011, T013 (contracts/docs) parallel to controller work.

## Implementation Strategy (MVP-first)

- Implement MeController returning `{ id, email, role }` for valid tokens.
- Ensure 401 for all invalid/expired/soft-deleted/inactive conditions.
