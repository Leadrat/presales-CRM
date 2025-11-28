# Quickstart: Activity Log Expansion v2

This guide explains how to work on and verify the Activity Log Expansion v2 feature.

## 1. Backend: Activity Logging

### 1.1 Data Model
- Ensure the following tables exist and are migrated:
  - `ActivityTypes` (lookup of standardized event type codes)
  - `ActivityLogs` (immutable audit entries)
- Add indexes:
  - `ActivityLogs(AccountId, CreatedAt DESC)` for per-account timelines.
  - Optionally `ActivityLogs(ActorUserId, CreatedAt DESC)` for user-based filtering.

### 1.2 ActivityLog service
- Create an `ActivityLogService` (or equivalent) in `backend/` that exposes methods such as:
  - `LogAccountCreated`, `LogAccountUpdated`
  - `LogContactAdded`, `LogContactUpdated`, `LogContactDeleted`
  - `LogDemoScheduled`, `LogDemoUpdated`, `LogDemoCompleted`, `LogDemoCancelled`
  - `LogNoteAdded`
- Each method should:
  - Accept the current user, account, and any related entity IDs.
  - Build a standardized `ActivityType` + `Message` string.
  - Insert a new row into `ActivityLogs`.

### 1.3 Wiring into existing flows
- In `AccountsController`, `Contacts` endpoints, and demo-related endpoints:
  - After a successful change (account update, contact change, demo lifecycle, note added), call the `ActivityLogService` to emit exactly one log entry per user action.
- Follow the immutability rule: never update or delete ActivityLogs.

### 1.4 API Endpoint
- Implement `GET /api/accounts/{accountId}/activity` in the backend:
  - Apply account-level RBAC: only users who can view the account can view its Activity Log.
  - Support query params from `contracts/activity-log.yaml`:
    - `eventTypes`, `from`, `to`, `userId`, `cursor`, `limit`.
  - Return `{ data: { items, nextCursor }, error, meta }`.
- Optionally add `GET /api/activity/types` to return available activity types for UI filters.

## 2. Frontend: Activity Tab

### 2.1 API helpers
- In `frontend/src/lib/api.ts` (or similar):
  - Add a `getAccountActivity(accountId, filters)` function that calls `/api/accounts/{accountId}/activity` and returns `data.items`/`data.nextCursor`.
  - Ensure it follows the same `{ data }` unwrapping as other helpers.

### 2.2 UI components
- In the account detail page (`/my-accounts/[id]`):
  - Add an **Activity** tab or section next to existing tabs (Overview, Contacts, Demos, etc.).
  - Create a reusable `ActivityLogList` component that:
    - Accepts an array of ActivityLog entries and renders a vertical list/timeline.
    - Shows timestamp (user’s local timezone), actor name, event type label, and description.
    - Handles empty states ("No activity yet") and loading state.

### 2.3 Filters
- Add simple filter controls above the list:
  - Event type multi-select or checklist.
  - Date range (e.g., presets + custom range).
  - Actor/user dropdown.
- Wire filters to the Activity API via query parameters, and refresh the list when filters change.

## 3. Testing

### 3.1 Backend tests
- Unit tests:
  - Verify `ActivityLogService` builds correct entries for a sample of event types (e.g., deal stage change shows old/new values).
- Integration tests:
  - For each core flow (account update, contact add/update/delete, demo scheduled/completed/cancelled, note added):
    - Perform the action via API.
    - Assert that exactly one matching `ActivityLogs` row exists.
  - Test `GET /api/accounts/{accountId}/activity`:
    - Pagination (cursor & limit).
    - Filters by event type, date range, user.
    - RBAC: users without access to the account get 403/404.

### 3.2 Frontend tests
- Component tests:
  - `ActivityLogList` renders entries and empty state correctly.
- Integration/E2E tests:
  - Create or modify an account, contact, or demo.
  - Navigate to the account’s Activity tab.
  - Verify a corresponding Activity entry appears with correct timestamp, actor, and description.

## 4. Rollout Notes
- No special backfill: detailed Activity Log entries effectively start from v2 go-live.
- Monitor performance of `GET /api/accounts/{accountId}/activity` and optimize indexes if needed.
- Ensure observability: log correlation IDs and key metadata when writing ActivityLogs.
