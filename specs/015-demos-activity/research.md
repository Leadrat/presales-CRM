# Research: Spec 015 – Demo Entity & Demo Activity History

## Decisions

- **Demo entity shape**  
  **Decision**: Use a dedicated `Demo` table with `Id`, `AccountId`, `ScheduledAt` (required, UTC), `DoneAt` (nullable, UTC), `DemoAlignedByUserId` (required), `DemoDoneByUserId` (nullable), `Attendees`/POCs (text), `Notes` (text), `CreatedAt`, `UpdatedAt`, `IsDeleted`.  
  **Rationale**: Mirrors existing soft-delete and audit fields on other entities; keeps demo-specific concerns isolated while remaining simple.  
  **Alternatives considered**: Embedding demos as JSON inside `Accounts` was rejected for queryability and consistency with existing normalized schema.

- **RBAC model for demos**  
  **Decision**: Reuse the existing rule: Admin can manage demos for any account; Basic users can manage demos only for accounts they created; anyone who can view an account can list demos.  
  **Rationale**: Aligns with Spec 012 rules for Accounts and Contacts; avoids introducing new permission concepts.  
  **Alternatives considered**: Per-demo ownership (alignedBy vs doneBy) as the permission driver was rejected as more complex and harder to reason about.

- **Editing behavior**  
  **Decision**: Demos are editable via a `PUT /api/Accounts/{accountId}/demos/{demoId}` endpoint and UI controls in the Demos tab. Allowed edits include correcting `ScheduledAt`, setting or updating `DoneAt`, switching `DemoAlignedByUserId` / `DemoDoneByUserId`, and editing attendees/notes.  
  **Rationale**: Users often schedule demos before they occur and need to later mark them done or correct details; full immutability would lead to noisy duplicate records.  
  **Alternatives considered**: Immutable demos with “superseding” records were rejected as overkill for current scale.

- **Soft delete vs hard delete**  
  **Decision**: Use `IsDeleted` soft delete, matching Contacts and Accounts. `GET` endpoints always filter out soft-deleted demos.  
  **Rationale**: Preserves history for auditability without cluttering UI; aligns with existing data patterns.  
  **Alternatives considered**: Hard delete was rejected due to accidental data loss risk.

- **Time handling**  
  **Decision**: Store all timestamps (`ScheduledAt`, `DoneAt`, `CreatedAt`, `UpdatedAt`) in UTC in the database; frontend formats for local display.  
  **Rationale**: Matches common best practice and simplifies cross-time-zone handling.  
  **Alternatives considered**: Storing local times per user/account was rejected as unnecessary complexity.

## Open Items (for future specs)

- Bulk editing or rescheduling of many demos at once is out of scope for Spec 015.
- Notification or reminder flows around upcoming demos will be handled by later activity-specs.
