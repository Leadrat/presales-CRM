# Data Model — A2 Local User & Role

## Tables

```sql
-- Enable UUID extension (uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles
CREATE TABLE IF NOT EXISTS Roles (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  Name VARCHAR(50) NOT NULL UNIQUE,
  Description TEXT NULL,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS Users (
  Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  FullName VARCHAR(100) NOT NULL,
  Email VARCHAR(100) NOT NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  Phone VARCHAR(15) NULL,
  RoleId UUID NULL REFERENCES Roles(Id),
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS IX_Users_RoleId ON Users(RoleId);
-- Case-insensitive uniqueness for non-deleted users
CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Email_Lower_Active ON Users ((lower(Email))) WHERE IsDeleted = FALSE;
```

## Seeds

```sql
-- Roles
INSERT INTO Roles (Id, Name, Description, IsActive, CreatedAt, UpdatedAt) VALUES
('7d61b152-87f3-4a7e-9c35-7a83c43bfb21','Admin','System administrator',TRUE,now(),now()),
('e452a2c7-2388-4a6e-bd38-5e7b03f34d9d','Basic','Default basic role',TRUE,now(),now())
ON CONFLICT (Id) DO NOTHING;

-- Users (bcrypt hashes: replace placeholders)
INSERT INTO Users (Id, FullName, Email, PasswordHash, Phone, RoleId, IsActive, CreatedAt, UpdatedAt)
VALUES
('11111111-1111-1111-1111-111111111111','System Admin','admin@leadrat.com','$2a$10$REPLACE_ADMIN_HASH','+1-555-0101','7d61b152-87f3-4a7e-9c35-7a83c43bfb21',TRUE,now(),now()),
('22222222-2222-2222-2222-222222222222','Basic User','user@leadrat.com','$2a$10$REPLACE_USER_HASH','+1-555-0102','e452a2c7-2388-4a6e-bd38-5e7b03f34d9d',TRUE,now(),now())
ON CONFLICT (Id) DO NOTHING;
```

## Validation Rules

- Email stored in lowercase; uniqueness enforced on `lower(Email)` where `IsDeleted = FALSE`.
- FullName required (≤100 chars).
- Password policy: min 8 chars, ≥1 letter and ≥1 number.
- Phone optional (≤15 chars).

## State Transitions

- Users: Active → (IsDeleted=TRUE, DeletedAt set) on soft delete. Email uniqueness constraint no longer applies to deleted rows.
