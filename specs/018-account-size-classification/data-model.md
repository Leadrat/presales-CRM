# Data Model – Spec 018: Account Size Classification

## Overview
This feature uses **client-side computation only**. No database changes are required.

## Existing Data Used

### Account Table (No Changes)
```sql
-- Existing field used for classification
Accounts.NumberOfUsers INT NULL
```

### AccountSizes Lookup Table (Ignored)
```sql
-- This table exists but is NOT used for computed size display
-- Kept for backward compatibility only
CREATE TABLE AccountSizes (
  Id UUID PRIMARY KEY,
  Name TEXT NOT NULL UNIQUE,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Computed Classification (Frontend Only)

### TypeScript Types
```typescript
// Size label type
type AccountSizeLabel = 
  | "Little Account" 
  | "Small Account" 
  | "Medium Account" 
  | "Enterprise" 
  | "";

// Classification function signature
function computeSizeLabel(n: number | null | undefined): AccountSizeLabel;
```

### Classification Rules
| numberOfUsers | Computed Label |
|---------------|----------------|
| null / undefined | "" |
| < 4 | "" |
| 4–9 | "Little Account" |
| 10–24 | "Small Account" |
| 25–49 | "Medium Account" |
| ≥ 50 | "Enterprise" |

## API Response (Existing)

### AccountDetailDto
```csharp
public class AccountDetailDto
{
    // ... other fields
    public int? NumberOfUsers { get; set; }  // Used for client-side computation
    public string AccountSizeName { get; set; }  // From lookup table (ignored)
    // ... other fields
}
```

### AccountListItem
```csharp
public class AccountListItem
{
    // ... other fields
    public int? NumberOfUsers { get; set; }  // Used for client-side computation
    // ... other fields
}
```

## Relationships

```
Account.NumberOfUsers (int?) 
    └──> computeSizeLabel() [client-side]
            └──> Display badge with appropriate styling
```

## Notes
- **No migrations required** – Uses existing `NumberOfUsers` field
- **No backend changes** – Computation is purely frontend
- **AccountSizeId ignored** – Stored size lookup is not used for display
