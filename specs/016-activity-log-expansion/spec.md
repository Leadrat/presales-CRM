# Feature Specification: Activity Log Expansion v2

**Feature Branch**: `016-activity-log-expansion`  
**Created**: 2025-11-24  
**Status**: Draft  
**Input**: User description: "We want to expand the Activity Log so that it becomes a meaningful audit trail for all important account-related events. The Activity Log should show structured entries such as: account created, account updated, deal stage changed, lead source changed, contact added/edited/deleted, demo scheduled, demo completed, notes added, etc. Each event should include: event type, description, timestamp, and user. The goal is to clearly document which user performed which action and when. This spec defines requirements, boundaries, and success criteria for Activity Log v2."

## Clarifications

### Session 2025-11-24

- Q: What is the rule for storing and displaying Activity Log timestamps (timezone & format)? e A: Store in UTC and display in the user's local timezone with a consistent readable format.
- Q: How detailed should Activity Log entries be for field changes? e A: Show per-field old/new values for a defined set of key fields; use generic update messages for other fields.
- Q: Should we backfill historic activity before Activity Log v2? e A: Do not perform special historic backfill beyond trivial cases; treat detailed Activity Log entries as starting from v2 go-live.
- Q: Can Activity Log entries be edited or deleted, and how are admin redactions handled? e A: Entries are immutable and cannot be edited or deleted by users. Only extremely rare admin-level redactions are allowed, and each redaction must leave a visible placeholder for audit integrity.
- Q: Who is allowed to view the Activity Log for an account? e A: Any user who can view an account can view that account's Activity Log; there is no extra restriction beyond existing account access rules.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View full account history (Priority: P1)

As a sales user, I want to open any account and see a clear, time-ordered history of important actions (creation, updates, demos, contacts, notes) so I can quickly understand what has happened with this account without asking others.

**Why this priority**: This is the core value of the Activity Log. Without a trustworthy timeline per account, the feature does not meet its purpose as an audit trail.

**Independent Test**: This story is independently testable by verifying that, for a sample account, all key actions performed in the system result in readable log entries in the Activity tab, ordered by time.

**Acceptance Scenarios**:

1. **Given** an account that has been created, updated, and had a demo scheduled, **When** a sales user opens the account and navigates to the Activity tab, **Then** they see a chronological list that includes at least: "Account created", "Account updated", and "Demo scheduled" entries with timestamps and the user who performed each action.
2. **Given** an account with no recorded actions beyond creation, **When** a user opens the Activity tab, **Then** they see either a single "Account created" entry or a clear empty-state message indicating that no further activity has occurred.
3. **Given** an account with many actions over time, **When** the user scrolls the Activity tab, **Then** entries remain ordered by time (most recent first or last, as defined), without gaps or duplicated events.

---

### User Story 2 - Audit who changed what and when (Priority: P1)

As a manager or admin, I want to know which user changed critical account fields (such as deal stage, lead source, and decision makers) and when, so I can resolve disputes, coach the team, and maintain accountability.

**Why this priority**: Accountability for key changes is a primary business reason for having an Activity Log. It reduces confusion and enables coaching.

**Independent Test**: This story is independently testable by making controlled changes to specific fields on an account and verifying that the Activity Log records each field change with the correct actor, time, and a description of what changed.

**Acceptance Scenarios**:

1. **Given** an account in deal stage "New lead", **When** a sales user updates the deal stage to "Qualified", **Then** the Activity Log records an entry like "Deal stage changed from 'New lead' to 'Qualified'" with the correct user and timestamp.
2. **Given** an account with a specific lead source, **When** another user changes the lead source, **Then** the Activity Log records a separate entry describing the old and new values and attributing it to that second user.
3. **Given** an account with multiple updates across different days, **When** a manager reviews the Activity Log, **Then** they can clearly see the sequence of changes (including who changed what and on which date/time) without needing to inspect raw data.

---

### User Story 3 - Track contact and demo lifecycle (Priority: P2)

As a sales user, I want the Activity Log to reflect contact changes (added/edited/deleted) and demo lifecycle events (scheduled, completed, cancelled) so I can quickly see how engagement with the account has evolved.

**Why this priority**: Contact and demo events are critical signals of engagement and progression; surfacing them in the Activity Log makes the account story understandable.

**Independent Test**: This story is independently testable by creating, editing, and deleting contacts and demos on a test account, then verifying that each action appears as an appropriate Activity Log entry with clear descriptions.

**Acceptance Scenarios**:

1. **Given** an account with no contacts, **When** a new contact is added, **Then** the Activity Log shows an entry such as "Contact added: [Name]" with timestamp and user.
2. **Given** an account with an existing contact, **When** a user edits the contact's key details (e.g., name or phone), **Then** the Activity Log shows an entry indicating that the contact was edited, including which key fields changed.
3. **Given** an upcoming demo scheduled for an account, **When** a user marks the demo as completed, **Then** the Activity Log shows an entry such as "Demo completed" with the scheduled time, completion time (if relevant), and the user who completed it.
4. **Given** a scheduled demo that is later cancelled or deleted, **When** the Activity Log is viewed, **Then** there is a clear entry indicating that the demo was cancelled/removed and by which user.

---

### User Story 4 - Filter and scan relevant activity (Priority: P3)

As a sales user or manager, I want to quickly focus on relevant activity (for example, only demos and notes in the last 30 days) so I can answer specific questions without manually scanning a long list.

**Why this priority**: Filtering improves usability when accounts have a long history; however, the basic timeline must work first, so this is P3.

**Independent Test**: This story is independently testable by applying different combinations of filters (by event type, date range, and user) and confirming that the Activity Log shows only matching entries while preserving ordering and completeness for that subset.

**Acceptance Scenarios**:

1. **Given** an account with many events of different types, **When** the user filters by "Demo" events only, **Then** the list only shows demo-related entries (scheduled, updated, completed, cancelled) in time order.
2. **Given** an account with activity over several months, **When** the user restricts the date range (e.g., last 30 days), **Then** only entries whose timestamps fall within that range are displayed.
3. **Given** multiple users interacting with the same account, **When** the user filters by a specific user, **Then** only activities performed by that user are shown.

---

### Edge Cases

- **High volume of activity**: Accounts with very frequent updates (e.g., automated imports or bulk edits) should still display a usable Activity Log, with sensible pagination or load-more behavior so the interface remains responsive.
- **System-generated actions**: Some actions may be performed by the system (e.g., automated imports or default creations). In such cases, the Activity Log should indicate a clear actor such as "System" where no human user exists.
- **Missing or deleted related records**: If a related entity (such as a contact or demo) is later deleted, existing Activity Log entries should remain, but may indicate that the related item is no longer available.
- **Timezone and display consistency**: Timestamps MUST be stored in UTC and displayed in the user's local timezone using a single consistent, human-readable format (for example, `24 Nov 2025, 14:35`), so that ordering and event times are easy to understand.
- **Historic data before v2**: Existing accounts and actions that occurred before Activity Log v2 will **not** receive special historic backfill beyond trivial cases (such as showing an "Account created" entry when a creation timestamp already exists). The system should behave gracefully (e.g., no errors, clear empty states) even if early history is incomplete, and stakeholders should expect detailed Activity Log coverage to begin from v2 go-live.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Event coverage)**: The Activity Log MUST record entries for at least the following account-related events:
  - Account created
  - Account core details updated (e.g., name, website, decision makers, contact information)
  - Deal stage changed
  - Lead source changed
  - Contact added
  - Contact updated
  - Contact deleted or removed from the account
  - Demo scheduled
  - Demo details updated (time, attendees, notes)
  - Demo completed
  - Demo cancelled/deleted
  - Note added to the account
  - Other significant account-level actions that materially change the state of the account (to be listed explicitly during implementation planning).

- **FR-002 (Entry structure)**: Each Activity Log entry MUST include at least:
  - An **event type** (standardized code or name, such as "ACCOUNT_CREATED", "DEAL_STAGE_CHANGED").
  - A **human-readable description** that explains what happened in plain language.
  - A **timestamp** representing when the action occurred.
  - A **user reference** (the actor) when a human user performed the action, including a display name; for system actions, a clearly labeled system actor.
  - A reference to the **account** the event belongs to.
  - When applicable, a reference to a **related entity** (e.g., contact or demo) so users can understand which specific item was affected.

- **FR-003 (Description clarity)**: Descriptions MUST clearly communicate the key change in one line (for example, "Deal stage changed from 'In progress' to 'Won' by [User Name]") without exposing internal/technical field names. For a defined set of key account and contact fields (such as deal stage, lead source, and decision makers), entries SHOULD show the previous and new values; for other fields, a concise generic description such as "Account updated" or "Contact updated" is acceptable.

- **FR-004 (Ordering)**: Activity entries for an account MUST be presented in a consistent chronological order, clearly indicating the ordering direction (e.g., newest first). Users must never see entries appearing out of order for the same timestamp range.

- **FR-005 (Per-account scoping)**: When viewing an account, the Activity Log MUST only show entries related to that specific account (and its direct related entities) and MUST NOT show actions from other accounts.

- **FR-006 (Filtering)**: Users MUST be able to filter the Activity Log for a single account by:
  - Filters MUST be implemented as lightweight, inline controls within the Activity Log panel (for example, small chips or dropdowns above the list), **not** as a heavy global header toolbar like "All events / All time / Me" or separate filter pages.
  - Users MUST be able to optionally narrow the list by one or more **event types** (e.g., only demos, only contact changes) without leaving the unified Activity Log view.
  - Users MUST be able to optionally restrict by **date range** (e.g., custom range, last 7 days, last 30 days) using these inline controls.
  - Users MUST be able to optionally filter by **user / actor** (e.g., activity performed by a specific user) using these inline controls.

- **FR-007 (Pagination / load-more)**: For accounts with many entries, the Activity Log MUST provide a way to view older entries (pagination, "load more", or scrolling) without losing ordering or data. The initial view should show recent entries first.

- **FR-008 (Performance expectations)**: For a typical account with up to a reasonable number of entries (e.g., a few hundred), the Activity Log MUST load in a timeframe acceptable for end users (for example, within a few seconds on a standard connection), so that reviewing history feels responsive.

- **FR-009 (User visibility)**: From the existing account detail views, users MUST be able to easily find and open the Activity Log (for example, via an "Activity" tab or section) without needing to navigate away from the account.

- **FR-010 (Data retention)**: Activity Log entries MUST be retained for a long enough period to be useful as an audit trail (assumed minimum of 24 months, unless compliance requirements later dictate a different period). If any retention or archival is implemented, it MUST be predictable and documented so stakeholders know how far back they can audit.

- **FR-011 (Security & access)**: Any user who can view an account MAY view that account's Activity Log; there is no extra restriction beyond existing account access rules. A user MUST only see Activity Log entries for accounts they are allowed to view according to those rules. The Activity Log MUST NOT expose data about restricted accounts or private notes beyond what the user is already permitted to see.

- **FR-012 (Consistency with actions)**: For every user-facing action in scope (e.g., updating deal stage in the account screen, scheduling a demo, editing a contact), the system MUST generate a corresponding Activity Log entry exactly once per action, avoiding duplicates or missing events.

- **FR-013 (Error handling)**: If logging an activity fails for any reason, this MUST NOT break the primary user action (for example, saving the account). However, the system SHOULD attempt to record the failure in a way that can be diagnosed later, and the Activity Log MUST remain in a valid state (no partially written or corrupted entries visible to users).

- **FR-014 (Immutability & redaction)**: Once created, Activity Log entries MUST NOT be edited or deleted through normal user flows. If an admin-level redaction capability is introduced for exceptional legal or privacy cases, any redacted entry MUST leave a visible placeholder indicating that a redaction occurred (including when and by whom), while preserving the overall timeline order.
 
- **FR-015 (Real-time updates, no manual refresh)**: When a user performs an in-scope action on an account (such as updating key fields, adding/editing contacts, or scheduling/updating/completing/cancelling a demo), the corresponding Activity Log entry for that account MUST appear in the Activity Log **without** requiring a full page reload or clicking a manual "Refresh" button. The UI MAY refresh the list by refetching data or optimistically inserting the new entry once the underlying operation succeeds, but there MUST NOT be a primary workflow that depends on a manual refresh control.

- **FR-016 (Layout & simplicity aligned with ABM sample)**: The account Activity Log UI MUST follow the general pattern of the provided ABM CRM sample: a unified Activity Log list for the account that presents a clear, chronological history (for example, alongside an Account Timeline), without a prominent header toolbar of filters like "All events / All time / Me" and without a dedicated "Refresh" button controlling visibility of new entries. The Activity Log itself is the primary source of truth for understanding the account's history.

### Key Entities *(include if feature involves data)*

- **Activity Log Entry**: Represents a single recorded event in the life of an account.
  - Key attributes (conceptual): event type, description, timestamp, actor (user or system), account reference, optional related-entity reference, and any additional contextual details helpful for understanding the change.

- **Actor (User / System)**: Represents who performed the action.
  - Key attributes (conceptual): display name, identifier, and a flag to distinguish human users from system-generated actions.

- **Account**: Existing concept in the system; serves as the anchor for grouping Activity Log entries.
  - Relationship: One account can have many Activity Log entries; each entry belongs to exactly one account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Coverage)**: For the set of in-scope actions (account creation/update, deal stage changes, lead source changes, contact changes, demo lifecycle events, notes added), at least 95% of executed actions in a test period result in a corresponding Activity Log entry with the correct type, timestamp, and actor.

- **SC-002 (Discoverability)**: In usability testing, at least 90% of users who are familiar with the existing account screens can locate the Activity Log for an account within 10 seconds without guidance.

- **SC-003 (Auditability)**: For a sample of accounts used in testing, managers can successfully answer the question "who changed [field X] and when?" using only the Activity Log in at least 90% of tested scenarios.

- **SC-004 (Performance)**: For accounts with up to a typical amount of activity, the Activity Log view loads initial entries within a timeframe perceived as acceptable by users (for example, within 3 seconds in a test environment) in at least 90% of test runs.

- **SC-005 (User satisfaction)**: After rollout, in qualitative feedback sessions or surveys, a majority of active users (e.g., at least 70%) report that the Activity Log "makes it easier" or "much easier" to understand an account's history compared to the previous version.

