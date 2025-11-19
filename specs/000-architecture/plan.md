# Plan — Spec 000 Architecture & Conventions

This plan describes how Spec 000 anchors the architecture for the Pre-Sales CRM and how other specs should depend on it.

## Objectives

- Document a single, shared architecture spec that all other specs reference.
- Standardize where code lives in backend and frontend.
- Standardize cross-cutting concerns: auth, RBAC, error handling, soft delete, and ownership.

## Scope

- **In scope**:
  - Describing backend and frontend layering.
  - Defining conventions for controllers, services, models, and API responses.
  - Defining how specs should structure `spec.md`, `plan.md`, and `tasks.md`.
- **Out of scope**:
  - Detailed feature behaviour (that belongs to per-feature specs like 006, 009, etc.).
  - UI design beyond routing/layout conventions.

## Backend Architecture Plan

- **Controller layer**
  - Location: `backend/Controllers/`.
  - Responsibilities: HTTP endpoints, input validation, mapping to DTOs, delegation to services.
  - Conventions: `[ApiController]`, `api/[controller]` routes, `{ data }` / `{ error }` response shape.

- **Service layer**
  - Location: `backend/Services/`.
  - Responsibilities: reusable business logic, token management, logging, current user access.
  - Conventions: injected via DI in `Program.cs`.

- **Data/model layer**
  - Location: `backend/Models/`, `backend/AppDbContext.cs`, `backend/Migrations/`.
  - Responsibilities: entities, relationships, migrations, seeding.
  - Conventions: GUID primary keys, soft delete via `IsDeleted`, lookup tables with `DisplayOrder`.

- **Auth & RBAC**
  - JWT auth configured in `Program.cs`.
  - `AuthController` for login/signup/refresh/logout.
  - `ICurrentUserService` + `OwnershipSpecifications` + `OwnershipHandler` for ownership-aware endpoints.

## Frontend Architecture Plan

- **Routing & layout**
  - Use Next.js App Router under `frontend/src/app/`.
  - Group routes by context: `(full-width-pages)` for unauth pages, `(admin)` for dashboard.
  - Wrap admin routes with `AdminGuard` and global layout (sidebar + header).

- **API integration**
  - All backend calls go through `frontend/src/lib/api.ts` and helper files.
  - Use `fetchWithAuth` to attach tokens and handle refresh.
  - Keep per-feature helpers (e.g., accounts, notes) in `api.ts` or sub-files.

- **State & context**
  - `AuthContext` for auth status and current user role.
  - Additional contexts can follow this pattern when needed.

## Spec Template Plan

Every new spec `<nnn>-<name>` should:

1. **spec.md**
   - Reference Spec 000 explicitly, stating which parts of the architecture are used.
   - Describe user stories and requirements.
   - Document any new error codes or cross-cutting changes.

2. **plan.md**
   - Map feature behaviour onto the existing architecture.
   - Identify which controllers/services/models are touched or created.
   - Note any new DTOs or tables and how they relate to existing ones.

3. **tasks.md**
   - Break work into phases (setup, backend, frontend, tests, polish).
   - Include tasks to verify alignment with Spec 000 (architecture, auth, RBAC, error shapes).

## Dependencies and Evolution

- Spec 000 should remain **backwards-compatible** with shipped specs.
- When architecture changes are required:
  - Update Spec 000 first.
  - Then adjust affected specs and code.
  - Keep a brief change log in this plan if major patterns change.

## Acceptance Criteria

- Spec 000 has `spec.md`, `plan.md`, and `tasks.md` in place.
- Later specs (e.g., 006, 009) can reference Spec 000 instead of duplicating architectural text.
- New contributors can read Spec 000 and understand where to place new code and how to structure specs.
