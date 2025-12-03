# Research – Spec 018: Account Size Classification

## Overview
This document captures research and decisions made during the implementation of account size classification.

## Research Topics

### 1. Computation Location: Client-side vs Server-side

**Decision**: Client-side computation

**Rationale**:
- Real-time updates when editing `numberOfUsers` field
- No API latency for size label display
- Simpler implementation – no backend changes required
- Size is purely a display concern, not business logic

**Alternatives Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Server-side computed field | Consistent across all clients | Requires backend changes, API latency |
| Stored in database | Queryable, filterable | Sync issues when numberOfUsers changes |
| Client-side (chosen) | Real-time, simple | Duplicated logic across pages |

### 2. Classification Thresholds

**Decision**: 4-9 Little, 10-24 Small, 25-49 Medium, 50+ Enterprise

**Rationale**:
- Business requirement from stakeholder
- Accounts with <4 users are too small to classify
- Thresholds align with typical B2B company size segments

**Alternatives Considered**:
| Option | Thresholds | Rejected Because |
|--------|------------|------------------|
| Original spec | 10-24, 25-49, 50+ | Missing "Little" category |
| Industry standard | 1-10, 11-50, 51-200, 200+ | Doesn't match business needs |
| Chosen | 4-9, 10-24, 25-49, 50+ | Best fit for target market |

### 3. Empty/Null Handling

**Decision**: Show nothing (empty string) for null/undefined/<4

**Rationale**:
- Clean UI without unnecessary placeholders
- Accounts without user count don't need a size label
- Consistent with existing UI patterns

**Alternatives Considered**:
| Option | Display | Rejected Because |
|--------|---------|------------------|
| Show "Not Set" | Gray badge | Adds visual noise |
| Show "Unknown" | Gray badge | Implies data problem |
| Show nothing (chosen) | Empty | Clean, unobtrusive |

### 4. Code Organization

**Decision**: Extract to shared utility file

**Rationale**:
- DRY principle – avoid duplicating logic across 5 files
- Testability – single function to unit test
- Maintainability – single place to update thresholds

**Implementation**:
- Created `src/lib/account-utils.ts`
- Exports `computeSizeLabel`, `accountSizeTagClass`, `accountSizeBadgeClass`
- Unit tests in `tests/lib/account-utils.test.ts`

### 5. Testing Strategy

**Decision**: Unit tests with boundary value analysis

**Rationale**:
- Pure function with clear input/output – ideal for unit testing
- Boundary values catch off-by-one errors
- Edge cases ensure robustness

**Test Coverage**:
| Category | Test Cases |
|----------|------------|
| Boundary values | 3, 4, 9, 10, 24, 25, 49, 50, 100, 1000 |
| Edge cases | null, undefined, 0, -1, -100, 1, 2 |
| Badge classes | All 4 size categories + empty |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Jest | Existing | Unit testing |
| TypeScript | Existing | Type safety |
| Tailwind CSS | Existing | Badge styling |

## References
- Spec 018: `specs/018-account-size-classification/spec.md`
- Clarifications session: 2024-11-30
