# Contracts: Demo API – Spec 015

## Overview

All demo endpoints are scoped under an Account and require authentication. RBAC rules:

- Admin: can create, list, update, and soft-delete demos for any account.  
- Basic: can create and update demos only for accounts they created; can list demos for any account they can view.

Base path: `/api/Accounts/{accountId}/demos`

## DTOs

### DemoCreateRequest

```jsonc
{
  "scheduledAt": "2025-11-24T10:00:00Z",   // required, ISO 8601 UTC
  "doneAt": "2025-11-24T10:45:00Z",       // optional
  "demoAlignedByUserId": "<guid>",        // required
  "demoDoneByUserId": "<guid>",           // optional
  "attendees": "Owner, CTO",              // optional free text
  "notes": "Initial walkthrough"           // optional
}
```

### DemoUpdateRequest

Same shape as `DemoCreateRequest`; server may choose which fields are actually updatable.

### DemoDto

```jsonc
{
  "id": "<guid>",
  "accountId": "<guid>",
  "scheduledAt": "2025-11-24T10:00:00Z",
  "doneAt": "2025-11-24T10:45:00Z",
  "demoAlignedByUserId": "<guid>",
  "demoAlignedByName": "Admin User",  // optional display field
  "demoDoneByUserId": "<guid>",       // may be null
  "demoDoneByName": "AE User",        // optional display field
  "attendees": "Owner, CTO",
  "notes": "Initial walkthrough",
  "createdAt": "2025-11-24T09:50:00Z",
  "updatedAt": "2025-11-24T10:46:00Z"
}
```

## Endpoint List

All endpoints are scoped to an Account and require authentication.

- `POST   /api/Accounts/{accountId}/demos`
- `GET    /api/Accounts/{accountId}/demos`
- `PUT    /api/Accounts/{accountId}/demos/{demoId}`
- `DELETE /api/Accounts/{accountId}/demos/{demoId}`  (soft delete)

### POST /api/Accounts/{accountId}/demos

Create a new demo for the given account.

- **Auth**: required.  
- **RBAC**: Admin or Basic user who created the account.  
- **Body**: `DemoCreateRequest`.  
- **Response**: `201 Created` + `DemoDto`.

### GET /api/Accounts/{accountId}/demos

List demos for the given account.

- **Auth**: required.  
- **RBAC**: any user who can view the account.  
- **Query**: optional filters (e.g., `from`, `to` in future specs).  
- **Behavior**: returns only demos where `IsDeleted = false`.
- **Response**: `200 OK` + `DemoDto[]`.

### PUT /api/Accounts/{accountId}/demos/{demoId}

Update an existing demo.

- **Auth**: required.  
- **RBAC**: same as create (Admin or Basic creator of the account).  
- **Body**: `DemoUpdateRequest`.  
- **Response**: `200 OK` + updated `DemoDto`.

### DELETE /api/Accounts/{accountId}/demos/{demoId}

Soft-delete an existing demo.

- **Auth**: required.  
- **RBAC**: Admin or Basic creator of the account.  
- **Behavior**: sets `IsDeleted = true`; subsequent GETs exclude this demo.  
- **Response**: `204 No Content`.

## Validation Rules

- **Route parameters**  
  - `accountId` MUST be a valid GUID and refer to an existing, non-deleted Account the caller is allowed to view.  
  - `demoId` (for PUT/DELETE) MUST be a valid GUID and refer to a Demo that belongs to the given `accountId`; otherwise `404 Not Found`.

- **Create/Update payload**  
  - `scheduledAt` is **required**; MUST be a valid ISO 8601 UTC timestamp. It MAY be in the past (backfilled demo) or future (upcoming demo).  
  - `demoAlignedByUserId` is **required**; MUST be a valid GUID of an existing active User and MUST pass RBAC checks for acting on the account.  
  - `demoDoneByUserId` is optional; when present, MUST be a valid GUID of an existing User.  
  - `doneAt` is optional; when present, MUST be a valid ISO 8601 UTC timestamp and SHOULD be greater than or equal to `scheduledAt` (enforced primarily via UI, server MAY enforce strictly).  
  - `attendees` and `notes` are optional free-text fields; MAY be empty strings; server MAY enforce a reasonable max length for each (e.g., 2000 characters).

- **Soft delete**  
  - `DELETE` MUST set `IsDeleted = true` (and optionally `DeletedAt`) instead of hard-deleting the row.  
  - All `GET` operations MUST filter `IsDeleted = false` by default so deleted demos are not returned.

## Error Handling & Status Codes

Demo endpoints follow the project-standard response shape:

```jsonc
{
  "data": {},
  "error": {
    "code": "string-code",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {}
}
```

Typical success responses:

- `201 Created` – Successful demo creation (`POST`), body: `DemoDto`.  
- `200 OK` – Successful list (`GET`) or update (`PUT`), body: `DemoDto[]` or `DemoDto`.  
- `204 No Content` – Successful soft delete (`DELETE`).

Typical error responses:

- `400 Bad Request`  
  - Invalid GUID for `accountId` / `demoId`.  
  - Invalid timestamp format for `scheduledAt` / `doneAt`.  
  - Missing required fields (`scheduledAt`, `demoAlignedByUserId`, etc.).

- `401 Unauthorized`  
  - Missing or invalid JWT access token.

- `403 Forbidden`  
  - Caller is authenticated but not allowed to create/update/delete demos on the target account (RBAC failure).

- `404 Not Found`  
  - Account not found or soft-deleted.  
  - Demo not found for the given `accountId` and `demoId` combination.

- `409 Conflict` (optional)  
  - Used for optimistic concurrency conflicts on update if implemented.

- `500 Internal Server Error`  
  - Unexpected server-side error; should be logged with correlation id per project standards.

## RBAC Matrix

All endpoints require a valid JWT access token and reuse existing Account ownership/Admin rules.

| Endpoint                                      | Admin                                      | Basic (account creator)                               | Basic (non-creator)                        |
|----------------------------------------------|--------------------------------------------|--------------------------------------------------------|-------------------------------------------|
| POST /api/Accounts/{accountId}/demos         | CAN create for any account                 | CAN create only for accounts they created             | CANNOT create                             |
| GET /api/Accounts/{accountId}/demos          | CAN list for any account they can view     | CAN list for any account they can view                | CAN list for any account they can view    |
| PUT /api/Accounts/{accountId}/demos/{demoId} | CAN edit any demo on any account           | CAN edit demos only for accounts they created         | CANNOT edit                               |
| DELETE /api/Accounts/{accountId}/demos/{id}  | CAN soft-delete any demo on any account    | CAN soft-delete demos only for accounts they created  | CANNOT soft-delete                        |

## Example Scenarios

### Successful create (Admin)

```http
POST /api/Accounts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/demos
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "scheduledAt": "2025-11-24T10:00:00Z",
  "demoAlignedByUserId": "9f1a8d0e-2c7f-4a4b-9c0f-0e1a2b3c4d5e",
  "attendees": "Owner, CTO",
  "notes": "First product walkthrough"
}
```

Response: `201 Created` + `DemoDto`.

### Forbidden create (Basic on someone else’s account)

```http
POST /api/Accounts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/demos
Authorization: Bearer <basic-user-token>
Content-Type: application/json
...
```

Response: `403 Forbidden` with error code such as `"DEMO_CREATE_FORBIDDEN"`.

### Not found (bad demoId)

```http
PUT /api/Accounts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/demos/ffffffff-ffff-ffff-ffff-ffffffffffff
Authorization: Bearer <access-token>
Content-Type: application/json
...
```

Response: `404 Not Found` with error code such as `"DEMO_NOT_FOUND"`.

### Soft delete then verify hidden

1. `DELETE /api/Accounts/{accountId}/demos/{demoId}` → `204 No Content`.  
2. `GET /api/Accounts/{accountId}/demos` → response list does **not** include that `demoId`.
