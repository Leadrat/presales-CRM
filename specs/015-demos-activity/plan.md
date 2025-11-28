# Implementation Plan: Spec 015 – Demo Entity & Demo Activity History

**Branch**: `015-demos-activity` | **Date**: 2025-11-24 | **Spec**: `specs/015-demos-activity/spec.md`
**Input**: Feature specification from `specs/015-demos-activity/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a new `Demo` activity for CRM Accounts so Admin and Basic users can record and review demos per account. Backend work adds a `Demo` entity, EF Core migration, RBAC-protected REST endpoints (`POST/GET/PUT/DELETE`) and soft-delete filtering. Frontend work adds API helpers and a **Demos** tab on both Admin and Basic account detail pages, with a TailAdmin-styled table and modal for creating/updating demos that refreshes without full page reloads.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Backend: C#/.NET with ASP.NET Core; Frontend: TypeScript with Next.js/React and TailwindCSS/TailAdmin.  
**Primary Dependencies**: Backend: EF Core, ASP.NET Core Web API, existing Auth/RBAC middleware. Frontend: Next.js app router, TailwindCSS, existing UI components (tabs, cards, modals).  
**Storage**: PostgreSQL database (same schema as existing Accounts/Contacts), EF Core migrations.  
**Testing**: Existing test stack (where present); for this feature primarily manual + endpoint- and UI-level tests, can be extended with integration tests later.  
**Target Platform**: Backend: Windows/Linux server; Frontend: modern browsers via Next.js app.  
**Project Type**: Web application with separate backend and frontend folders.  
**Performance Goals**: Demos list and creation should add negligible overhead vs. current Account detail; Demos tab list should load in <1s for typical accounts (<100 demos).  
**Constraints**: Reuse existing RBAC and soft-delete patterns; keep schema additive (no breaking changes to existing entities).  
**Scale/Scope**: Expected tens of demos per account, thousands of accounts—well within current DB and API patterns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Aligns with existing architectural patterns: EF Core models + migrations, ASP.NET Core controllers, and typed frontend API helpers.  
- Respects RBAC and soft-delete conventions already used for Accounts and Contacts.  
- Scope is constrained to additive changes (new entity + tabs) without reworking existing flows.

## Project Structure

### Documentation (this feature)

```text
specs/015-demos-activity/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (decisions & rationale)
├── data-model.md        # Phase 1 output (Account, Demo, User)
├── quickstart.md        # Phase 1 output (how to run & test demos)
├── contracts/           # Phase 1 output (Demo API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks, not created yet)
```

### Source Code (repository root)

```text
backend/
├── Models/
│   ├── Account.cs
│   └── Demo.cs              # NEW: Spec 015 Demo entity
├── Controllers/
│   ├── AccountsController.cs
│   └── DemosController.cs   # NEW or AccountsController extension for demo endpoints
├── Migrations/
│   ├── 2025xxxx_AddDemo.cs  # NEW EF migration for Demo table
│   └── ...
└── ... (services, auth, etc.)

frontend/
├── src/
│   ├── lib/
│   │   └── api.ts                          # NEW helpers: getAccountDemos, createAccountDemo, updateAccountDemo
│   ├── app/
│   │   ├── (admin)/accounts/[id]/page.tsx  # NEW Demos tab section
│   │   └── (protected)/my-accounts/[id]/page.tsx  # NEW Demos tab section
│   └── components/
│       └── demos/                          # Optional: Demo list + modal components
└── ...
```

**Structure Decision**: Use the existing **backend/** and **frontend/** split. Implement the Demo entity and endpoints under `backend/Models`, `backend/Controllers`, and `backend/Migrations`. Implement UI and API helpers under `frontend/src/lib/api.ts`, account detail pages, and (optionally) new `components/demos` React components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
