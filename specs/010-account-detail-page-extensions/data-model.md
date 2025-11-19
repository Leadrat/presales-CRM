# Data Model — Spec 10: Account Detail Page Extensions

## Entities

### Account (existing)

- Source: Spec 008 / existing schema.
- Role in Spec 10: parent entity for all detail and child tab data.

### Demos (new or existing canonical entity)

- Fields (conceptual):
  - `Id` (GUID, PK)
  - `AccountId` (GUID, FK → Accounts)
  - `Title` (string)
  - `ScheduledAt` (datetime, optional)
  - `Status` (string or lookup)
  - `CreatedByUserId` (GUID, FK → Users)
  - `CreatedAt`, `UpdatedAt` (datetime)
  - `IsDeleted` (bool)

### Contacts (existing)

- Used for Contacts tab and `contactCount`.

### Notes (existing)

- Used for Notes tab and `noteCount`.

### Activity Log (existing global audit)

- Concept: existing audit/activity log entries filtered by account.
- For Spec 10, we surface:
  - `Id`, `Timestamp`, `Type`, `Description`.

## Relationships

- `Account 1 - n Contacts`
- `Account 1 - n Demos`
- `Account 1 - n Notes`
- `Account 1 - n ActivityLogEntries` (conceptual association via account reference in the audit log).
