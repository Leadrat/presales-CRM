# Data Model — A1 JWT Authentication Setup

## Entities

### Users
- Id: UUID (PK)
- Email: TEXT (UNIQUE, NOT NULL)
- PasswordHash: TEXT (NOT NULL) — BCrypt
- FullName: TEXT (NULL)
- RoleId: UUID (NULL)
- IsActive: BOOLEAN (NOT NULL, DEFAULT TRUE)
- CreatedAt: TIMESTAMPTZ (NOT NULL, DEFAULT now())
- UpdatedAt: TIMESTAMPTZ (NOT NULL, DEFAULT now())
- IsDeleted: BOOLEAN (NOT NULL, DEFAULT FALSE)
- DeletedAt: TIMESTAMPTZ (NULL)

```sql
CREATE TABLE Users (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Email TEXT NOT NULL UNIQUE,
  PasswordHash TEXT NOT NULL,
  FullName TEXT NULL,
  RoleId UUID NULL,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
  DeletedAt TIMESTAMPTZ NULL
);
```

### RefreshTokens
- Id: UUID (PK)
- UserId: UUID (FK → Users.Id, NOT NULL)
- TokenHash: TEXT (NOT NULL)
- ExpiresAt: TIMESTAMPTZ (NOT NULL)
- RevokedAt: TIMESTAMPTZ (NULL)
- CreatedAt: TIMESTAMPTZ (NOT NULL, DEFAULT now())

```sql
CREATE TABLE RefreshTokens (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  UserId UUID NOT NULL REFERENCES Users(Id),
  TokenHash TEXT NOT NULL,
  ExpiresAt TIMESTAMPTZ NOT NULL,
  RevokedAt TIMESTAMPTZ NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON RefreshTokens (UserId);
CREATE INDEX ON RefreshTokens (ExpiresAt);
```

### ActivityTypes (Lookup)
- Id: UUID (PK)
- Name: TEXT (UNIQUE)

```sql
CREATE TABLE ActivityTypes (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Name TEXT NOT NULL UNIQUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### ActivityLogs
- Id: UUID (PK)
- ActorUserId: UUID (NULL, FK → Users.Id)
- EntityType: TEXT (NOT NULL) — e.g., "Auth"
- EntityId: UUID (NULL)
- ActivityTypeId: UUID (NOT NULL, FK → ActivityTypes.Id)
- Message: TEXT (NOT NULL)
- CorrelationId: UUID (NULL)
- CreatedAt: TIMESTAMPTZ (NOT NULL, DEFAULT now())

```sql
CREATE TABLE ActivityLogs (
  Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ActorUserId UUID NULL REFERENCES Users(Id),
  EntityType TEXT NOT NULL,
  EntityId UUID NULL,
  ActivityTypeId UUID NOT NULL REFERENCES ActivityTypes(Id),
  Message TEXT NOT NULL,
  CorrelationId UUID NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Validation Rules
- Email: RFC-compliant format validation
- Password: BCrypt comparison; do not enforce complexity here (separate spec)
- TokenHash: store SHA-256 or equivalent one-way hash of refresh token

## State & Transitions
- RefreshToken: Issued → (Rotated | Revoked | Expired)
- User: Active → (Inactive | Soft-Deleted)

## Sample Data
```sql
INSERT INTO Users (Id, Email, PasswordHash, FullName, IsActive, CreatedAt, UpdatedAt)
VALUES ('8ac25b1c-728a-4f4d-a5d2-67b9b71bfae9','demo@leadrat.com','$2a$10$E6yFgJ92VpwF......................','Demo User',TRUE,now(),now());

INSERT INTO ActivityTypes (Id, Name, CreatedAt, UpdatedAt)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd','Authenticated', now(), now());
```
