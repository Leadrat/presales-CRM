# Account Size Display Contract

## Overview
This contract defines how account size classification is computed and displayed across the application.

## Classification Function

### Input
```typescript
type Input = number | null | undefined;
```

### Output
```typescript
type Output = "Little Account" | "Small Account" | "Medium Account" | "Enterprise" | "";
```

### Logic
```typescript
function computeSizeLabel(n: number | null | undefined): string {
  if (n == null || n < 4) return "";
  if (n <= 9) return "Little Account";
  if (n <= 24) return "Small Account";
  if (n <= 49) return "Medium Account";
  return "Enterprise";
}
```

## Classification Thresholds

| Range | Label | Badge Color |
|-------|-------|-------------|
| n < 4 or null | (empty) | — |
| 4 ≤ n ≤ 9 | Little Account | Cyan |
| 10 ≤ n ≤ 24 | Small Account | Green |
| 25 ≤ n ≤ 49 | Medium Account | Amber |
| n ≥ 50 | Enterprise | Purple |

## Display Locations

### Detail Page Badge (Large)
- **Location**: Account detail page header
- **Style**: `accountSizeTagClass()`
- **Size**: `px-5 py-1.5 text-base`

### List/Table Badge (Compact)
- **Location**: Account list tables
- **Style**: `accountSizeBadgeClass()`
- **Size**: `px-3 py-1 text-xs`

## Data Source

| Endpoint | Field | Type |
|----------|-------|------|
| `GET /api/accounts` | `numberOfUsers` | `int?` |
| `GET /api/accounts/{id}` | `numberOfUsers` | `int?` |

## Notes
- Size is computed **client-side only** from `numberOfUsers`
- No backend computation or storage of computed size
- `AccountSizeId` lookup table is ignored for display purposes
