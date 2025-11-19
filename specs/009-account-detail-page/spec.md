# Feature Specification: Spec 9 — Account Detail Page

> Architecture note: This spec follows the global architecture and conventions defined in `specs/000-architecture/spec.md` (Spec 000 — Architecture & Conventions), including layered ASP.NET Core backend, Next.js frontend, JWT-based auth, RBAC, and the shared `{ data }` / `{ error: { code, message } }` response shape.

**Feature Branch**: `[009-account-detail-page]`  
**Created**: 2025-11-17  
**Status**: Draft  
**Input**: User description: "Title: Spec 9 — Account Detail Page (Accounts → Details → Child Modules Foundation)"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - View full account details (Priority: P1)

As an **admin user**, I want to open an **Account Detail Page** for any account and see its core profile (company details, categorisation, CRM info, and child-module counts) so that I can understand the overall context before drilling into Contacts, Opportunities, or Activities.

**Why this priority**: This page becomes the central entry point for all future account-related modules (Contacts, Opportunities, Activities). Without a reliable Account Detail Page, downstream specs cannot provide a coherent user experience.

**Independent Test**: Using only the Accounts list and the new Account Detail endpoint/UI, a tester can select any existing account as Admin and see the correct overview properties and child counts, without needing Contacts/Opportunities/Activities CRUD implemented.

**Acceptance Scenarios**:

1. **Given** an existing Account row with valid lookup references (type, size, CRM) and CRM expiry, **When** an Admin navigates from the Accounts list to `/accounts/{id}` using the UI, **Then** the Account Detail Page loads and shows company name, website, account type, account size, CRM provider, CRM expiry, number of users, and created-at timestamp.
2. **Given** that the database contains child rows in the Contacts, Opportunities, and Activities tables for the account, **When** the Account Detail Page loads, **Then** the Overview shows counts for Contacts, Opportunities, and Activities that match the data in the database.

---

### User Story 2 - Respect RBAC and ownership on detail view (Priority: P2)

As a **Basic user**, I want to access the Account Detail Page **only for accounts I own**, and see a limited, read-only version of the page so that I can review my accounts without accidentally changing or seeing other users' data.

**Why this priority**: RBAC and ownership rules defined in Specs 5 and 8 must be consistently enforced on detail views. This prevents data leakage and sets the pattern for future child modules.

**Independent Test**: A tester with a Basic user account can create one or more accounts, navigate to the detail page for those accounts, and confirm that attempts to open detail pages for other users' accounts result in 403/redirect behaviour, while own accounts are visible in a minimal layout with no edit/delete actions.

**Acceptance Scenarios**:

1. **Given** a Basic user who has created an account (CreatedByUserId = current user), **When** they navigate to `/accounts/{id}` for that account, **Then** the detail page loads in a minimal layout showing overview information without edit/delete buttons.
2. **Given** the same Basic user and an account created by a different user (CreatedByUserId ≠ current user), **When** they attempt to navigate to `/accounts/{id}` for that foreign account, **Then** the API returns 403 Forbidden (or the UI redirects to a not-authorized flow) and no details are displayed.

---

### User Story 3 - Prepare child modules foundation (Priority: P3)

As a **developer or architect**, I want the Account Detail Page backend and schema to expose child-module counts and create empty but consistent table structures for Contacts, Opportunities, and Activities so that later specs can add CRUD functionality without revisiting foundational design decisions.

**Why this priority**: Defining tables and lookup structures early (with GUID PKs, ownership, and RBAC rules) avoids incompatible designs in Specs 10–12 and ensures all account-related child entities follow the same patterns.

**Independent Test**: Without any frontend for Contacts/Opportunities/Activities, a tester can verify via SQL and the `/api/accounts/{id}/detail` endpoint that child tables exist, have correct foreign keys and ownership columns, are populated with seed lookup data, and their counts are correctly reported in the detail response.

**Acceptance Scenarios**:

1. **Given** the migrations are applied on a fresh database, **When** the tester inspects the schema and `docs/table-catalog.md`, **Then** Contacts, Opportunities, Activities, and their lookup tables (OpportunityStages, ActivityTypes, ActivityStatuses) exist with GUID PKs, lookup-based categorisation, and `CreatedByUserId` ownership columns.
2. **Given** the tester inserts sample child rows for a specific Account into Contacts, Opportunities, and Activities, **When** they call `GET /api/accounts/{id}/detail`, **Then** the response includes `contactCount`, `opportunityCount`, and `activityCount` matching the number of non-deleted rows in each child table for that account.

---

### Edge Cases

- Account does not exist or has been soft-deleted (`IsDeleted = true`) when hitting `GET /api/accounts/{id}/detail`.
- Basic user attempts to open detail page for an account they do not own.
- Account exists but some child tables have zero rows for this account (counts must show 0, not null or missing).
- Lookup rows referenced by an account (AccountType, AccountSize, CrmProvider) have been removed or are inconsistent; the API MUST return **500 Internal Server Error** with a clear error code (e.g., `ACCOUNT_DATA_INCONSISTENT`) rather than returning partial/corrupt data.
- Admin and Basic users both accessing the same account detail concurrently while child rows are being added; counts should remain consistent per request.

## Requirements *(mandatory)*

### Functional Requirements

#### Backend: Endpoints and RBAC

- **FR-001**: The backend MUST expose a new endpoint `GET /api/accounts/{id}/detail` that returns a JSON payload containing:
  - The Account core fields (Id, CompanyName, Website, AccountTypeId, AccountSizeId, CurrentCrmId, NumberOfUsers, CrmExpiry, CreatedAt).
  - The resolved names for AccountType, AccountSize, and CRM Provider.
  - Counts for child entities: `contactCount`, `opportunityCount`, `activityCount`, each counting **only non-deleted** rows (`IsDeleted = false`) in the corresponding child table.

- **FR-002**: `GET /api/accounts/{id}/detail` MUST enforce RBAC consistent with Spec 8:
  - Admin users can request details for **any** non-deleted account.
  - Basic users can request details **only** for accounts they own (`Accounts.CreatedByUserId == currentUserId`).
  - If the account does not exist or is soft-deleted, the endpoint MUST return **404 Not Found**.
  - If a Basic user attempts to access an account they do not own, the endpoint MUST return **403 Forbidden**.

- **FR-003**: The detail endpoint MUST never expose `CreatedByUserId` directly in the response body; ownership is enforced server-side only.

#### Backend: Data Model and Migrations

- **FR-004**: The system MUST add a `Contacts` table with at least the following columns (TitleCase names):
  - `Id` (GUID primary key).
  - `AccountId` (GUID foreign key → `Accounts.Id`).
  - `CreatedByUserId` (GUID foreign key → `Users.Id`).
  - `Name` (string, required).
  - `Email` (string, optional).
  - `Phone` (string, optional).
  - `Position` (string, optional).
  - `CreatedAt` (timestamp, required).
  - `UpdatedAt` (timestamp, required).
  - `IsDeleted` (boolean, required, default false).

- **FR-005**: The system MUST add an `Opportunities` table with at least the following columns:
  - `Id` (GUID primary key).
  - `AccountId` (GUID foreign key → `Accounts.Id`).
  - `CreatedByUserId` (GUID foreign key → `Users.Id`).
  - `Title` (string, required).
  - `Amount` (decimal, required).
  - `StageId` (GUID foreign key → `OpportunityStages.Id`).
  - `CloseDate` (date, optional).
  - `CreatedAt` (timestamp, required).
  - `UpdatedAt` (timestamp, required).
  - `IsDeleted` (boolean, required, default false).

- **FR-006**: The system MUST add an `Activities` table with at least the following columns:
  - `Id` (GUID primary key).
  - `AccountId` (GUID foreign key → `Accounts.Id`).
  - `CreatedByUserId` (GUID foreign key → `Users.Id`).
  - `Description` (string, required).
  - `ActivityTypeId` (GUID foreign key → `ActivityTypes.Id`).
  - `DueDate` (date, optional).
  - `StatusId` (GUID foreign key → `ActivityStatuses.Id`).
  - `CreatedAt` (timestamp, required).
  - `UpdatedAt` (timestamp, required).
  - `IsDeleted` (boolean, required, default false).

- **FR-007**: The system MUST introduce the following lookup tables, each with GUID primary keys and seeded values:
  - `OpportunityStages` (e.g., `Id`, `Name`, `DisplayOrder`).
  - `ActivityTypes` (e.g., `Id`, `Name`, `DisplayOrder`).
  - `ActivityStatuses` (e.g., `Id`, `Name`, `DisplayOrder`).
  Each table MUST be seeded with 3–5 initial values (e.g., stages such as "Prospect", "Proposal", "Closed Won", "Closed Lost").

- **FR-008**: All new tables (Contacts, Opportunities, Activities, and their lookup tables) MUST:
  - Use GUIDs as primary keys and foreign keys.
  - Avoid PostgreSQL enums and JSON/JSONB for categorical values; instead, use lookup tables as above.
  - Include `CreatedAt`, `UpdatedAt`, `IsDeleted` (where applicable) for auditability and soft delete.
  - Be added to `docs/table-catalog.md` with primary keys, important columns, and key relationships.

#### Frontend: Routing and UI

- **FR-009**: The frontend MUST support an Account Detail Page route for administrators, reachable from the Accounts list via a navigation action (e.g., clicking a row or a "View" button). Given that `(admin)` is a route group, the concrete path for Admin should be `/accounts/[id]` under the admin layout.

- **FR-010**: The Account Detail Page MUST render an **Overview** section with the following fields:
  - Company Name.
  - Website (clickable link when present).
  - Account Type (display name from lookup).
  - Account Size (display name from lookup).
  - CRM Provider (display name from lookup).
  - CRM Expiry.
  - NumberOfUsers.
  - CreatedAt.
  - Counts for Contacts, Opportunities, Activities.

- **FR-011**: The Account Detail Page MUST provide the following actions for **Admin users only**:
  - **Edit Account** → navigates or opens an existing edit flow for the account.
  - **Delete Account** → triggers the existing soft-delete API and then navigates back to the Accounts list.
  - **Back to Accounts** → navigates back to the admin Accounts list.

- **FR-012**: For **Basic users**, the Account Detail Page MUST:
  - Render a minimal read-only layout (no edit/delete actions).
  - Only be reachable for accounts the user owns (enforced by backend RBAC and frontend error handling).
  - Handle 403 responses by redirecting the user to the `/not-authorized` page, providing a clear not-authorized experience consistent with Spec 7.

- **FR-013**: The UI MUST include placeholders (tabs or sections) for **Contacts**, **Opportunities**, and **Activities**, but only the **Overview** tab needs to be functional in this spec. Switching tabs SHOULD not cause errors even though child CRUD is out of scope.

#### Cross-Cutting

- **FR-014**: All new endpoints and data access MUST respect the global architecture preferences from Spec 000, including JWT-based stateless auth, GUID PKs, lookup tables for categoricals, and RBAC enforced at the API/controller level in alignment with Spec 5 and Spec 8.

- **FR-015**: The new feature MUST be covered by at least basic integration tests or manual test instructions that verify RBAC behaviour (Admin vs Basic) and detail payload correctness for a sample account.

### Key Entities *(include if feature involves data)*

- **Account (existing)**: Represents a customer or prospect organisation. For this feature, it is the parent entity whose detailed view is being implemented and to which Contacts, Opportunities, and Activities are attached.

- **Contact (new)**: Represents an individual person associated with an account (e.g., decision-maker, champion). Linked to `Account` via `AccountId` and to `User` via `CreatedByUserId` for ownership.

- **Opportunity (new)**: Represents a potential revenue event for an account (e.g., new sale, renewal). Linked to `Account` via `AccountId`, to `User` via `CreatedByUserId`, and categorised via `OpportunityStages`.

- **Activity (new)**: Represents a task or interaction related to an account (e.g., call, meeting, email). Linked to `Account` via `AccountId`, to `User` via `CreatedByUserId`, and categorised via `ActivityTypes` and `ActivityStatuses`.

- **OpportunityStage (new lookup)**: Represents the stage of an opportunity in the sales process (e.g., Prospecting, Proposal, Closed Won, Closed Lost).

- **ActivityType (new lookup)**: Represents the type of an activity (e.g., Call, Email, Meeting).

- **ActivityStatus (new lookup)**: Represents the status of an activity (e.g., Planned, Completed, Cancelled).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a fresh environment, running migrations and seeding data produces the new child tables and lookup tables without errors, and `GET /api/accounts/{id}/detail` returns the correct account overview and counts for at least 3 sample accounts.

- **SC-002**: Admin and Basic RBAC for `GET /api/accounts/{id}/detail` behave as specified in 100% of tested scenarios: Admin can see any non-deleted account; Basic can only see their own accounts, receiving 403 for others.

- **SC-003**: From the admin Accounts list, navigating to the Account Detail Page and back again works reliably for at least 20 different accounts without navigation or data errors.

- **SC-004**: When at least 50 Contacts, 30 Opportunities, and 100 Activities are present across accounts, the `GET /api/accounts/{id}/detail` endpoint returns within an acceptable time (e.g., under 200 ms in a representative environment) and the counts match the underlying data.

## Clarifications

### Session 2025-11-17

- Q: How should the API respond when lookup rows referenced by an account (AccountType, AccountSize, CrmProvider) are missing or inconsistent for `GET /api/accounts/{id}/detail`? → A: Return **500 Internal Server Error** with a specific error code (e.g., `ACCOUNT_DATA_INCONSISTENT`).
- Q: How should the frontend handle a 403 response from `GET /api/accounts/{id}/detail` when a Basic user tries to access an account they do not own? → A: Redirect the user to `/not-authorized`.
- Q: Should the child entity counts in the detail response include soft-deleted rows? → A: No, counts must only include non-deleted rows (`IsDeleted = false`).
