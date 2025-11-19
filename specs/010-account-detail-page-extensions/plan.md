# Implementation Plan: Spec 10 — Account Detail Page Extensions

**Branch**: `010-account-detail-page-extensions` | **Spec**: `specs/010-account-detail-page-extensions/spec.md`

## Summary

Implement **Account Detail Page Extensions** for Phase 2 — Accounts & Company Data by:

- Extending the **backend** with:
  - A complete `GET /api/accounts/{id}/detail` endpoint (full fields & counts) aligned with Spec 000 and Spec 9.
  - Child tab data endpoints for **Contacts**, **Demos**, **Notes**, and **Activity Log**, all RBAC-aware and excluding soft-deleted rows.
- Extending the **frontend** account detail page at `/accounts/[id]` (admin route group) with:
  - Tabs: **Company Info, Contacts, Demos, Notes, Activity Log**.
  - Lazy loading per tab, shared error handling, and consistent UX states.
  - Breadcrumbs `Accounts > {AccountName}`.

This plan assumes Spec 000, Spec 008 (Accounts), and Spec 009 (initial Account Detail) are already implemented and working.

## Technical Context

- **Backend**
  - Language/Framework: C# / ASP.NET Core Web API.
  - Data access: Entity Framework Core with PostgreSQL.
  - Auth: JWT-based auth + RBAC (Admin/Basic) as per Spec 000/Spec 5.
  - Existing pieces:
    - `AppDbContext` with `Accounts`, `Contacts`, `Activities`, etc.
    - `AccountsController` and detail/list endpoints from Spec 9.
    - Global activity log/audit mechanisms.

- **Frontend**
  - Framework: Next.js 15 (App Router) + React + TypeScript.
  - Auth: `AuthContext`, `fetchWithAuth`, protected `(admin)` route group.
  - Existing pieces:
    - Accounts list page at `frontend/src/app/(admin)/accounts/page.tsx`.
    - Initial Account Detail page at `frontend/src/app/(admin)/accounts/[id]/page.tsx` from Spec 9.

- **Storage & Scale**
  - PostgreSQL with GUID PKs, lookup tables, soft delete fields as per Spec 000.
  - Expected scale: tens of thousands of accounts; hundreds of child rows (contacts, demos, notes, activity log entries) per account.

## Constitution Check (Spec 000)

Relevant rules from **Spec 000 — Architecture & Conventions**:

- Data modeling:
  - Use GUID primary keys for new tables.
  - Avoid enums/JSONB for categoricals → use lookup tables.
  - Include ownership fields (`CreatedByUserId`) and soft delete (`IsDeleted`) where applicable.
- Auth & RBAC:
  - Enforce RBAC in controllers using JWT roles.
  - Do not expose `CreatedByUserId` in responses.
- API & DTOs:
  - Response envelope `{ data }` / `{ error }`.
  - Consistent error codes and messages.
- Governance:
  - All new tables must be added to `docs/table-catalog.md`.

**Gate result**: PASS — Spec 10 builds on Spec 008/009 and follows Spec 000 conventions for data modeling, RBAC, and error handling.

## Project Structure

```text
specs/010-account-detail-page-extensions/
├── spec.md            # Feature spec (requirements & clarifications)
├── plan.md            # This implementation plan
├── research.md        # Phase 0 research & decisions
├── data-model.md      # Entities and relationships for Spec 10
├── quickstart.md      # How to exercise Spec 10
├── contracts/         # API contracts (detail & child tab endpoints)
└── tasks.md           # Task list (structure defined, to be refined)

backend/
├── AppDbContext.cs
├── Models/
│   ├── Account.cs
│   ├── Contact.cs
│   ├── Note.cs
│   ├── ActivityLog*.cs         # existing audit/activity models
│   └── Demo.cs (if introduced) # canonical Demos entity
├── Controllers/
│   ├── AccountsController.cs   # extend with detail & child tab endpoints
│   └── other controllers
└── Migrations/
    └── [new] migrations for Demos/relations (if needed)

frontend/
├── src/app/
│   ├── (admin)/accounts/
│   │   ├── page.tsx            # Accounts list
│   │   └── [id]/page.tsx       # Account Detail Page (extended for tabs)
│   ├── not-authorized/page.tsx
│   └── (protected)/dashboard/page.tsx
├── src/lib/api.ts              # API helpers for accounts & child data
└── src/context/AuthContext.tsx
```

## Phase 0 — Research & Clarifications

Goals:
- Confirm how **Demos** and **Activity Log** are modeled in the existing codebase.
- Identify any gaps between Spec 10 and current models/endpoints.

Activities:
- Inspect backend models for any existing Demo/ActivityLog entities.
- Verify current `AccountsController` endpoints and DTOs (from Spec 9).
- Check `docs/table-catalog.md` for Accounts, Contacts, Notes, Activities, and any Demos-related tables.

Output:
- `research.md` summarising decisions and alternatives (e.g., how to represent Demos, which activity types to surface).

## Phase 1 — Design & Contracts

### Backend Design

- Extend `AccountDetailDto` (or equivalent) to include:
  - Full account fields from Spec 10.
  - `demoCount` sourced from the canonical `Demos` entity/table.
- Design child tab DTOs:
  - `ContactSummaryDto`, `DemoSummaryDto`, `NoteSummaryDto`, `ActivityLogEntryDto`.
- Define controller actions on `AccountsController`:
  - `GET /api/accounts/{id}/detail`
  - `GET /api/accounts/{id}/contacts`
  - `GET /api/accounts/{id}/demos`
  - `GET /api/accounts/{id}/notes`
  - `GET /api/accounts/{id}/activity-log`
- Ensure all endpoints:
  - Use `{ data }` / `{ error }` envelope.
  - Enforce RBAC and ownership via existing policies/handlers.
  - Exclude soft-deleted rows from counts and lists.

### Frontend Design

- Extend `frontend/src/lib/api.ts` with typed helpers for:
  - `getAccountDetail(id)` (extended fields).
  - `getAccountContacts(id)`, `getAccountDemos(id)`, `getAccountNotes(id)`, `getAccountActivityLog(id)`.
- Design the Account Detail React component to:
  - Render tabs and manage active tab state.
  - Lazy-load tab data on first activation and cache in component state.
  - Handle loading/empty/error states per Spec 10.
  - Handle 403/404/500 by redirecting or showing inline states.
- Breadcrumbs:
  - Use the account detail payload (`companyName`) to render `Accounts > {AccountName}` and link `Accounts` back to the list page.

### Contracts & Quickstart

- Document all endpoints and DTOs in `contracts/` (Markdown or OpenAPI fragments).
- Provide a simple end-to-end flow in `quickstart.md`:
  - Seed or create an account.
  - Hit detail endpoint and child tab APIs.
  - Open `/accounts/[id]` and exercise all tabs.

## Phase 2 — Implementation Outline

> Concrete tasks are tracked in `tasks.md`; this section gives the high-level order of work.

1. **Backend**
   - Update/confirm data model and migrations for Demos (if needed).
   - Implement or extend `GET /api/accounts/{id}/detail` to match Spec 10.
   - Implement child tab endpoints with RBAC & soft delete handling.
   - Add/update tests or manual scripts to validate 403/404/500 and counts.

2. **Frontend**
   - Extend API client with new helpers.
   - Upgrade `accounts/[id]/page.tsx` to add tabs, lazy loading, and breadcrumbs.
   - Implement loading/empty/error states for each tab.

3. **Validation**
   - Verify flows for Admin and Basic users.
   - Test large accounts with many child rows.
   - Confirm error behaviours (403 redirect, 404 not found, 500 inconsistency).

## Complexity & Risks

- Added complexity:
  - Multiple child endpoints with shared RBAC and error handling.
  - Lazy loading and caching of tab data in the frontend.
- Key risks:
  - Inconsistent counts vs. tab data if queries diverge.
  - Performance issues on large datasets if queries are not optimized.

Mitigations:
- Reuse existing ownership/authorization helpers.
- Centralise query logic for counts and lists.
- Add targeted indexes if needed during implementation.
