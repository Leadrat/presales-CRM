# Tasks – Spec 11: Account Profile Enrichment

## Phase 1 – Setup

- [ ] T001 Ensure backend EF Core migrations are configured and `dotnet ef` tooling is available in backend/ (no code changes)
- [ ] T002 Ensure frontend dev environment is running (Next.js dev server) and `.env` points API_BASE to `http://localhost:5033`

## Phase 2 – Foundational Backend/Data

- [ ] T003 Add new profile fields to `Account` entity in `backend/Models/Account.cs` (WebsiteUrl, DecisionMakers, NumberOfUsers, InstagramUrl, LinkedinUrl, Phone, Email)
- [ ] T004 [P] Create and apply EF migration to add new columns to `"Accounts"` table, matching Spec 11 nullable/required expectations
- [ ] T005 Update any seed data or fixtures touching `Accounts` (if present) under `backend/` to populate safe defaults for new fields

## Phase 3 – Backend APIs for Account Profile (US1)

- [ ] T006 [US1] Extend `AccountCreateRequest` and `AccountUpdateRequest` records in `backend/Controllers/AccountsController.cs` with Spec 11 fields (DecisionMakers, NumberOfUsers, InstagramUrl, LinkedinUrl, Phone, Email)
- [ ] T007 [P] [US1] Update `Create` handler in `backend/Controllers/AccountsController.cs` to map new fields into `Account` and return them in the response payload (including computed `accountSize`)
- [ ] T008 [P] [US1] Update `List` handler in `backend/Controllers/AccountsController.cs` to project enriched fields to the list DTO (websiteUrl, decisionMakers, numberOfUsers, instagramUrl, linkedinUrl, phone, email, accountSize)
- [ ] T009 [US1] Update `GetDetail` handler in `backend/Controllers/AccountsController.cs` and `backend/Models/Interfaces/AccountDetailDto.cs` to include enriched fields so detail view receives websiteUrl, decisionMakers, numberOfUsers, instagramUrl, linkedinUrl, phone, email
- [ ] T010 [US1] Update `Update` handler in `backend/Controllers/AccountsController.cs` to support updating enriched fields and recomputing `NumberOfUsers`/`accountSize` while preserving RBAC and partial-update semantics
- [ ] T011 [P] [US1] Implement server-side computation of `accountSize` from `NumberOfUsers` in `backend/Controllers/AccountsController.cs` list/create/update projections per Spec 11 ranges

## Phase 4 – Frontend API Wiring (US1)

- [ ] T012 [US1] Extend `AccountDto` type in `frontend/src/lib/api.ts` to include Spec 11 fields (websiteUrl, decisionMakers, numberOfUsers, instagramUrl, linkedinUrl, phone, email, accountSize)
- [ ] T013 [P] [US1] Extend `AccountDetailDto` type in `frontend/src/lib/api.ts` to include enriched fields for detail view
- [ ] T014 [P] [US1] Extend `AccountCreateInput` / `AccountUpdateInput` in `frontend/src/lib/api.ts` to carry Spec 11 fields
- [ ] T015 [US1] Update `createAccount` helper in `frontend/src/lib/api.ts` to send Spec 11 fields in POST body
- [ ] T016 [US1] Update `updateAccount` helper in `frontend/src/lib/api.ts` to send Spec 11 fields, preserving partial-update semantics (undefined vs null)

## Phase 5 – Frontend Create/Edit Forms (US1)

- [ ] T017 [US1] Update New Account page in `frontend/src/app/(admin)/accounts/new/page.tsx` to add TailAdmin inputs for websiteUrl, decisionMakers, numberOfUsers, instagramUrl, linkedinUrl, phone, email and wire them to `createAccount`
- [ ] T018 [P] [US1] Update Admin Edit Account page in `frontend/src/app/(admin)/accounts/[id]/edit/page.tsx` to bind enriched fields from `AccountDetailDto` and include them in `updateAccount` payload
- [ ] T019 [P] [US1] Update Basic/My-Accounts Edit page in `frontend/src/app/(protected)/my-accounts/[id]/edit/page.tsx` to bind enriched fields and include them in `updateAccount` payload
- [ ] T020 [US1] Normalize CRM expiry handling in edit forms to `MM/YY` format when loading from API so backend validation passes on subsequent edits

## Phase 6 – Frontend Detail Views (US1)

- [ ] T021 [US1] Update Admin Account Detail page in `frontend/src/app/(admin)/accounts/[id]/page.tsx` Company Info section to display websiteUrl, decisionMakers, numberOfUsers, instagramUrl, linkedinUrl, phone, email, and computed accountSize
- [ ] T022 [P] [US1] Update Basic/My-Accounts Detail page in `frontend/src/app/(protected)/my-accounts/[id]/page.tsx` Company Information card (dark theme) to display the same Spec 11 fields and computed accountSize
- [ ] T023 [US1] Ensure list views that show account size or basic profile use enriched list DTO fields from `listAccounts` (frontend) and `List` (backend)

## Phase 7 – Validation & UX Polish (US1)

- [ ] T024 [US1] Tighten backend validation in `AccountsController` create/update handlers to enforce required fields from Spec 11 (decisionMakers, numberOfUsers, phone, email, accountType) with clear error codes
- [ ] T025 [P] [US1] Align frontend New Account form validation in `frontend/src/app/(admin)/accounts/new/page.tsx` with backend rules (required marks, MM/YY checks, basic email/phone/URL sanity)
- [ ] T026 [P] [US1] Align Admin Edit Account form validation in `frontend/src/app/(admin)/accounts/[id]/edit/page.tsx` with backend rules
- [ ] T027 [P] [US1] Align Basic/My-Accounts Edit form validation in `frontend/src/app/(protected)/my-accounts/[id]/edit/page.tsx` with backend rules
- [ ] T028 [US1] Review TailAdmin styling on create/edit/detail to ensure spacing, labels, error text, and responsive layout remain consistent after adding new fields

## Phase 8 – Polish & Cross-Cutting

- [ ] T029 Document Spec 11 behavior and new fields in a short README note under `specs/011-account-profile-enrichment/` or project docs (how accountSize is computed, required fields)
- [ ] T030 Add a quick manual test checklist for Spec 11 (create, edit, detail, list) to `specs/011-account-profile-enrichment/quickstart.md` or equivalent, if present

## Dependencies & Execution Order

- Phase 1 and Phase 2 tasks (T001–T005) must be completed before backend API work (T006–T011).
- Backend API changes (T006–T011) should be completed before or in parallel with frontend API wiring (T012–T016).
- Frontend forms (T017–T020) depend on frontend API wiring (T012–T016).
- Detail view updates (T021–T023) depend on backend detail DTO (T009) and frontend types (T013).
- Validation/UX polish (T024–T028) should follow after core flows are working end-to-end.
- Documentation/polish tasks (T029–T030) come last.
