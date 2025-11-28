# Data Model: Activity Log Expansion v2

## Core Entities

### 1. ActivityLog (table: ActivityLogs)
- **Purpose**: Store immutable audit records for material actions related to accounts.
- **Key fields (conceptual)**:
  - `Id` (GUID, PK)
  - `AccountId` (GUID, FK → Accounts.Id)
  - `ActivityTypeId` (GUID, FK → ActivityTypes.Id)
  - `ActorUserId` (GUID, nullable FK → Users.Id; null or special value for system actions)
  - `RelatedEntityType` (TEXT, e.g., `Account`, `Contact`, `Demo`, `Note`)
  - `RelatedEntityId` (GUID, nullable; references the related entity when applicable)
  - `Message` (TEXT; human-readable description with key details and, where applicable, old/new values)
  - `CorrelationId` (GUID, nullable; used to group related operations)
  - `CreatedAt` (TIMESTAMPTZ, UTC; when the event occurred)

- **Indexes & constraints (conceptual)**:
  - PK on `Id`.
  - Index on `(AccountId, CreatedAt DESC)` for per-account timelines.
  - Index on `(ActivityTypeId, CreatedAt DESC)` to support potential reporting.
  - Optional index on `ActorUserId` for user-based filtering.

### 2. ActivityType (table: ActivityTypes)
- **Purpose**: Lookup table for standardized activity types.
- **Key fields**:
  - `Id` (GUID, PK)
  - `Name` (TEXT, unique; e.g., `ACCOUNT_CREATED`, `ACCOUNT_UPDATED`, `DEAL_STAGE_CHANGED`, `LEAD_SOURCE_CHANGED`, `CONTACT_ADDED`, `CONTACT_UPDATED`, `CONTACT_DELETED`, `DEMO_SCHEDULED`, `DEMO_UPDATED`, `DEMO_COMPLETED`, `DEMO_CANCELLED`, `NOTE_ADDED`)
  - `CreatedAt`, `UpdatedAt` (TIMESTAMPTZ)

### 3. Actor (existing: Users table)
- **Purpose**: Source of truth for the human actor shown on Activity logs.
- **Relationship**:
  - `ActivityLogs.ActorUserId` → `Users.Id` (nullable).
  - System-generated actions are represented with a null `ActorUserId` and a special message/label such as "System".

### 4. Related Domain Entities
- **Accounts** (existing `Accounts` table)
  - Relationship: `Accounts.Id` → `ActivityLogs.AccountId` (one-to-many).

- **Contacts** (existing `Contacts` table)
  - Relationship: `Contacts.Id` → `ActivityLogs.RelatedEntityId` when `RelatedEntityType = 'Contact'`.

- **Demos** (existing `Demos` table)
  - Relationship: `Demos.Id` → `ActivityLogs.RelatedEntityId` when `RelatedEntityType = 'Demo'`.

- **Notes** (wherever notes are stored)
  - Relationship: Note identifier → `ActivityLogs.RelatedEntityId` when `RelatedEntityType = 'Note'`.

## API-Level Models (DTOs)

### ActivityLogEntryDto
- **Fields**:
  - `id` (string, GUID)
  - `accountId` (string, GUID)
  - `eventType` (string; derived from `ActivityTypes.Name`)
  - `description` (string; human-readable message)
  - `timestamp` (string, ISO-8601 UTC timestamp)
  - `actorId` (string, GUID | null)
  - `actorName` (string; display name or `"System"`)
  - `relatedEntityType` (string | null)
  - `relatedEntityId` (string, GUID | null)

### ActivityLogFilter
- **Conceptual request model** used by the backend endpoint:
  - `eventTypes` (array of strings, optional)
  - `from` (DateTime?, optional, UTC)
  - `to` (DateTime?, optional, UTC)
  - `userId` (GUID?, optional)
  - `cursor` (string, optional; cursor token for pagination)
  - `limit` (int, optional; default page size)

### ActivityLogPage
- **Response wrapper**:
  - `items` (array of `ActivityLogEntryDto`)
  - `nextCursor` (string | null; cursor for subsequent page, if any)

## State & Lifecycle

- ActivityLog entries are **append-only**:
  - Created when a material event occurs (account update, contact change, demo lifecycle, note added).
  - Never updated or deleted via normal flows (immutability).
  - If a future admin redaction is implemented, redaction will replace the `Message` content with a neutral placeholder while preserving the entry record and timeline position.

- Related domain entities (Account, Contact, Demo, Note) follow existing soft-delete rules. Deleted entities will continue to have historical ActivityLog entries, potentially with UI hints like "(deleted)".
