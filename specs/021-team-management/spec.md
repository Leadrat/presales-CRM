# Spec 021 – Team Management (Users & Roles UI)

## Goal

Provide a complete Team Management UI that lets admins and managers view all users, filter by active/inactive status, see contact details and roles, and perform common user actions (edit, assign role, deactivate).

## Problem

There is currently no central UI for viewing and managing team members. Admins need an accessible page where they can:

- See a list of all users in the organization.
- Quickly understand each user’s role and status.
- Perform basic lifecycle actions such as editing user details, changing roles, and deactivating or deleting users.

Without this, user management is fragmented and error-prone.

## Solution Overview

Implement a **Team** page accessible from the sidebar that surfaces organization users in a responsive card grid. Each user card shows key details (name, role, email, phone, status) and offers a contextual actions menu for managing that user. The page includes filter tabs (All / Active / Inactive) to quickly slice the list, and uses existing APIs for listing and updating users. The UI must reuse the existing design system (cards, buttons, icons) and be responsive and accessible.

## Scope

### In Scope – Frontend

- Add a **Team** navigation item in the main sidebar that:
  - Appears for all authenticated users; Admins can perform management actions, non-admin users see a read-only view.
  - Highlights as active when the `/team` route is active.
  - Navigates to the new Team page at `/team`.
- Create a **Team** page at `/team` that includes:
  - Page title and subtitle (e.g. "Team" / "Manage your organization users").
  - Filter tabs for **All**, **Active**, and **Inactive** users.
  - A responsive grid of user cards that adjusts for different screen widths.
- **User card layout** (per user):
  - Avatar (initial-based circle, or avatar image if `avatarUrl` is present).
  - Full name.
  - Role badge (e.g. Admin, Basic, or other roles if present).
  - Email address.
  - Phone number (if available).
  - Status indicator:
    - Active vs Inactive.
    - Deactivated date if the user is inactive and a `deactivatedAt` timestamp is available.
  - Three-dot actions menu with options such as:
    - Edit user.
    - Make Admin / Remove Admin (role change).
    - Deactivate / Activate.
    - Delete (soft delete).
- **Filters and interactions**:
  - Filter tabs (All / Active / Inactive) should update the displayed users.
    - At minimum, the filtering should work client-side once a page of users is loaded.
    - The UI should be compatible with server-side filtering / pagination if the API supports it.
  - Support server-side pagination with a default **20 users per page**, using standard next/previous page controls (numbered pagination is acceptable).
- **Reusable components**:
  - `UserCard` component encapsulating the user card layout.
  - `RoleBadge` component for consistent role styling.
  - `FilterTabs` component for All / Active / Inactive selection.
  - `OptionsMenu` (three-dot) component for per-user actions.
  - All components must reuse existing button/input styles and icon set where possible.
- **Modals / forms**:
  - Provide UI to **Edit User** (e.g. name, email, phone, role) via a modal or dedicated route.
  - Provide confirmation modals for **Deactivate**, **Activate**, and **Delete** actions to avoid accidental changes.
  - Validate inputs on edit (required fields, email format) and show success/error feedback (e.g. toasts or inline messages).
- **Accessibility & responsiveness**:
  - All interactive elements (tabs, card menus, modals) must be keyboard operable.
  - Use appropriate ARIA attributes for menus, dialogs, and buttons.
  - Ensure the layout adapts gracefully from mobile to desktop screen sizes.

### In Scope – Backend

- Ensure API endpoints exist and are suitable for the Team UI:
  - `GET /api/users` with optional query parameters, e.g. `?status=active|inactive|all` and pagination parameters.
  - `GET /api/users/{id}` to fetch a single user.
  - `PATCH /api/users/{id}` to update user profile fields and role/status.
  - `DELETE /api/users/{id}` to soft-delete a user (not hard delete), so they can be hidden from active lists.
- Ensure the user DTO returned by these endpoints includes the fields required by the Team page:
  - `id`
  - `fullName`
  - `email`
  - `phone`
  - `role` (e.g. Admin, Basic)
  - `isActive` (or equivalent active/inactive flag)
  - `deactivatedAt` (nullable timestamp)
  - `avatarUrl` (optional string)
- Verify that existing authentication/authorization logic enforces:
  - All authenticated users can access the Team page; only Admins (and any other privileged roles) can perform mutating actions via the management APIs.
  - Basic users cannot promote themselves or others.
- If any of the above endpoints or fields are missing or incomplete, extend or add the necessary controllers, DTOs, and validation to support the Team page.

### Out of Scope

- SSO or authentication mechanism changes.
- Complex role-based access control beyond simple Admin vs Basic (e.g. fine-grained permissions, custom role definitions).
- Bulk import/export of users (CSV, Excel, etc.).
- Advanced analytics, reporting, or audit dashboards based on user actions.

## Users and Scenarios

### Primary Users

- **Admin users** who need to manage organization members, assign roles, and deactivate or delete accounts.
- **Managers or team leads** (if permitted) who may review their team’s users but with limited editing rights depending on existing auth rules.

### Key Scenarios

1. **View all users in the organization**
   - An Admin clicks the **Team** item in the sidebar.
   - They land on `/team` and see a grid of user cards with names, roles, and contact information.
   - The grid is readable on both desktop and mobile.

2. **Filter by Active / Inactive users**
   - An Admin opens `/team` and clicks the **Active** filter tab.
   - Only active users are shown.
   - They switch to **Inactive** and see only inactive (or deactivated) users, with deactivation dates displayed.

3. **Edit a user’s details**
   - From a user card, the Admin opens the three-dot menu and chooses **Edit**.
   - An edit form appears (modal or route) with fields for name, email, phone, and role.
   - The Admin updates the information and saves; the card reflects the changes immediately after a successful API call.

4. **Change a user’s role**
   - From the user’s card menu, the Admin selects **Make Admin** or **Remove Admin**.
   - A confirmation (if needed) appears.
   - On confirmation, the system updates the user’s role via the API and refreshes the card, showing the new role badge.

5. **Deactivate / Activate a user**
   - From the user’s card menu, the Admin selects **Deactivate**.
   - A confirmation modal explains the impact (e.g. user will no longer be able to sign in).
   - After confirmation and successful API response, the user’s card shows an Inactive state and deactivated date.
   - From the Inactive filter, the Admin can choose **Activate** to restore the user.

6. **Delete a user (soft delete)**
   - From a user’s card menu, the Admin selects **Delete**.
   - A confirmation modal warns about the action and clarifies that this is a soft delete.
   - After confirmation, the user is removed from the active list and handled according to the backend’s soft-delete rules.

## Functional Requirements

1. **Navigation and Routing**
   - A `Team` item must appear in the left sidebar navigation for all authenticated users.
   - Clicking `Team` navigates to `/team`.
   - The Team item must visually indicate when `/team` is the active route.

2. **Team Page Layout**
   - The `/team` page must display a header with title and descriptive subtitle.
   - The page must include filter tabs for **All**, **Active**, and **Inactive** users.
   - Below the header and filters, the page must render a responsive grid of user cards.

3. **User Card Content**
   - Each user card must show at minimum:
     - Avatar (initial or image).
     - Full name.
     - Role badge.
     - Email.
   - If available, the card must also show:
     - Phone number.
     - Inactive status and deactivated date if the user is inactive.
   - Each card must expose a three-dot options menu for user actions.

4. **Filtering Behavior**
   - The filter tabs must change which users are shown:
     - **All**: all non-deleted users (soft-deleted users are never shown).
     - **Active**: only users with `isActive == true`.
     - **Inactive**: only users with `isActive == false` (or equivalent flag), optionally sorted by `deactivatedAt`.
   - The Team page must be able to call backend APIs with appropriate query parameters when needed (e.g. `?status=active`).

5. **User Actions – Edit, Role Change, Deactivate/Activate, Delete**
   - The three-dot menu must provide actions:
     - Edit user.
     - Make Admin / Remove Admin (depending on current role).
     - Deactivate or Activate (depending on current status).
     - Delete (soft delete).
   - Each action must:
     - Call the appropriate API endpoint.
     - Show a confirmation modal for destructive operations (deactivate, delete).
     - On success, update the UI so the card reflects the new state or disappears if deleted.

6. **API Integration**
   - The Team page must use defined API helpers in `frontend/src/lib/api.ts` to:
     - Fetch the paginated list of users (`getUsers`).
     - Fetch a single user (`getUser`) for editing if needed.
     - Update a user’s profile/role/status (`updateUser`).
     - Soft-delete a user (`deleteUser`).
   - The backend must implement the corresponding endpoints and ensure correct role-based authorization.

7. **Validation and Feedback**
   - Edit forms must validate required fields (e.g. full name, email format).
   - On success, show a clear confirmation (e.g. toast or inline message) after the backend confirms the change.
   - On failure, show a readable error message and do not apply UI changes until the backend confirms success.

8. **Accessibility and Responsiveness**
   - All interactive controls (tabs, menus, buttons, dialogs) must be keyboard navigable.
   - Appropriate ARIA attributes must be added for menus, dialogs, and key controls.
   - On small screens, the layout must adapt (e.g. cards stack in a single column) and remain readable.

## Assumptions

- The system already has a concept of authenticated users with roles such as Admin and Basic.
- All authenticated users can access the Team page; only Admin (and any other privileged roles defined elsewhere) can perform user-management actions.
- The backend can be extended to support the required user list and update operations if they do not already exist.
- Soft delete is the preferred deletion model for users, consistent with other parts of the application.

## Clarifications

- Q: Should **Basic** users see the Team page in read-only mode, or should it be hidden entirely for non-admins? 
  → A: All authenticated users can see the Team page, but only Admins can perform user-management actions; non-admins have a read-only view.

- Q: What are the exact rules for when a user is considered **Inactive** (e.g. `isActive == false`, soft deleted, or both)?
  → A: Inactive users are those with `isActive == false`; soft-deleted users are excluded from all Team filters and do not appear in the list.

- Q: Should role changes and deletions be fully optimistic in the UI, or should the UI always wait for backend confirmation before updating the display?
  → A: The UI must wait for backend confirmation before updating cards; while a request is in flight, affected controls should show a loading/disabled state.

- Q: Are there any limits on how many users can be shown per page (default page size) and how pagination should be presented (buttons vs infinite scroll)?
  → A: Use server-side pagination with 20 users per page and classic next/previous controls (numbered pagination allowed).

## Success Criteria

- A `Team` item appears in the sidebar for all authenticated users and navigates to `/team`.
- The `/team` page displays user cards in a responsive grid that matches the app’s design style.
- Filter tabs correctly toggle between All / Active / Inactive users and, where supported, drive backend filtering.
- Per-user options menus allow Edit, Change Role, Deactivate/Activate, and Delete with appropriate confirmation modals.
- User changes (edit, role change, deactivate/activate, delete) correctly call the backend APIs and are reflected immediately in the UI.
- The Team page is keyboard accessible, mobile responsive, and produces no console errors when listing many users.
