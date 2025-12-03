# Implementation Plan – Spec 018: Account Size Classification

## Technical Context

| Aspect | Value | Status |
|--------|-------|--------|
| Frontend Framework | Next.js with TypeScript | ✅ Known |
| Backend Framework | .NET Core C# REST APIs | ✅ Known |
| Database | PostgreSQL | ✅ Known |
| Computation Location | Client-side only | ✅ Clarified |
| Data Source | `numberOfUsers` field on Account | ✅ Known |
| Test Framework (Frontend) | Jest | ✅ Known |

## Constitution Check

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. Simplicity** | ✅ PASS | Pure function, no backend changes, single responsibility |
| **II. Auditability** | ✅ N/A | Display-only feature, no data mutations |
| **III. Testability** | ✅ PASS | Unit tests required per acceptance criteria |
| **IV. Extensibility** | ✅ PASS | Logic centralized, easy to modify thresholds |
| **V. Security & RBAC** | ✅ N/A | No auth/permission changes |

**Gate Status**: ✅ ALL GATES PASS

---

## Phase 0: Research

### Research Summary

Since this is a frontend-only display feature with no backend changes, minimal research is needed.

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Computation location | Client-side | Real-time updates when editing `numberOfUsers`; no API latency |
| Test approach | Jest unit tests | Standard frontend testing; boundary value testing |
| Threshold values | 4-9, 10-24, 25-49, 50+ | Business requirement from spec |

**Output**: No `research.md` needed – all decisions already clarified in spec.

---

## Phase 1: Design & Contracts

### Data Model

No database changes required. The feature uses existing `numberOfUsers` field.

**Existing Field Used**:
```
Account.NumberOfUsers: int? (nullable)
```

**Computed Classification** (client-side only):
```typescript
type AccountSizeLabel = "Little Account" | "Small Account" | "Medium Account" | "Enterprise" | "";
```

### API Contracts

No new API endpoints. Existing endpoints already expose `numberOfUsers`:

| Endpoint | Field | Status |
|----------|-------|--------|
| `GET /api/accounts` | `numberOfUsers` | ✅ Exposed |
| `GET /api/accounts/{id}` | `numberOfUsers` | ✅ Exposed |

### Component Design

**Shared Function** (to be extracted for testing):
```typescript
// Location: frontend/src/lib/account-utils.ts (new file for testability)
export function computeSizeLabel(n: number | null | undefined): string {
  if (n == null || n < 4) return "";
  if (n <= 9) return "Little Account";
  if (n <= 24) return "Small Account";
  if (n <= 49) return "Medium Account";
  return "Enterprise";
}
```

**Badge Styling Function**:
```typescript
export function accountSizeBadgeClass(label: string): string {
  // Returns Tailwind classes for each size category
}
```

---

## Phase 2: Implementation Tasks

### Task 1: Extract shared utility function
- Create `frontend/src/lib/account-utils.ts`
- Move `computeSizeLabel` and `accountSizeBadgeClass` to shared location
- Update all 5 page files to import from shared location

### Task 2: Write unit tests
- Create `frontend/src/lib/__tests__/account-utils.test.ts`
- Test boundary values: 3, 4, 9, 10, 24, 25, 49, 50
- Test edge cases: `null`, `undefined`, `0`, `-1`

### Task 3: Verify UI displays
- Manual verification on all pages
- Screenshot evidence for acceptance

---

## Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/018-account-size-classification/plan.md` | ✅ Created |
| Research | N/A (not needed) | ✅ Skipped |
| Data Model | N/A (no DB changes) | ✅ N/A |
| API Contracts | N/A (no new endpoints) | ✅ N/A |

---

## Quickstart

### Current State
The `computeSizeLabel` function is already implemented and duplicated across 5 files. The logic has been standardized per Spec 018.

### Remaining Work
1. **Extract to shared utility** (optional but recommended for DRY)
2. **Add unit tests** (required per acceptance criteria)

### Commands

```bash
# Run frontend tests (after adding test file)
cd frontend
npm test -- --testPathPattern=account-utils

# Manual verification
npm run dev
# Visit: /accounts, /accounts/[id], /my-accounts, /accounts/new, /my-accounts/new
```

---

## Post-Design Constitution Re-check

| Principle | Final Status |
|-----------|--------------|
| Simplicity | ✅ Single pure function |
| Auditability | ✅ N/A |
| Testability | ✅ Unit tests defined |
| Extensibility | ✅ Centralized logic |
| Security | ✅ N/A |

**Final Gate Status**: ✅ READY FOR IMPLEMENTATION
