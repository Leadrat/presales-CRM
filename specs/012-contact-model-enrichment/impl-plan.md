# Spec 012 — Contact Model Enrichment: Implementation Plan

## 0. Context

- **Spec**: `specs/012-contact-model-enrichment/spec.md`
- **Goal**: Enrich the Contact model, API, and UI under each Account with ABM-friendly fields (phones, designation, city, DOB, socials) without regressing existing Account functionality.
- **Tech stack** (inferred from existing app):
  - Backend: .NET API with EF Core and controllers similar to `AccountsController`.
  - Frontend: Next.js (App Router), React, TypeScript, TailAdmin-style UI, API helpers in `frontend/src/lib/api.ts`.

This plan mirrors how Spec 011 was implemented (model + DTO + API + UI), scoped specifically to Contacts.

---

## Phase 1 — Backend: Data Model & Migrations

**Objective**: Extend the Contact persistence layer to support the new ABM fields, with safe migrations.

### Tasks

1. **Identify Contact model & DbSet**
   - Locate `Contact` EF model class (e.g. `backend/Models/Contact.cs`).
   - Confirm how it relates to `Account` (foreign key, navigation properties).

2. **Extend Contact model**
   - Add nullable properties:
     - `PersonalPhone: string?`
     - `WorkPhone: string?`
     - `Designation: string?`
     - `City: string?`
     - `DateOfBirth: DateTimeOffset?` (or equivalent type used for dates)
     - `InstagramUrl: string?`
     - `LinkedinUrl: string?`
   - Keep default values/nullability consistent with existing patterns.

3. **Create EF Core migration**
   - Add new nullable columns to the Contacts table.
   - Ensure:
     - No existing rows are invalidated.
     - No non-null constraints added for new columns.

4. **Apply migration locally**
   - Run migrations against the local dev database.
   - Sanity-check schema: columns present with correct types.

5. **Update Contact-related interfaces/DTO models (backend)**
   - If there is a `ContactDetailDto` or shared interface, add the same fields.
   - Ensure DTOs mirror the enriched model shape that the frontend will rely on.

**Exit criteria for Phase 1**
- Database contains new columns for all Spec 012 contact fields.
- API can start projecting/accepting these fields without runtime schema errors.

---

## Phase 2 — Backend: API Requests, DTOs & Endpoints

**Objective**: Wire the new fields through all relevant contact APIs.

### Tasks

1. **Update request contracts**
   - Locate `ContactCreateRequest` and `ContactUpdateRequest` (likely in a ContactsController).
   - Add optional properties:
     - `PersonalPhone`
     - `WorkPhone`
     - `Designation`
     - `City`
     - `DateOfBirth` (string or ISO date in the request; convert to UTC internally)
     - `InstagramUrl`
     - `LinkedinUrl`
   - Maintain backward compatibility (callers not sending these fields must still work).

2. **Update list and detail DTOs**
   - `ContactDto` (for Account contacts list): include all enriched fields.
   - `ContactDetailDto` (for contact detail view): include all enriched fields.

3. **Map new fields in controller actions**
   - **Create** contact:
     - Map incoming fields from `ContactCreateRequest` to `Contact` entity.
     - Parse `DateOfBirth` into UTC `DateTimeOffset?` (handle missing/invalid input with clear errors).
   - **Update** contact:
     - For each non-null property in `ContactUpdateRequest`, update the corresponding entity field.
     - Preserve existing values if a field is omitted in the update.
   - **List** contacts under an Account:
     - Populate `ContactDto` with all enriched fields.
   - **Detail** contact endpoint:
     - Populate `ContactDetailDto` with all enriched fields.

4. **RBAC & scoping check**
   - Ensure that contact endpoints still enforce:
     - Basic users only see contacts under their accessible Accounts.
     - Admins can access contacts for any Account.
   - No changes required if existing account-based checks are reused.

5. **Unit / integration checks (backend)**
   - Add/adjust tests to cover:
     - Creating a contact with enriched fields populates them in the DB.
     - Updating selected fields preserves others.
     - List and detail endpoints return correct values.

**Exit criteria for Phase 2**
- All contact endpoints accept and return enriched ABM fields.
- RBAC and account scoping behavior is unchanged from pre-012.

---

## Phase 3 — Frontend: API Types & Helpers

**Objective**: Expose the new fields to the React/Next.js app via typed helpers.

### Tasks

1. **Add contact types in frontend API layer**
   - In `frontend/src/lib/api.ts` (or corresponding file):
     - Extend existing `ContactDto` / `ContactDetailDto` types (or create them if they dont exist yet) with:
       - `personalPhone?: string | null`
       - `workPhone?: string | null`
       - `designation?: string | null`
       - `city?: string | null`
       - `dateOfBirth?: string | null` (ISO or canonical format from backend)
       - `instagramUrl?: string | null`
       - `linkedinUrl?: string | null`

2. **Update contact API helpers**
   - For list, detail, create, and update contact helpers:
     - Pass enriched fields in create/update payloads.
     - Parse/forward enriched fields from responses.

3. **Date handling contract**
   - Decide on wire format of `dateOfBirth`:
     - Backend returns ISO string (UTC).
   - Frontend will convert to IST and `DD/MM/YYYY` on display.

**Exit criteria for Phase 3**
- Frontend code can consume enriched contact data via typed helpers without TypeScript errors.

---

## Phase 4 — Frontend: Contacts List & Detail UI under Account

**Objective**: Render enriched contact data in list and detail views, following TailAdmin styling.

### Tasks

1. **Locate Account → Contacts UI**
   - Find the Account detail page components (Admin and Basic) and identify the Contacts tab/list implementation.

2. **Update Contacts list**
   - For each contact row/card, display:
     - Name.
     - Designation (if present).
     - City (if present).
     - One or both phones (personal/work).
     - Date of birth (converted to IST `DD/MM/YYYY` if present).
     - Optional icons/links for Instagram/LinkedIn when URLs exist.
   - Ensure list layout matches TailAdmin spacing and typography patterns.

3. **Implement / update Contact detail view**
   - Either enhance existing detail component or create one, with sections:
     - Identity: name, email, designation.
     - Contact info: phones, city.
     - Date of birth (IST `DD/MM/YYYY`).
     - Social: clickable Instagram/LinkedIn links (open in new tab).
   - Use a TailAdmin-styled container (`rounded-2xl border border-gray-100 bg-white p-6 shadow-theme-sm`).

4. **Empty/missing data handling**
   - Decide consistent behavior for missing values:
     - Show `-` or hide row when a field is empty.
   - Ensure no layout break when older contacts lack enriched fields.

**Exit criteria for Phase 4**
- Within an Account, users can see enriched contact information at a glance and drill into a structured detail view.

---

## Phase 5 — Frontend: Create & Edit Contact Forms

**Objective**: Allow users to capture and edit all enriched fields when managing contacts.

### Tasks

1. **Create Contact form**
   - Add or extend a form for creating contacts under an Account:
     - Fields: name, email, personalPhone, workPhone, designation, city, dateOfBirth, instagramUrl, linkedinUrl.
     - Wrap form in TailAdmin card: `rounded-2xl border border-gray-100 bg-white p-6 shadow-theme-sm`.
     - Wire submit handler to `createContact` helper with enriched payload.

2. **Edit Contact form**
   - Load existing contact data from detail API.
   - Populate all enriched fields into the form.
   - On submit, call `updateContact` with updated values.

3. **Validation & UX**
   - Add light client-side checks:
     - If phone fields are provided, ensure minimal length and allowed characters.
     - If URL fields are provided, ensure they look like valid URLs.
     - Date of birth input:
       - Accept user-friendly format (e.g., `DD/MM/YYYY`).
       - Convert to backend-accepted format before sending.
   - Show inline error messages and keep styling consistent with existing account forms.

4. **Navigation & feedback**
   - After create/edit:
     - Decide navigation pattern (e.g., back to account Contacts tab, optional toast).
   - Ensure a smooth flow from Account detail → Contacts tab → Create/Edit → back.

**Exit criteria for Phase 5**
- Users can create and edit contacts with all enriched fields end-to-end.
- Forms look and behave consistently with other forms in the app.

---

## Phase 6 — Testing, QA & Rollout

**Objective**: Validate correctness, avoid regressions, and prepare for deployment.

### Tasks

1. **Backend tests**
   - Verify that migrations run cleanly on a copy of the current DB.
   - Add tests around create/update/list/detail for contacts with enriched fields.

2. **Frontend tests / manual QA**
   - Smoke test both Admin and Basic flows:
     - Create contact with full enriched data.
     - Edit each field individually.
     - Verify list and detail rendering with partial/missing data.
   - Confirm `dateOfBirth` display is IST `DD/MM/YYYY` and underlying value remains UTC.

3. **Performance/regression checks**
   - Ensure contacts list performance remains acceptable for typical account sizes.
   - Verify that existing Account features (other tabs, account lists) still work.

4. **Deployment considerations**
   - Sequence migrations before deploying new backend binaries.
   - Deploy backend, then frontend.

**Exit criteria for Phase 6**
- All acceptance criteria from Spec 012 are verifiably met in at least one environment.
- No regressions detected in existing Account/Contact functionality.
