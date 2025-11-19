# Research: RBAC Middleware

Created: 2025-11-14
Feature: specs/005-rbac-middleware/spec.md

## Decisions and Rationale

- Decision: Use policy-based AuthorizationHandler with a reusable attribute to declare ownership rules per endpoint.
  - Rationale: Aligns with ASP.NET Core best practices; composes with `[Authorize]`, keeps controllers clean, centralizes authorization logic, easily testable.
  - Alternatives: Global middleware (too coarse and brittle), action filters (ordering and coupling issues), manual checks (error‑prone and duplicated).

- Decision: Retrieve entity for single-resource endpoints by having the attribute declare the entity type and route id; handler loads via DbContext and checks `CreatedBy == sub`.
  - Rationale: Avoids controller boilerplate while ensuring the handler has the data to evaluate ownership.
  - Alternatives: Resource-based auth requiring controller to load entity (adds per‑action code), storing entity in HttpContext via filters (lifecycle complexity).

- Decision: Enforce list ownership using repository/specification pattern that injects the current principal.
  - Rationale: Centralizes list filtering, prevents leaks, easier to unit test and reason about than global EF filters.
  - Alternatives: EF global query filters (difficult to toggle per role; easy to accidentally bypass or over-apply).

- Decision: Server sets `CreatedBy = sub` on create, ignoring any client-supplied value.
  - Rationale: Prevents privilege escalation and data corruption; stable ownership semantics.
  - Alternatives: Allow Admin to set CreatedBy (adds complexity and risk; Admin already has full access, so not needed).

- Decision: Response semantics for protected resources
  - 401 Unauthorized: Missing/invalid token, inactive/soft-deleted user.
  - 403 Forbidden: Authenticated Basic user accessing an existing resource they do not own.
  - 404 Not Found: Entity not found (treat as security failure to avoid existence disclosure).

## Implementation Notes

- Claims used: `sub` (GUID user id), `role` with ClaimTypes.Role configured.
- Performance target: <5ms median overhead per request for authorization checks.
- Logging: Log denials with correlation id, user id, role, action, and resource id when available.
