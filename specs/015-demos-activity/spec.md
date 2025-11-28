# Feature Specification: Spec 015 – Demo Entity & Demo Activity History

**Feature Branch**: `015-demos-activity`  
**Created**: 2025-11-24  
**Status**: Draft  
**Input**: User description: "Introduce “Demos” as a first-class CRM activity per Account, with backend entity/endpoints and frontend Demos tab for Admin and Basic users. Track who aligned and conducted the demo, when it was scheduled and completed, attendees/POCs, and notes. Build a reusable demo history layer for future activities."

## Clarifications

### Session 2025-11-24

- Q: Can demos be edited after creation? → A: Demos can be edited via an update endpoint and UI in the Demos tab (core fields like doneAt, doneBy, attendees, notes, and correcting scheduledAt if needed).

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

### User Story 1 - View demo history for an account (Priority: P1)

Admin and Basic users can see all demos associated with an account in a dedicated **Demos** tab on the Account detail page.

**Why this priority**: Without a clear historical view of demos, users cannot understand engagement history or prepare follow‑ups. Viewing demo history is the foundation for any further demo-related actions.

**Independent Test**: Can be fully tested by navigating to an existing account and verifying that the Demos tab lists demos returned from the backend, including soft‑delete filtering.

**Acceptance Scenarios**:

1. **Given** an account with one or more demos, **When** an Admin opens the Account detail page and selects the **Demos** tab, **Then** the system shows a table of demos with scheduledAt, doneAt, alignedBy, doneBy, attendees/POCs, and notes for that account only.
2. **Given** an account whose demos have `isDeleted = true`, **When** any user who can view the account opens the **Demos** tab, **Then** the deleted demos do **not** appear in the table.
3. **Given** a Basic user who is allowed to view an account, **When** they open the **Demos** tab for that account, **Then** they see the same demo list as an Admin, subject to the same soft‑delete filtering.

---

### User Story 2 - Create a demo for an account (Priority: P2)

Admins and eligible Basic users can add a new demo record to an account from the **Demos** tab using a modal form.

**Why this priority**: Creating demos is the main action that populates the demo history. It must be quick and consistent so users record demos instead of keeping them offline.

**Independent Test**: Can be fully tested by creating a demo through the UI, verifying the POST call, and seeing the new row appear in the list without reloading the page.

**Acceptance Scenarios**:

1. **Given** an Admin user viewing an account’s **Demos** tab, **When** they click **+ Add Demo**, fill in scheduledAt, attendees/POCs, leave optional fields blank, and submit, **Then** a new demo is created via `POST /api/Accounts/{accountId}/demos`, the modal closes, and the new demo appears at the top of the demos table.
2. **Given** a Basic user who **created** the account, **When** they open the account’s **Demos** tab and click **+ Add Demo**, **Then** they can submit the form successfully and see the new demo added to the list.
3. **Given** a Basic user who did **not** create the account, **When** they open the account’s **Demos** tab, **Then** they see the list but the **+ Add Demo** button is hidden or disabled so they cannot create demos.

---

### User Story 3 - Track demo completion and responsibilities (Priority: P3)

Users can capture who aligned and conducted a demo, plus when it was actually completed, for auditability and follow‑ups.

**Why this priority**: Knowing which team member aligned vs. conducted the demo and whether it is completed is important for performance tracking and next‑step planning, but it builds on basic creation and listing.

**Independent Test**: Can be tested by creating and later updating demos to set `doneAt` and `demoDoneByUserId`, then verifying that this information appears correctly in the list.

**Acceptance Scenarios**:

1. **Given** a logged‑in user creating a demo, **When** they open the **Add Demo** modal, **Then** `Demo aligned by` defaults to the current user while `Demo done by` and `Completed at` can be left blank or set explicitly.
2. **Given** a demo with `doneAt` and `demoDoneByUserId` populated, **When** a user views the demos table, **Then** they see both the completion timestamp and the display names of the alignedBy and doneBy users.
3. **Given** a demo that is not yet completed (`doneAt` is null), **When** a user views the demos table, **Then** the `Done at` / `Done by` columns clearly show that the demo is pending (e.g., empty or “—”).

---

### Edge Cases

- A demo is created with `scheduledAt` in the past (back‑filled data or late entry). The system must accept it and display it correctly in chronological order.
- A demo is created without `doneAt` and `demoDoneByUserId`. The system must treat it as scheduled/pending and not require completion info.
- The account is soft‑deleted after demos exist. The account and its demos should no longer be visible through normal account detail routes.
- A user who previously had access to an account loses permission (e.g., role change). They should no longer be able to view that account’s demos.
- Soft‑deleted demos (via a future delete endpoint) must not appear in `GET /api/Accounts/{accountId}/demos` results.
- Time zone differences between client and server: scheduledAt and doneAt must be stored in UTC on the backend and consistently formatted on the frontend.

## Requirements *(mandatory)*

-->

### Functional Requirements

- **FR-001**: The system MUST introduce a `Demo` entity persisted in the database with at least: `Id`, `AccountId`, `ScheduledAt`, `DoneAt` (nullable), `DemoAlignedByUserId`, `DemoDoneByUserId` (nullable), `Attendees`/POCs (text or JSON), `Notes`, `CreatedAt`, `UpdatedAt`, and `IsDeleted` for soft delete.
- **FR-002**: The system MUST expose `POST /api/Accounts/{accountId}/demos` to create a demo for a specific account, validating required fields (`accountId`, `scheduledAt`, `demoAlignedByUserId`) and enforcing RBAC.
- **FR-003**: The system MUST expose `GET /api/Accounts/{accountId}/demos` to list demos for a given account, returning only records where `IsDeleted = false` and the caller has permission to view the account.
- **FR-004**: The system MUST expose an update endpoint (e.g., `PUT /api/Accounts/{accountId}/demos/{demoId}`) that allows editing core demo fields such as `ScheduledAt`, `DoneAt`, `DemoAlignedByUserId`, `DemoDoneByUserId`, `Attendees`, and `Notes`, with the same RBAC rules as creation.
- **FR-005**: The system SHOULD expose a soft‑delete endpoint (e.g., `DELETE /api/Accounts/{accountId}/demos/{demoId}`) that marks `IsDeleted = true` without removing the row, and subsequent list calls MUST exclude it.
- **FR-006**: RBAC MUST ensure that Admin users can create and edit demos for any account, while Basic users can create and edit demos only for accounts they created (aligned with existing Contacts and Accounts rules).
- **FR-007**: Anyone who can view an account (Admin or authorized Basic) MUST be able to list that account’s demos via the Demos tab and corresponding API.
- **FR-008**: The frontend MUST provide API helpers `getAccountDemos(accountId)`, `createAccountDemo(accountId, input)`, and `updateAccountDemo(accountId, demoId, input)` that call the backend endpoints and map to strongly typed DTOs.
- **FR-009**: The Account detail pages for Admin (`/accounts/[id]`) and Basic (`/my-accounts/[id]`) MUST include a **Demos** tab next to existing tabs (Company Info, Notes, Activity, etc.).
- **FR-010**: Within the **Demos** tab, the UI MUST show a table with at least the columns: Scheduled at, Done at, Aligned by, Done by, Attendees/POCs, Notes.
- **FR-011**: The **Demos** tab MUST include a **+ Add Demo** button for Admins and eligible Basic users; this button MUST open a modal form and be hidden or disabled for users without create permission.
- **FR-012**: The Add Demo modal MUST collect: scheduledAt (datetime), attendees/POCs (text or line‑separated list), demoAlignedByUserId (defaulted to current user, but overrideable if needed), demoDoneByUserId (optional), doneAt (optional datetime), and notes (textarea), using Spec 013 dark/light styling.
- **FR-013**: Upon successful demo creation or update, the frontend MUST close the modal (for create) or inline editor (for update, if implemented) and refresh the demos table **without** a full page reload (e.g., by refetching `getAccountDemos`).
- **FR-014**: The system MUST ensure that demos associated with soft‑deleted accounts are not visible through standard account detail and demo list endpoints.

No `[NEEDS CLARIFICATION]` items remain for this spec; reasonable defaults (e.g., soft delete behavior, UTC timestamps) are assumed and documented here.

### Key Entities *(include if feature involves data)*

- **Account**: Existing CRM account object; parent entity for demos. Demos are always scoped to a single account via `AccountId`.
- **Demo**: Represents a single demo interaction for an account. Key attributes: `Id`, `AccountId`, `ScheduledAt`, `DoneAt`, `DemoAlignedByUserId`, `DemoDoneByUserId`, `Attendees`/POCs, `Notes`, `CreatedAt`, `UpdatedAt`, `IsDeleted`.
- **User**: Existing user entity used to resolve `demoAlignedByUserId` and `demoDoneByUserId` into display names in the UI.

## Dependencies & Assumptions

- Depends on existing **Accounts** and **Users** tables, RBAC rules, and JWT-based authentication as defined in the Pre-Sales CRM Constitution.  
- Assumes soft-delete patterns (e.g., `IsDeleted`) and ActivityLog mechanisms are already available and reused for Demos.  
- Assumes no external calendar/email integrations or notification workflows are in scope for Spec 015; these will be handled in later specs.  
- Assumes typical scale of tens of demos per account and thousands of accounts; high-volume demo analytics and bulk operations are out of scope.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: For any account with at least one demo, the Demos tab loads and displays results from `GET /api/Accounts/{accountId}/demos` in under 1 second on average under normal load.
- **SC-002**: 95%+ of successful demo creations via the Add Demo modal result in the new demo appearing in the table within 2 seconds, without a full page reload.
- **SC-003**: In a test scenario, Admin and eligible Basic users can create demos for at least 3 different accounts without encountering permission errors or inconsistent RBAC behavior.
- **SC-004**: Soft‑deleted demos do not appear in any Demos tab views or list endpoints, confirmed by automated tests that create, soft‑delete, and re‑list demos.
