# Feature Specification: Spec 014 – Lead Source & Deal Stage Integration

**Feature Branch**: `014-lead-source-deal-stage`  
**Created**: 2025-11-23  
**Status**: Draft  
**Input**: Introduce basic CRM pipeline structure by adding Lead Source and Deal Stage to Accounts and making them fully manageable across create, edit, and detail flows for both Admin and Basic users.

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Capture lead source when creating an account (Priority: P1)

A sales or pre-sales user creating a new account can specify where the lead came from (e.g. LinkedIn, Website, Referral) so that reporting and pipeline analysis later know the origin of each opportunity.

**Why this priority**: Capturing lead source at creation time is foundational for all downstream reporting and targeting. If it is missed here, it is unlikely to be accurately recovered later.

**Independent Test**: From the Admin “New Account” page, create an account while selecting different Lead Source options and confirm that the value persists and is visible on the account detail page.

**Acceptance Scenarios**:

1. **Given** an Admin user on the Account Create page, **When** they open the Lead Source dropdown, **Then** they see all configured options: LinkedIn, Instagram, Website, Cold Call, Facebook, Google Ads, Referral.
2. **Given** an Admin user creating a new account, **When** they select `LinkedIn` as the Lead Source and save the account, **Then** the account detail view shows Lead Source = LinkedIn.
3. **Given** an Admin user creating a new account, **When** they do not select any Lead Source but it is required, **Then** they see a clear validation message and the account is not created until a valid option is chosen.

---

### User Story 2 – Track deal stage progression on accounts (Priority: P1)

A sales or pre-sales user can set and update the Deal Stage for an account (e.g. New Lead → Contacted → Qualified → In Progress → Won/Lost) to reflect its current position in the pipeline.

**Why this priority**: Deal Stage is the core indicator of pipeline status; without it, there is no visibility into where each account stands or how the pipeline is progressing.

**Independent Test**: On an existing account’s edit flow, change the Deal Stage across multiple stages and verify that the updated stage appears consistently on all relevant views.

**Acceptance Scenarios**:

1. **Given** an Admin user on the Account Edit page, **When** they open the Deal Stage dropdown, **Then** they see the configured pipeline stages (e.g. New Lead, Contacted, Qualified, In Progress, Won, Lost).
2. **Given** an Admin user viewing an account currently in `New Lead` stage, **When** they update the Deal Stage to `Qualified` and save, **Then** the account detail view shows Deal Stage = Qualified.
3. **Given** an Admin or Basic user viewing an account in `Won` stage, **When** they open the detail page, **Then** the Deal Stage is displayed read-only and clearly indicates `Won`.

---

### User Story 3 – Basic user visibility and editing (Priority: P2)

A Basic user (e.g. the account owner in the My Accounts area) can see and update the Lead Source and Deal Stage for their own accounts using the same pipeline model, subject to the existing access rules on which accounts they can manage.

**Why this priority**: Basic users need a clear view of where they stand in the pipeline and, in many workflows, are responsible for keeping their own account status up to date.

**Independent Test**: Sign in as a Basic user, navigate to My Accounts, open an account detail page, and verify that Lead Source and Deal Stage are both visible and editable. Change them and confirm the changes persist after saving and reloading.

**Acceptance Scenarios**:

1. **Given** a Basic user on the My Account Detail page, **When** they scroll through the Company Info section, **Then** they see Lead Source and Deal Stage values presented alongside other account metadata.
2. **Given** a Basic user on the My Account Edit flow for an account they are allowed to manage, **When** they change Lead Source and Deal Stage using the dropdowns and save, **Then** the updated values are visible on subsequent detail page loads.
3. **Given** a Basic user attempting to manage an account they are not allowed to edit, **When** they open the account, **Then** Lead Source and Deal Stage appear read-only, consistent with other non-editable fields for that account.

---

### Edge Cases

- Accounts created before this feature is deployed without leadSource/dealStage data MUST be backfilled by a migration so they have non-null Lead Source and Deal Stage values, and MUST display safe, business-approved defaults (e.g. Lead Source = "Not Set" and Deal Stage = `NEW_LEAD`) without breaking pages.
- Invalid enum values returned by the backend (e.g. due to legacy data or future enum extensions) MUST be handled gracefully in the UI (e.g. show `Unknown` instead of crashing) while still logging for follow-up.
- When network or validation errors occur while updating Lead Source or Deal Stage, the UI MUST show a clear error and leave the current (saved) value intact.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-014-001**: System MUST introduce a canonical set of lead source options via a LeadSource enum/table with at least: `LINKEDIN`, `INSTAGRAM`, `WEBSITE`, `COLD_CALL`, `FACEBOOK`, `GOOGLE_ADS`, `REFERRAL`.
- **FR-014-002**: System MUST introduce a canonical set of pipeline stages via a DealStage enum/table with at least: `NEW_LEAD`, `CONTACTED`, `QUALIFIED`, `IN_PROGRESS`, `WON`, `LOST` (names may be adjusted to match house style but semantics MUST remain clear).
- **FR-014-003**: The Account domain model and API DTOs MUST be extended to include `leadSource: LeadSource` and `dealStage: DealStage` as first-class properties, and these properties MUST be populated for both newly created and previously existing accounts.
- **FR-014-004**: All account creation endpoints MUST accept `leadSource` and `dealStage` values, validate them against the allowed enums, and persist them on successful creation.
- **FR-014-005**: All account update endpoints that modify company-level data MUST accept changes to `leadSource` and `dealStage`, validate the enum values, and persist updates atomically with other account fields.
- **FR-014-006**: Account GET/detail endpoints MUST always return the current `leadSource` and `dealStage` values for each account.
- **FR-014-007**: Backend validation MUST reject any `leadSource` or `dealStage` value that is not part of the configured enum set and return a clear, field-specific error message.
- **FR-014-008**: Account Create pages (Admin) MUST render TailAdmin-style select controls for both Lead Source and Deal Stage, populated from the canonical option lists.
- **FR-014-009**: Account Edit pages (Admin) MUST allow changing Lead Source and Deal Stage using the same dropdown controls and MUST disable the controls while a save is in progress.
- **FR-014-010**: Account Detail pages (Admin and Basic) MUST display Lead Source and Deal Stage in the Company Info section using theme-consistent components; when the current user has edit rights for that account, the associated Edit flow MUST allow changing these values.
- **FR-014-011**: For new accounts, the default Deal Stage MUST be `NEW_LEAD` unless explicitly specified by the caller; the frontend MUST initialize the dropdown accordingly, and the migration MUST assign an appropriate default Deal Stage to historical accounts.
- **FR-014-012**: If leadSource is optional by business rules, the UI MUST allow a blank/"Not Set" state and handle it without errors; if required, the UI MUST prevent form submission until a valid value is selected.
- **FR-014-013**: Enum option labels shown in the UI MUST be human-friendly (e.g. `NEW_LEAD` → "New lead", `COLD_CALL` → "Cold call") while preserving stable enum keys in the backend.
- **FR-014-014**: All new UI components and states for Lead Source and Deal Stage MUST respect the dark/light theming rules defined in Spec 013.
- **FR-014-015**: Both Admin and Basic users MUST be able to edit Lead Source and Deal Stage for accounts they are allowed to manage under the existing RBAC model; users without edit rights MUST still be able to view these fields in read-only form.

### Key Entities *(include if feature involves data)*

- **LeadSource**: Enumeration/table representing the origin of an account or opportunity (e.g. LinkedIn, Website, Referral). Used for reporting, segmentation, and attribution.
- **DealStage**: Enumeration/table representing the pipeline stage of an account or deal (e.g. New Lead, Contacted, Qualified, In Progress, Won, Lost).
- **Account**: Existing entity extended with two additional properties: `leadSource` and `dealStage`.
- **AccountDTO / API payloads**: Request/response representations of an Account that now include `leadSource` and `dealStage` fields to keep backend, API, and UI in sync.

## Clarifications

### Decisions Captured

1. **Basic user editing rights** – Basic users are allowed to view and edit `leadSource` and `dealStage` for accounts they are permitted to manage under the existing RBAC rules; for other accounts, these fields remain read-only.
2. **Lead Source on existing accounts** – Lead Source MUST be added for already existing accounts via migration, with a safe default value (e.g. "Not Set") applied where no historical information is available.
3. **Historical accounts and Deal Stage** – For accounts that pre-date this feature, Deal Stage MUST be initialized by migration (e.g. defaulting to `NEW_LEAD` or another clearly documented starting stage) so that all accounts participate in the pipeline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-014-001**: In manual tests, 100% of new accounts created via the Admin UI include a valid `leadSource` and `dealStage` value, and these values are visible on the account detail page after page reload.
- **SC-014-002**: In manual tests, editing an existing account’s Deal Stage and Lead Source via the Admin Edit flow correctly updates the values as confirmed by a subsequent GET request or page refresh in at least 10 representative accounts.
- **SC-014-003**: Basic and Admin account detail views consistently display Lead Source and Deal Stage for all accounts, including those created before this feature, without broken UI or runtime errors.
- **SC-014-004**: No invalid enum values for `leadSource` or `dealStage` are accepted by the backend during testing; attempts to submit invalid values result in clear validation messages and no data corruption.
- **SC-014-005**: New UI elements for Lead Source and Deal Stage pass a visual QA check in both light and dark modes (per Spec 013), with readable text, sufficient contrast, and no layout regressions on key account pages.

---

## Implementation Log / Commands (Spec 014)

This section will be maintained during implementation to document how Spec 014 is realized.

### Backend / Infrastructure Steps

- _Planned_: Add LeadSource and DealStage enums/tables and extend the Account persistence model with `leadSource` and `dealStage` fields.
- _Planned_: Add database migrations to backfill defaults for existing accounts and enforce appropriate constraints.
- _Planned_: Update account create/update/detail endpoints to read/write/return the new fields and validate enum values.

### Frontend Steps

- _Planned_: Extend account creation/edit forms (Admin) with TailAdmin-style select controls for Lead Source and Deal Stage, using canonical option lists.
- _Planned_: Surface Lead Source and Deal Stage on Admin and Basic account detail pages with read-only, theme-respecting UI.
- _Planned_: Wire default Deal Stage to `NEW_LEAD` for new accounts and ensure edits persist round-trip through the API.

### Representative Commands

- `git checkout 014-lead-source-deal-stage`
- `npm run dev` – verify Lead Source and Deal Stage flows during development.
- `npm run lint` – ensure no lint errors introduced by new fields and UI.
- `npm run test` – run or extend tests that cover account creation, editing, and detail views.

> Update this section as implementation progresses to keep Spec 014 traceable to actual changes.
