# Research: Activity Log Expansion v2

## Decisions & Rationale

### 1. Storage & Data Model
- **Decision**: Use dedicated relational tables `ActivityLogs` and `ActivityTypes` in PostgreSQL, aligned with the constitution’s Appendix A.
- **Rationale**: Keeps audit events normalized and queryable, supports future reporting, and matches the existing governance for Auditability and Extensibility.
- **Alternatives considered**:
  - Embedding JSON change blobs directly on Accounts/Demos tables → rejected (conflicts with no-JSONB rule, harder to query).
  - Writing to a separate log store (e.g., files or external log service) → rejected (harder to join with account context and enforce RBAC).

### 2. Event Taxonomy & Field-Level Diffs
- **Decision**: Maintain a curated list of activity types in `ActivityTypes` (e.g., `ACCOUNT_CREATED`, `DEAL_STAGE_CHANGED`, `CONTACT_ADDED`, `DEMO_SCHEDULED`, `NOTE_ADDED`).
- **Field diffs**: For a defined set of key account/contact fields (deal stage, lead source, decision makers, etc.) we log old/new values in the description; for other fields we use a generic “Account updated” / “Contact updated” message.
- **Rationale**: Balances audit detail with readability and implementation cost; matches Spec 16 clarifications.
- **Alternatives considered**:
  - Full diff for all fields → rejected as noisy and high-effort.
  - No diffs at all → rejected because it weakens the core auditability goal.

### 3. Activity Logging Pattern (Backend)
- **Decision**: Implement a small ActivityLog service/component in the backend that exposes high-level methods like `LogAccountUpdated`, `LogContactChanged`, `LogDemoScheduled`, etc., and is called from existing controllers/services.
- **Rationale**: Centralizes formatting, ensures consistency of event types/messages, and keeps controllers thin.
- **Alternatives considered**:
  - Inline `ActivityLogs` insertion in every controller → rejected as duplication and harder to evolve.
  - Full event-sourcing with an event bus → rejected as overkill for this phase and violates Simplicity.

### 4. API Shape & Response Contract
- **Decision**: Expose a per-account Activity API endpoint:
  - `GET /api/accounts/{accountId}/activity` with query params for event type(s), date range, user, pagination cursor, and page size.
  - Response shape follows constitution standard: `{ data, error, meta }` where `data.items` is the list of ActivityLog entries and `data.nextCursor` enables pagination.
- **Rationale**: Aligns with existing API patterns and Appendix C (standard response shape, cursor pagination).
- **Alternatives considered**:
  - Embedding the activity list directly in the existing account detail response → rejected to avoid over-fetching and allow independent pagination.

### 5. Pagination & Performance
- **Decision**: Use cursor-based pagination ordered by `CreatedAt DESC`, with a sensible default page size (e.g., 20–50 entries) and optional `limit` parameter.
- **Rationale**: Matches constitution standards for pagination and prevents heavy accounts from overloading the Activity tab.
- **Alternatives considered**:
  - Offset-based pagination → acceptable, but cursor-based is preferred for stability when new events are inserted.

### 6. Timezone Handling
- **Decision**: Store timestamps in UTC in the database; convert to the user’s local timezone in the frontend for display, using a single readable format (e.g., `24 Nov 2025, 14:35`).
- **Rationale**: Removes ambiguity at rest, while making the UI intuitive for users; matches clarification in Spec 16.

### 7. Immutability & Redactions
- **Decision**: Treat ActivityLogs as immutable records. No edit/delete for normal users. If a future admin redaction feature is required, it will soft-hide the message but keep a visible placeholder entry in the timeline.
- **Rationale**: Strongly supports Auditability; any redaction must itself be auditable.
- **Alternatives considered**:
  - Allowing edits/deletes of log entries → rejected as it undermines trust.

### 8. RBAC & Visibility
- **Decision**: Reuse existing account-level RBAC. Any user who can view an account may view its Activity Log. The Activity endpoint will apply the same authorization checks used for account detail.
- **Rationale**: Keeps mental model simple and avoids a separate permission system for logs; matches Spec 16 clarifications.

### 9. Frontend Rendering & Filters
- **Decision**: Implement an Activity tab/section on the account detail page that:
  - Fetches activity entries via the new API helper in `frontend/src/lib/api.ts`.
  - Renders a vertical timeline/list with timestamp, actor, event type label, and description.
  - Provides filters for event type(s), date range, and user, wired to query parameters on the API.
- **Rationale**: Directly implements User Stories 1–4.

### 10. Testing Strategy (High-Level)
- **Backend tests**:
  - Unit tests for ActivityLog service to ensure correct event types/messages are emitted for given inputs.
  - Integration tests to verify that specific account/contact/demo operations result in ActivityLogs rows and that filters/pagination/RBAC are enforced.
- **Frontend tests**:
  - Component tests for the Activity list and filter controls.
  - Integration/E2E tests for the Activity tab (e.g., simulate account updates and assert that entries appear after refresh).
- **Rationale**: Satisfies Testability and the Success Criteria for coverage, auditability, and performance.
