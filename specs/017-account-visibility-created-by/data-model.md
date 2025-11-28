# Data Model – Spec 17: Universal Account Visibility & Created-By Attribution

## Entities

### Account (existing)

Relevant fields for this spec (names approximate existing schema):

- `Id` (GUID, PK)
- `CompanyName` (TEXT)
- `AccountTypeId` (GUID, FK → AccountTypes)
- `AccountSizeId` (GUID, FK → AccountSizes)
- `CurrentCrmId` (GUID, FK → CrmProviders)
- `LeadSource` (TEXT / lookup key)
- `DealStage` (TEXT / lookup key)
- `CreatedByUserId` (GUID, FK → Users)
- `CreatedAt` (TIMESTAMPTZ)
- Soft-delete columns: `IsDeleted`, `DeletedAt`

**New projection field (API only):**

- `createdByUserDisplayName` (nullable string) – not a DB column; populated by backend query joining `Accounts.CreatedByUserId` to `Users` and selecting the appropriate name field.

### User (existing)

Relevant fields:

- `Id` (GUID, PK)
- `Email` (TEXT, unique)
- `FullName` / `FirstName` + `LastName` or equivalent display-name fields  
- `IsActive` (BOOLEAN)
- `IsDeleted`, `DeletedAt`

**Usage in Spec 17:**

- Serves as the source of the **display name / username** for the Created By column.  
- If the user row is missing or marked deleted, the API returns `createdByUserDisplayName = null`, and the UI renders `Unknown`.

## Relationships

- **Account → User (Creator)**: Many Accounts to one User via `CreatedByUserId`.  
  - Cardinality: 0..1 creator per Account at read time (creator row may be missing).  
  - Navigation: used only for read/projection in Spec 17; no new write behaviors.

## State & Lifecycle Notes

- Spec 17 does **not** change how Accounts or Users are created, updated, or deleted.  
- Created By attribution is purely a **read-time projection** for the Accounts list; historical events remain in Activity Logs per existing specs.
