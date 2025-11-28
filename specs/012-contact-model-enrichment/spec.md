# Spec 012 — Contact Model Enrichment

## 1. Overview

### 1.1 Goal

Enhance the Contact model, backend APIs, and frontend UI so each Account can have richer contact-level details required for Account-Based Marketing (ABM). Users should be able to create, view, and edit enriched contact profiles inside an Account in a way that is consistent with the existing TailAdmin-styled UI.

### 1.2 Motivation / Why

- Current Contacts are too minimal for ABM use-cases.
- Sales and pre-sales teams need richer context on each person (multiple phones, designation, city, birthday, social links).
- Better contact data supports targeted outreach, segmentation, and personalization at the account level.

### 1.3 Scope (In)

1. **Backend – Model & DB**
   - Extend `Contact` with:
     - `personalPhone` (string, optional)
     - `workPhone` (string, optional)
     - `designation` (string, optional)
     - `city` (string, optional)
     - `dateOfBirth` (date, optional, stored UTC)
     - `instagramUrl` (string, optional)
     - `linkedinUrl` (string, optional)
   - Update DB schema/migrations.
   - Ensure all fields are supported in GET/POST/PUT.

2. **Backend – API**
   - Update `ContactCreateRequest` and `ContactUpdateRequest`.
   - Update `ContactDto` and `ContactDetailDto`.
   - Enriched fields must be present in:
     - Account-level contacts list.
     - Contact detail endpoint for a specific contact.

3. **Frontend – Contact UI (under each Account)**
   - Contact **list** under an Account: show enriched ABM fields.
   - Contact **detail** view: full structured layout for all fields.
   - Contact **create** form: TailAdmin-styled card, inputs for all fields, light validation.
   - Contact **edit** form: load and edit all fields.
   - All new/updated forms use TailAdmin card styling:
     - `rounded-2xl`, `border-gray-100`, `bg-white`, `p-6`, `shadow-theme-sm`.

4. **Data Handling & Integrity**
   - Contacts remain strictly scoped to their parent Account.
   - Account views must not break when enriched fields are present/absent.
   - `dateOfBirth` stored in UTC, displayed to users in IST as `DD/MM/YYYY`.

### 1.4 Scope (Out)

- No changes to authentication, roles, or RBAC logic beyond what already protects Accounts and Contacts.
- No marketing automation workflows or campaign integrations.
- No bulk contact import/export.
- No advanced validation (e.g., phone normalization, deep URL validation) beyond basic format checks.
- No changes to non-contact tabs for Accounts (notes, activities, demos, opportunities), except where needed to avoid regressions.

---

## 2. Actors & User Roles

- **Basic User (Pre-sales / SDR / AE)**
  - Can view accounts they own and their associated contacts.
  - Can create, edit, and view contacts under accounts they are allowed to see (per existing RBAC).
- **Admin**
  - Can view all accounts and associated contacts (per existing RBAC).
  - Can create, edit, and view contacts under any account.
- **System**
  - Persists new contact fields.
  - Computes and stores `dateOfBirth` timestamps in UTC.
  - Returns enriched contact data to the frontend.

---

## 3. User Scenarios

### 3.1 Create a new enriched contact for an account

- User navigates to an Account (Admin: any, Basic: own).
- On the Contacts tab, user clicks **“Add contact”**.
- A TailAdmin-styled form card opens with fields:
  - Name, Email (existing, if present already).
  - Personal phone, Work phone.
  - Designation.
  - City.
  - Date of birth (DD/MM/YYYY).
  - Instagram URL, LinkedIn URL.
- User fills in details and submits.
- Contact is created, tied to that Account, and appears in the Contacts list with key enriched details visible.

### 3.2 View enriched contact list inside an account

- User opens an Account and navigates to the Contacts section.
- The list shows one row/card per contact with:
  - Name, designation.
  - City.
  - One or both phones (personal/work).
  - Date of birth in `DD/MM/YYYY` (if present, IST).
  - Icons or text for Instagram/LinkedIn if URLs exist.
- User uses this information to quickly understand key decision makers and stakeholders.

### 3.3 View full contact detail

- From the Contacts list, user clicks a contact.
- The contact detail view shows:
  - Identity: name, email, designation.
  - Contact info: personal phone, work phone, city.
  - Date of birth (IST, `DD/MM/YYYY`).
  - Social links: Instagram and LinkedIn.
- Layout uses a clear, two- or three-column grid following TailAdmin styles.

### 3.4 Edit an existing contact

- User opens contact detail or chooses an “Edit” option from the list.
- System loads existing values for all fields.
- User updates phones, designation, city, birthday, or social URLs.
- On save:
  - Changes are persisted.
  - Returning to the list or detail shows updated information.
  - Account views continue to work; no crash if some fields are empty.

### 3.5 Handling missing/partial data

- For older contacts created before this spec, enriched fields may be empty.
- List and detail views:
  - Render gracefully when fields are missing (e.g., show `-` or hide labels).
  - Do not require all fields to be present.

---

## 4. Functional Requirements

### 4.1 Backend – Contact Model & Persistence

1. **FR-1**: `Contact` model must include:
   - `PersonalPhone: string?`
   - `WorkPhone: string?`
   - `Designation: string?`
   - `City: string?`
   - `DateOfBirth: DateTimeOffset?` (or equivalent UTC-capable date type).
   - `InstagramUrl: string?`
   - `LinkedinUrl: string?`

2. **FR-2**: Database schema must be migrated to add nullable columns for all fields above.

3. **FR-3**: Existing contacts must remain valid after migration (no data loss, no required non-null defaults).

### 4.2 Backend – API Contracts

4. **FR-4**: `ContactCreateRequest` must accept all new fields as optional properties.

5. **FR-5**: `ContactUpdateRequest` must accept all new fields as optional, supporting partial updates without forcing all fields to be re-sent.

6. **FR-6**: API must parse `dateOfBirth` from the request in a stable, documented format (e.g., `YYYY-MM-DD` or `DD/MM/YYYY`), converting to a UTC `DateTimeOffset` internally.

7. **FR-7**: `ContactDto` used in contact lists must include all enriched fields so the frontend list can display them.

8. **FR-8**: `ContactDetailDto` must include all enriched fields so the contact detail view can render them without additional API calls.

9. **FR-9**: The account-level contacts list endpoint (e.g., `GET /api/Accounts/{accountId}/contacts`) must return all enriched fields per contact.

10. **FR-10**: The contact detail endpoint (e.g., `GET /api/Accounts/{accountId}/contacts/{contactId}` or `GET /api/Contacts/{contactId}` depending on existing routing) must return all enriched fields.

11. **FR-11**: Existing RBAC rules must continue to apply:
    - Basic users may only access contacts under accounts they are allowed to see.
    - Admins may access contacts for all accounts.

### 4.3 Frontend – Contact List UI

12. **FR-12**: Within the **Account detail page → Contacts tab**, each contact item must show:
    - Name (existing field).
    - Designation (if present).
    - City (if present).
    - Personal and/or work phone if present (priority order can be defined in UI).
    - `dateOfBirth` formatted as IST `DD/MM/YYYY` if present.
    - Indicators/links for Instagram and LinkedIn if URLs are present.

13. **FR-13**: Contact list styling must follow TailAdmin patterns:
    - Card/table layout that visually matches existing account/notes UI.
    - Spacing, typography, and colors consistent with current theme.

### 4.4 Frontend – Contact Detail View

14. **FR-14**: Contact detail view must present enriched data in a structured layout, such as:
    - Identity block: name, email, designation.
    - Contact block: personalPhone, workPhone, city.
    - Date of birth block: IST `DD/MM/YYYY` or "–" if missing.
    - Social block: clickable Instagram/LinkedIn links (open in new tab).

15. **FR-15**: If a field is missing, the UI must not break and should either omit the row or display a neutral placeholder.

### 4.5 Frontend – Create & Edit Forms

16. **FR-16**: **Create Contact** form must provide inputs for:
    - Name (existing).
    - Email (existing, if already supported).
    - Personal phone.
    - Work phone.
    - Designation.
    - City.
    - Date of birth (user-facing, likely `DD/MM/YYYY`).
    - Instagram URL.
    - LinkedIn URL.

17. **FR-17**: **Edit Contact** form must:
    - Pre-populate all above fields from existing data.
    - Allow updating any subset of fields.

18. **FR-18**: Both create and edit forms must:
    - Use a TailAdmin-styled container: `rounded-2xl border border-gray-100 bg-white p-6 shadow-theme-sm`.
    - Use consistent label, input, and error text styling matching existing account forms.

19. **FR-19**: Basic validation rules:
    - Phone fields: must be non-empty only if user chooses to provide them; if provided, basic validation (e.g., minimum length, numeric characters plus optional `+`, spaces, dashes).
    - URL fields: if provided, must look like valid URLs (e.g., start with `http://` or `https://`).
    - Date of birth: must match expected format; invalid input should show a helpful error, not crash.

20. **FR-20**: Submitting create or edit must:
    - Call the appropriate backend API with the enriched fields.
    - Show loading/disabled state while the request is in flight.
    - Surface any API errors in a TailAdmin-styled error text banner.

### 4.6 Data Handling & Integrity

21. **FR-21**: Contacts must remain strictly associated with a single parent Account (no cross-account associations introduced).

22. **FR-22**: Adding or editing a contact must not break Account list/detail views.

23. **FR-23**: `dateOfBirth` must be:
    - Stored in the database as a UTC timestamp or date type that is unambiguous and timezone-aware.
    - Converted to IST and displayed as `DD/MM/YYYY` in the UI.

---

## 5. Data Model & API

### 5.1 Contact Entity (Conceptual)

Fields (including existing ones, conceptual only):

- `id` (GUID/string)
- `accountId` (foreign key to Account)
- `name`
- `email`
- `personalPhone` (optional)
- `workPhone` (optional)
- `designation` (optional)
- `city` (optional)
- `dateOfBirth` (optional, stored UTC)
- `instagramUrl` (optional)
- `linkedinUrl` (optional)
- Timestamps, soft-delete flags, etc., as currently implemented.

### 5.2 API Shape (Conceptual)

- **Create Contact**: `POST /api/Accounts/{accountId}/contacts`
  - Request body includes enriched fields.
  - Response returns a `ContactDto` with all enriched fields.

- **Update Contact**: `PUT /api/Accounts/{accountId}/contacts/{contactId}` (or existing route)
  - Request body includes enriched fields (partial update semantics as per current pattern).
  - Response returns updated `ContactDto`.

- **List Contacts for Account**: `GET /api/Accounts/{accountId}/contacts`
  - Returns list of `ContactDto` with enriched fields.

- **Contact Detail**: `GET /api/Accounts/{accountId}/contacts/{contactId}` (or existing route)
  - Returns `ContactDetailDto` with enriched fields.

---

## 6. Non-Functional Requirements

- **NFR-1**: New fields must not significantly degrade performance of contacts list for typical account sizes.
- **NFR-2**: API error messages must follow existing error shape and codes.
- **NFR-3**: UI must remain responsive on common target devices and browsers.
- **NFR-4**: Changes must not introduce breaking changes to existing consumers of contact APIs (if any external).

---

## 7. Assumptions

- Contacts are only used inside the current application (no external API clients with hard-coded schemas).
- Current contact CRUD endpoints already exist and can be extended without breaking routing.
- Timezone conversion to IST is acceptable for all users (primary user base is IST-based).
- `dateOfBirth` is informational only; there are no age-based access control requirements.

---

## 8. Success Criteria

1. **SC-1**: For a given Account, a user can create a contact with all enriched fields populated and see those values immediately in the contact list and detail views.

2. **SC-2**: For an existing contact, editing any enriched field (e.g., city or LinkedIn URL) is reflected across list and detail views after save.

3. **SC-3**: `dateOfBirth` is stored in UTC (verified in DB) and displayed as `DD/MM/YYYY` in IST in the UI.

4. **SC-4**: Admin accounts can see both:
   - Global view of contacts via accounts they can access.
   - All enriched contact details for those accounts.

5. **SC-5**: No errors or crashes occur when:
   - Enriched fields are absent (old contacts).
   - Enriched fields contain unexpected but valid values.

6. **SC-6**: All new or updated UI components follow TailAdmin styling (visual inspection against existing cards).

7. **SC-7**: Existing Account functionality (listing, detail, notes, activities, etc.) remains unchanged and passes current regression tests.

---

## 9. Implementation Log / Commands

This section documents how Spec 012 was actually implemented in this codebase. It is intended as a reference and a template for future specs.

### 9.1 Backend changes

- **Contact model**
  - File: `backend/Models/Contact.cs`
  - Added nullable enrichment fields:
    - `PersonalPhone`, `WorkPhone`, `Designation`, `City`, `DateOfBirth`, `InstagramUrl`, `LinkedinUrl`.
  - Kept existing `Phone` and `Position` for backward compatibility.

- **EF Core migration**
  - Migration created (name may differ slightly depending on local command):
    - `AddContactEnrichmentFields`
  - Typical commands used:
    - `dotnet ef migrations add AddContactEnrichmentFields`
    - `dotnet ef database update`

- **AccountsController contact endpoints**
  - File: `backend/Controllers/AccountsController.cs`
  - Updated `GetContacts` (`GET /api/Accounts/{id}/contacts`):
    - Projection now returns all enriched fields plus legacy `phone`/`position`.
  - Added/updated request records:
    - `ContactCreateRequest` with all Spec 012 fields.
    - `ContactUpdateRequest` with optional fields for partial updates.
  - Implemented endpoints:
    - **Create contact**: `POST /api/Accounts/{id}/contacts`
      - Parses optional `DateOfBirth` to UTC.
      - Populates both enriched fields and legacy `Phone`/`Position`.
    - **Update contact**: `PUT /api/Accounts/{accountId}/contacts/{contactId}`
      - Applies partial updates.
      - Keeps `Phone`/`Position` roughly in sync with `WorkPhone`/`PersonalPhone` and `Designation`.
    - **Soft-delete contact**: `DELETE /api/Accounts/{accountId}/contacts/{contactId}`
      - Marks `IsDeleted = true` and updates `UpdatedAt`.
      - Respects the same RBAC rules as create/update (Admin: any account; Basic: only own accounts).

### 9.2 Frontend API helpers

- File: `frontend/src/lib/api.ts`

- **Types**
  - Extended `AccountContactSummary` with:
    - `personalPhone`, `workPhone`, `designation`, `city`, `dateOfBirth`, `instagramUrl`, `linkedinUrl`.

- **Contact helpers**
  - `getAccountContacts(accountId: string)`
    - Returns `AccountContactSummary[]` with enriched fields.
  - `ContactCreateInput` / `ContactUpdateInput`
    - Typed inputs for create / update (all enriched fields optional except `name` on create).
  - `createContact(accountId, input)`
    - `POST /api/Accounts/{accountId}/contacts`.
    - Normalizes empty strings to `null`, passes `dateOfBirth` through to backend.
  - `updateContact(accountId, contactId, input)`
    - `PUT /api/Accounts/{accountId}/contacts/{contactId}`.
    - Sends `null` for fields that should be cleared; omits `dateOfBirth` when unchanged.
  - `deleteContact(accountId, contactId)`
    - `DELETE /api/Accounts/{accountId}/contacts/{contactId}`.
    - Throws on non-2xx with backend error message.

### 9.3 Admin account detail UI

- File: `frontend/src/app/(admin)/accounts/[id]/page.tsx`

- **Contacts tab layout**
  - Uses a `TabLoader` wrapper to lazy-load contacts and handle loading/error states.
  - Enriched contacts table columns:
    - Name, Email, Phones, Designation, City, Date of Birth (IST `DD/MM/YYYY`), Socials, Actions.
  - Phones column:
    - Combines `workPhone` and `personalPhone` with `" / "` separator.
    - Falls back to legacy `phone` when both are missing.
  - Socials column:
    - Shows "Instagram" / "LinkedIn" labels when URLs exist, otherwise `-`.

- **Create contact flow**
  - "Add contact" button in the Contacts tab header.
  - Opens a TailAdmin-style modal with fields for all Spec 012 fields.
  - On submit:
    - Validates `name` and `dateOfBirth` (basic date check).
    - Calls `createContact(accountId, payload)`.
    - Refetches contacts via `getAccountContacts` and closes the modal.

- **Edit contact flow**
  - Per-row **Edit** button in Actions column.
  - Opens modal pre-filled from the selected `AccountContactSummary`.
  - On submit:
    - Validates `name` and `dateOfBirth`.
    - Calls `updateContact(accountId, contactId, payload)`.
    - Refetches contacts and closes the modal.

- **Delete contact (soft-delete)**
  - Per-row **Delete** button in Actions column.
  - Shows `window.confirm` before delete.
  - On confirm:
    - Calls `deleteContact(accountId, contactId)`.
    - Refetches contacts via `getAccountContacts`.
    - On error: shows a simple `alert` with the message.

### 9.4 Basic account detail UI (My Accounts)

- File: `frontend/src/app/(protected)/my-accounts/[id]/page.tsx`

- **Contacts tab**
  - Reuses the same `getAccountContacts`, `createContact`, `updateContact`, and `deleteContact` helpers.
  - Uses dark TailAdmin styling (slate/gray background, brand accent colors).
  - Shows the same enriched columns as Admin.
  - All mutating actions (Create, Edit, Delete) are only available when `canManage` is `true` (current user created the account).

- **Create / Edit / Delete flows**
  - Match Admin behavior, but with dark-themed modals and buttons.
  - All flows refetch `getAccountContacts(accountId)` after success.

### 9.5 Representative dev commands

These are typical commands used while working on Spec 012 (actual sequence may vary):

- **Backend**
  - Run API locally while developing:
    - `cd backend`
    - `dotnet watch run`
  - Create and apply migration for enriched contact fields:
    - `dotnet ef migrations add AddContactEnrichmentFields`
    - `dotnet ef database update`

- **Frontend**
  - Run Next.js dev server:
    - `cd frontend`
    - `npm install` (once, if needed)
    - `npm run dev`
  - Build for production / CI:
    - `npm run build`

This log can be used as a reference when auditing Spec 012 or when creating similar specs (e.g., Spec 013 for opportunities or demos) to keep implementation steps and commands consistent.
