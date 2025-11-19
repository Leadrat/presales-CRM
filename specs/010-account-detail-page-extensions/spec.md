# Spec 10 — Account Detail Page Extensions

## 1. Purpose

This spec defines **Account Detail Page Extensions** for Phase 2 — Accounts & Company Data.

It builds on **Spec 9 — Account Detail Page** and the global architecture in **Spec 000 — Architecture & Conventions** to:

- Extend the **Account Detail** experience with **tabbed child data** (Contacts, Demos, Notes, Activity Log).
- Standardise **backend APIs** for fetching account core data and child tab data.
- Define **RBAC behaviour**, **error handling**, and **UX states** for the detail view.

This spec corresponds to **“Spec B3 — Account Detail Page”** from the project plan and assumes the entities, RBAC rules, and basic detail endpoint introduced earlier are already in place.

## 2. User Stories

### US-01 — Explore full account context via tabs (Admin)

As an **Admin user**, I want to open an account detail page and switch between tabs for **Company Info, Contacts, Demos, Notes, and Activity Log** so that I can see a complete picture of the account without leaving the page.

### US-02 — Respect ownership for child data (Basic)

As a **Basic user**, I want to see only the accounts and associated child data (Contacts, Demos, Notes, Activity Log) that I **own**, so that I do not see other users’ accounts or their activity.

### US-03 — Lazy, performant loading of tab data

As a **user on a slower connection**, I want the account detail page to **load quickly** and then fetch tab content **on demand**, so the initial page load is not blocked by large child datasets.

### US-04 — Clear feedback for empty and error states

As a **user**, I want clear feedback when a tab has **no data**, is **still loading**, or encounters an **error**, so that I understand whether something is broken or simply empty.

## 3. Functional Requirements (FR)

### 3.1 Backend — Core detail endpoint

- **FR-001**: The backend MUST expose `GET /api/accounts/{id}/detail` that returns:
  - Account core fields (at minimum):
    - `id` (GUID)
    - `companyName`
    - `website`
    - `accountTypeId`, `accountTypeName`
    - `accountSizeId`, `accountSizeName`
    - `currentCrmId`, `crmProviderName`
    - `numberOfUsers`
    - `crmExpiry`
    - `createdAt`
  - Child counts (excluding soft-deleted rows):
    - `contactCount`
    - `demoCount` (counting non-deleted rows in the canonical `Demos` entity/table linked to the account)
    - `noteCount`
    - `activityCount`

- **FR-002**: `GET /api/accounts/{id}/detail` MUST:
  - **Exclude soft-deleted rows** (`IsDeleted = true`) from all child counts.
  - Enforce RBAC and ownership rules (see Section 6).
  - Follow the standard response envelope:
    - Success: `{ "data": { ...accountDetail... } }`
    - Error: `{ "error": { "code": string, "message": string } }`

### 3.2 Backend — Child tab data APIs

For each tab, the backend MUST provide dedicated **read-only** endpoints that return data for a single account, filtered by RBAC and ownership.

- **FR-003 (Contacts tab API)**:
  - Endpoint: `GET /api/accounts/{id}/contacts`
  - Returns `{ "data": ContactSummaryDto[] }` where each item includes:
    - `id`, `name`, `email`, `phone`, `position`, `createdAt`, `updatedAt`.
  - MUST include only **non-deleted** contacts (`IsDeleted = false`) for that account.

- **FR-004 (Demos tab API)**:
  - Endpoint: `GET /api/accounts/{id}/demos`
  - Returns `{ "data": DemoSummaryDto[] }` where each item includes key demo fields (e.g., `id`, `title`, `scheduledAt`, `status`, `createdAt`).
  - The data MUST come from the canonical `Demos` entity/table linked to `Account` (or an equivalent dedicated Demos model); this spec only requires a **summary representation** for the tab.

- **FR-005 (Notes tab API)**:
  - Endpoint: `GET /api/accounts/{id}/notes`
  - Returns `{ "data": NoteSummaryDto[] }` where each item includes:
    - `id`, `title`, `snippet` (e.g., truncated body), `createdAt`, `updatedAt`.
  - MUST include only non-deleted notes associated with the account.

- **FR-006 (Activity Log tab API)**:
  - Endpoint: `GET /api/accounts/{id}/activity-log`
  - Returns `{ "data": ActivityLogEntryDto[] }` summarising recent account-related activity (e.g., significant account changes, demo updates, note creation).
  - The data MUST come from the existing global activity log/audit mechanism defined in earlier specs, filtered by the relevant account reference, and SHOULD include only event types that are meaningful for the Account Detail view.

- **FR-007**: All child tab endpoints MUST:
  - Enforce RBAC and ownership rules consistent with the account detail view.
  - Follow the same `{ data }` / `{ error }` envelope as the core endpoint.
  - Exclude soft-deleted rows from all results.

### 3.3 Backend — Error codes and conditions

- **FR-008**: When the account **does not exist** or is soft-deleted, all endpoints in this spec MUST return:
  - HTTP **404 Not Found**
  - Error code: `ACCOUNT_NOT_FOUND` (or reuse the existing equivalent if already defined), with a clear human-readable message.

- **FR-009**: When a Basic user attempts to access an account (or its child data) they do **not own**:
  - HTTP **403 Forbidden**
  - Error code: `FORBIDDEN`
  - Frontend behaviour MUST follow Section 5 and Section 8.

- **FR-010**: When lookup rows referenced by an account (e.g., AccountType, AccountSize, CrmProvider) are **missing or inconsistent**:
  - HTTP **500 Internal Server Error**
  - Error code: `ACCOUNT_DATA_INCONSISTENT`
  - MUST NOT return partial or corrupted data.

### 3.4 Frontend — Account detail page & tabs

- **FR-011**: The frontend MUST render the account detail at:
  - Route: `/accounts/[id]` under the **`(admin)`** route group.
  - File: `frontend/src/app/(admin)/accounts/[id]/page.tsx`.

- **FR-012**: The page MUST include the following **tabs**:
  - `Company Info`
  - `Contacts`
  - `Demos`
  - `Notes`
  - `Activity Log`

- **FR-013**: The **Company Info** tab MUST display:
  - All fields from `GET /api/accounts/{id}/detail` core payload.
  - Child counts (Contacts, Demos, Notes, Activity Log) from the same payload.

- **FR-014**: Each non-default tab (Contacts, Demos, Notes, Activity Log) MUST:
  - Fetch data from its corresponding API endpoint.
  - Render results in a table or list view with clear labels.
  - Show appropriate **loading**, **empty**, and **error** states (see Section 9).

### 3.5 Frontend — Lazy loading behaviour

- **FR-015**: The **initial page load** MUST:
  - Fetch only the **core account detail** payload (`GET /api/accounts/{id}/detail`).
  - **Not** pre-fetch all tab data by default.

- **FR-016**: Each tab’s data MUST be **lazy loaded**:
  - Fetch when the tab is **first activated**.
  - Optionally cache results in memory so that revisiting the tab within the same session does not re-fetch, unless explicitly refreshed.

## 4. Non-Functional Requirements (NFR)

- **NFR-001 (Performance)**: `GET /api/accounts/{id}/detail` SHOULD respond in under **200 ms** in a representative environment for typical accounts.
- **NFR-002 (Scalability)**: Child tab APIs MUST handle at least **hundreds of rows** per account without timeouts or unacceptable UI lag.
- **NFR-003 (Security)**: All endpoints MUST be protected by JWT-based auth, use HTTPS in non-dev environments, and honour RBAC rules.
- **NFR-004 (Resilience)**: Transient failures in child endpoints MUST present user-friendly error states without breaking the entire page.
- **NFR-005 (UX Consistency)**: UI states (loading, empty, error) MUST follow existing design patterns from earlier specs and shared components.

## 5. Error Handling Rules

- **EHR-001**: For **unauthenticated** requests:
  - Endpoints MUST return **401 Unauthorized** with error code `UNAUTHORIZED`.

- **EHR-002**: For **forbidden** requests (authenticated but lacking access):
  - Endpoints MUST return **403 Forbidden** with error code `FORBIDDEN`.
  - Frontend MUST redirect to `/not-authorized` for 403 responses from account detail or tab APIs, consistent with Spec 9 clarifications.

- **EHR-003**: For **not found** accounts:
  - Endpoints MUST return **404 Not Found** with error code `ACCOUNT_NOT_FOUND` (or equivalent).
  - Frontend SHOULD render a user-friendly “Account not found” state within the detail layout or navigate back to the accounts list.

- **EHR-004**: For **lookup inconsistency** (AccountType, AccountSize, CrmProvider missing or invalid):
  - Endpoints MUST return **500 Internal Server Error** with error code `ACCOUNT_DATA_INCONSISTENT`.
  - Frontend MUST show a generic error state on the Company Info tab and SHOULD log/report the issue for investigation.

- **EHR-005**: For unexpected errors in child tab APIs:
  - Return **500 Internal Server Error** with an appropriate error code (e.g., `INTERNAL_ERROR`), avoiding technical stack traces in messages.
  - Frontend MUST show an error state **scoped to the tab** while keeping other tabs functional.

## 6. RBAC Enforcement Rules

- **R-001**: Admin users:
  - MAY access `GET /api/accounts/{id}/detail` and all child tab APIs for any non-deleted account.

- **R-002**: Basic users:
  - MAY access detail and tab APIs **only** for accounts they own (`Accounts.CreatedByUserId == currentUserId`).
  - MUST receive `403 FORBIDDEN` for any other account, and the frontend MUST redirect to `/not-authorized`.

- **R-003**: Ownership checks:
  - MUST be enforced in the backend using the established ownership specifications and handlers from Spec 000.
  - MUST NOT rely solely on frontend route guards.

- **R-004**: Endpoints MUST NOT expose `CreatedByUserId` or other sensitive ownership fields directly in the API responses.

## 7. API Contracts

This section describes the **shape** of API contracts. Actual DTO naming may vary but MUST preserve fields and semantics.

### 7.1 `GET /api/accounts/{id}/detail`

- **Request**: path parameter `id` (GUID)
- **Response (200)**:
  - Envelope: `{ "data": AccountDetailDto }`
  - `AccountDetailDto` fields:
    - `id: string`
    - `companyName: string`
    - `website?: string`
    - `accountTypeId: string`
    - `accountTypeName: string`
    - `accountSizeId: string`
    - `accountSizeName: string`
    - `currentCrmId?: string`
    - `crmProviderName?: string`
    - `numberOfUsers: number`
    - `crmExpiry: string | null` (ISO 8601)
    - `createdAt: string` (ISO 8601)
    - `contactCount: number`
    - `demoCount: number`
    - `noteCount: number`
    - `activityCount: number`

### 7.2 `GET /api/accounts/{id}/contacts`

- **Response (200)**:
  - `{ "data": ContactSummaryDto[] }`
  - `ContactSummaryDto`:
    - `id: string`
    - `name: string`
    - `email?: string`
    - `phone?: string`
    - `position?: string`
    - `createdAt: string`
    - `updatedAt: string`

### 7.3 `GET /api/accounts/{id}/demos`

- **Response (200)**:
  - `{ "data": DemoSummaryDto[] }`
  - `DemoSummaryDto` (minimum):
    - `id: string`
    - `title: string`
    - `scheduledAt?: string`
    - `status: string`
    - `createdAt: string`

### 7.4 `GET /api/accounts/{id}/notes`

- **Response (200)**:
  - `{ "data": NoteSummaryDto[] }`
  - `NoteSummaryDto`:
    - `id: string`
    - `title: string`
    - `snippet: string`
    - `createdAt: string`
    - `updatedAt: string`

### 7.5 `GET /api/accounts/{id}/activity-log`

- **Response (200)**:
  - `{ "data": ActivityLogEntryDto[] }`
  - `ActivityLogEntryDto` (minimum):
    - `id: string`
    - `timestamp: string`
    - `type: string` (event type drawn from the existing activity log classification)
    - `description: string` (human-readable summary of the event)

### 7.6 Error responses (shared)

- **Error envelope**:
  - `{ "error": { "code": string, "message": string } }`

- Representative codes used in this spec:
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `ACCOUNT_NOT_FOUND`
  - `ACCOUNT_DATA_INCONSISTENT`
  - `INTERNAL_ERROR`

## 8. Frontend Requirements

- **FE-001**: Implement the account detail page at `frontend/src/app/(admin)/accounts/[id]/page.tsx` using the existing admin layout and guards.
- **FE-002**: Use the shared **auth-aware API helpers** (e.g., `fetchWithAuth`) and central API client to call the endpoints, not raw `fetch` scattered across components.
- **FE-003**: Implement a **tabbed layout** with labels exactly: `Company Info`, `Contacts`, `Demos`, `Notes`, `Activity Log`.
- **FE-004**: Default tab MUST be `Company Info`.
- **FE-005**: Implement **lazy loading** per Section 3.5 and cache data per tab for the duration of the page session.
- **FE-006**: Support **breadcrumb navigation** at the top of the page as:
  - `Accounts > {AccountName}`
  - Where `Accounts` navigates back to the accounts list page, and `{AccountName}` is the current account’s company name from the detail payload.
- **FE-007**: On **403** from any detail or tab endpoint, redirect to `/not-authorized`.
- **FE-008**: On **404**, show a “not found” state and provide a link/button back to the accounts list.
- **FE-009**: On **500**, show an error state but keep the shell (layout, header, tabs) intact so the user can navigate elsewhere.

## 9. UX States

For each tab (including Company Info):

- **Loading state**:
  - Show a skeleton, spinner, or loading indicator while fetching data.
  - For the initial page load, the Company Info tab may show a full-page skeleton until the detail payload is loaded.

- **Empty state**:
  - When `data` array is empty (for Contacts, Demos, Notes, Activity Log), show a clear message such as “No contacts yet for this account” rather than an empty table.

- **Error state**:
  - When a tab fetch fails (4xx or 5xx), show a scoped error message within the tab, including a “Retry” action when appropriate.
  - For 403, rely on the global redirect to `/not-authorized` instead of showing a tab-level error.

- **Mixed state**:
  - A failure on one tab MUST NOT break other tabs; the user can still switch to tabs whose data is available.

## 10. Clarifications

### Session 2025-11-18

- Q: What is the canonical source for Demos data used by the Demos tab? 9 A: Use a dedicated `Demos` entity/table linked to `Account` (or equivalent) as the canonical source; this spec defines its summary read model.
- Q: What is the canonical source for the Activity Log tab? 9 A: Use the existing global activity log/audit mechanism, filtered by account, surfacing only relevant event types for the Account Detail view.

## 11. Open Questions

*(None yet — to be filled during planning/clarification if needed.)*

## 12. Cross-Spec References

- **Spec 000 — Architecture & Conventions**: global architecture, layering, DTO patterns, error envelope, auth/RBAC, ownership, and soft delete rules.
- **Spec 005 — RBAC / roles** (or equivalent): definitions of Admin vs Basic roles and global RBAC policies.
- **Spec 006 — Session & Token Handling (Frontend)**: `AuthContext`, token storage, `fetchWithAuth`, and auth-driven routing.
- **Spec 007 — Admin Routing / Not Authorized** (if present): patterns for admin route groups and `/not-authorized` handling.
- **Spec 008 — Accounts Table**: base Accounts schema, lookups (AccountType, AccountSize, CrmProvider), and core account list behaviour.
- **Spec 009 — Account Detail Page**: initial detail endpoint, child table schemas (Contacts, Opportunities/Activities), RBAC and ownership clarifications, and foundational UI for the detail page.
