---

description: "Task list for A1: JWT Authentication Setup"
---

# Tasks: JWT Authentication Setup (A1)

**Input**: Design documents from `/specs/1-jwt-auth-setup/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/auth.yaml, research.md

**Tests**: Only include if requested. This feature does not explicitly require TDD; include minimal verification tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create folder structure per plan in specs/1-jwt-auth-setup/
- [ ] T002 [P] Add backend project references for JWT + BCrypt in backend/src/
- [ ] T003 [P] Configure environment variables in backend/src/appsettings.json and appsettings.Development.json
- [ ] T004 [P] Add frontend env keys (NEXT_PUBLIC_API_URL) in frontend/.env.local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infra required before any user story work

- [ ] T005 Setup PostgreSQL connection and migrations in backend/src/
- [ ] T006 [P] Add Users and RefreshTokens migrations per data-model.md in backend/src/migrations/
- [ ] T007 [P] Seed ActivityTypes (Authenticated) in backend/src/migrations/
- [ ] T008 Implement JWT service (HS256, 15m) in backend/src/services/JwtService.cs
- [ ] T009 Implement BCrypt hashing service in backend/src/services/PasswordHasher.cs
- [ ] T010 Add middleware for Correlation-Id in backend/src/middleware/CorrelationIdMiddleware.cs
- [ ] T011 Setup authz policy scaffold in backend/src/config/AuthPolicies.cs
- [ ] T012 [P] Create API error response shape in backend/src/middleware/ErrorHandlerMiddleware.cs
- [ ] T013 [P] Frontend auth client utilities in frontend/src/services/authClient.ts

**Checkpoint**: Foundation ready — endpoints can be implemented and tested

---

## Phase 3: User Story 1 — Login with valid credentials (Priority: P1) 🎯 MVP

**Goal**: Users can log in and receive access + refresh tokens
**Independent Test**: POST /api/auth/login with valid credentials → 200 with tokens; protected route accepts access token

### Implementation

- [ ] T014 [P] [US1] Create LoginRequest/Response DTOs in backend/src/api/auth/models/
- [ ] T015 [US1] Implement POST /api/auth/login in backend/src/api/auth/AuthController.cs
- [ ] T016 [US1] Persist hashed refresh token in backend/src/repositories/RefreshTokenRepository.cs
- [ ] T017 [US1] Emit ActivityLogs on success/failure in backend/src/services/ActivityLogService.cs
- [ ] T018 [US1] Add protected sample endpoint (GET /api/ping/secure) in backend/src/api/ping/PingController.cs
- [ ] T019 [P] [US1] Frontend login form in frontend/src/app/login/page.tsx
- [ ] T020 [P] [US1] Frontend auth state + token handling in frontend/src/state/authStore.ts
- [ ] T021 [US1] Frontend call login API and store tokens (cookie+memory) in frontend/src/services/authClient.ts

### Optional Tests (if requested)

- [ ] T022 [P] [US1] Backend integration test login in backend/tests/integration/Auth_Login_Tests.cs
- [ ] T023 [P] [US1] E2E login flow in frontend/tests/e2e/auth.spec.ts

**Checkpoint**: User Story 1 independently functional and testable

---

## Phase 4: User Story 2 — Invalid credentials (Priority: P1)

**Goal**: System rejects invalid credentials with 401
**Independent Test**: Wrong email/password → 401 Unauthorized, no tokens created

### Implementation

- [ ] T024 [US2] Return 401 with standard error shape in backend/src/api/auth/AuthController.cs
- [ ] T025 [US2] Throttle repeated failures (per IP+Email) in backend/src/middleware/RateLimitMiddleware.cs
- [ ] T026 [P] [US2] Frontend display error and do not persist any token in frontend/src/app/login/page.tsx

### Optional Tests (if requested)

- [ ] T027 [P] [US2] Backend integration test invalid login in backend/tests/integration/Auth_Invalid_Tests.cs

**Checkpoint**: User Stories 1 and 2 independently functional

---

## Phase 5: User Story 3 — Refresh access token (Priority: P2)

**Goal**: Valid refresh token yields new access token; rotation enforced
**Independent Test**: POST /api/auth/refresh → 200 with new tokens; revoked/expired → 401

### Implementation

- [ ] T028 [P] [US3] Implement POST /api/auth/refresh in backend/src/api/auth/AuthController.cs
- [ ] T029 [US3] Rotate refresh token and revoke old in backend/src/repositories/RefreshTokenRepository.cs
- [ ] T030 [US3] Add token validation middleware for protected routes in backend/src/middleware/JwtValidationMiddleware.cs
- [ ] T031 [P] [US3] Frontend auto-refresh flow in frontend/src/services/authClient.ts

### Optional Tests (if requested)

- [ ] T032 [P] [US3] Backend integration test refresh in backend/tests/integration/Auth_Refresh_Tests.cs

**Checkpoint**: User Stories 1–3 functional and independently testable

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T033 Add logout endpoint POST /api/auth/logout revoking current token in backend/src/api/auth/AuthController.cs
- [ ] T034 [P] Frontend logout action and redirect in frontend/src/services/authClient.ts
- [ ] T035 Security hardening: ensure tokens never logged; add HSTS config in backend/src/Program.cs
- [ ] T036 Observability: structured logs and correlation across auth flows in backend/src/
- [ ] T037 Documentation updates in docs/

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup → Foundational → User Stories → Polish
- User stories can proceed after Foundational is completed

### User Story Dependencies
- US1: None beyond Foundational
- US2: None beyond Foundational
- US3: Depends on US1 (refresh relies on login-issued token families)

### Within Each User Story
- Models → Services → Endpoints → Frontend integration
- Optional tests before implementation if TDD requested

### Parallel Opportunities
- [P] tasks in Setup/Foundational (T002–T004, T006–T007, T012–T013)
- Frontend tasks can proceed in parallel with backend routes once contracts are fixed (T019–T021, T031, T034)
- Tests marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup + Foundational
2. Implement US1 login (backend + sample protected route + minimal frontend)
3. Validate and demo

### Incremental Delivery
1. Add US2 invalid flows (401) and throttling
2. Add US3 refresh and auto-refresh
3. Add logout + polish
