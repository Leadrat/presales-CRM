# Data Model — Spec 3: User Registration

Reuses Spec A2 schema; no new tables added.

## Entities

- Users
  - Id UUID (PK, DEFAULT uuid_generate_v4())
  - Email VARCHAR(100) NOT NULL (stored lowercase)
  - PasswordHash VARCHAR(255) NOT NULL
  - FullName VARCHAR(100) NULL
  - Phone VARCHAR(15) NULL
  - RoleId UUID NULL (FK → Roles.Id)
  - IsActive BOOLEAN NOT NULL DEFAULT TRUE
  - CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
  - UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
  - IsDeleted BOOLEAN NOT NULL DEFAULT FALSE
  - DeletedAt TIMESTAMPTZ NULL

- Roles
  - Id UUID (PK, DEFAULT uuid_generate_v4())
  - Name VARCHAR(50) NOT NULL UNIQUE
  - Description TEXT NULL
  - CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
  - UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()

## Indexes

- Users
  - IX_Users_RoleId (RoleId)
  - IX_Users_Email_Lower_Active UNIQUE ON (lower(Email)) WHERE IsDeleted = FALSE
- Roles
  - IX_Roles_Name UNIQUE (Name)

## Validation Rules

- Email must belong to an allowed domain from config: `Signup:AllowedDomains` (CSV). If empty/missing → deny signup.
- Email normalized to lowercase before insert.
- Password policy: min 8, ≥1 letter, ≥1 number.
- Role assignment: resolve Basic by name; ignore any client-provided role.

## State

- Soft delete: Users.IsDeleted=TRUE removes uniqueness constraint, allowing re-registration with same email.
