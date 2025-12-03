# Spec 020 – Account Timeline (Lifecycle + Activity Integration)

## Goal

Provide a visually clear, unified timeline showing the full lifecycle of an account — from creation, demos, updates, activities, and final deal outcome — all displayed in chronological order on the Account Detail page.

## Problem

Currently, the Account Detail page does not provide a consolidated view of all account events. Activity logs are separate, demo events are separate, and lifecycle events are not merged into one place. Users cannot see the full story of an account in a single timeline, which makes it harder to understand how an account has progressed over time.

## Solution Overview

Implement a unified timeline component on the Account Detail page that merges all relevant lifecycle and demo events into a single chronological list. The timeline will present lifecycle milestones, demo events, and deal outcomes in order, with clear labels and visual indicators for each type of event.

This feature builds on the existing basic timeline (created + demos + won/lost) from Spec 009 and extends it to include activity events and a more complete lifecycle view.

## Scope

### In Scope – Frontend

- A dedicated **Account Timeline** area on the Account Detail page (Admin view and any other relevant views that show full account history).
- The timeline must display at least the following event types:
  - Account Created
  - Demo Scheduled
  - Demo Completed
  - Deal Won
  - Deal Lost
- Events must be:
  - Clearly labeled with an event title (e.g. "Account Created", "Demo Scheduled", "Note Added", "Deal Closed Won").
  - Shown with a precise timestamp in a readable format.
  - Visually distinguished by event type (icon, color, or label).
  - Ordered strictly by timestamp (oldest → newest).
- The timeline should handle accounts with many events without layout breaking or extreme scrolling issues.
- The UI should follow the existing design language used on the Dashboard and Account Detail pages (colors, typography, spacing, light/dark themes).
- The design should leave room for **future** grouping and filtering (for example, by event type), but these advanced filters do not need to be implemented in this spec.

### In Scope – Backend

- Extend the Account Detail data returned by the API so that all relevant lifecycle and demo events can be represented in a single chronological sequence. This includes:
  - Lifecycle data: `CreatedAt`, `UpdatedAt`, `DealStage`, `ClosedDate` (and any related fields).
  - Demo events associated with the account (scheduled and completed).
- Ensure all events relevant to the account timeline have:
  - A reliable timestamp that can be used for chronological ordering.
  - Enough metadata to derive a stable event type and user-visible label.
- Decide and document the source of **deal closed timestamps**:
  - Either rely on existing `ClosedDate + DealStage` logic, **or**
  - Introduce explicit `ClosedWonAt` and `ClosedLostAt` fields if needed.
- Ensure that the Account Detail API returns data in a shape that allows the frontend to construct the unified timeline without:
  - Multiple round-trips per account, or
  - Needing complex joins on the client.

### Out of Scope

- Cross-account or global timelines.
- Organization-level or user-level timelines outside the Account Detail context.
- Exporting the timeline (e.g. CSV, PDF).
- Advanced filtering, search, or drill-down interactions beyond what is described in this spec.
- Any analytics or aggregated reporting based on timeline events (these are covered by analytics specs).

## Users and Scenarios

### Primary User

- Sales or CS users viewing an individual account to understand its full history and current state.
- Managers or admins auditing how an account has been worked over time.

### Key Scenarios

1. **Review full account history**
   - A user opens an account.
   - The timeline shows when the account was created, when demos were scheduled and completed, and when the deal moved to Won or Lost.
   - The user can quickly see how long it took to progress from creation to closure and what happened in between.

2. **Inspect recent activity before a call**
   - A user is about to contact a customer.
   - They open the account and scan the most recent timeline entries (demos and deal outcome).
   - They use this information to prepare for the conversation.

3. **Understand why a deal was lost**
   - A user opens a Lost account.
   - The timeline shows demos and the final "Deal Lost" event.
   - The user can review the sequence of events leading up to the loss.

4. **Audit interactions on long-running deals**
   - A manager opens an account that has been in the pipeline for a long time.
   - The timeline shows all major demo and lifecycle touchpoints (demos and deal outcome).
   - The manager can see whether the account has been actively worked or neglected.

## Functional Requirements

1. **Unified Timeline Display**
   - The Account Detail page must show a single "Account Timeline" section that combines:
     - Account lifecycle events (created, updated, closed / Won / Lost).
     - Demo events (scheduled and completed).
   - Events must be rendered in chronological order (oldest first).

2. **Event Types and Labels**
   - Each event type must have:
     - A human-readable title ("Account Created", "Demo Completed", "Note Added", "Deal Closed Lost", etc.).
     - A timestamp displayed in the app's standard date/time format.
   - The event list must distinguish between:
     - Lifecycle events.
     - Demo events.
     - Activity / communication events.
     - Deal outcome events (Won / Lost).

3. **Visual Differentiation**
   - The timeline must visually differentiate event types using:
     - Icons, colors, or badges.
     - Consistent layout around a central vertical line or similar timeline visual.
   - The design must remain clear and legible in both light and dark themes.

4. **Backend Data Exposure**
   - The Account Detail API must expose sufficient data to construct all event types, including:
     - A timestamp that determines ordering.
     - An event category or underlying fields that allow the frontend to classify events.
     - Optional descriptive fields where applicable (e.g. demo-related text if needed).
   - The API must include:
     - All demos associated with the account and their scheduled/completed timestamps.
     - Lifecycle fields required to derive "Account Created", "Deal Won", and "Deal Lost" events.

5. **Deal Outcome Timestamps**
   - The system must have a reliable way to timestamp when a deal is considered:
     - **Won** – e.g. `DealStage == "WON"` and `ClosedDate` (or `ClosedWonAt` if introduced).
     - **Lost** – e.g. `DealStage == "LOST"` and `ClosedDate` (or `ClosedLostAt` if introduced).
   - The chosen approach (existing `ClosedDate + DealStage` vs new fields) must be documented and used consistently for timeline events.

6. **Performance and Robustness**
   - The timeline must load without errors for:
     - Accounts with no demos or activity (show an empty / "No events yet" state if appropriate).
     - Accounts with many events (demos + activities).
   - The feature must not significantly increase load time of the Account Detail page under typical usage.

## Assumptions

- The system already records:
  - Demos connected to accounts.
  - Account lifecycle fields (`CreatedAt`, `UpdatedAt`, `DealStage`, `ClosedDate`).
- It is acceptable to infer "Deal Won" and "Deal Lost" events from `DealStage` and `ClosedDate` if explicit `ClosedWonAt` / `ClosedLostAt` timestamps are not yet available.
- The primary interaction with the timeline in this spec is **read-only viewing**; editing or deleting events via the timeline itself is not required.

## Open Questions / Clarifications

- If an account's deal stage changes multiple times (e.g. from Open → Won → Reopened → Lost), should each stage change appear as a separate timeline event, or only the final state?
- If explicit `ClosedWonAt` / `ClosedLostAt` fields are introduced later, how should legacy records without those fields be represented in the timeline?

## Clarifications

- Timeline ordering is **strictly chronological** from oldest at the top to newest at the bottom, based on each event's timestamp.
- The timeline uses **fixed icons and colors per event type**, matching the existing Account Timeline mocks:
  - Account Created: blue ring / neutral lifecycle icon
  - Demo Scheduled: purple calendar icon
  - Demo Completed: green check icon
  - Deal Closed Won: green success icon (e.g. check or trophy)
  - Deal Closed Lost: red failure icon (e.g. X in a circle)

## Success Criteria

- For any given account, a user can see from the timeline:
  - When the account was created.
  - When demos were scheduled and completed.
  - When and how the deal was closed (Won or Lost).
- Timeline events:
  - Appear in the correct chronological order.
  - Use clear, distinct labels and visual indicators for each event type.
- The timeline:
  - Loads without frontend or backend errors for both "simple" and "busy" accounts.
  - Integrates visually with the existing Account Detail design.
- Stakeholders confirm that they can understand the "story" of an account from the timeline alone, without switching between separate demo and activity sections.
