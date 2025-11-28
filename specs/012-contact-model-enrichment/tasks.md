# Spec 012 — Contact Model Enrichment: Tasks

## Phase 1 — Backend: Data Model & Migrations

- [ ] **T1.1** Identify existing Contact model and its location
  - Path hint: `backend/Models/Contact.cs` (or equivalent)
  - Confirm relationship with `Account` and current fields.

- [ ] **T1.2** Extend Contact model with new ABM fields
  - Add nullable properties: `PersonalPhone`, `WorkPhone`, `Designation`, `City`, `DateOfBirth`, `InstagramUrl`, `LinkedinUrl`.
  - Ensure types and nullability match Spec 012.

- [ ] **T1.3** Create EF Core migration for Contact fields
  - Add new nullable columns for the fields above.
  - Verify existing data is preserved and migration is non-breaking.

- [ ] **T1.4** Apply migration to local dev database
  - Run migrations.
  - Inspect schema to confirm new columns exist with expected types.

- [ ] **T1.5** Update backend Contact DTO/Interface types (if present)
  - Extend any shared `ContactDetailDto` or similar interface with the new fields.

---

## Phase 2 — Backend: API Requests, DTOs & Endpoints

- [ ] **T2.1** Update ContactCreateRequest and ContactUpdateRequest
  - Add optional properties for all new ABM fields.
  - Keep backward compatibility (old callers without fields still work).

- [ ] **T2.2** Update ContactDto for list responses
  - Ensure list responses include personal/work phones, designation, city, DOB, socials.

- [ ] **T2.3** Update ContactDetailDto for detail responses
  - Ensure detail response includes all enriched fields.

- [ ] **T2.4** Map new fields in Create contact endpoint
  - Map request fields → Contact entity.
  - Parse `DateOfBirth` into UTC `DateTimeOffset?` (validate or return clear error on invalid input).

- [ ] **T2.5** Map new fields in Update contact endpoint
  - Support partial updates (only update non-null fields from request).
  - Preserve existing values when fields are omitted.

- [ ] **T2.6** Ensure list/detail contact endpoints project enriched fields
  - Account contacts list: `GET /api/Accounts/{accountId}/contacts` includes all Spec 012 fields.
  - Contact detail endpoint returns full enriched contact data.

- [ ] **T2.7** Verify RBAC and account scoping for contacts
  - Confirm Basic users only access contacts under their allowed accounts.
  - Confirm Admins can access contacts for any account.

---

## Phase 3 — Frontend: API Types & Helpers

- [ ] **T3.1** Define/extend ContactDto and ContactDetailDto in frontend API layer
  - Path hint: `frontend/src/lib/api.ts` or dedicated contacts API module.
  - Add fields: `personalPhone`, `workPhone`, `designation`, `city`, `dateOfBirth`, `instagramUrl`, `linkedinUrl`.

- [ ] **T3.2** Update contact API helpers (list/detail/create/update)
  - Ensure enriched fields are included in request payloads and parsed from responses.

- [ ] **T3.3** Decide and document `dateOfBirth` wire format
  - Prefer backend → frontend as ISO UTC string.
  - Note that UI will convert to IST and `DD/MM/YYYY` for display.

---

## Phase 4 — Frontend: Contacts List & Detail UI under Account

- [ ] **T4.1** Locate Account detail → Contacts tab UI
  - Identify components for Admin and Basic views.

- [ ] **T4.2** Update Contacts list rows/cards to show enriched fields
  - Show: name, designation, city, phones, date of birth (IST `DD/MM/YYYY`), Instagram/LinkedIn if present.
  - Keep layout consistent with TailAdmin cards/tables.

- [ ] **T4.3** Implement or enhance Contact detail view
  - Use TailAdmin-style container (`rounded-2xl border border-gray-100 bg-white p-6 shadow-theme-sm`).
  - Organize fields into logical sections (identity, contact info, DOB, socials).

- [ ] **T4.4** Handle missing/partial data gracefully
  - Decide per-field behavior: show `-` or hide row if field is empty.
  - Verify list and detail views still look clean for legacy contacts.

---

## Phase 5 — Frontend: Create & Edit Contact Forms

- [ ] **T5.1** Implement Create Contact form under Account
  - TailAdmin card styling.
  - Inputs for all Spec 012 fields.
  - Wire submit to create contact API helper.

- [ ] **T5.2** Implement Edit Contact form
  - Load existing contact from detail API.
  - Pre-fill all enriched fields.
  - Wire submit to update contact API helper.

- [ ] **T5.3** Add client-side validation for enriched fields
  - Phone fields: basic length/character checks if provided.
  - URLs: basic URL shape check if provided.
  - DOB: enforce `DD/MM/YYYY` input, convert to backend format.

- [ ] **T5.4** Confirm navigation and feedback after save
  - Decide consistent pattern (e.g., return to Account Contacts tab, optional toast).
  - Ensure user flow feels similar to existing account edit flows.

---

## Phase 6 — Testing, QA & Rollout

- [ ] **T6.1** Backend tests for enriched contacts
  - Create/update/list/detail with new fields.
  - Verify `DateOfBirth` stored as UTC and round-tripped correctly.

- [ ] **T6.2** Frontend manual test matrix (Admin & Basic)
  - Create new contacts with enriched data.
  - Edit existing contacts; test partial updates.
  - View list/detail for contacts with full and partial data.

- [ ] **T6.3** Regression checks for Accounts
  - Ensure existing Account views, notes, activities, etc. still work.
  - Verify no UI or API errors when old contacts lack enriched data.

- [ ] **T6.4** Deployment sequencing
  - Run DB migrations.
  - Deploy backend, then frontend.
  - Monitor for contact-related errors post-release.
