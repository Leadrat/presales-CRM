# Impl Plan – Spec 11: Account Profile Enrichment

## 1. Context

- **Spec:** `specs/011-account-profile-enrichment/spec.md`
- **Feature:** Enrich Account company profile with additional fields and computed `accountSize`.
- **Backend:** .NET API (AccountsController, Account model, EF Core).
- **Frontend:** Next.js + TypeScript + Tailwind (TailAdmin-style UI), account pages already exist.

---

## 2. High-Level Phases

1. **Phase 1 – Backend data model & API**
   - Extend `Account` entity with new profile fields.
   - Wire new fields into `AccountsController` create/update/list/detail.
   - Compute `accountSize` from `numberOfUsers` on the server.

2. **Phase 2 – Frontend wiring**
   - Update `api.ts` types and helpers to include new fields.
   - Update account create/edit forms to capture new fields.
   - Update account detail views to display new profile information and `accountSize`.

3. **Phase 3 – Validation alignment & UX polish**
   - Align backend validation with Spec 11 required fields.
   - Ensure frontend validations and error messages match.
   - Minor UX refinements (labels, layout, responsive behavior).

---

## 3. Phase 1 – Backend Data Model & API

### 3.1 Account Entity

- **File:** `backend/Models/Account.cs`
- **Changes:**
  - Add properties with safe defaults:
    - `WebsiteUrl: string`
    - `DecisionMakers: string`
    - `NumberOfUsers: int`
    - `InstagramUrl: string`
    - `LinkedinUrl: string`
    - `Phone: string`
    - `Email: string`
  - Keep existing IDs, timestamps, and navigation properties.

> Migration note: columns can be added with default values or allow nulls then backfilled; exact migration mechanics handled via EF migrations outside this plan.

### 3.2 AccountsController

- **File:** `backend/Controllers/AccountsController.cs`
- **Create/Update request models:**
  - Extend `AccountCreateRequest` and `AccountUpdateRequest` with optional fields:
    - `DecisionMakers?`, `InstagramUrl?`, `LinkedinUrl?`, `Phone?`, `Email?`.
  - Keep `Website` and `NumberOfUsers` as already modeled.

- **Create (POST /api/Accounts):**
  - Map request fields → `Account` properties.
  - Initialize enriched fields with `request` values or safe fallbacks.
  - Return enriched response including:
    - Legacy fields: `website`, `numberOfUsers`, IDs, timestamps.
    - New fields: `websiteUrl`, `decisionMakers`, `instagramUrl`, `linkedinUrl`, `phone`, `email`.
    - Computed `accountSize` from `NumberOfUsers`.

- **List (GET /api/Accounts):**
  - Project enriched fields:
    - `website = WebsiteUrl`, `numberOfUsers = NumberOfUsers`.
    - `websiteUrl`, `decisionMakers`, `instagramUrl`, `linkedinUrl`, `phone`, `email`.
    - `accountSize` computed from `NumberOfUsers` using Spec 11 rules.

- **Detail (GET /api/Accounts/{id}/detail):**
  - Populate `AccountDetailDto` with `Website = WebsiteUrl`, `NumberOfUsers = NumberOfUsers`.

- **Update (PUT /api/Accounts/{id}):**
  - Update all enriched fields when provided in request.
  - Update `NumberOfUsers` when explicitly present.
  - Return enriched response mirroring Create.

> Validation hardening for required fields (decisionMakers, phone, email, etc.) is deferred to Phase 3 to avoid breaking existing clients during rollout.

---

## 4. Phase 2 – Frontend Wiring

### 4.1 API Types & Helpers

- **File:** `frontend/src/lib/api.ts`
- **Tasks:**
  - Extend `AccountDto` and `AccountDetailDto` with:
    - `websiteUrl`, `decisionMakers`, `numberOfUsers`, `instagramUrl`, `linkedinUrl`, `phone`, `email`, `accountType`, `accountSize` (where appropriate).
  - Extend `AccountCreateInput` / `AccountUpdateInput` to carry new fields.
  - Update `createAccount` and `updateAccount` helpers to send/receive enriched payloads.

### 4.2 Account Create/Edit Forms

- **Files:**
  - Admin create/edit account pages.
  - Basic/My-accounts edit page.
- **Tasks:**
  - Add TailAdmin-styled form controls for:
    - Website URL, Decision Makers, Number of Users, Instagram URL, LinkedIn URL, Phone Number, Email ID, Account Type (dropdown).
  - Mark required fields clearly (Account Name, Account Type, Number of Users, Decision Makers, Phone, Email).
  - Wire form submission to updated `createAccount`/`updateAccount` helpers.

### 4.3 Account Detail Views

- **Files:**
  - Admin account detail.
  - Basic/My-accounts detail.
- **Tasks:**
  - Display new profile fields in the Company Information card.
  - Show computed `accountSize` label next to `numberOfUsers` or Account Type.

---

## 5. Phase 3 – Validation & UX Polish

- Tighten backend validation to fully enforce Spec 11 required fields.
- Align frontend form validation (required markers, error text) with backend rules.
- Ensure dark/light TailAdmin styling and responsive layout remain consistent after new fields are added.

---

## 6. Risks & Considerations

- **Backward compatibility:**
  - New fields are added in a way that preserves existing shapes; strict required validation is delayed until frontend is updated.
- **Data quality:**
  - URL/email/phone validation kept basic to avoid blocking users; can be refined later.
- **Incremental rollout:**
  - Safe to deploy backend changes first, then frontend, as long as new required fields are not enforced until forms are ready.
