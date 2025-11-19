# Feature Specification: Spec 8 — Accounts Table

**Feature Branch**: `[008-accounts-table]`  
**Created**: 2025-11-17  
**Status**: Draft  
**Input**: User description: "Create a new feature spec for Spec 8 — Accounts Table under specs/008-accounts-table. The spec must define the Accounts table for the Pre-Sales CRM in PostgreSQL with GUID PKs, no enums/JSONB, and lookup tables for account type/size/CRM provider, including migrations, constraints, and sample data seeding."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and manage accounts (Priority: P1)

A sales or presales user needs to create and maintain a list of customer accounts in the CRM, including company details and high-level CRM/license information, so they can track opportunities and renewals.

**Why this priority**: Without a reliable Accounts table, no downstream CRM workflows (contacts, opportunities, notes, renewals) can function. This is foundational data.

**Independent Test**: Using only the Accounts-related backend APIs/UI, a tester can create, read, update, soft-delete, and list accounts, and verify that all persisted data is consistent in the database.

**Acceptance Scenarios**:

1. **Given** a clean database, **When** a new Account is created with valid CompanyName, AccountTypeId, AccountSizeId, CurrentCrmId, and CrmExpiry, **Then** a row is inserted into `Accounts` with a new GUID `Id`, populated foreign keys, timestamps, and `IsDeleted = false`.
2. **Given** an existing Account row, **When** the user updates fields such as `CompanyName`, `NumberOfUsers`, or `CrmExpiry`, **Then** the row is updated, `UpdatedAt` reflects the change time, and foreign keys remain valid.
3. **Given** an existing Account row, **When** the user performs a soft delete, **Then** `IsDeleted` is set to `true`, the row remains in the database, and normal list queries can be configured to exclude it while audit/reporting queries can still access it.

---

### User Story 2 - Use lookup data for consistency (Priority: P2)

A sales operations admin wants to standardize account categorization (type, size, CRM provider) so that reporting and segmentation are consistent across the organization.

**Why this priority**: Consistent lookup values enable reliable filtering, segmentation, and reporting, and avoid free-text divergence.

**Independent Test**: A tester can query the lookup tables directly (or via backend APIs) to see a stable set of GUID-based options and create multiple accounts that reuse those lookup values.

**Acceptance Scenarios**:

1. **Given** a freshly migrated database, **When** the tester queries `AccountTypes`, `AccountSizes`, and `CrmProviders`, **Then** each table contains a seeded set of GUID-keyed rows (e.g., "Prospect", "Customer", size bands, and common CRM providers).
2. **Given** the seeded lookup rows, **When** multiple Accounts are created that reference the same `AccountTypeId`/`AccountSizeId`/`CurrentCrmId`, **Then** all foreign key constraints are satisfied and queries can group or filter by these lookups.

---

### User Story 3 - Report and query on accounts (Priority: P3)

A manager wants to run queries and dashboards against the Accounts data (e.g., by CRM provider, by size, by renewal date) without data quality issues.

**Why this priority**: Management visibility and reporting depend on the quality and structure of the Accounts data and its lookup relationships.

**Independent Test**: A tester can run SQL queries or backend reporting endpoints that join Accounts with lookup tables and obtain correct, performant results.

**Acceptance Scenarios**:

1. **Given** a database with many Accounts, **When** the tester runs a query that filters by a specific `CurrentCrmId` or `AccountTypeId`, **Then** the query returns only matching rows and uses the configured indexes where applicable.
2. **Given** some Accounts are soft-deleted (`IsDeleted = true`), **When** business-facing queries are run for active accounts, **Then** soft-deleted rows are excluded unless an explicit audit/reporting query is used.

---

### Edge Cases

- What happens when an Account is created with missing required fields (e.g., `CompanyName`, required lookup IDs)?
- What happens when a referenced lookup row is removed in the future? Lookup values MAY be hard-deleted only if there are no referencing `Accounts` rows; otherwise the database will prevent deletion via foreign key constraints.
- How does the system handle invalid `CrmExpiry` formats or past dates (e.g., `01/20` for an already expired CRM)?
- What happens when a user attempts to create two accounts with the same `CompanyName`? In this case, the system MAY allow duplicates at the database level but SHOULD use business logic and UI validation to warn/prevent unintended duplicates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create an `Accounts` table in PostgreSQL with the following columns (TitleCase):
  - `Id` (GUID primary key)
  - `CompanyName` (string, required)
  - `Website` (string, optional)
  - `AccountTypeId` (GUID foreign key → `AccountTypes.Id`)
  - `NumberOfUsers` (integer, optional; can be 0 when unknown)
  - `AccountSizeId` (GUID foreign key → `AccountSizes.Id`)
  - `CurrentCrmId` (GUID foreign key → `CrmProviders.Id`)
  - `CrmExpiry` (timestamp with time zone in the database; at the application/API level it is represented as a required `MM/YY` string that is parsed into the underlying timestamp)
  - `CreatedByUserId` (GUID foreign key → `Users.Id`)
  - `CreatedAt` (timestamp, required)
  - `UpdatedAt` (timestamp, required)
  - `IsDeleted` (boolean, required, default `false`).

- **FR-002**: The system MUST create three lookup tables with GUID primary keys and TitleCase naming:
  - `AccountTypes` (e.g., `Id`, `Name`, `DisplayOrder`)
  - `AccountSizes` (e.g., `Id`, `Name`, `MinUsers`, `MaxUsers`, `DisplayOrder`)
  - `CrmProviders` (e.g., `Id`, `Name`, `Website`, `DisplayOrder`).

- **FR-003**: The system MUST define foreign key relationships from `Accounts` to each lookup table and to `Users` via `CreatedByUserId`, enforcing referential integrity at the database level.

- **FR-004**: The system MUST implement soft delete for Accounts via the `IsDeleted` flag; physical deletion of Account rows MUST be avoided in normal business flows.

- **FR-005**: The system MUST avoid database enums and JSON/JSONB columns for this feature; all categorical values MUST be modeled via lookup tables.

- **FR-006**: The system MUST seed sample lookup data for `AccountTypes`, `AccountSizes`, and `CrmProviders` using database migrations, with deterministic GUIDs documented in code so they can be referenced by name in higher layers if needed.

- **FR-007**: The system MUST ensure that migrations can be applied cleanly on a fresh database to create the schema from scratch without manual SQL steps.

- **FR-008**: The system MUST ensure that the .NET Core backend data models (e.g., EF Core entities) map cleanly onto the Accounts and lookup tables, using GUID types for all primary and foreign keys.

- **FR-009**: The system SHOULD provide indexes to support common query patterns, including at minimum:
  - Index on `Accounts.CreatedByUserId`
  - Index on `Accounts.CurrentCrmId`
  - Index on `Accounts.AccountTypeId`
  - Index on `Accounts.AccountSizeId`
  - Consider composite indexes including `IsDeleted` when beneficial for active-account queries.

- **FR-010**: The system SHOULD ensure that application-level validation enforces the `CrmExpiry` format (MM/YY) and reasonable ranges, even though it is stored as a string.

### Key Entities *(include if feature involves data)*

- **Account**: Represents a customer or prospect organization tracked in the Pre-Sales CRM. Key attributes: identifier (`Id`), `CompanyName`, `Website`, account categorization (`AccountTypeId`, `AccountSizeId`), CRM information (`CurrentCrmId`, `CrmExpiry`), ownership/audit (`CreatedByUserId`, `CreatedAt`, `UpdatedAt`), and lifecycle state (`IsDeleted`).

- **AccountType**: Represents the high-level type of account (e.g., Prospect, Customer, Partner). Used for segmentation and reporting. Referenced by `Accounts.AccountTypeId`.

- **AccountSize**: Represents the approximate size of an account, typically based on number of users or employees (e.g., Small, Mid-market, Enterprise). May include optional range hints (MinUsers/MaxUsers). Referenced by `Accounts.AccountSizeId`.

- **CrmProvider**: Represents the current CRM platform used by the account (e.g., Salesforce, HubSpot, Zoho, "None"). Referenced by `Accounts.CurrentCrmId`.

- **User** (existing): Represents application users in the system. `Accounts.CreatedByUserId` references the user who created the account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh database environment can be fully migrated using the standard migration mechanism, resulting in the `Accounts`, `AccountTypes`, `AccountSizes`, and `CrmProviders` tables with all primary keys, foreign keys, and indexes created without errors.

- **SC-002**: In a test environment, at least 20 Accounts can be created, updated, soft-deleted, and queried (including joins to lookup tables) without referential integrity violations or migration issues.

- **SC-003**: Lookup tables contain seeded values after migration, and at least 95% of Accounts created during testing reuse existing lookup rows rather than introducing new ad hoc values.

- **SC-004**: Typical account listing queries that join Accounts with lookup tables and filter on `IsDeleted = false` and common lookup fields (e.g., `CurrentCrmId`, `AccountTypeId`) complete within an acceptable time for the expected dataset size (e.g., under 200 ms for 10k accounts) in a representative environment.
 
## Clarifications

### Session 2025-11-18

- Q: How should `CrmExpiry` be represented across layers? → A: Store `CrmExpiry` as a timestamp with time zone in PostgreSQL, but expose it at the application/API boundary as an `MM/YY` string that is parsed into the underlying timestamp.

