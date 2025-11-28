# Feature Specification: Spec 17 – Universal Account Visibility & Created-By Attribution

**Feature Branch**: `017-account-visibility-created-by`  
**Created**: 2025-11-25  
**Status**: Draft  
**Input**: User description: "Make all users (Basic + Admin) see all accounts in the Accounts list, and surface a Created By column showing the creator's email, with supporting API and UI changes."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Basic user can see all accounts (Priority: P1)

As a **Basic user**, I want to see **all accounts** in the Accounts list (not just those I created) so that I can work on any account my team is managing.

**Why this priority**: This removes the current ownership restriction and is the core behavior change. Without this, Basic users remain artificially limited and cannot collaborate effectively.

**Independent Test**: Log in as a Basic user and open the Accounts list. Compare the list with an Admin view; the Basic user should see the same number of accounts and be able to open any of them.

**Acceptance Scenarios**:

1. **Given** a Basic user is logged in, **When** they open the Accounts list, **Then** they see all existing accounts, regardless of who created them.
2. **Given** an Admin creates a new account, **When** a Basic user refreshes the Accounts list, **Then** the new account appears in their list without any extra permissions.
3. **Given** a Basic user clicks any account in the list, **When** the detail view opens, **Then** the user can view (but only edit according to existing RBAC rules) the account just like Admins.

---

### User Story 2 – Created By attribution is clear (Priority: P1)

As **any user**, I want to see **who created each account** via the creator's display name (username provided at signup) in the Accounts list so that I know who to contact for questions or follow-up.

**Why this priority**: Attribution is essential for collaboration and auditability once all accounts are visible to everyone.

**Independent Test**: For a known account, verify that the Created By column shows the correct creator display name; if the creator cannot be resolved, verify that “Unknown” is displayed.

**Acceptance Scenarios**:

1. **Given** an account whose creator user still exists, **When** the Accounts list is loaded, **Then** the Created By column shows that user’s display name (e.g., `Shashank Yogesh`).
2. **Given** an account whose creator user no longer exists or cannot be resolved, **When** the Accounts list is loaded, **Then** the Created By column shows `Unknown`.
3. **Given** a list with many accounts created by different users, **When** a user scans the Accounts table, **Then** each row’s Created By value is clearly aligned and formatted like the other text in the table.

---

### User Story 3 – Unified Accounts list for all roles (Priority: P2)

As **any user (Basic or Admin)**, I want a **single, consistent Accounts list UI** so that I don’t need to learn different layouts or routes for the same concept.

**Why this priority**: A unified list reduces confusion between “My Accounts” and “Accounts” and keeps maintenance cost low.

**Independent Test**: Compare the Accounts page as seen by a Basic user and an Admin user; both should show the same layout, columns, and behavior, aside from any existing edit permissions on the underlying detail pages.

**Acceptance Scenarios**:

1. **Given** a Basic user logs in, **When** they navigate to the accounts listing area, **Then** they see a page titled “Accounts” with the unified columns and styling.
2. **Given** an Admin user logs in, **When** they open the Accounts list, **Then** they see the same columns and visual style as the Basic user.
3. **Given** either role is viewing the Accounts list, **When** they use search or filters, **Then** the query is applied across all accounts, not just accounts they created.

---

### User Story 4 – Search, filters, and pagination continue to work (Priority: P3)

As **any user**, I want to keep using **search, filters, and pagination** on the Accounts list so that the list remains usable even when it includes all accounts.

**Why this priority**: Showing all accounts may significantly increase list size. Usability requires that existing controls continue to function correctly.

**Independent Test**: With a data set large enough to need paging and search, verify that searching, filtering, and paginating behave correctly when all accounts are visible.

**Acceptance Scenarios**:

1. **Given** there are more accounts than fit on a single page, **When** a user navigates through pages, **Then** each page shows accounts from the full set (not filtered by creator), and page transitions are responsive.
2. **Given** a user types a search term matching company names created by multiple different users, **When** they apply the search, **Then** accounts from all creators are matched.
3. **Given** filters (e.g., by deal stage) are applied, **When** the filtered list is shown, **Then** it may include accounts from any creator as long as they satisfy the filter.

---

### Edge Cases

- Accounts whose `createdBy` user record no longer exists or cannot be found should show `Unknown` in the Created By column, without breaking the list view.
- Accounts with missing or invalid `createdBy` identifiers should still appear in the list and be fully navigable.
- The Accounts list should handle very large numbers of accounts without noticeable degradation in perceived performance, assuming backend pagination is correctly configured.
- If the Accounts listing API temporarily fails to resolve creator emails, the UI should still render rows gracefully, using `Unknown` where necessary.
- If future RBAC rules restrict editing for some roles, viewing all accounts in the list must still be allowed for both Basic and Admin roles, consistent with this spec.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 – Universal account visibility**  
  The system MUST present the same full set of accounts to both Basic and Admin users in the Accounts list, without filtering by the current user as creator or owner.

- **FR-002 – Unified Accounts list UI**  
  The product MUST provide a single Accounts list experience (labelled “Accounts”) for both Basic and Admin users, with a consistent table layout, column order, and styling.

- **FR-003 – Created By column content**  
  The Accounts list MUST include a **Created By** column that shows the **display name / username** of the user who created each account (the name provided at signup), when that information is available.

- **FR-004 – Unknown creator fallback**  
  When an account’s creator display name cannot be resolved (for example, the user record is missing or has been deleted), the Accounts list MUST display `Unknown` in the Created By column for that row.

- **FR-005 – API contract for creator attribution**  
  The Accounts listing API MUST provide sufficient data for the UI to render the Created By column without additional per-row lookups. This MAY be either:
  - a top-level `createdByUserDisplayName` (or equivalent) field on each account item, **or**
  - a nested `creator` object containing at least `userId` and `displayName`.

- **FR-006 – No behavioral change to create/edit flows**  
  The feature MUST NOT change how accounts are created or edited, beyond ensuring that newly created accounts continue to populate the creator attribution fields needed for the Created By column.

- **FR-007 – RBAC: view-only scope**  
  Both Basic and Admin roles MUST be allowed to view the entire Accounts list and open any account’s detail page. Existing role-based rules for editing, updating, and deleting accounts MUST remain unchanged.

- **FR-008 – Search and filters across all accounts**  
  Any account search, filtering, or sorting behavior available on the Accounts list MUST operate over the full set of accounts, not just those created by the current user.

- **FR-009 – Pagination behavior**  
  The Accounts list MUST continue to support pagination (or equivalent lazy loading mechanism) so that loading all accounts remains performant even as the total number of accounts grows.

- **FR-010 – Backward compatibility for clients**  
  The updated API contract MUST be designed so that existing clients that do not rely on the Created By column can continue functioning or be adapted with minimal change (for example, by adding non-breaking fields rather than removing or renaming required fields).

### Key Entities *(include if feature involves data)*

-- **Account**  
  Represents a customer organization or prospect. Relevant attributes for this spec include identifiers, company name, account type, size, city (if available), deal stage, creation timestamp, and a reference to the creator (user id and/or display name).

- **User**  
  Represents a person using the system. Relevant attributes include unique identifier, email, role (Basic or Admin), and active/deleted status. Users are the creators of accounts and are referenced in the Created By attribution.

- **Account List View**  
  The UI surface where users see multiple accounts in a tabular format, with columns such as Company Name, Account Type, Size, City, Deal Stage, Created By, Created Date, and Actions. It supports search, filtering, pagination, and row-level actions such as view/edit/delete (subject to RBAC).

-- **Created-By Attribution**  
  Logical link between an Account and the User who created it, where the **display name / username** shown in the Accounts list is resolved from the current User record (via user id) at read time, with `Unknown` used as a fallback when that resolution fails.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 – Visibility parity**  
  For a representative test dataset, the number of accounts shown to a Basic user and an Admin user in the Accounts list MUST be identical (barring test-only fixtures), confirming removal of creator-based filtering.

- **SC-002 – Attribution coverage**  
  At least 95% of existing accounts in production SHOULD display a non-`Unknown` value in the Created By column after deployment, assuming valid historical creator data exists.

- **SC-003 – Performance under load**  
  When listing all accounts with pagination enabled, the time to load the first page of the Accounts list SHOULD remain within acceptable UX guidelines (for example, under 2 seconds on a typical network) for datasets up to an agreed maximum size.

- **SC-004 – Search correctness**  
  Searching from the Accounts list MUST return matching accounts regardless of which user created them, as validated by test scenarios comparing Admin and Basic search results for the same query.

- **SC-005 – No regression in RBAC**  
  After deployment, automated and manual tests MUST confirm that view permissions are broadened as specified while edit/update/delete capabilities remain governed by existing role-based rules.


---

## Clarifications

### Session 2025-11-25

- Q: In the Accounts list, should the **Created By** column show the creator's email address or the username provided during signup?  
  A: Show the **signup username / display name** (e.g., `Shashank Yogesh`) in the Created By column. Use `Unknown` only when that display name cannot be resolved.
 - Q: Should the **Created By** value be a fixed snapshot taken at account creation time, or should it always reflect the creator's current display name from their user profile?  
  A: Always show the creator's **current display name** resolved from the User record; if the user is missing or cannot be loaded, fall back to `Unknown`.
