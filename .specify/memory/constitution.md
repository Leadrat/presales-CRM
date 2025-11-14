<!--
Sync Impact Report
Version change: N/A → 1.0.0
Modified principles: N/A → Simplicity; Auditability; Testability; Extensibility; Security & RBAC
Added sections: Specification Framework (1–13); Appendices (Schemas, Sample Data, Standards)
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md → ✅ Constitution Check aligns (no change needed)
  - .specify/templates/spec-template.md → ✅ Acceptance criteria + testing align
  - .specify/templates/tasks-template.md → ✅ Checkpoints present per milestone
  - .specify/templates/agent-file-template.md → ✅ Generic, no updates needed
  - .specify/templates/checklist-template.md → ✅ Generic, no updates needed
Follow-up TODOs:
  - TODO(SecurityAlgo): Confirm Argon2id availability in deployment environment; fallback PBKDF2 params.
-->

# Pre-Sales CRM Constitution

## Core Principles

### I. Simplicity
MUST favor small, composable modules and straightforward flows. Endpoints and services
adhere to single responsibility. Avoid premature abstractions; prefer additive evolution.
Rationale: Simple systems are easier to ship, test, and maintain.

### II. Auditability
Every material action emits an immutable ActivityLog with actor, entity, type, and
correlation. Entity tables use soft deletes only (IsDeleted, DeletedAt). Rationale:
Trust and compliance require complete forensic visibility.

### III. Testability
Specs mandate Unit, Integration, and (where relevant) E2E tests. Contracts are versioned
and snapshotted. CI blocks on minimum coverage of critical paths. Rationale: Prevent
regressions and enable safe iteration.

### IV. Extensibility
GUID primary keys. No JSONB or enums—use relational lookup tables. Prefer additive,
backward-compatible changes. Rationale: Future-proof, schema-governed evolution.

### V. Security & RBAC
JWT-based auth with short-lived access tokens and rotating refresh tokens. RBAC enforced
server-side on all endpoints. Principle of least privilege; secrets managed securely.
Rationale: Protect users, data, and reputation.

## Specification Framework

### 1) Project Overview
- Name: Pre-Sales CRM
- Purpose: Manage presales lifecycle across Accounts, Contacts, Demos, and Team roles.
- Tech Stack: Next.js (frontend), .NET Core C# REST APIs (backend), PostgreSQL (DB),
  JWT-based authentication (no Microsoft Identity/Azure AD).

### 2) Spec Hierarchy
- Phases A–N (A=Auth, B=RBAC, C=Accounts, D=Contacts, E=Demos, F=Activity Logs,
  G=Dashboard, H=Integrations, I=Notifications, J=Search, K=Files, L=Audit,
  M=Settings, N=DevOps/Observability).
- Numbering: A1, A2, B1, ...; files: /specs/A_Auth_UserMgmt.md, etc.
- Each spec carries version vMAJOR.MINOR.PATCH.

### 3) Phase Structure (A–N)
- A: Authentication & User Management — JWT issuance, refresh rotation, password policies.
- B: RBAC & Team Roles — Roles, permissions, teams, membership, policy enforcement.
- C: Accounts — Account CRUD, ownership, segmentation, lifecycle.
- D: Contacts — Contact CRUD, associations, deduplication.
- E: Demos — Planning, scheduling, outcomes, participants.
- F: Activity Logs — Auditable events, correlation, reporting hooks.
- G: Dashboard & Reporting — Metrics, widgets, filters, saved views.
- H: Integrations — Email/calendar hooks, webhooks, import/export.
- I: Notifications — In-app/email, digests, preferences.
- J: Search — Server-driven search, filters, pagination.
- K: Files & Attachments — Secure upload, scanning, linking.
- L: Audit & Compliance — Retention, legal holds, PII, access reviews.
- M: Settings & Configuration — System settings, lookups, feature flags.
- N: DevOps & Observability — CI/CD, logs/metrics/traces, SLOs, runbooks.

### 4) Reusable Spec Template
Use this template for each spec (e.g., /specs/A_Auth_UserMgmt.md):

```markdown
# [PHASE_CODE] [Spec Name] — v[MAJOR.MINOR.PATCH]

## What & Why
- What:
- Why:

## Scope
- In-scope:
- Out-of-scope:

## Personas
- Primary:
- Secondary:

## Inputs
- API Inputs:
- UI Inputs:
- System Inputs (events, jobs):

## Outputs
- API Responses:
- UI State:
- Events/Logs/Side-effects:

## Data Model
- Tables:
  - [TableName]: columns, FKs, indexes
- Lookups:
  - [LookupName]: values managed in-app (no enums/JSONB)

## API Contract
- Endpoints:
  - [METHOD] /api/[resource]
  - Request/Response schemas
- Error Handling:
  - Error shape and codes

## Acceptance Criteria
- [AC-1]
- [AC-2]
- [AC-3]

## Versioning
- Current: v[X.Y.Z]
- Backward compatibility:
- Change log:

## Dependencies
- Phases:
- Services:
- External integrations:

## Security
- AuthN:
- AuthZ (RBAC):
- Data protection:

## Observability
- Logs:
- Metrics:
- Traces:

## Testing Strategy
- Unit:
- Integration:
- E2E:
- Test data:

## Migration & Rollout
- Migrations:
- Backfill:
- Feature flags:
- Rollback plan:

## Risks & Mitigations
- [R-1]
- [R-2]

## JTBD Reference
- Link: [doc or ticket]
```

### 5) Database Conventions
- TitleCase for tables and columns.
- GUID PKs: Id UUID DEFAULT gen_random_uuid() or uuid_generate_v4().
- Standard columns: CreatedAt, UpdatedAt (UTC), IsDeleted, DeletedAt.
- Lookups for statuses/config (no enums/JSONB).
- Indexing: PK(Id), uniques on natural keys, filter indexes for frequent queries.
- Auditing: ActivityLogs for create/update/delete/auth events.

### 6) Versioning Rules
- vMAJOR.MINOR.PATCH per spec.
  - MAJOR: breaking external contract/governance.
  - MINOR: backward-compatible additions.
  - PATCH: fixes/clarifications.
- Log all changes in /docs/spec-log.md with date, author, spec, from→to, summary, PR.
- Module versions maintained per phase (see Appendix B).

### 7) Documentation Rules
- Structure:
  - /specs/Phase_A_Auth.md (phase overview)
  - /specs/A_Auth_UserMgmt.md (spec detail)
  - /docs/spec-log.md (changelog)
  - /docs/Project_Spec_Constitution.md (this public doc)
- Naming: [PhaseCode]_[ShortName].md
- PR checklist must reference acceptance criteria and update spec-log.

### 8) Testing Strategy
- Backend (.NET Core): Unit (xUnit/NUnit), Integration (Testcontainers Postgres),
  Contract tests, AuthZ matrix per endpoint.
- Frontend (Next.js): Unit (Jest/RTL), Integration (MSW), E2E (Playwright/Cypress).
- Data: Migration idempotency; referential integrity checks in CI.
- Observability: Assertions on structured logs and trace IDs in critical paths.

### 9) Security Constitution
- JWT: Access (≈15m) RS/ES preferred; claims: sub (UserId GUID), iat, exp, jti, roles[], ver.
- Refresh tokens: rotation; hashed at rest; expiry and RevokedAt tracked.
- Passwords: Argon2id preferred; PBKDF2 fallback with strong params; breach checks.
- RBAC: Roles → Permissions via RolePermissions; Users via UserRoles/Teams; server-side checks.
- Least privilege everywhere; secrets in secure store; HTTPS/TLS, HSTS.
- Sessions: sign-in sessions tracked with device metadata and token family.
- Audit: ActivityLogs for auth/data/permission changes.

### 10) Governance Roles
- Spec Author: drafts/maintains spec version.
- Reviewer: architecture & security review.
- QA: defines/validates acceptance criteria and tests.
- Admin: ratifies specs and constitution amendments.

### 11) Phase Execution Flow (with Milestone Check-ins)
- Idea → Draft: Create issue with JTBD and draft spec using template.
  - Check-in: Confirm scope, personas, and acceptance criteria agreement.
- Review: Architecture + Security + QA review.
  - Check-in: Resolve dependencies/risks; readiness to approve.
- Approval: Admin ratifies; set initial version v1.0.0 for new specs.
  - Check-in: Freeze contract, create implementation plan.
- Implementation: Code, migrations, tests; feature flags as needed.
  - Check-in: Mid-sprint demo to validate direction; update risks.
- Test: Unit/Integration/E2E green; QA sign-off.
  - Check-in: Go/No-Go decision for release.
- Merge & Release: Update spec-log; bump versions; enable monitoring.
  - Check-in: Post-release review; capture learnings and backlog follow-ups.

### 12) Final Notes
- First step: create /specs/A_Auth_UserMgmt.md using the template above, covering
  registration, login, refresh, logout, password reset, role assignment, and auth logs.

## Appendices

### Appendix A: Core Tables (Schemas)
```sql
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- or: uuid-ossp

CREATE TABLE DemoStatuses (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL UNIQUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ActivityTypes (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL UNIQUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Users (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Email TEXT NOT NULL UNIQUE,
  PasswordHash TEXT NOT NULL,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);

CREATE TABLE Roles (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL UNIQUE,
  Description TEXT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Permissions (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL UNIQUE,
  Description TEXT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE RolePermissions (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  RoleId UUID NOT NULL REFERENCES Roles(Id),
  PermissionId UUID NOT NULL REFERENCES Permissions(Id),
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (RoleId, PermissionId)
);

CREATE TABLE UserRoles (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  UserId UUID NOT NULL REFERENCES Users(Id),
  RoleId UUID NOT NULL REFERENCES Roles(Id),
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (UserId, RoleId)
);

CREATE TABLE Teams (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL UNIQUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);

CREATE TABLE TeamMembers (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  TeamId UUID NOT NULL REFERENCES Teams(Id),
  UserId UUID NOT NULL REFERENCES Users(Id),
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (TeamId, UserId)
);

CREATE TABLE RefreshTokens (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  UserId UUID NOT NULL REFERENCES Users(Id),
  TokenHash TEXT NOT NULL,
  ExpiresAt TIMESTAMPTZ NOT NULL,
  RevokedAt TIMESTAMPTZ NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE Accounts (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL,
  OwnerUserId UUID NULL REFERENCES Users(Id),
  Website TEXT NULL,
  Industry TEXT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);

CREATE TABLE Contacts (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  AccountId UUID NOT NULL REFERENCES Accounts(Id),
  Email TEXT NOT NULL,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  Title TEXT NULL,
  Phone TEXT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL,
  UNIQUE (AccountId, Email)
);

CREATE TABLE Demos (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  AccountId UUID NOT NULL REFERENCES Accounts(Id),
  ScheduledAt TIMESTAMPTZ NOT NULL,
  StatusId UUID NOT NULL REFERENCES DemoStatuses(Id),
  Title TEXT NOT NULL,
  Notes TEXT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);

CREATE TABLE DemoParticipants (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  DemoId UUID NOT NULL REFERENCES Demos(Id),
  ContactId UUID NULL REFERENCES Contacts(Id),
  UserId UUID NULL REFERENCES Users(Id),
  Role TEXT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ActivityLogs (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ActorUserId UUID NULL REFERENCES Users(Id),
  EntityType TEXT NOT NULL,
  EntityId UUID NULL,
  ActivityTypeId UUID NOT NULL REFERENCES ActivityTypes(Id),
  Message TEXT NOT NULL,
  CorrelationId UUID NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Appendix B: Sample Data (GUIDs)
```sql
INSERT INTO DemoStatuses (Id, Name, CreatedAt, UpdatedAt) VALUES
('11111111-1111-1111-1111-111111111111','Scheduled', now(), now()),
('22222222-2222-2222-2222-222222222222','Completed', now(), now()),
('33333333-3333-3333-3333-333333333333','Cancelled', now(), now());

INSERT INTO ActivityTypes (Id, Name, CreatedAt, UpdatedAt) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Created', now(), now()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Updated', now(), now()),
('cccccccc-cccc-cccc-cccc-cccccccccccc','Deleted', now(), now()),
('dddddddd-dddd-dddd-dddd-dddddddddddd','Authenticated', now(), now());

INSERT INTO Users (Id, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt, UpdatedAt)
VALUES
('9f1a8d0e-2c7f-4a4b-9c0f-0e1a2b3c4d5e','admin@presalescrm.io','<argon2id_hash>','System','Admin',TRUE,now(),now()),
('0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f','se@presalescrm.io','<argon2id_hash>','Sam','Engineer',TRUE,now(),now());

INSERT INTO Roles (Id, Name, Description, CreatedAt, UpdatedAt) VALUES
('44444444-4444-4444-4444-444444444444','Admin','System administrator',now(),now()),
('55555555-5555-5555-5555-555555555555','SalesEngineer','Presales engineer',now(),now());

INSERT INTO Permissions (Id, Name, Description, CreatedAt, UpdatedAt) VALUES
('66666666-6666-6666-6666-666666666666','Accounts.Read','View accounts',now(),now()),
('77777777-7777-7777-7777-777777777777','Accounts.Write','Modify accounts',now(),now()),
('88888888-8888-8888-8888-888888888888','Demos.Manage','Create and update demos',now(),now());

INSERT INTO RolePermissions (Id, RoleId, PermissionId, CreatedAt, UpdatedAt) VALUES
('99999999-9999-9999-9999-999999999999','44444444-4444-4444-4444-444444444444','66666666-6666-6666-6666-666666666666',now(),now()),
('aaaaaaaa-bbbb-cccc-dddd-eeeeffffffff','44444444-4444-4444-4444-444444444444','77777777-7777-7777-7777-777777777777',now(),now()),
('bbbbbbbb-cccc-dddd-eeee-ffff00000000','44444444-4444-4444-4444-444444444444','88888888-8888-8888-8888-888888888888',now(),now()),
('cccccccc-dddd-eeee-ffff-000000000001','55555555-5555-5555-5555-555555555555','66666666-6666-6666-6666-666666666666',now(),now()),
('dddddddd-eeee-ffff-0000-000000000002','55555555-5555-5555-5555-555555555555','88888888-8888-8888-8888-888888888888',now(),now());

INSERT INTO UserRoles (Id, UserId, RoleId, CreatedAt, UpdatedAt) VALUES
('eeeeeeee-ffff-0000-0000-000000000003','9f1a8d0e-2c7f-4a4b-9c0f-0e1a2b3c4d5e','44444444-4444-4444-4444-444444444444',now(),now()),
('ffffffff-0000-0000-0000-000000000004','0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f','55555555-5555-5555-5555-555555555555',now(),now());

INSERT INTO Teams (Id, Name, CreatedAt, UpdatedAt, IsDeleted) VALUES
('12121212-1212-1212-1212-121212121212','SE-Team',now(),now(),FALSE);

INSERT INTO TeamMembers (Id, TeamId, UserId, CreatedAt, UpdatedAt) VALUES
('13131313-1313-1313-1313-131313131313','12121212-1212-1212-1212-121212121212','0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f',now(),now());

INSERT INTO Accounts (Id, Name, OwnerUserId, Website, Industry, CreatedAt, UpdatedAt, IsDeleted)
VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','Acme Corp','9f1a8d0e-2c7f-4a4b-9c0f-0e1a2b3c4d5e','https://acme.example','Manufacturing',now(),now(),FALSE);

INSERT INTO Contacts (Id, AccountId, Email, FirstName, LastName, Title, Phone, CreatedAt, UpdatedAt, IsDeleted)
VALUES
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','jane.doe@acme.example','Jane','Doe','VP Operations','+1-555-0100',now(),now(),FALSE);

INSERT INTO Demos (Id, AccountId, ScheduledAt, StatusId, Title, Notes, CreatedAt, UpdatedAt, IsDeleted)
VALUES
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', now() + interval '3 days','11111111-1111-1111-1111-111111111111','Platform Overview','Focus on automation',now(),now(),FALSE);

INSERT INTO DemoParticipants (Id, DemoId, ContactId, UserId, Role, CreatedAt, UpdatedAt)
VALUES
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3','b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',NULL,'Decision Maker',now(),now()),
('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5','c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',NULL,'0f0f0f0f-0f0f-0f0f-0f0f-0f0f0f0f0f0f','Presenter',now(),now());

INSERT INTO ActivityLogs (Id, ActorUserId, EntityType, EntityId, ActivityTypeId, Message, CorrelationId, CreatedAt)
VALUES
('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6','9f1a8d0e-2c7f-4a4b-9c0f-0e1a2b3c4d5e','Account','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Account created',NULL,now());
```

### Appendix C: API & Operational Standards
- Requests: `Correlation-Id` header (GUID) — server assigns if missing.
- Response shape: `{ data, error: { code, message, details? }, meta }`.
- Pagination: cursor, limit, nextCursor.
- Errors: consistent codes; 400/401/403/404/409/422/429/5xx.
- Idempotency: `Idempotency-Key` for applicable POSTs.
- Index suggestions: Users(Email) UNIQUE; Contacts(AccountId, Email) UNIQUE;
  Demos(AccountId, ScheduledAt, StatusId); ActivityLogs(ActivityTypeId, CreatedAt DESC).

## Governance

- Constitution supersedes conflicting practices. All PRs must verify compliance.
- Amendments via PR with rationale and version bump; Admin ratification required.
- Quarterly compliance review with focus on Security, Auditability, and Test discipline.
- Roles: Spec Author, Reviewer, QA, Admin as defined in §10.

**Version**: 1.0.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-12
