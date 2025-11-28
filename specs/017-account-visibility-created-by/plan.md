# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: Backend: .NET 7 (C#); Frontend: Next.js (React, TypeScript)  
**Primary Dependencies**: ASP.NET Core Web API, PostgreSQL driver; Next.js app with React, TailwindCSS, AuthContext  
**Storage**: PostgreSQL (existing `Accounts` and `Users` tables; no new tables expected)  
**Testing**: Backend: xUnit integration tests around `/api/Accounts`; Frontend: Jest/React Testing Library + Playwright for Accounts list flows  
**Target Platform**: Web app – .NET API + Next.js frontend deployed together  
**Project Type**: Web (monorepo with `backend/` and `frontend/`)  
**Performance Goals**: Accounts list first page loads in under ~2s for typical datasets, with pagination used for larger sets  
**Constraints**: Backward-compatible API changes only (additive fields); must honor existing RBAC rules and soft-delete behavior  
**Scale/Scope**: Tens of thousands of accounts, hundreds of users; feature is limited to listing behavior and attribution, no new domains

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity**: Reuse existing `/api/Accounts` endpoint and Accounts list pages; only extend response shape and UI columns. No new microservices or complex abstractions planned.  
- **Auditability**: No change to ActivityLog model or logging responsibilities; visibility changes only affect read paths.  
- **Testability**: Plan includes backend integration tests for the new Created By projection and visibility behavior, plus frontend tests for table rendering and filtering.  
- **Extensibility**: Follow additive schema rules (new nullable fields or projections, no enums/JSONB); use existing GUID keys and lookup tables.  
- **Security & RBAC**: View permissions broadened intentionally (both roles can read all accounts) but edit/delete checks remain enforced server-side as they are today. No new roles or bypasses.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
specs/017-account-visibility-created-by/
├── spec.md
├── plan.md
├── research.md          # Phase 0 – design decisions & tradeoffs
├── data-model.md        # Phase 1 – Account/User attribution shape
├── quickstart.md        # Phase 1 – how to implement & test
└── contracts/           # Phase 1 – /api/Accounts contract snapshot

backend/
├── Controllers/
├── Models/
└── Services/

frontend/
├── src/app/
└── src/lib/
```

**Structure Decision**: Use existing `backend/` (ASP.NET Core API) and `frontend/` (Next.js app) as the only code locations touched by this feature. All Spec 17 documentation artifacts live under `specs/017-account-visibility-created-by/` and describe changes to the Accounts controller/service and the Admin/Basic Accounts list pages.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
