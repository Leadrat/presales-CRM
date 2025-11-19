# Tasks: RBAC Middleware

**Input**: Design documents from `/specs/005-rbac-middleware/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not mandated in spec. Add only minimal integration/unit tests where noted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 (from spec.md)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create folders, scaffolds, and service interfaces used by all stories

- [ ] T001 [P] Create Authorization requirement class in backend/Authorization/Requirements/OwnershipRequirement.cs
- [ ] T002 [P] Create Authorization handler in backend/Authorization/Handlers/OwnershipHandler.cs
- [ ] T003 [P] Create ownership attribute in backend/Authorization/Attributes/OwnedByAttribute.cs
- [ ] T004 [P] Create policy constants in backend/Authorization/Policies.cs
- [ ] T005 [P] Create current user service interface in backend/Services/ICurrentUserService.cs
- [ ] T006 [P] Implement current user service in backend/Services/CurrentUserService.cs (reads `sub` and `role` from claims)
- [ ] T007 [P] Create IOwnedEntity interface with `Guid CreatedBy` in backend/Models/Interfaces/IOwnedEntity.cs
- [ ] T008 [P] Create ownership specifications/extensions in backend/Data/Specifications/OwnershipSpecifications.cs (IQueryable extensions for list filtering)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire DI, implement core RBAC logic, establish standard responses

- [ ] T009 Register RBAC services in backend/Program.cs (AddAuthorization, add handler DI, add CurrentUserService DI)
- [ ] T010 Implement OwnedByAttribute parsing route id param and storing metadata in HttpContext.Items (backend/Authorization/Attributes/OwnedByAttribute.cs)
- [ ] T011 Implement OwnershipRequirement (backend/Authorization/Requirements/OwnershipRequirement.cs)
- [ ] T012 Implement OwnershipHandler core logic (backend/Authorization/Handlers/OwnershipHandler.cs): Admin bypass; load entity by id via DbContext using attribute metadata; evaluate `CreatedBy == sub`
- [ ] T013 Return codes contract (backend/Authorization/Handlers/OwnershipHandler.cs): 401 if unauthenticated/invalid sub; 404 if entity not found (security posture); 403 if entity exists but not owned
- [ ] T014 Add denial logging with correlation id, user id, role, action, and resource id when available (backend/Authorization/Handlers/OwnershipHandler.cs)
- [ ] T015 Implement IQueryable ownership filter extensions: `ApplyOwnershipFilter<T>(IQueryable<T>, Guid? userId, string role)` (backend/Data/Specifications/OwnershipSpecifications.cs)
- [ ] T016 Add XML summary comments documenting 401/403/404 behaviors to OwnedByAttribute and OwnershipHandler (backend/Authorization/*)

**Checkpoint**: RBAC policy and list filtering utilities ready. Controllers can start adopting attribute and repository/spec usage.

---

## Phase 3: User Story 1 - Admin can access any protected resource (Priority: P1) 🎯 MVP

**Goal**: Admin requests are always authorized regardless of ownership

**Independent Test**: With an Admin JWT, any action decorated with the RBAC attribute succeeds without ownership check

### Implementation for User Story 1

- [ ] T017 [US1] Ensure handler short-circuits success when role == Admin (backend/Authorization/Handlers/OwnershipHandler.cs)
- [ ] T018 [US1] Add unit test for Admin bypass in tests/Unit/OwnershipHandlerTests.cs

**Checkpoint**: Admin bypass validated.

---

## Phase 4: User Story 2 - Basic users can only access their own records (Priority: P1)

**Goal**: Basic users access only entities where `CreatedBy == sub`; lists show only owned rows

**Independent Test**: With a Basic JWT, non-owned single-resource returns 403; lists only contain owned records

### Implementation for User Story 2

- [ ] T019 [US2] Enforce `CreatedBy == sub` in OwnershipHandler for single-resource endpoints (backend/Authorization/Handlers/OwnershipHandler.cs)
- [ ] T020 [US2] Implement `ApplyOwnershipFilter` to include only owned rows for Basic, bypass for Admin (backend/Data/Specifications/OwnershipSpecifications.cs)
- [ ] T021 [US2] Document usage in specs/005-rbac-middleware/quickstart.md (examples for list and single-resource)

**Checkpoint**: Basic ownership enforcement complete.

---

## Phase 5: User Story 3 - Ownership enforcement on write operations (Priority: P2)

**Goal**: Basic users can update/delete only their own records; Admin can modify any

**Independent Test**: Basic PATCH/DELETE non-owned → 403; owned → success

### Implementation for User Story 3

- [ ] T022 [US3] Ensure OwnershipHandler covers PUT/PATCH/DELETE with same logic as GET (backend/Authorization/Handlers/OwnershipHandler.cs)
- [ ] T023 [US3] On create endpoints, set `CreatedBy = sub` server-side and ignore client-supplied value (verify in relevant controllers when integrating)

**Checkpoint**: Write-path ownership rules enforced.

---

## Phase 6: User Story 4 - Transparent integration with controllers (Priority: P2)

**Goal**: Minimal controller changes using attribute-driven enforcement

**Independent Test**: Controller action decorated with attribute returns 403 for non-owned access without action code changes

### Implementation for User Story 4

- [ ] T024 [US4] Provide attribute usage examples and guidance in specs/005-rbac-middleware/quickstart.md
- [ ] T025 [US4] Add `OwnedByAttribute` overloads to support common id parameter names ("id", "dealId", etc.) (backend/Authorization/Attributes/OwnedByAttribute.cs)

**Checkpoint**: Controllers adopt attribute with minimal changes.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Add structured logging scopes and correlation id propagation notes in specs/005-rbac-middleware/quickstart.md
- [ ] T027 [P] Validate added latency <5ms median in development (temporary timing logs) and document in research.md
- [ ] T028 Review and update specs/005-rbac-middleware/contracts/README.md with final 401/403/404 examples
- [ ] T029 Validate security posture: confirm 404 for not-found and 403 for not-owned across sample endpoints (manual test notes)

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion — BLOCKS all user stories
- US1 (P1): Depends on Foundational
- US2 (P1): Depends on Foundational (independent of US1)
- US3 (P2): Depends on Foundational (independent of US1/US2)
- US4 (P2): Depends on Foundational (independent of US1/US2/US3)
- Polish: Depends on desired stories completed

### Within Each User Story

- Admin bypass (US1) can be validated with unit tests
- Ownership enforcement (US2, US3) validated with targeted tests or manual checks

### Parallel Opportunities

- [P] tasks in Phase 1 can run concurrently (different files)
- US1, US2, US3, US4 can proceed in parallel after Phase 2 if staffed

## Implementation Strategy

- MVP first: Complete Phase 1 → Phase 2 → US1; validate Admin bypass end-to-end
- Incremental: Add US2 (ownership on read), US3 (ownership on write), US4 (ergonomic integration) in any order
