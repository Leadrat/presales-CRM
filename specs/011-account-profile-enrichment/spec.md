# Spec 11 – Account Profile Enrichment

## 1. Overview

### Goal

Extend the CRM’s Account experience so that each account stores a **rich company profile** suitable for account‑based marketing, and expose this profile consistently through:

- The domain model / persisted data  
- Backend APIs for create, read, update  
- Frontend create/edit forms  
- Frontend account detail views

The spec focuses only on **company profile information** and a computed **account size** label; it does not cover contacts, demos, or analytics (those will be separate specs).

---

## 2. Scope

### In Scope

- New and updated fields on the **Account** entity to represent company profile information.
- Validation and behavior for these fields in **create** and **update** operations.
- A **computed account size label** derived from number of users.
- Updates to:
  - Account create form
  - Account edit form
  - Account detail page (company information section)
- Backwards compatibility: existing accounts remain valid and visible.

### Out of Scope (covered by other specs)

- Contact field enrichment (personal/work phones, DOB, social links).
- Lead source and deal stage modeling.
- Demo entities and demo history.
- Advanced search and filtering logic.
- Dashboards, metrics, and timelines.
- Export to CSV/Excel.

---

## 3. Actors & Users

- **Pre‑Sales User / Sales User**
  - Creates new accounts.
  - Edits existing account company profiles they are allowed to modify.
  - Views detailed company profile for their accounts.

- **Admin User**
  - Same capabilities as Pre‑Sales, but may manage accounts created by any user, according to existing RBAC rules.

- **System**
  - Persists and returns account profile data.
  - Computes and exposes the account size label from `numberOfUsers`.

---

## 4. Functional Requirements

### 4.1 Account Model – Fields

1. The system MUST represent each Account with the following **company profile** attributes:

   - `websiteUrl` – optional; the company’s website URL.
   - `decisionMakers` – required; free‑text list/description of key decision makers for the account.
   - `numberOfUsers` – required; positive integer representing users/seats for the current CRM or target tool.
   - `instagramUrl` – optional; URL to the company’s Instagram profile.
   - `linkedinUrl` – optional; URL to the company’s LinkedIn page.
   - `phone` – required; primary phone number for the company.
   - `email` – required; primary email address for the company.
   - `accountType` – required; categorical value with allowed set:
     - “Channel Partner”
     - “Mandate”
     - “Developer”
     - “Builder”
     - “Land & Plots”

2. The system MUST persist these fields for each account and return current values in all **account detail** and **account list** responses where that information is expected.

3. For existing accounts created before this spec:
   - All new fields MUST default to `null`, empty values, or suitable defaults such that:
     - Existing accounts remain queryable.
     - Existing UI that does not depend on these fields continues to function.

---

### 4.2 Computed Account Size

4. The system MUST derive a **computed field** `accountSize` for each account based on `numberOfUsers`:

   - If `numberOfUsers` is between 1 and 4 (inclusive) → `accountSize` = **“Micro”**
   - If `numberOfUsers` is between 5 and 9 (inclusive) → `accountSize` = **“Little”**
   - If `numberOfUsers` is between 10 and 24 (inclusive) → `accountSize` = **“Small”**
   - If `numberOfUsers` is between 25 and 49 (inclusive) → `accountSize` = **“Medium”**
   - If `numberOfUsers` is 50 or higher → `accountSize` = **“Enterprise”**
   - If `numberOfUsers` is missing or zero → `accountSize` MAY be omitted or shown as an empty/undefined value.

5. The computed `accountSize` MUST be:

   - Deterministic for a given `numberOfUsers` value.
   - Consistent across:
     - Account detail view
     - Any list or dashboard where account size is displayed.

---

### 4.3 Backend API Behavior

6. **Create Account** operation MUST accept the new company profile fields described above as part of the account creation payload.

7. When creating an account:

   - `numberOfUsers` MUST be validated as:
     - Present (non‑null).
     - A positive integer.
   - `accountType` MUST be validated to be one of the 5 allowed values and MUST be present.
   - `email` MUST be present and SHOULD be validated to be in a reasonable email format.
   - `decisionMakers` MUST be present and non‑empty.
   - `phone` MUST be present and validated to be in a reasonable phone format (length and characters), without being overly strict.
   - Optional URL fields (`websiteUrl`, `instagramUrl`, `linkedinUrl`) SHOULD pass **basic URL validation** in the frontend (e.g., start with `http://` or `https://`, contain no obvious spaces) and receive only light sanity checks in the backend (no overly strict regex that would block common, valid URLs).

8. On successful creation, the account detail returned MUST include:

   - All persisted company profile fields.
   - The computed `accountSize` derived from `numberOfUsers`.

9. **Update Account** operation MUST allow updating all of the new fields.

10. The update behavior MUST support:

   - Changing any of the profile fields (e.g., correcting phone or email).
   - Updating `numberOfUsers` and reflecting a new `accountSize`.
   - Leaving untouched fields unchanged when they are not provided or explicitly not edited (implementation may be PUT or PATCH but behavior SHOULD appear as partial updates from the user’s perspective).

11. When fetching account details by ID:

   - The response MUST include:
     - All new company profile fields.
     - The computed `accountSize`, when `numberOfUsers` is present and within defined ranges.

12. Existing RBAC rules (Admin vs. Basic/Pre‑Sales) MUST continue to apply to create/update/view operations without regression.

---

### 4.4 Frontend – Create & Edit Forms

13. The **Add Account** form MUST provide input controls for:

   - Website URL
   - Decision Makers
   - Number of Users
   - Instagram URL
   - LinkedIn URL
   - Phone Number
   - Email ID
   - Account Type (dropdown with exactly the 5 allowed values)

14. The form MUST:

   - Indicate required fields (at minimum: Account Name, Account Type, Number of Users, Decision Makers, Phone Number, and Email ID, plus any existing required fields from previous specs).
   - Show clear validation messages when:
     - Required fields are missing.
     - `numberOfUsers` is not a positive integer.
     - Account Type is not selected.
     - Decision Makers is empty.
     - Phone Number is missing or clearly invalid.
     - Email is missing or malformed.
     - URLs are obviously malformed.

15. The **Edit Account** form MUST display current values of all these fields and allow the user to adjust them.

16. After successful submit:

   - The user MUST see updated data reflected on the account detail page.
   - Any lists summarizing account info MUST show the updated values where applicable.

17. All forms MUST follow the existing **TailAdmin‑style UI** for:

   - Spacing
   - Labels
   - Input appearance
   - Error message styling
   - Card layout (grouping profile fields in a clear, readable section)

---

### 4.5 Frontend – Account Detail Page

18. The Account detail view MUST display, in a **Company Information** section:

   - Company Name (existing)
   - Website URL
   - Decision Makers
   - Number of Users
   - Account Type
   - Instagram URL
   - LinkedIn URL
   - Phone Number
   - Email ID
   - Current CRM and CRM Expiry (from previous specs)
   - Account Created By (existing)
   - Computed `accountSize` (Little/Small/Medium/Enterprise)

19. The Company Information section MUST:

   - Use a card layout consistent with TailAdmin styling (clean, readable).
   - Present key information at a glance, with secondary fields visually de‑emphasized but still accessible.

20. The computed `accountSize` MUST be prominently visible near `numberOfUsers` and/or Account Type, with a clear label (e.g., "Account Size: Small").

---

## 5. Data Consistency & Migration

21. For existing accounts at the time of adoption:

   - New fields MUST initialize to null/empty where values were not previously captured.
   - No existing data may be lost or transformed incorrectly.

22. The system MUST continue to serve existing clients:

   - Any previously defined API response shapes MUST remain valid, either by:
     - Extending them with new fields, or
     - Keeping old shapes intact while providing enriched shapes through detail endpoints.

23. If any field is optional, UI MUST handle missing values gracefully (e.g., show "—" or hide the row/label) rather than breaking layout.

---

## 6. Non‑Functional Requirements

24. Validation and enrichment MUST not introduce noticeable latency for typical account create/edit operations.

25. The UI MUST remain responsive on typical devices used by the sales team (laptops and common tablet sizes).

26. Error messages MUST be user‑friendly and avoid exposing technical details (e.g., stack traces).

---

## 7. Assumptions

- Phone and email stored at the **account level** are meant as **primary company contact** details, distinct from contact‑person phone/email (handled in another spec).
- Decision makers can be stored initially as free‑text; structured modeling (e.g., specific contact linkage) may be introduced in later specs.
- Account Types and Account Size rules are stable and will not change frequently; any changes will be handled via future specs.

---

## 8. Success Criteria

- A user can **create a new account** with all profile fields and see them immediately on the detail page.
- A user can **edit an existing account**, change profile fields, and see updated values on detail and list screens.
- The **Account Type dropdown** shows exactly:
  - Channel Partner, Mandate, Developer, Builder, Land & Plots
- The **Account Size label** (Little/Small/Medium/Enterprise) correctly matches the `numberOfUsers` ranges for at least:
  - 8 users → Little
  - 15 users → Small
  - 30 users → Medium
  - 75 users → Enterprise
- Existing accounts created before this spec:
  - Still load in lists and detail views.
  - Show empty/missing values for new fields without errors.
- No breaking changes to existing API consumers; their existing flows continue to operate without modification.
