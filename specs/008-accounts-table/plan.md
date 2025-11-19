# Implementation Plan — Spec 8: Accounts Table

## 1. Data model & migration
- Define `Accounts` entity in backend models.
- Define lookup entities: `AccountType`, `AccountSize`, `CrmProvider`.
- Create EF Core migration to:
  - Create `AccountTypes`, `AccountSizes`, `CrmProviders`.
  - Create `Accounts` table with GUID PK, FK to lookup tables and `Users`.
  - Add indexes for common query patterns.

## 2. Seeding
- In the migration, seed initial lookup values for:
  - `AccountTypes` (e.g., Prospect, Customer, Partner).
  - `AccountSizes` (e.g., Small, Mid-market, Enterprise).
  - `CrmProviders` (e.g., Salesforce, HubSpot, Zoho, None).

## 3. AppDbContext configuration
- Add `DbSet<Account>`, `DbSet<AccountType>`, `DbSet<AccountSize>`, `DbSet<CrmProvider>`.
- Configure relationships and constraints via Fluent API.
- Ensure soft-delete (`IsDeleted`) is present on `Accounts`.

## 4. Table catalog update
- Update `docs/table-catalog.md` to include:
  - `Accounts` with key columns and relationships.
  - `AccountTypes`, `AccountSizes`, `CrmProviders`.

## 5. Verification
- Apply migrations against the PostgreSQL database.
- Verify tables, FKs, and indexes exist.
- Insert sample data and run queries joining Accounts with lookup tables.
