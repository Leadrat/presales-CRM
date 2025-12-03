# Quickstart – Spec 018: Account Size Classification

## Overview
Auto-mark accounts as Little / Small / Medium / Enterprise based on `numberOfUsers`.

## Quick Reference

### Classification Logic
```
4–9 users    → Little Account  (Cyan)
10–24 users  → Small Account   (Green)
25–49 users  → Medium Account  (Amber)
50+ users    → Enterprise      (Purple)
<4 or null   → (no label)
```

## Usage

### Import the Utility
```typescript
import { computeSizeLabel, accountSizeTagClass, accountSizeBadgeClass } from '@/lib/account-utils';
```

### Compute Size Label
```typescript
const label = computeSizeLabel(account.numberOfUsers);
// Returns: "Little Account" | "Small Account" | "Medium Account" | "Enterprise" | ""
```

### Display Badge (Detail Page Style)
```tsx
{label && (
  <span className={accountSizeTagClass(label)}>
    {label}
  </span>
)}
```

### Display Badge (Table/List Style)
```tsx
{label && (
  <span className={accountSizeBadgeClass(label)}>
    {label}
  </span>
)}
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/account-utils.ts` | Shared utility functions |
| `tests/lib/account-utils.test.ts` | Unit tests (26 tests) |

## Commands

### Run Tests
```bash
cd frontend
npm test -- tests/lib/account-utils.test.ts --verbose
```

### Run All Tests
```bash
cd frontend
npm test
```

## Pages Using This Feature

| Page | Route | Badge Style |
|------|-------|-------------|
| Account Detail | `/accounts/[id]` | Large (Tag) |
| Admin Accounts List | `/accounts` | Compact (Badge) |
| My Accounts List | `/my-accounts` | Compact (Badge) |
| Admin New Account | `/accounts/new` | Large (Tag) |
| My Accounts New | `/my-accounts/new` | Large (Tag) |

## Modifying Thresholds

To change classification thresholds, edit `src/lib/account-utils.ts`:

```typescript
export function computeSizeLabel(n: number | null | undefined): string {
  if (n == null || n < 4) return "";      // Change minimum threshold
  if (n <= 9) return "Little Account";    // Change Little upper bound
  if (n <= 24) return "Small Account";    // Change Small upper bound
  if (n <= 49) return "Medium Account";   // Change Medium upper bound
  return "Enterprise";
}
```

**Important**: After changing thresholds, update the unit tests in `tests/lib/account-utils.test.ts`.

## Troubleshooting

### Badge Not Showing
- Check if `numberOfUsers` is populated (not null/undefined)
- Verify `numberOfUsers >= 4`

### Wrong Color
- Ensure using correct function: `accountSizeTagClass` for detail pages, `accountSizeBadgeClass` for lists

### Tests Failing
- Run `npm test -- tests/lib/account-utils.test.ts --verbose` to see detailed output
- Check if thresholds were changed without updating tests
