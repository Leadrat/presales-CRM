# Spec A2 — Local User Record & Role Link

## What / Why

Create relational tables `Users` and `Roles` (TitleCase, GUID PKs) with a foreign key from `Users.RoleId` to `Roles.Id`. Seed baseline roles and demo users. Provide `POST /api/auth/signup` to create users with the Basic role by default. Enforce uniqueness and UTC timestamps. This enables local identity for JWT auth and RBAC.

## Clarifications

### Session 2025-11-12

- Q: Should email uniqueness be enforced on normalized form? → A: Normalize to lowercase and enforce unique on normalized email
- Q: Can clients specify RoleId during signup? → A: Disallow RoleId; always assign Basic
- Q: Should signup auto-login (issue tokens) or require separate login? → A: Require separate login after signup (no tokens issued on signup)
- Q: Password policy for signup? → A: Min 8 chars, at least 1 letter and 1 number
- Q: Email uniqueness with soft-deletes? → A: Unique only for non-deleted users (partial unique index)

## Inputs (API endpoints and payloads)

- POST /api/auth/signup
  - Body: `{ FullName: string, Email: string, Password: string, Phone?: string }`

## Outputs

- 200 OK: `{ data: { email: string, id: string } }`
- 409 CONFLICT: `{ error: { code: "EMAIL_EXISTS", message: "Email already registered" } }`

## Acceptance Criteria (checklist)

- [ ] Tables `Users` and `Roles` exist with TitleCase columns and GUID PKs
- [ ] FK `Users.RoleId` → `Roles.Id`
- [ ] Seed roles: Admin, Basic (GUIDs provided)
- [ ] Seed users mapped to each role with BCrypt password hashes
- [ ] `POST /api/auth/signup` assigns Basic role by default, validates unique email (case-insensitive via lower(Email)), stores UTC timestamps
- [ ] Client cannot set `RoleId` in signup payload
- [ ] Signup does not issue tokens; user must login explicitly
- [ ] Password policy enforced: min 8 chars, >=1 letter, >=1 number
- [ ] Case-insensitive email uniqueness enforced only where `IsDeleted = FALSE`
- [ ] No enums or jsonb used; only relational tables

## Dependencies

- A1 JWT Authentication Setup (tokens, hashing)
- PostgreSQL with UUID support (uuid-ossp or pgcrypto)

## Database Tables (SQL)

Note: Ensure UUID extension is available. Choose one:

```sql
-- Option 1 (pgcrypto)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Option 2 (uuid-ossp)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

```sql
-- Roles
CREATE TABLE Roles (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name VARCHAR(50) NOT NULL UNIQUE,
  Description TEXT NULL,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE Users (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  FullName TEXT NULL,
  Email TEXT NOT NULL,
  PasswordHash TEXT NOT NULL,
  Phone TEXT NULL,
  RoleId UUID NULL REFERENCES Roles(Id),
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);

CREATE INDEX ON Users(RoleId);
-- Enforce case-insensitive email uniqueness for non-deleted users only
CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Email_Lower_Active
  ON Users ((lower(Email)))
  WHERE IsDeleted = FALSE;
```

## Seed Data (GUIDs)

```sql
-- Roles
INSERT INTO Roles (Id, Name, Description, IsActive, CreatedAt, UpdatedAt) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Admin','System administrator',TRUE,now(),now()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Basic','Default basic role',TRUE,now(),now());

-- Users (bcrypt hashes are placeholders; replace with real hashes for Admin@123 and User@123)
INSERT INTO Users (Id, FullName, Email, PasswordHash, Phone, RoleId, IsActive, CreatedAt, UpdatedAt)
VALUES
('11111111-1111-1111-1111-111111111111','System Admin','admin@leadrat.com','$2a$10$REPLACE_ADMIN_HASH','+1-555-0101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',TRUE,now(),now()),
('22222222-2222-2222-2222-222222222222','Basic User','user@leadrat.com','$2a$10$REPLACE_USER_HASH','+1-555-0102','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',TRUE,now(),now());
```

## API Contract — Signup

- Endpoint: `POST /api/auth/signup`
- Request: `{ FullName: string, Email: string, Password: string, Phone?: string }`
- Behavior:
  - Normalize `Email` to lowercase for uniqueness checks
  - Validate password meets policy: min 8, >=1 letter and >=1 number
  - If a non-deleted user with normalized email exists → 409 with `EMAIL_EXISTS`
  - Else create user with:
    - `Id = uuid`
    - `RoleId = Basic` (lookup by Name). Ignore any client-supplied role fields if present.
    - `PasswordHash = BCrypt(Password)`
    - `CreatedAt/UpdatedAt = now() (UTC)`
  - Response: 200 `{ data: { id, email } }` (no tokens returned; login required)

## Functional Requirements

- FR-1: Create Roles and Users tables per SQL above (TitleCase, GUID PK).
- FR-2: Enforce uniqueness on `Roles.Name` and case-insensitive user email via unique index on `lower(Email)`.
- FR-2.1: Email uniqueness applies only to non-deleted users via partial unique index `WHERE IsDeleted = FALSE`.
- FR-3: Implement `POST /api/auth/signup` with Basic role default.
- FR-3.1: Disallow client-provided `RoleId` during signup; backend assigns Basic.
- FR-3.2: Signup endpoint must not authenticate the user or return tokens; login is a separate flow.
- FR-4: Use BCrypt (Identity PasswordHasher<User> acceptable) for password hashing.
- FR-4.1: Enforce password policy: min 8 chars, at least 1 letter and 1 number.
- FR-5: Store timestamps in UTC and never log plaintext passwords.
- FR-6: No enums or jsonb; relational only.

## Success Criteria

- SC-1: Migration applies cleanly and seeds two roles and two users.
- SC-2: Signup creates user, returns email and id, and sets Basic role.
- SC-3: Email uniqueness enforced (409 on duplicate).

## Assumptions

- Basic role is uniquely identified by `Name = 'Basic'`.
- UUID generation via `gen_random_uuid()` (pgcrypto). If using uuid-ossp, replace default with `uuid_generate_v4()`.

## Migration Notes

- Create EF Core migration adding `Roles` and `Users` with constraints and seed data.
- Ensure `Npgsql` value generation strategy for UUIDs is configured or defaults via SQL.

## Plain Table Documentation (reference)

Roles(Id UUID PK, Name VARCHAR(50) UNIQUE, Description TEXT, IsActive BOOLEAN, CreatedAt TIMESTAMPTZ, UpdatedAt TIMESTAMPTZ)
Users(Id UUID PK, FullName TEXT, Email TEXT UNIQUE, PasswordHash TEXT, Phone TEXT, RoleId UUID FK→Roles.Id, IsActive BOOLEAN, CreatedAt TIMESTAMPTZ, UpdatedAt TIMESTAMPTZ, IsDeleted BOOLEAN, DeletedAt TIMESTAMPTZ)
