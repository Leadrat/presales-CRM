# Data Model: Spec 015 – Demo Entity & Demo Activity History

## Entities

### Account (existing)

- **Id** (GUID) – primary key.  
- Other fields from existing model (companyName, type, size, CRM provider, etc.).

### User (existing)

- **Id** (GUID) – primary key.  
- Other identity and profile fields used for display (e.g., email, name).

### Demo (new)

Represents a single demo interaction for an Account.

- **Id** (GUID) – primary key.  
- **AccountId** (GUID, FK → Accounts.Id) – required; owning account.  
- **ScheduledAt** (DateTime, required, UTC) – when the demo is/was scheduled.  
- **DoneAt** (DateTime?, nullable, UTC) – when the demo actually completed (if applicable).  
- **DemoAlignedByUserId** (GUID, FK → Users.Id, required) – user who aligned/organized the demo.  
- **DemoDoneByUserId** (GUID?, FK → Users.Id, nullable) – user who conducted the demo.  
- **Attendees** (string, nullable) – free-form text list of POCs/attendees.  
- **Notes** (string, nullable) – free-form notes/outcomes.  
- **CreatedAt** (DateTime, required, UTC).  
- **UpdatedAt** (DateTime, required, UTC).  
- **IsDeleted** (bool, required, default false) – soft delete flag.

## Relationships

- **Account 1 → N Demo**: An Account can have many Demos; a Demo belongs to exactly one Account.  
- **User 1 → N Demo (aligned)**: A User can align many Demos via `DemoAlignedByUserId`.  
- **User 1 → N Demo (done)**: A User can conduct many Demos via `DemoDoneByUserId`.

## Validation & Constraints

- `AccountId` MUST refer to an existing, non-deleted Account.  
- `ScheduledAt` MUST be present and represent a valid date/time; it may be in the past (backfilled demos) or future (upcoming demos).  
- `DemoAlignedByUserId` MUST refer to an existing User with permission to act on the account per RBAC rules.  
- `DemoDoneByUserId` (when provided) MUST refer to an existing User.  
- `DoneAt` (when provided) SHOULD be greater than or equal to `ScheduledAt`, but enforcement can be soft (UI validation + optional server warning).  
- `IsDeleted = true` demos MUST be excluded from all standard list endpoints and UI views.

## State Transitions (Demo)

- **Scheduled → Completed**: `DoneAt` and optionally `DemoDoneByUserId` set.  
- **Scheduled/Completed → Soft-deleted**: `IsDeleted` set to true (record hidden from UI, retained in DB).  
- **Scheduled/Completed → Updated**: Allowed fields updated via `PUT` endpoint; `UpdatedAt` refreshed.
