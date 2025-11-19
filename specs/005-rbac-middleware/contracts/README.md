# Contracts: RBAC Middleware

This feature introduces no new public endpoints. It standardizes authorization behavior on existing endpoints.

## Standard Responses

- 401 Unauthorized
  - Cause: Missing/invalid token, inactive/soft-deleted user.
- 403 Forbidden
  - Cause: Authenticated Basic user lacks ownership for existing entity.
- 404 Not Found
  - Cause: Entity not found (treated as security failure to avoid existence disclosure).

## Error Body (example)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource.",
    "correlationId": "<GUID>"
  }
}
```

## Headers

- Authorization: Bearer <access_token>
- Correlation-Id: <GUID> (server may generate if missing)

## Notes

- Ownership for list endpoints is enforced server-side via repository/specification.
- Ownership for single-resource endpoints is enforced by the authorization handler after loading the entity.
