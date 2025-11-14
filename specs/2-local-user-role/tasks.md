# Tasks — A2 Local User Record & Role Link

## Phase 1 — Setup

- [ ] T001 Ensure connection string via User Secrets for backend (backend/appsettings.json or user-secrets)
- [ ] T002 Install EF Core tools locally (`dotnet tool install --global dotnet-ef`) [Doc]

## Phase 2 — Foundational

- [ ] T003 Add property constraints in DbContext (Email 100, PasswordHash 255, FullName 100, Phone 15) in backend/AppDbContext.cs
- [ ] T004 Ensure User model has Phone property in backend/Models/User.cs
- [ ] T005 Keep Roles.Name unique and length 50 in backend/AppDbContext.cs

## Phase 3 — [US1] Signup user (P1)

Goal: As a visitor, I can sign up and get a user record linked to the Basic role.
Independent test: Duplicate email (any case) → 409; valid signup → 200 with id/email; no tokens returned.

- [ ] T006 [US1] Normalize email to lowercase in signup flow backend/Controllers/AuthController.cs
- [ ] T007 [US1] Enforce password policy (>=8, >=1 letter, >=1 number) backend/Controllers/AuthController.cs
- [ ] T008 [US1] Disallow client RoleId; resolve Basic by name backend/Controllers/AuthController.cs
- [ ] T009 [US1] Duplicate check among non-deleted users (case-insensitive) backend/Controllers/AuthController.cs
- [ ] T010 [US1] Return { data: { id, email } } without tokens backend/Controllers/AuthController.cs
- [ ] T011 [P] [US1] Activity log "UserCreated" on signup backend/Controllers/AuthController.cs

## Phase 4 — [US2] Database schema & seed (P1)

Goal: Roles and Users tables exist with correct constraints; seeds created; partial unique index in place.
Independent test: Migrations apply cleanly; Roles Admin/Basic exist; index prevents duplicate active emails.

- [ ] T012 [US2] Generate EF migration A2_UsersAndRoles backend/Migrations/
- [ ] T013 [US2] Add `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in migration Up() backend/Migrations/*.cs
- [ ] T014 [US2] Create Roles table (Id uuid_generate_v4, Name varchar(50) unique, Description, IsActive, CreatedAt, UpdatedAt) backend/Migrations/*.cs
- [ ] T015 [US2] Create Users table (Id uuid_generate_v4, FullName varchar(100) not null, Email varchar(100) not null, PasswordHash varchar(255), Phone varchar(15), RoleId uuid FK, IsActive, CreatedAt, UpdatedAt, IsDeleted, DeletedAt) backend/Migrations/*.cs
- [ ] T016 [US2] Create index IX_Users_RoleId backend/Migrations/*.cs
- [ ] T017 [US2] Add partial unique index on lower(Email) where IsDeleted = FALSE (raw SQL) backend/Migrations/*.cs
- [ ] T018 [P] [US2] Seed Roles with fixed GUIDs (Admin 7d61b152-87f3-4a7e-9c35-7a83c43bfb21; Basic e452a2c7-2388-4a6e-bd38-5e7b03f34d9d) backend/Migrations/*.cs
- [ ] T019 [P] [US2] Seed two demo users (admin@leadrat.com → Admin; user@leadrat.com → Basic) backend/Migrations/*.cs
- [ ] T020 [US2] Apply migration to database (`dotnet ef database update`) backend/

## Phase 5 — Polish & Docs

- [ ] T021 Update quickstart.md with exact migration name specs/2-local-user-role/quickstart.md
- [ ] T022 Add plain table summary to spec (if changed) specs/2-local-user-role/spec.md
- [ ] T023 Add OpenAPI example response for 409 in contracts/signup.yaml specs/2-local-user-role/contracts/signup.yaml

## Dependencies

- US1 depends on Foundational (Phase 2) being complete.
- US2 (schema/seed) must be applied before fully validating US1 in a real DB.

## Parallel Opportunities

- T011 can run in parallel with T006–T010 (same file caution; ideally in a single PR commit).
- T018 and T019 can be prepared in parallel after T014–T15, but both depend on tables existing.

## Implementation Strategy (MVP-first)

- Implement US1 controller changes behind a feature branch.
- Scaffold migration and apply in dev DB.
- Verify with quick smoke tests (signup success, duplicate 409, weak password 400).
