# Spec 020 – Account Timeline (Lifecycle + Activity Integration) – Implementation Plan

## 1. Technical Context

- **Backend stack**: ASP.NET Core + Entity Framework Core, existing `Account`, `Demo`, and activity logging models.
- **Frontend stack**: Next.js (App Router), React, TailwindCSS/TailAdmin, existing Admin Account Detail page at `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- **Existing timeline**: A basic Account Timeline is already implemented in the Admin Account Detail page using `getTimelineEvents()` (account created, demos, deal won/lost). Spec 020 refines and formalizes this behavior and UI.
- **Data sources**:
  - `Account` model (`backend/Models/Account.cs`): `CreatedAt`, `UpdatedAt`, `DealStage`, `ClosedDate`, `IsDeleted`, etc.
  - `Demo` model (`backend/Models/Demo.cs`): `ScheduledAt`, `DoneAt`, `Status`, `IsDeleted`, `AccountId`.
  - Account detail endpoint in `AccountsController` that returns `AccountDetailDto` plus related demos via existing APIs.

## 2. High-Level Design

### 2.1 Backend

Goal: Ensure the Account Detail API exposes all the timestamps and minimal metadata needed for the unified timeline of:

- Account Created
- Demo Scheduled
- Demo Completed
- Deal Closed Won
- Deal Closed Lost

Design points:

- Reuse existing `Account` fields:
  - `CreatedAt` → Account Created event.
  - `DealStage` + `ClosedDate` → Deal Closed Won/Lost events.
  - `UpdatedAt` is available but not rendered as a separate timeline event unless needed later.
- Reuse existing demo summary/list endpoint already used on the Account Detail page:
  - `ScheduledAt` + `Status == Scheduled` → Demo Scheduled event.
  - `DoneAt` + `Status == Completed` → Demo Completed event.
- No new tables are required for Spec 020.
- Optional: If later needed, we can introduce explicit `ClosedWonAt` / `ClosedLostAt` fields and wire them into the timeline without changing the overall contract.

### 2.2 Frontend

Goal: Implement a visually polished Account Timeline section on the Admin Account Detail page that matches the provided mocks and Spec 020 clarifications.

Key behaviors:

- Build a unified `timelineEvents` array in the React component by combining:
  - One `ACCOUNT_CREATED` event from `detail.createdAt`.
  - For each demo:
    - A `DEMO_SCHEDULED` event if `scheduledAt` exists.
    - A `DEMO_COMPLETED` event if `doneAt` exists and status is Completed.
  - If `detail.dealStage === "WON"` and `detail.closedDate` → `DEAL_CLOSED_WON` event.
  - If `detail.dealStage === "LOST"` and `detail.closedDate` exists (or, as fallback, `updatedAt`/`createdAt`) → `DEAL_CLOSED_LOST` event.
- Sort all events strictly by timestamp (oldest first).
- Render them along a single vertical line with fixed icons/colors per event type (Account Created, Demo Scheduled, Demo Completed, Deal Closed Won, Deal Closed Lost).
- Ensure the UI matches the visual examples: compact, readable, and consistent with existing card styling.

## 3. Tasks – Backend

> Note: Because the necessary data is already exposed for Spec 009, backend changes for Spec 020 are expected to be minimal or zero. These tasks confirm and tighten that.

### 3.1 Verify Account Detail DTO has all required fields

- **File**: `backend/Controllers/AccountsController.cs`
- **Checks**:
  - `AccountDetailDto` includes `CreatedAt`, `UpdatedAt`, `DealStage`, and `ClosedDate`.
  - Demos for the account are retrievable from existing demo endpoints used by the Account Detail page (no additional joins needed for Spec 020).
- **Outcome**: Confirm that the frontend can already derive all five event types from existing responses.

### 3.2 (Optional) Add explicit closedWonAt / closedLostAt fields

- **Only if needed later**; out-of-scope for first implementation pass.
- Steps if we ever choose to implement:
  - Add nullable `ClosedWonAt` and `ClosedLostAt` to `Account` model and migrations.
  - Update deal-stage transition logic to populate these fields.
  - Extend `AccountDetailDto` and mapping in `AccountsController`.
  - Update timeline mapping on the frontend to prefer these fields when present.

## 4. Tasks – Frontend

### 4.1 Confirm and refactor `getTimelineEvents` implementation

- **File**: `frontend/src/app/(admin)/accounts/[id]/page.tsx`
- **Actions**:
  - Review current `getTimelineEvents` implementation.
  - Ensure it constructs events only for:
    - Account Created
    - Demo Scheduled
    - Demo Completed
    - Deal Closed Won
    - Deal Closed Lost
  - Remove any activity-log or extra event kinds that are no longer in scope for Spec 020.
  - Ensure event objects include at least:
    - `kind: "ACCOUNT_CREATED" | "DEMO_SCHEDULED" | "DEMO_COMPLETED" | "DEAL_CLOSED_WON" | "DEAL_CLOSED_LOST"`
    - `title: string` – user-visible label per spec.
    - `timestamp: string` – ISO or API-provided timestamp.

### 4.2 Enforce strict chronological ordering

- **File**: `frontend/src/app/(admin)/accounts/[id]/page.tsx`
- **Actions**:
  - Keep or adjust the existing sort:
    ```ts
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    ```
  - Confirm ordering matches Spec 020 clarifications and the mocks (oldest at top, newest at bottom).

### 4.3 Align titles and timestamps with the spec

- **File**: `frontend/src/app/(admin)/accounts/[id]/page.tsx`
- **Actions**:
  - Standardize event titles:
    - `ACCOUNT_CREATED` → "Account Created".
    - `DEMO_SCHEDULED` → "Demo Scheduled".
    - `DEMO_COMPLETED` → "Demo Completed".
    - `DEAL_CLOSED_WON` → "Deal Closed Won".
    - `DEAL_CLOSED_LOST` → "Deal Closed Lost".
  - Format timestamps as in the mocks, e.g. `Nov 26, 2025, 9:48 PM` using `toLocaleDateString` / `toLocaleTimeString` or a common helper.

### 4.4 Implement fixed icons and colors per event type

- **File**: `frontend/src/app/(admin)/accounts/[id]/page.tsx` (or a small extracted `AccountTimeline` component).
- **Actions**:
  - Map `event.kind` to visual styles:
    - `ACCOUNT_CREATED` → blue ring / neutral lifecycle icon.
    - `DEMO_SCHEDULED` → purple calendar icon.
    - `DEMO_COMPLETED` → green check icon.
    - `DEAL_CLOSED_WON` → green success icon (could reuse the same check icon as completed but with different emphasis if desired).
    - `DEAL_CLOSED_LOST` → red failure icon (e.g. X in a circle).
  - Implement a left-side vertical line with circular markers for each event, matching the provided screenshots.
  - Ensure dark/light theme compatibility (use Tailwind classes consistent with existing cards).

### 4.5 Ensure robust rendering for edge cases

- **Actions**:
  - If there are **no events** (e.g. a brand-new account), show either:
    - No timeline card, or
    - An empty state text such as "No timeline events yet".
  - Ensure timeline does not break if:
    - An account is Won/Lost without demos.
    - There are multiple scheduled/completed demos.
    - `ClosedDate` is missing but `DealStage` is set (use fallback timestamps per spec assumptions).

## 5. Testing Plan

### 5.1 Manual Test Scenarios

- **Scenario 1 – New account, no demos**
  - Create a brand-new account with no demos.
  - Open Account Detail page.
  - Verify the timeline shows only "Account Created" (or an appropriate minimal/empty state).

- **Scenario 2 – Account with one demo and Won**
  - Account has:
    - CreatedAt set.
    - One demo that is scheduled and then completed.
    - DealStage = WON, ClosedDate set.
  - Expected timeline order:
    1. Account Created
    2. Demo Scheduled
    3. Demo Completed
    4. Deal Closed Won

- **Scenario 3 – Account with multiple demos and Lost**
  - Account has multiple scheduled/completed demos and `DealStage = LOST`.
  - Expected timeline:
    - All created/scheduled/completed demo events in order.
    - Final "Deal Closed Lost" at the correct timestamp.

- **Scenario 4 – No ClosedDate on Lost/Won**
  - If `DealStage` is WON or LOST but `ClosedDate` is null, confirm fallback behavior is acceptable (e.g. use `UpdatedAt` or hide the deal outcome event until data is complete, depending on implementation choice).

### 5.2 Regression Checks

- Ensure existing Account Detail content (demos list, notes, activity log card) still works as before.
- Confirm that adding or editing demos updates the timeline as expected once the user refreshes the page.

## 6. Risks and Mitigations

- **Risk**: Inconsistent or missing `ClosedDate` values could lead to confusing deal outcome timestamps.
  - **Mitigation**: Document fallback rules in code comments and spec; optionally validate data when closing deals.

- **Risk**: Visual regressions on small screens.
  - **Mitigation**: Test the timeline on narrow viewports and adjust spacing/stacking as needed.

## 7. Implementation Order

1. Backend verification (3.1) – confirm no backend changes are required.
2. Frontend refactor of `getTimelineEvents` and ordering (4.1, 4.2).
3. Frontend titles and timestamp formatting (4.3).
4. Frontend icons/colors and timeline layout (4.4).
5. Edge case handling and empty states (4.5).
6. Manual testing (5.1, 5.2) and refinements.
