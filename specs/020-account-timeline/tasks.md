# Spec 020 – Account Timeline (Lifecycle + Activity Integration) – Tasks

## Phase 1 – Setup

- [ ] T001 Confirm backend dev environment is running for Spec 020 (dotnet run from `backend/`) and frontend dev server is available (npm run dev from `frontend/`).
- [ ] T002 Review `specs/020-account-timeline/spec.md` and `specs/020-account-timeline/plan.md` to understand scope and constraints for the Account Timeline.

## Phase 2 – Foundational

- [ ] T003 Verify `Account` and `Demo` models contain required fields (`CreatedAt`, `UpdatedAt`, `DealStage`, `ClosedDate`, `ScheduledAt`, `DoneAt`, `Status`, `IsDeleted`) in `backend/Models/Account.cs` and `backend/Models/Demo.cs`.
- [ ] T004 Confirm the Account Detail endpoint returns `AccountDetailDto` with `createdAt`, `updatedAt`, `dealStage`, and `closedDate` in `backend/Controllers/AccountsController.cs`.
- [ ] T005 Confirm the Admin Account Detail page already loads demos for the account (scheduled/completed) in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.

## Phase 3 – User Story 1: View Account Lifecycle Timeline

**Goal:** As an admin user, I can see a unified Account Timeline on the Account Detail page showing Account Created, Demo Scheduled, Demo Completed, and Deal Closed Won/Lost events in strict chronological order, with fixed icons and colors that match the design mocks.

### Implementation Tasks

- [ ] T006 [US1] Refine the `getTimelineEvents` helper to build events only for `ACCOUNT_CREATED`, `DEMO_SCHEDULED`, `DEMO_COMPLETED`, `DEAL_CLOSED_WON`, and `DEAL_CLOSED_LOST` in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T007 [US1] Ensure `getTimelineEvents` sources timestamps from `detail.createdAt`, `detail.closedDate`, and demo `scheduledAt` / `doneAt` fields in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T008 [US1] Keep or update the sort logic so timeline events are ordered strictly by timestamp (oldest at top, newest at bottom) in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T009 [US1] Standardize event titles to "Account Created", "Demo Scheduled", "Demo Completed", "Deal Closed Won", and "Deal Closed Lost" when mapping `timelineEvents` in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T010 [US1] Format event timestamps in the timeline to match the mocks (e.g. `Nov 26, 2025, 9:48 PM`) using consistent date/time formatting utilities in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T011 [US1] Map each event kind to fixed icons and colors (blue ring for Account Created, purple calendar for Demo Scheduled, green check for Demo Completed and Deal Closed Won, red icon for Deal Closed Lost) in the Account Timeline UI in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T012 [US1] Implement or refine the vertical timeline layout (left rail line with circular markers and right-side content) to match the provided Account Timeline mocks in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T013 [US1] Handle accounts with no demos (show only Account Created or an appropriate empty state) in the Account Timeline rendering logic in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T014 [US1] Handle accounts that are Won or Lost without demos so the timeline still shows Account Created and Deal Closed Won/Lost correctly in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T015 [US1] Ensure the timeline respects both light and dark themes and aligns with existing card styling in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.

### Testing Tasks

- [ ] T016 [US1] Manually test a new account with no demos to confirm the timeline shows at least "Account Created" and renders without errors in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T017 [US1] Manually test an account with one scheduled and completed demo and a WON deal to verify the event order (Created → Demo Scheduled → Demo Completed → Deal Closed Won) in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T018 [US1] Manually test an account with multiple demos and a LOST deal to verify all events appear in correct chronological order and the Deal Closed Lost event is shown with the red icon in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.

## Phase 4 – Polish & Cross-Cutting

- [ ] T019 Review the Account Timeline for responsiveness and visual polish on small and large screens in `frontend/src/app/(admin)/accounts/[id]/page.tsx`.
- [ ] T020 Confirm no console errors or backend exceptions occur when loading accounts with large numbers of demos in the timeline in both `frontend/src/app/(admin)/accounts/[id]/page.tsx` and `backend/Controllers/AccountsController.cs`.
