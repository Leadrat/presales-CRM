# Spec 018 – Account Size Classification

## Goal
Auto-mark accounts as Little / Small / Medium / Enterprise based on `numberOfUsers`.

## Clarifications

### Session 2024-11-30
- Q: Should computed size or stored `AccountSizeId` be authoritative? → A: Computed size is authoritative; ignore `AccountSizeId` lookup entirely.
- Q: How to display when `numberOfUsers` is null/undefined/0/negative? → A: Show nothing (empty/blank).
- Q: What defines "done" for this feature? → A: Unit tests for `computeSizeLabel` function with boundary values.
- Q: Should size-based filtering be implemented now? → A: Defer filtering to a future spec; current scope is display-only.
- Q: Should the spec explicitly list out-of-scope items? → A: Yes, add explicit out-of-scope section.

## Classification Logic

| Number of Users | Size Label |
|-----------------|------------|
| 4–9             | Little Account |
| 10–24           | Small Account |
| 25–49           | Medium Account |
| 50+             | Enterprise |

**Note:** Accounts with fewer than 4 users or no user count show no size label (empty/blank display).

## Out of Scope
- **Size-based filtering** – Deferred to future spec; no filter dropdowns or backend query endpoints
- **Backend computation** – Size is computed client-side only; no server-side classification
- **Size-based permissions** – Account size does not affect user access or feature availability
- **Stored size sync** – `AccountSizeId` lookup table is ignored; no automatic updates when `numberOfUsers` changes
- **Size change notifications** – No alerts when an account crosses size thresholds

## Scope

### Frontend (Computed on Display)
- **Account Detail Page** (`/accounts/[id]`) – Show size badge in header
- **Admin Accounts List** (`/accounts`) – Show size badge in table
- **My Accounts List** (`/my-accounts`) – Show size badge in table
- **New Account Pages** – Show size badge preview when entering numberOfUsers

### Backend
- `AccountDetailDto` returns `accountSizeName` from the `AccountSize` lookup table
- Size is computed client-side from `numberOfUsers` for real-time display
- The `AccountSizeId` lookup remains for backward compatibility but is secondary to computed size

### API
- `numberOfUsers` is exposed in account list and detail APIs
- Dashboard/filtering can use `numberOfUsers` ranges for size-based queries

## Implementation Status

| Component | Status |
|-----------|--------|
| Frontend size label display | ✅ Implemented (logic updated) |
| Admin accounts detail page | ✅ Updated |
| Admin accounts list page | ✅ Updated |
| My-accounts list page | ✅ Updated |
| Admin new account page | ✅ Updated |
| My-accounts new page | ✅ Updated |
| Backend AccountSize model | ✅ Exists (lookup table) |
| API exposes numberOfUsers | ✅ Implemented |

## Acceptance Criteria
- [x] Unit tests exist for `computeSizeLabel` with boundary values: 3, 4, 9, 10, 24, 25, 49, 50
- [x] All tests pass for edge cases: `null`, `undefined`, `0`, negative numbers → return empty string
- [x] Size badge displays correctly on account detail page
- [x] Size badge displays correctly on admin accounts list
- [x] Size badge displays correctly on my-accounts list
- [x] Size badge preview works on new account forms

## Implementation Log / Commands

### Frontend Updates
All `computeSizeLabel` functions standardized to:
```typescript
function computeSizeLabel(n: number | null | undefined): string {
  if (n == null || n < 4) return "";
  if (n <= 9) return "Little Account";
  if (n <= 24) return "Small Account";
  if (n <= 49) return "Medium Account";
  return "Enterprise";
}
```

### Files Modified
1. `frontend/src/app/(admin)/accounts/[id]/page.tsx`
2. `frontend/src/app/(admin)/accounts/page.tsx`
3. `frontend/src/app/(protected)/my-accounts/page.tsx`
4. `frontend/src/app/(admin)/accounts/new/page.tsx`
5. `frontend/src/app/(protected)/my-accounts/new/page.tsx`

### Shared Utility Created
- `frontend/src/lib/account-utils.ts` – Exports `computeSizeLabel`, `accountSizeTagClass`, `accountSizeBadgeClass`

### Unit Tests Added
- `frontend/tests/lib/account-utils.test.ts` – 26 tests covering boundary values and edge cases

### Test Command
```bash
npm test -- tests/lib/account-utils.test.ts --verbose
```

### Test Results
```
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```
