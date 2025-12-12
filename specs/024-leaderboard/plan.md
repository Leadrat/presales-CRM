# Implementation Plan: Leaderboard

**Branch**: `024-leaderboard` | **Date**: 2025-12-11 | **Spec**: `specs/024-leaderboard/spec.md`
**Input**: Feature specification from `/specs/024-leaderboard/spec.md`

## Summary

Implement a **Leaderboard module** that ranks active users (Admins and Basics) over **weekly, monthly, and quarterly** periods using:

- Accounts created in the period (2 points each)
- Completed demos in the period, weighted by **account size** (Small/Medium/Enterprise)

The backend will expose a single `GET /leaderboard?period=...` endpoint in the ASP.NET Core API, aggregating data from `Users`, `Account`, `AccountSize`, and `Demo` tables. The frontend (Next.js app) will add a protected `/leaderboard` page with period tabs, a sorted list of users, top-3 highlighting, and a scoring explanation panel.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: 
- Backend: C# / ASP.NET Core (current backend)  
- Frontend: TypeScript / React (Next.js 15)

**Primary Dependencies**: 
- Backend: ASP.NET Core Web API, Entity Framework Core, SQL database (existing `AppDbContext`)  
- Frontend: Next.js App Router, React, TailwindCSS (existing UI stack)

**Storage**: Existing relational database used by `AppDbContext` (Accounts, Demos, Users, AccountSize tables).

**Testing**: 
- Backend: xUnit / existing integration test framework in `backend/Tests`  
- Frontend: React Testing Library / Playwright or existing test approach (lightweight for this feature).

**Target Platform**: 
- Backend: Deployed ASP.NET Core API (same environment as current backend)  
- Frontend: Browser clients via existing Next.js app

**Project Type**: Web application with separate `backend/` and `frontend/` projects.

**Performance Goals**: Leaderboard endpoint should typically respond in **< 500 ms** for expected data volumes (team-sized user counts) under normal load.

**Constraints**: Reuse existing database schema and auth; no long-running background jobs—leaderboard is computed on-demand per request for the selected period.

**Scale/Scope**: 
- Number of users per tenant/team: O(10–100)  
- Accounts/demos per period: O(10^2–10^4); aggregation must remain efficient using DB-side grouping.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

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

```text
backend/
├── Controllers/
│   ├── UsersController.cs
│   ├── AccountsController.cs
│   └── AnalyticsController.cs
├── Models/
│   ├── Account.cs
│   ├── AccountSize.cs
│   ├── Demo.cs
│   └── User.cs
└── Tests/
    ├── Integration/
    └── Unit/

frontend/
├── src/
│   ├── app/
│   │   ├── (protected)/dashboard/page.tsx
│   │   ├── (protected)/profile/page.tsx
│   │   └── (protected)/leaderboard/page.tsx   # NEW
│   ├── components/
│   └── lib/
└── tests/
    ├── integration/
    └── unit/
```

**Structure Decision**: Use the existing **backend/ + frontend/** split. Implement the leaderboard API in a new or existing backend controller (e.g., `LeaderboardController` or extension in `AnalyticsController`), and add a new `/leaderboard` page under `frontend/src/app/(protected)/leaderboard/page.tsx` consuming that API.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
