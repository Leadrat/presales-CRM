# Implementation Plan: Spec 014 – Lead Source & Deal Stage Integration

**Branch**: `014-lead-source-deal-stage` | **Date**: 2025-11-23 | **Spec**: `specs/014-lead-source-deal-stage/spec.md`
**Input**: Feature specification for adding Lead Source and Deal Stage to Accounts and making them manageable across create, edit, and detail flows for both Admin and Basic users, including backfilling existing accounts.

## Summary

Introduce pipeline metadata to the existing CRM by adding two standardized fields to the Account domain: `leadSource` and `dealStage`. On the backend, create canonical enums/tables, extend the Account model and API contracts, and run a migration that backfills reasonable defaults for all historical accounts. On the frontend, expose these fields via TailAdmin-style selects on Admin and Basic account forms (create/edit) and show them clearly on detail pages, while respecting existing RBAC and dark/light theming (Spec 013). Validation will ensure only allowed enum values are accepted end-to-end.

## Technical Context

**Language/Version**: C# (.NET backend), TypeScript, Next.js (App Router) frontend  
**Primary Dependencies**: Entity Framework Core for persistence, existing Account repository/services, Next.js app in `frontend/` with Tailwind CSS + TailAdmin, existing `lib/api.ts` client for account endpoints  
**Storage**: Existing application database (accounts table); new LeadSource/DealStage definition mechanism (either enums and/or lookup tables) persisted alongside Account data  
**Testing**: Existing backend tests (if any) plus targeted unit/integration tests for new fields; manual UI verification of Admin and Basic flows; potential extension of frontend tests for forms and detail views  
**Target Platform**: Web app accessed by Admin and Basic users via modern browsers  
**Project Type**: Split `backend/` (API + data) and `frontend/` (Next.js UI) monorepo  
**Performance Goals**: Adding the two fields must have negligible impact on request latency; migrations must run safely within normal deployment windows  
**Constraints**: Must not break existing account APIs; must remain backwards compatible for callers that don’t yet send `leadSource`/`dealStage` (defaults applied); must respect dark/light theming rules from Spec 013 and existing RBAC model for who can edit which account fields  
**Scale/Scope**: Single product CRM with a moderate number of accounts; all accounts (historical and future) will participate in the pipeline model.

## Constitution Check

*GATE: Must pass before deeper design. Re-check after data model and contracts are finalized.*

- Reuses existing stack (C# backend, Next.js + Tailwind/TailAdmin frontend); no new language or framework introduced.  
- Extends the Account model rather than introducing a separate Deal/Opportunity object, keeping scope focused.  
- Backend changes are incremental (new enums/columns + migration) and do not require new infrastructure.  
- Frontend forms and detail pages are extended in-place, respecting existing patterns for account editing and theming.

## Project Structure

### Documentation (this feature)

```text
specs/014-lead-source-deal-stage/
├── spec.md        # Feature specification (already written)
├── plan.md        # This implementation plan
├── research.md    # Optional research/decision log, if needed
├── data-model.md  # LeadSource, DealStage, Account extensions
├── quickstart.md  # How to exercise lead source & pipeline flows
└── contracts/     # HTTP/API contracts for account endpoints
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── Models/
    │   ├── Account.cs                 # Extended with LeadSource/DealStage
    │   └── LeadSource.cs / DealStage.cs (if lookup tables used)
    ├── Data/
    │   └── Migrations/                # New migration for columns + backfill
    ├── Services/
    │   └── Accounts/                  # Business logic updated to handle fields
    └── Controllers/
        └── AccountsController.cs      # Expose leadSource/dealStage on GET/POST/PUT

frontend/
└── src/
    ├── lib/
    │   └── api.ts                     # Account DTOs & client updated with new fields
    ├── app/
    │   ├── (admin)/accounts/new/page.tsx      # Admin create: selects for Lead Source/Deal Stage
    │   ├── (admin)/accounts/[id]/page.tsx     # Admin detail/edit: show & edit fields
    │   ├── (protected)/my-accounts/page.tsx   # Basic list view (if showing columns)
    │   ├── (protected)/my-accounts/[id]/page.tsx   # Basic detail: show & edit fields
    │   └── (protected)/my-accounts/[id]/edit/page.tsx # Basic edit flow, if separate
    └── components/
        └── accounts/
            └── LeadSourceDealStageSelects.tsx # (optional) shared UI components for selects
```

**Structure Decision**: Implement Lead Source and Deal Stage as additional properties on the existing Account model and reuse the existing account endpoints. Keep UI changes localized to the existing account pages and forms.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified.** Currently, none are expected.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
|           |            |                                       |

## Phase Plan

### Phase 0 – Data & Contracts Design

1. **Data model design (`data-model.md`)**  
   - Define `LeadSource` and `DealStage` enums (or lookup tables) with canonical keys and labels.  
   - Extend `Account` entity with `LeadSource` and `DealStage` properties (nullable vs non-nullable as per spec decision; backfill will ensure non-null in practice).  
   - Document defaulting rules for historical accounts (e.g. Lead Source = "Not Set", Deal Stage = `NEW_LEAD`).

2. **API contract design (`contracts/`)**  
   - Update or define OpenAPI/contract docs for account create, update, and detail endpoints to include `leadSource` and `dealStage`.  
   - Specify validation rules (only allowed enum values; clear error shapes).  
   - Confirm how clients that omit these fields are handled (defaults applied server-side).

3. **Research notes (`research.md`, optional)**  
   - Capture any decisions about enum naming, DB representation (string vs int), and migration/backfill strategy.

### Phase 1 – Backend Implementation

1. **Model & migration**  
   - Add `LeadSource` and `DealStage` enum/lookup definitions.  
   - Extend `Account` entity and EF model configuration.  
   - Create a migration that:  
     - Adds new columns to the Accounts table.  
     - Backfills existing rows with safe defaults for both fields.  
     - Enforces appropriate nullability/constraints once backfill is complete.

2. **Services & business logic**  
   - Update account creation/update services to accept and validate `leadSource` and `dealStage`.  
   - Ensure updates to these fields are included in existing unit-of-work/transaction scopes.

3. **Controllers / endpoints**  
   - Update account POST/PUT endpoints to bind and validate the new fields.  
   - Update GET/detail endpoints to always include `leadSource` and `dealStage` in responses.  
   - Add/extend tests for invalid enum values and defaulting behavior.

### Phase 2 – Frontend Implementation

1. **API client & DTOs**  
   - Update `lib/api.ts` account types and client functions to include `leadSource` and `dealStage` in request/response DTOs.  
   - Provide typed option lists for Lead Source and Deal Stage (reusing backend enum keys and human labels).

2. **Admin flows**  
   - **Account Create (admin)**:  
     - Add TailAdmin-style select components for Lead Source and Deal Stage.  
     - Initialize Deal Stage to `NEW_LEAD` by default; set Lead Source to blank/"Not Set" until chosen.  
   - **Account Detail/Edit (admin)**:  
     - Show Lead Source and Deal Stage in the Company Info section in view mode.  
     - In edit mode, render the same selects and wire them into the existing inline edit/save flow.  
     - Ensure error handling is consistent with other fields when backend validation fails.

3. **Basic flows**  
   - **My Accounts Detail (basic)**:  
     - Display Lead Source and Deal Stage alongside other company info fields.  
   - **My Accounts Edit (basic)**:  
     - Add the same select controls to the basic edit flow (inline or dedicated page), respecting existing state management.  
     - Ensure values are persisted via the same account update API as admin, constrained by RBAC.

4. **Styling & theming**  
   - Apply TailAdmin / Tailwind light-first styles with `dark:` variants to new fields, matching surrounding layout.  
   - Verify both dark and light modes on all updated pages (admin and basic).

### Phase 3 – Validation & QA

1. **Backend QA**  
   - Verify migrations on a copy of production-like data (including backfill correctness).  
   - Test account create/update with all valid enum combinations and some invalid values.  
   - Confirm all account GETs include the new fields.

2. **Frontend QA**  
   - Walk through Admin and Basic flows: create, edit, and view accounts with different Lead Source and Deal Stage combinations.  
   - Confirm fields persist after reload and are consistent across pages.  
   - Validate behavior for accounts created before this feature (backfilled data).

3. **Regression & sign-off**  
   - Ensure existing account functionality (non-pipeline fields) remains intact.  
   - Review against Spec 014 Success Criteria and mark each outcome as met or follow-up required.
