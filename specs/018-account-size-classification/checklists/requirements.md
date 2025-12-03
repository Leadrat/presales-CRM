# Spec 018 – Account Size Classification Checklist

## Requirements Checklist

### Classification Logic
- [x] 4–9 users → Little Account
- [x] 10–24 users → Small Account
- [x] 25–49 users → Medium Account
- [x] 50+ users → Enterprise
- [x] <4 users or null/undefined → No label (empty)

### Frontend Display
- [x] Account Detail Page (`/accounts/[id]`) – Size badge in header
- [x] Admin Accounts List (`/accounts`) – Size badge in table
- [x] My Accounts List (`/my-accounts`) – Size badge in table
- [x] Admin New Account (`/accounts/new`) – Size badge preview
- [x] My Accounts New (`/my-accounts/new`) – Size badge preview

### Badge Styling
- [x] Little Account → Cyan badge
- [x] Small Account → Green badge
- [x] Medium Account → Amber badge
- [x] Enterprise → Purple badge

### Code Quality
- [x] Shared utility created (`src/lib/account-utils.ts`)
- [x] Unit tests added (26 tests)
- [x] All boundary values tested (3, 4, 9, 10, 24, 25, 49, 50)
- [x] All edge cases tested (null, undefined, 0, negative)

### Out of Scope (Verified Not Implemented)
- [x] No size-based filtering added
- [x] No backend computation added
- [x] No size-based permissions added
- [x] No AccountSizeId sync added
- [x] No size change notifications added

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | — | 2024-11-30 | ✅ Complete |
| QA | — | — | Pending |
