# Implementation Plan: Activity Log Expansion v2

**Branch**: `016-activity-log-expansion` | **Date**: 2025-11-24 | **Spec**: `specs/016-activity-log-expansion/spec.md`
**Input**: Feature specification from `specs/016-activity-log-expansion/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement Activity Log Expansion v2 for the Pre-Sales CRM so that every material account-related action (account changes, contacts, demos, notes) produces a clear, immutable Activity Log entry that can be viewed and filtered per account.

On the **backend** (.NET Core + PostgreSQL), we will:
- Use a dedicated `ActivityLogs` table (aligned with the constitution) plus lookup tables (e.g., `ActivityTypes`) to capture structured events with actor, account, related entity, and message.
- Introduce a small logging layer/service that is called from existing account/contact/demo flows to emit one Activity Log entry per user action.
- Expose a per-account Activity API that returns a paginated, filterable timeline for the frontend.

On the **frontend** (Next.js/React), we will:
- Add an Activity tab/section on the account detail page that lists Activity Log entries in time order.
- Provide filters by event type, date range, and user, with sensible empty/loading states.

## Technical Context

**Language/Version**: C# (.NET Core backend), TypeScript/React with Next.js frontend (versions as configured in the existing repo)  
**Primary Dependencies**: ASP.NET Core Web API, Entity Framework Core, PostgreSQL, Next.js, React, Tailwind CSS  
**Storage**: PostgreSQL with normalized schema and lookup tables (per constitution; no JSONB/enums)  
**Testing**: xUnit/NUnit (backend), Jest + React Testing Library and/or Playwright/Cypress (frontend), plus contract tests for Activity API  
**Target Platform**: Linux-compatible server hosting for backend and Node-based hosting for Next.js frontend  
**Project Type**: Web application (separate `backend/` and `frontend/` projects)  
**Performance Goals**: Activity Log view loads initial entries for a typical account within ~3 seconds in >90% of test runs (per spec SC-004)  
**Constraints**: Must preserve auditability and immutability, follow RBAC rules strictly, and avoid breaking existing account/contact/demo flows  
**Scale/Scope**: Pre-Sales CRM with thousands of accounts and up to a few hundred activity entries per account in typical usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity**: Plan favors a small ActivityLog service and simple REST endpoints instead of complex event buses or over-generalized frameworks. No new architectural layer is introduced beyond what the repo already uses. **Status: PASS.**
- **Auditability**: Every material account-related action will emit an immutable Activity Log entry with actor, entity, type, and correlation ID where available, aligned with the `ActivityLogs` pattern in the constitution. **Status: PASS (must be re-verified in design).**
- **Testability**: Implementation will include unit tests for the logging service, integration tests for the Activity API (including RBAC), and at least one end-to-end UI flow validating the Activity tab. **Status: PASS.**
- **Extensibility**: New activity types and log data will use lookup tables and relational schema (no enums/JSONB), with additive changes only. **Status: PASS.**
- **Security & RBAC**: Activity APIs will be protected by existing JWT auth and RBAC, ensuring users only see logs for accounts they can access. No new unauthenticated endpoints will be introduced. **Status: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/016-activity-log-expansion/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── Controllers/         # e.g., AccountsController, DemosController
├── Models/              # Entity and DTO classes
├── Services/            # Application/domain services (including ActivityLog service)
└── ...                  # Existing startup, configuration, and infrastructure

frontend/
├── src/
│   ├── app/             # Next.js app router pages (e.g., /my-accounts, /my-accounts/[id])
│   ├── components/      # Shared UI components (including Activity Log list/filter components)
│   ├── lib/             # API client helpers, utilities
│   └── ...              # Styles, config, etc.
└── ...                  # Frontend build/test configuration
```

**Structure Decision**: Use the existing two-project structure (`backend/` for ASP.NET Core API, `frontend/` for Next.js) and add Activity Log functionality as incremental modules:
- Backend: new ActivityLog service/module and API endpoints under existing controllers/namespaces.
- Frontend: new Activity tab/section and components under the account detail flow, plus API helpers in `frontend/src/lib`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
