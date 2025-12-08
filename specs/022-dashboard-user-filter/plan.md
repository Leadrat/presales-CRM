# Implementation Plan: Dashboard User Filter

**Branch**: `022-dashboard-user-filter` | **Date**: December 8, 2025 | **Spec**: [/specs/022-dashboard-user-filter/spec.md](../spec.md)
**Input**: Feature specification from `/specs/022-dashboard-user-filter/spec.md`

## Summary

Implement a multi-user filter on the Dashboard page that allows Admin users to filter dashboard metrics by selected team members. The filter will persist selections across page reloads using sessionStorage, reset on logout, and ensure Basic users always see only their own data. This requires both frontend and backend changes to support filtering metrics by multiple user IDs.

## Technical Context

**Language/Version**: C# 10 (.NET 6) for backend, TypeScript 4.9 (React 18) for frontend
**Primary Dependencies**: ASP.NET Core 6, Next.js 13, React 18, TailwindCSS 3
**Storage**: PostgreSQL 14 (existing database)
**Testing**: xUnit for backend, Jest/RTL for frontend
**Target Platform**: Web application (desktop browsers)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Dashboard metrics should update within 500ms of filter change
**Constraints**: Filter selection limited to sessionStorage (not localStorage or URL)
**Scale/Scope**: Support filtering by up to 100 team members

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Simplicity
✅ **Pass**: The feature follows a straightforward flow with clear responsibilities:
- Backend endpoints accept optional userIds parameter
- Frontend components handle user selection and persistence
- Role-based filtering enforces access control

### II. Auditability
✅ **Pass**: No changes to audit logging required for this feature. Existing ActivityLog mechanisms will capture any data access.

### III. Testability
✅ **Pass**: Feature is testable through:
- Backend unit tests for filtering logic
- Frontend unit tests for filter UI and persistence
- Integration tests for API parameter handling

### IV. Extensibility
✅ **Pass**: Implementation uses:
- Optional query parameters (backward compatible)
- Existing GUID primary keys for users
- No schema changes required

### V. Security & RBAC
✅ **Pass**: Implementation enforces role-based access control:
- Admin users can filter by any team member
- Basic users are restricted to their own data
- No new permissions required

## Project Structure

### Documentation (this feature)

```text
specs/022-dashboard-user-filter/
├── plan.md              # This file
├── research.md          # Not needed (no unknowns)
├── data-model.md        # Not needed (no schema changes)
├── quickstart.md        # Implementation guide
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
backend/
├── Controllers/
│   ├── AccountsController.cs    # Update GetDashboardSummary endpoint
│   └── AnalyticsController.cs   # Update GetAccountAnalytics and GetDemosBySize endpoints
└── Tests/
    └── Controllers/
        ├── AccountsControllerTests.cs
        └── AnalyticsControllerTests.cs

frontend/
├── src/
│   ├── app/
│   │   └── (protected)/
│   │       └── dashboard/
│   │           └── page.tsx     # Add user filter UI and logic
│   ├── lib/
│   │   ├── api.ts              # Update API helpers
│   │   └── auth/
│   │       └── tokenService.ts  # Update logout handling
│   └── components/
│       └── form/
│           └── MultiSelect.tsx  # Existing component to reuse
└── tests/
    └── dashboard/
        └── UserFilter.test.tsx
```

**Structure Decision**: The implementation follows the existing web application structure with frontend and backend components. We'll modify existing files rather than creating new ones, as this feature is an enhancement to existing functionality.

## Implementation Approach

### Phase 1: Backend Changes

1. **Update AccountsController.cs**
   - Modify `GetDashboardSummary` endpoint to accept optional `userIds` query parameter
   - Parse comma-separated GUIDs into a list
   - Apply role-based filtering logic:
     - Admin: Filter by provided userIds or show global data if none provided
     - Basic: Always filter to current user's ID
   - Update account and demo queries to filter by user IDs

2. **Update AnalyticsController.cs**
   - Modify `GetAccountAnalytics` and `GetDemosBySize` endpoints to accept optional `userIds` parameter
   - Apply the same role-based filtering logic
   - Ensure backward compatibility with existing single-user filter

### Phase 2: Frontend API Integration

1. **Update API Helpers (api.ts)**
   - Update `getDashboardSummary()`, `getAnalyticsAccounts()`, and `getDemosBySize()` to accept optional userIds parameter
   - Ensure backward compatibility with existing code

2. **Update Authentication Service (tokenService.ts)**
   - Update logout function to clear "dashboard_user_filter" from sessionStorage
   - Update broadcast channel handler to clear filter on cross-tab logout

### Phase 3: Dashboard UI Implementation

1. **Update Dashboard Page (dashboard/page.tsx)**
   - Add state for team users, selected user IDs, filter open state, loading state, and error state
   - Add effect to load team users and restore filter selection from sessionStorage
   - Add effect to update dashboard metrics based on filter selection
   - Add UI components for the filter card, dropdown, and user selection
   - Implement handlers for user selection, Select All, and Clear All
   - Add persistence logic for filter selection

### Phase 4: Testing

1. **Backend Tests**
   - Unit tests for parsing userIds parameter
   - Unit tests for role-based filtering logic
   - Integration tests for API endpoints

2. **Frontend Tests**
   - Unit tests for filter UI components
   - Unit tests for sessionStorage persistence
   - Integration tests for API helpers

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| SessionStorage not available in some browsers | Low | Medium | Fall back to in-memory state |
| Performance impact of filtering large datasets | Medium | Medium | Optimize queries with appropriate indexes |
| Filter not clearing properly on logout | Low | High | Add redundant clearing in multiple places |
| Cross-tab synchronization issues | Medium | Low | Use BroadcastChannel API for cross-tab communication |
