# Implementation Plan: A2 Local User Record & Role Link

**Branch**: `a2-local-user-role` | **Date**: 2025-11-12 | **Spec**: specs/2-local-user-role/spec.md
**Input**: Feature specification from `/specs/2-local-user-role/spec.md`

## Summary

Create Roles and Users tables (GUID PKs) in PostgreSQL with a FK from Users.RoleId → Roles.Id. Enforce case-insensitive email uniqueness for non-deleted users via a partial unique index on lower(Email) WHERE IsDeleted = FALSE. Implement POST /api/auth/signup to create a new user with the Basic role by default, apply password policy, and do not issue tokens (login is separate). Seed Admin/Basic roles and two demo users. Connect to existing JWT/auth foundation but without auto-login.

## Technical Context

**Language/Version**: .NET 8 (ASP.NET Core Web API)
**Primary Dependencies**: EF Core (Npgsql), Microsoft.AspNetCore.Identity (PasswordHasher<User>)
**Storage**: PostgreSQL 14+ (uuid-ossp preferred: uuid_generate_v4())
**Testing**: xUnit, FluentAssertions; optional Testcontainers for Postgres (later)
**Target Platform**: Backend API (Windows/Linux)
**Project Type**: Web backend + later frontend integration
**Performance Goals**: N/A (auth/signup p95 < 200ms typical)
**Constraints**:
- No enums or jsonb
- GUID primary keys
- Timestamps UTC
- Activity logging via existing service
**Scale/Scope**: Initial MVP (≤10k users)

NEEDS CLARIFICATION (tracked in research):
- Duplicate email error code: Spec uses 409; user plan input mentions 400.
- Users.FullName required vs optional: Spec allows null; user plan input marks required and length 100.
- Column lengths: Email/PasswordHash/FullName/Phone maximums (spec used TEXT; user input provides sizes).

## Constitution Check

Gates derived from constitution:
- GUID PKs: PASS
- No enums/jsonb: PASS
- Auditability (activity logs): PASS (signup logs via existing ActivityLogService)
- Soft deletes: PASS (Users includes IsDeleted/DeletedAt)
- Security: PASS (PasswordHasher, no tokens on signup; JWT in A1)

Re-check after design: Expect PASS. Deviations allowed: using uuid-ossp (uuid_generate_v4()) instead of pgcrypto.

## Project Structure

### Documentation (this feature)

```text
specs/2-local-user-role/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── signup.yaml
```

### Source Code (repository root)

```text
backend/
├── Models/            # User, Role
├── Controllers/       # AuthController (signup)
├── Services/          # ActivityLogService, JwtService, etc.
├── Middleware/        # CorrelationId
└── Migrations/        # EF Core migrations for Roles/Users/index/seeds
```

**Structure Decision**: Use existing backend project; add models, DbContext mappings, migration, and controller updates per A2.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Use uuid_generate_v4() | Align with environment preference | gen_random_uuid() requires pgcrypto; team prefers uuid-ossp |
| 409 vs 400 on duplicate | Align with REST conflict semantics | 400 is generic; 409 better signals resource conflict |
