# Quickstart: RBAC Middleware

## Prerequisites

- Working JWT auth: tokens carry `sub` (GUID) and `role` claims.
- EF Core models include `CreatedBy` on protected aggregates.

## Steps

1. Add CurrentUserService
   - Provides `UserId` (Guid?) and `Role` from `HttpContext.User` claims.

2. Create policy artifacts
   - `OwnershipRequirement` (IAuthorizationRequirement)
   - `OwnershipHandler` (AuthorizationHandler<OwnershipRequirement>)
   - `OwnedByAttribute` to declare entity type and id route parameter

3. Register in Program.cs
   - `services.AddAuthorization(options => { /* add named policies if needed */ });`
   - `services.AddScoped<IAuthorizationHandler, OwnershipHandler>();`
   - `services.AddScoped<ICurrentUserService, CurrentUserService>();`

4. Enforce on single-resource endpoints
   - Decorate actions: `[OwnedBy(typeof(Deal), idParam: "id")]`
   - Handler reads route values, loads entity, checks `CreatedBy == sub`
   - Return 403 if owned by another user; 404 if entity not found; 401 if not authenticated

5. Enforce on list endpoints
   - In repository/specification, if role == Basic, apply `Where(e => e.CreatedBy == currentUserId)`; skip for Admin

6. Creation semantics
   - On create, override/set `CreatedBy = currentUserId` server-side; ignore client value

7. Testing
   - Integration tests covering: Admin access to any, Basic to own only, list filtering precision, 401/403/404 cases
   - Unit tests for handler logic with fake `HttpContext` and in-memory DbContext

## Verification

- Measure added latency (<5ms median) with development logs
- Confirm denial logs include correlation id, user id, role, action, resource id (when available)
