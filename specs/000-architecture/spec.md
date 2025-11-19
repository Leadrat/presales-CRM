# Spec 000 — Architecture & Conventions

This spec defines the global architecture, layering, and conventions for the Pre-Sales CRM project. All later specs (001+, 006+, 009+, etc.) must be consistent with this document.

## Goals

- Provide a single place that describes the **overall architecture** of the system.
- Define **cross-cutting conventions** (naming, folders, DTOs, error shape, auth, RBAC).
- Make it easy for any spec to answer "where does this code live and how should it look?".

## High-Level Architecture

- **Backend**: ASP.NET Core / Entity Framework Core / PostgreSQL.
  - Project: `backend/`
  - Patterns: layered structure with Controllers → Services → Data/Models.
- **Frontend**: Next.js (App Router) + React + TypeScript.
  - Project: `frontend/`
  - Patterns: feature-oriented routing under `src/app`, shared libs in `src/lib`, contexts in `src/context`.
- **Specs**: Each feature spec lives under `specs/<nnn>-<name>/` and should contain at least `spec.md`, `plan.md`, and `tasks.md`.

## Backend Structure

- **AppDbContext**: central EF Core DbContext in `backend/AppDbContext.cs`.
- **Models**: POCO entity classes in `backend/Models/` (e.g., `User`, `Account`, `Contact`, `Opportunity`, `Activity`, lookups).
- **Controllers**: Web API endpoints under `backend/Controllers/`.
- **Services**: Cross-cutting services under `backend/Services/` (e.g., JWT, CurrentUserService, ActivityLogService).
- **Authorization**: Policies, handlers, and attributes under `backend/Authorization/`.
- **Migrations**: EF Core migrations under `backend/Migrations/`.

### Backend Conventions

- Controllers are `[ApiController]` classes with route pattern `api/[controller]`.
- JSON responses follow the pattern:
  - Success: `{ "data": <payload> }`
  - Error: `{ "error": { "code": string, "message": string } }`
- Auth:
  - JWT Bearer tokens created by `AuthController` and `JwtService`.
  - Claims: `sub` (user id), `email`, `roleId`, `role`.
- RBAC:
  - Roles: `Admin`, `Basic`.
  - Admin can see everything unless a spec narrows it.
  - Basic is restricted by ownership and specific feature rules.
- Ownership:
  - Entities implement `IOwnedEntity` when they have a `CreatedBy` owner.
  - Ownership checks use `OwnershipSpecifications` and `OwnershipHandler`.
- Soft delete:
  - Entities with `IsDeleted` should be filtered out from normal queries.

## Frontend Structure

- **App Router** under `frontend/src/app/`:
  - `(full-width-pages)` for marketing/auth pages.
  - `(admin)` for admin dashboard routes.
- **Shared layout**:
  - `AppHeader`, `AppSidebar`, `Backdrop` under `frontend/src/layout/`.
  - Admin routes wrapped with `AdminGuard` for role-based access.
- **Auth**:
  - `AuthContext` holds auth state and user info.
  - `tokenService` manages access/refresh tokens and refresh flow.
  - `fetchWithAuth` is the standard way to call backend APIs from the frontend.

### Frontend Conventions

- All API calls go through `frontend/src/lib/api.ts` (or submodules), not inline `fetch`.
- Components in `src/components/` are reusable building blocks; pages under `src/app/` orchestrate them.
- Error handling for API calls:
  - API helper throws or returns `{ error: { code, message } }`.
  - Pages handle 401 (redirect to `/login` via `AuthGate`), 403 (redirect to `/not-authorized`), 404, and 500 as per spec.

## Spec & Tasks Conventions

Each feature spec folder should contain:

- `spec.md` — problem description, user stories, and constraints.
- `plan.md` — architecture/implementation plan referencing Spec 000.
- `tasks.md` — checklist of concrete tasks, grouped by phases.

Specs must:

- Reuse the existing architecture instead of re-inventing layers.
- Keep naming consistent with entities and DTOs already defined.
- Ensure new endpoints follow the established response shape and auth rules.

## Error Codes

Global error codes used across specs:

- `UNAUTHORIZED` — missing/invalid JWT, user not active.
- `FORBIDDEN` — RBAC/ownership violation.
- `ACCOUNT_DATA_INCONSISTENT` — lookup/relational data inconsistency for Accounts.
- `DOMAIN_NOT_ALLOWED` — signup domain not allowed.
- `WEAK_PASSWORD` — password policy violation.
- `EMAIL_EXISTS` — duplicate email on signup.
- `TOKEN_INVALID` — bad/expired refresh token.

Specs may introduce additional error codes, but they must be named in `UPPER_SNAKE_CASE` and documented in their own `spec.md`.

## Data Model Reference

For a current view of tables and relationships, see:

- `docs/table-catalog.md` — authoritative list of tables and their relationships.
- Latest `AppDbContext` and migrations for exact EF mappings.

## How Specs Should Use This

When adding a new feature spec:

- Reference this spec in its `spec.md` (e.g., "follows Spec 000 architecture").
- In `plan.md`, explicitly state where backend code will live (controller, services, models) and how it aligns with existing layers.
- In `tasks.md`, include a Phase 0/1 task to "Verify architecture and conventions from Spec 000".

This ensures all future work remains consistent and the codebase stays clean and navigable.
