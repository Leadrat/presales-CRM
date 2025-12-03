# Tasks – Spec 018: Account Size Classification

## Overview
Implementation tasks for account size classification feature.

## Status Summary

| Phase | Status | Tasks |
|-------|--------|-------|
| Phase 1: Core Implementation | ✅ Complete | 5/5 |
| Phase 2: Testing | ✅ Complete | 2/2 |
| Phase 3: Documentation | ✅ Complete | 1/1 |

**Overall Progress**: 8/8 tasks complete (100%)

---

## Phase 1: Core Implementation

### Task 1.1: Standardize Classification Logic
**Status**: ✅ Complete

**Description**: Update `computeSizeLabel` function across all pages to use consistent thresholds.

**Acceptance Criteria**:
- [x] 4–9 users → Little Account
- [x] 10–24 users → Small Account
- [x] 25–49 users → Medium Account
- [x] 50+ users → Enterprise
- [x] <4 or null → Empty string

**Files Modified**:
- `frontend/src/app/(admin)/accounts/[id]/page.tsx`
- `frontend/src/app/(admin)/accounts/page.tsx`
- `frontend/src/app/(protected)/my-accounts/page.tsx`
- `frontend/src/app/(admin)/accounts/new/page.tsx`
- `frontend/src/app/(protected)/my-accounts/new/page.tsx`

---

### Task 1.2: Update Badge Styling
**Status**: ✅ Complete

**Description**: Ensure badge colors are consistent across all pages.

**Acceptance Criteria**:
- [x] Little → Cyan
- [x] Small → Green
- [x] Medium → Amber
- [x] Enterprise → Purple

---

### Task 1.3: Create Shared Utility
**Status**: ✅ Complete

**Description**: Extract classification logic to shared utility file.

**Acceptance Criteria**:
- [x] Create `src/lib/account-utils.ts`
- [x] Export `computeSizeLabel` function
- [x] Export `accountSizeTagClass` function
- [x] Export `accountSizeBadgeClass` function

**Files Created**:
- `frontend/src/lib/account-utils.ts`

---

### Task 1.4: Verify Detail Page Display
**Status**: ✅ Complete

**Description**: Confirm size badge displays correctly on account detail page.

**Acceptance Criteria**:
- [x] Badge appears in page header
- [x] Correct color for each size category
- [x] Updates when editing numberOfUsers

---

### Task 1.5: Verify List Page Display
**Status**: ✅ Complete

**Description**: Confirm size badge displays correctly on account list pages.

**Acceptance Criteria**:
- [x] Badge appears in table for admin accounts list
- [x] Badge appears in table for my-accounts list
- [x] Correct compact styling

---

## Phase 2: Testing

### Task 2.1: Write Unit Tests
**Status**: ✅ Complete

**Description**: Create comprehensive unit tests for classification logic.

**Acceptance Criteria**:
- [x] Test boundary values: 3, 4, 9, 10, 24, 25, 49, 50
- [x] Test edge cases: null, undefined, 0, negative numbers
- [x] Test badge class functions
- [x] All tests pass

**Files Created**:
- `frontend/tests/lib/account-utils.test.ts`

**Test Results**:
```
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```

---

### Task 2.2: Run Test Suite
**Status**: ✅ Complete

**Description**: Execute test suite and verify all tests pass.

**Command**:
```bash
npm test -- tests/lib/account-utils.test.ts --verbose
```

**Results**: 26/26 tests passing

---

## Phase 3: Documentation

### Task 3.1: Update Spec Documentation
**Status**: ✅ Complete

**Description**: Complete all spec documentation files.

**Acceptance Criteria**:
- [x] spec.md updated with clarifications
- [x] plan.md created
- [x] research.md created
- [x] data-model.md created
- [x] quickstart.md created
- [x] tasks.md created
- [x] checklists/requirements.md created
- [x] contracts/account-size-display.md created

---

## Completion Checklist

- [x] All classification logic standardized
- [x] All badge styling consistent
- [x] Shared utility created
- [x] Unit tests written and passing
- [x] Documentation complete
- [x] Acceptance criteria verified

## Notes

- This feature is **frontend-only** – no backend changes required
- The existing `AccountSizeId` lookup table is **ignored** for display
- Size is computed client-side from `numberOfUsers` field
