# Quickstart — A2 Local User & Role

## Prerequisites
- PostgreSQL with `uuid-ossp` extension available
- backend/appsettings.json configured with ConnectionStrings:Default
- .NET 8 SDK, EF Core tools installed (`dotnet tool install --global dotnet-ef`)

## Steps
1. Ensure DB reachable; create extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
2. Generate migration (from backend directory root):
   ```powershell
   dotnet ef migrations add A2_UsersAndRoles --project backend --startup-project backend
   ```
3. Apply migration:
   ```powershell
   dotnet ef database update --project backend --startup-project backend
   ```
4. Verify schema:
   - Tables: Roles, Users
   - Indexes: IX_Users_RoleId, IX_Users_Email_Lower_Active
5. Seed check:
   - Roles present (Admin, Basic)
   - Demo users present (admin@leadrat.com, user@leadrat.com)

## API Smoke Test
- Request:
  ```http
  POST /api/auth/signup
  Content-Type: application/json

  {
    "FullName": "Demo User",
    "Email": "demo@example.com",
    "Password": "pass1234",
    "Phone": "+1-555-0199"
  }
  ```
- Expected 200:
  ```json
  { "data": { "id": "<uuid>", "email": "demo@example.com" } }
  ```
- Duplicate email (any case) → 409
- Weak password → 400

## Plain Table Reference
- Roles(Id UUID PK, Name VARCHAR(50) UNIQUE, Description TEXT, IsActive BOOLEAN, CreatedAt TIMESTAMPTZ, UpdatedAt TIMESTAMPTZ)
- Users(Id UUID PK, FullName VARCHAR(100) NOT NULL, Email VARCHAR(100) NOT NULL, PasswordHash VARCHAR(255) NOT NULL, Phone VARCHAR(15) NULL, RoleId UUID FK→Roles.Id, IsActive BOOLEAN, CreatedAt TIMESTAMPTZ, UpdatedAt TIMESTAMPTZ, IsDeleted BOOLEAN, DeletedAt TIMESTAMPTZ)
