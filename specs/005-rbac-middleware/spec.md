# Feature Specification: RBAC Middleware

**Feature Branch**: `005-rbac-middleware`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "Middleware to enforce Role-Based Access Control using JWT role claims. Admin users can access all resources; Basic users can access only records they created (CreatedBy = sub). Works with .NET Core 8, PostgreSQL, and JWT-based auth. Stack: backend .NET Core 8 Web API, database PostgreSQL (GUID PK, TitleCase tables), frontend Next.js 15."

## Clarifications

### Session 2025-11-14

- Q: How should we implement RBAC/ownership enforcement for controllers? → A: Policy-based AuthorizationHandler (custom `IAuthorizationRequirement` + `AuthorizationHandler`) with an attribute to bind ownership semantics.
- Q: For list endpoints, where should ownership filtering be enforced? → A: In the data access layer via repository/specification or EF query filter driven by the current principal (server-side, centralized).
- Q: For single-resource endpoints, how does the handler obtain the entity for ownership checks? → A: A custom attribute declares the entity type and route id parameter; the handler reads route values, loads the entity via DbContext, and evaluates `CreatedBy == sub`.
- Q: Exact list filtering mechanism? → A: Repository/Specification pattern that injects current principal and applies `CreatedBy == sub` for Basic; Admin bypasses the predicate.
- Q: On create, who sets `CreatedBy`? → A: Server always sets `CreatedBy = sub` and ignores any client-provided value (applies to all roles).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin can access any protected resource (Priority: P1)

Admin users need unrestricted access to read and mutate all protected resources.

**Why this priority**: Ensures administrators can manage the system without being blocked by ownership checks.

**Independent Test**: Seed an Admin user, authenticate, and confirm access to GET/LIST/POST/PUT/PATCH/DELETE on a test entity regardless of `CreatedBy`.

**Acceptance Scenarios**:

1. **Given** an Admin access token, **When** calling GET a resource created by another user, **Then** response is 200 with the resource.
2. **Given** an Admin access token, **When** calling DELETE on a resource not owned, **Then** response is 204/200 and the resource is removed.

---

### User Story 2 - Basic users can only access their own records (Priority: P1)

Basic users should be able to read and mutate only resources where `CreatedBy == sub` from their JWT.

**Why this priority**: Enforces least privilege for most users.

**Independent Test**: Seed two Basic users A and B, create resources with `CreatedBy=A` and `CreatedBy=B`, verify A cannot access B’s resources and vice versa.

**Acceptance Scenarios**:

1. **Given** a Basic user token, **When** calling GET for a resource created by another user, **Then** response is 403 Forbidden.
2. **Given** a Basic user token, **When** listing resources, **Then** only records with `CreatedBy == sub` are returned.

---

### User Story 3 - Ownership enforcement on write operations (Priority: P2)

For Basic users, create is allowed, but update/patch/delete require ownership.

**Why this priority**: Prevents unauthorized modifications.

**Independent Test**: As a Basic user, create a record; attempt to update/delete another user’s record; verify 403. Update/delete own record; verify success.

**Acceptance Scenarios**:

1. **Given** a Basic user token, **When** PATCH non-owned resource, **Then** response is 403 Forbidden.
2. **Given** a Basic user token, **When** PATCH owned resource, **Then** response is 200 and changes persist.

---

### User Story 4 - Transparent integration with controllers (Priority: P2)

Developers can protect endpoints with minimal code by applying a policy/attribute indicating the entity’s ownership field (`CreatedBy`).

**Why this priority**: Reduces boilerplate and mistakes.

**Independent Test**: Add the attribute/policy to a controller; no manual ownership checks in action methods; middleware/policy enforces access.

**Acceptance Scenarios**:

1. **Given** a controller action decorated with the RBAC attribute, **When** invoked by Basic user for non-owned resource, **Then** 403 is returned automatically.
2. **Given** the same action and Admin token, **When** invoked, **Then** access is granted.

### Edge Cases

- Missing or invalid `role` claim in JWT → return 403; token still validated but lacks required role context.
- Missing or invalid `sub` claim (not a GUID) → return 401 from auth, or 403 from RBAC if identity lacks a valid subject.
- Resource not found vs forbidden: if the resource id does not exist → 404; if exists but not owned → 403.
- Soft-deleted or inactive users → 401 from auth layer before RBAC.
- Role changed after token issuance → authorization is based on token claims until expiration; document that revocation requires token invalidation or short TTL.
- List endpoints: Basic users must receive only their own rows (server-side filtering); Admin receives all.
- Endpoints without ownership semantics (no `CreatedBy`) → only role check applies; ownership filter is skipped.
- Multi-tenant future-proofing: ownership claim could be extended with `tenantId` without breaking current behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support two roles: `Admin` and `Basic`, conveyed via JWT `role` claim and `ClaimTypes.Role`.
- **FR-002**: Admin MUST have full access (read/write/delete) to all protected resources.
- **FR-003**: Basic users MUST only access resources where `CreatedBy == sub` (JWT subject GUID) for read and write operations.
- **FR-004**: The system MUST provide a reusable authorization attribute/policy to enforce ownership checks based on an entity’s `CreatedBy` field.
- **FR-005**: For list endpoints, the system MUST filter results server-side to include only records owned by the Basic user; Admin receives unfiltered results.
- **FR-006**: For single-resource endpoints, the system MUST return 403 when the resource exists but is not owned by a Basic user; return 404 when the resource does not exist.
- **FR-007**: Endpoints without ownership semantics MUST still enforce role-based access (e.g., Admin-only) without ownership checks.
- **FR-008**: Authorization failures MUST return standard responses: 401 (unauthenticated), 403 (authenticated but not authorized).
- **FR-009**: The middleware/policy MUST be testable in isolation with integration tests covering success and failure cases for both roles.
- **FR-010**: The solution MUST not require modifying controller action logic; enforcement occurs via middleware/policy and, for lists, via a standard repository/specification pattern or query filter.
- **FR-011**: The system MUST log authorization denials with correlation id, user id (if present), role, action, and resource identifier when available.
- **FR-012**: Performance overhead introduced by the RBAC layer MUST be minimal (<5ms median per request in development on a typical machine).
- **FR-013**: RBAC MUST be implemented using policy-based authorization (`IAuthorizationRequirement` and `AuthorizationHandler`) with a reusable attribute to declare role/ownership rules per endpoint.
- **FR-014**: List ownership enforcement MUST be implemented in the data layer using a repository/specification or EF global query filter that injects the current user id; controllers MUST NOT hand-write ownership filters.
- **FR-015**: For single-resource endpoints, the attribute MUST specify the entity type and route id parameter; the authorization handler MUST load the entity via DbContext and enforce `CreatedBy == sub` (return 403 if owned by another user, 404 if not found).
- **FR-016**: The repository/specification layer MUST be the standard mechanism for list filtering; it MUST accept/access the current principal and apply/remove the ownership predicate based on role.
- **FR-017**: On create operations, the API MUST set `CreatedBy` from the authenticated user’s `sub` claim and MUST ignore any client-supplied `CreatedBy` value (for both Admin and Basic).

### Assumptions

- `CreatedBy` is a GUID on protected entities and stores the creator’s user id.
- JWTs already include `sub` (user id) and `role` claims; authentication is configured and working.
- Tables use TitleCase, GUID PKs, and EF Core is the ORM.

### Key Entities *(include if feature involves data)*

- **User (JWT Claims)**: `sub` (GUID), `email`, `role` (Admin|Basic).
- **Protected Resource**: Any entity with `Id` (GUID) and `CreatedBy` (GUID) used for ownership checks.
- **Authorization Rule**: Role-based policies and ownership predicate `CreatedBy == sub`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected endpoints return 403 instead of 200 when a Basic user accesses non-owned resources in tests.
- **SC-002**: Admin access succeeds for 100% of protected endpoints in tests regardless of ownership.
- **SC-003**: List endpoints return only owned items for Basic users; precision and recall = 1.0 in integration tests.
- **SC-004**: Median added latency by RBAC enforcement <5ms per request in development measurements.
- **SC-005**: 100% of authorization denials are logged with correlation id and user context in development.
