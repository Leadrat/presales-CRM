# Data Model: RBAC Middleware

This feature does not introduce new tables, but relies on standard fields and claims to enforce ownership and role checks.

## Key Entities (Conceptual)

- User (JWT Claims)
  - sub: GUID user id (required)
  - role: Admin | Basic (required)

- Protected Resource (any aggregate enforcing ownership)
  - Id: GUID (PK)
  - CreatedBy: GUID (FK to Users.Id)

## Ownership Rule

- Basic users may only access entities where `CreatedBy == sub`.
- Admin users can access all entities (ownership predicate is bypassed).

## Notes

- Ensure all protected aggregates include a `CreatedBy` GUID column.
- On create, API assigns `CreatedBy = sub` regardless of client input.
- For list endpoints, apply repository/specification filtering using current principal.
