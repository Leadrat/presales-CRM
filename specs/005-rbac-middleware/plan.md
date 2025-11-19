# Implementation Plan — Spec 5: RBAC Middleware

**Branch**: `005-rbac-middleware`  
**Spec**: `c:/Users/shash/Desktop/Pre- Sales/specs/005-rbac-middleware/spec.md`

## Summary

Implement policy-based RBAC middleware in the **backend .NET 8 Web API** that enforces:

- `Admin` can access all protected resources.
- `Basic` users can only access entities they created (`CreatedBy == sub`).
- List endpoints are filtered server-side; single-resource endpoints use a handler that loads the entity and checks ownership.

The solution must integrate cleanly with existing controllers and EF Core/PostgreSQL, following Spec 000 architecture.

## Technical Context

**Language/Version**: C# / .NET 8 Web API  
**Primary Dependencies**: ASP.NET Core Authorization, EF Core, JWT bearer auth  
**Storage**: PostgreSQL via EF Core (GUID PKs, TitleCase tables)  
**Testing**: xUnit (or existing test framework) with integration tests for auth/authorization  
**Target Platform**: Backend service running on local dev + future container hosting  
**Project Type**: Web API backend with Next.js 15 frontend (separate project)  
**Performance Goals**: RBAC adds <5ms median per request in dev  
**Constraints**: No controller-specific ownership logic; enforcement via middleware/policy + repository/specification  
**Scale/Scope**: Single backend service; entities with `CreatedBy` field (Accounts, Contacts, Opportunities, Activities, Notes, etc.)

## Constitution Check

**GATE 1 — Layering**: RBAC must live in the backend API layer, not in the frontend. Ownership logic belongs in:

- Authorization layer (policy/handler + attribute) for single-resource endpoints.  
- Data layer (repository/specification or query filter) for list endpoints.

**GATE 2 — Cross-cutting concerns**: RBAC is a cross-cutting concern and must be implemented as reusable components (attribute, handler, data-layer helpers) and not duplicated in each controller.

**GATE 3 — Observability**: Authorization denials must be logged with correlation id, user id, role, action, and resource id when available.

These gates are compatible with Spec 000; no violations expected.

## Project Structure

### Documentation (this feature)

```text
specs/005-rbac-middleware/
├── spec.md        # RBAC feature specification
├── plan.md        # This file (implementation plan)
├── research.md    # Optional clarifications/decisions if needed
├── data-model.md  # Describes Protected Resource, claims, and ownership
├── quickstart.md  # How to exercise RBAC in dev
└── contracts/     # Any API docs/examples for RBAC-protected endpoints
```

### Source Code (repository root)

```text
backend/
├── Controllers/
│   ├── AccountsController.cs
│   ├── ContactsController.cs (future)
│   ├── ActivitiesController.cs (future)
│   └── [other controllers]
├── Authorization/
│   ├── OwnershipRequirement.cs
│   ├── OwnershipAuthorizationHandler.cs
│   ├── RbacPolicies.cs
│   └── Attributes/
│       └── EnforceOwnershipAttribute.cs
├── Services/
│   └── CurrentUser/ICurrentUserService.cs
├── Models/
│   ├── User.cs
│   ├── Account.cs
│   ├── Contact.cs
│   ├── Opportunity.cs
│   └── Activity.cs
└── AppDbContext.cs

tests/
├── Integration/
│   └── Authorization/
│       └── RbacMiddlewareTests.cs
└── [other tests]
```

**Structure Decision**: Use a dedicated `Authorization/` folder in the backend for RBAC policies, requirements, handlers, and attributes. Controllers remain thin and do not contain ownership logic.

## Phase Plan

### Phase 0 — Research & Design (lightweight)

- Map all entities that participate in ownership (`CreatedBy` fields) using existing models and Spec 000.  
- Confirm JWT claims (`sub`, `role`) and how they are populated during login (Spec 6).  
- Decide on the standard route id parameter name (e.g., `id`) for ownership checks.

### Phase 1 — Core RBAC building blocks

- Implement `OwnershipRequirement` (`IAuthorizationRequirement`) expressing the need to enforce `CreatedBy == sub` for Basic users while allowing Admins.  
- Implement `OwnershipAuthorizationHandler` that:
  - Reads route values (`id`) from the current `HttpContext`.
  - Resolves the entity type from the attribute metadata.
  - Loads the entity via `AppDbContext` and compares `CreatedBy` to the current user id.  
- Implement `EnforceOwnershipAttribute` that decorates controller actions with metadata (entity type, route id param name, optional roles).
- Register policies in `RbacPolicies` and wire them into `Program.cs`/`Startup` via `AddAuthorization`.

### Phase 2 — List ownership enforcement

- Add a small data-layer helper (e.g., extension method or specification pattern) that takes the current user principal and applies `CreatedBy == sub` for Basic users while bypassing for Admins.  
- Integrate this helper into list queries for at least one real entity (e.g., `Accounts`) to validate the pattern.

### Phase 3 — Controller integration

- Apply the RBAC attribute/policy to representative endpoints:
  - `GET /api/accounts/{id}` / `/detail` (single-resource).  
  - `GET /api/accounts` (list).  
- Ensure controllers no longer contain inline ownership checks; they rely on the handler + data-layer helper.

### Phase 4 — Logging & Observability

- Hook into the authorization handler to log denials with correlation id, user id, role, action, and resource id (using existing logging infrastructure).  
- Confirm logs are visible in development when RBAC denies access.

### Phase 5 — Testing & Validation

- Add integration tests for:
  - Admin accessing any resource (always allowed where role permits).
  - Basic accessing owned vs non-owned resources (single and list).  
  - Missing/invalid `role` or `sub` claims (401/403).  
- Measure added latency in development to ensure the handler is not introducing excessive overhead.

## Complexity Tracking

No additional architectural complexity beyond what is described in Spec 000. RBAC is implemented as a standard policy-based authorization layer with a small amount of data-layer support, which is appropriate for the project scale.
