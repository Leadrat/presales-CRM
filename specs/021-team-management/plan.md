# Spec 021 – Team Management (Users & Roles UI) – Implementation Plan

## 1. Context & Goals

- Feature: Team Management page at `/team` showing all organization users in a responsive grid with filters and per-user actions.
- Backend: ASP.NET Core + EF Core, existing auth (`Admin` / `Basic`) and user models.
- Frontend: Next.js (App Router), TailwindCSS, existing layout/sidebar, API helpers in `frontend/src/lib/api.ts`.
- Clarified decisions from spec:
  - All authenticated users see the Team page; **Admins** can mutate, others are **read-only**.
  - **Inactive** = `isActive == false`; soft-deleted users are never shown on Team page.
  - UI always **waits for backend confirmation** before updating cards.
  - Pagination: **20 users per page** with classic next/previous controls.

## 2. High-Level Design

### 2.1 Frontend

- Add `Team` nav item in sidebar that is visible for authenticated users.
- New protected route `/team` under `(protected)` segment.
- Page layout:
  - Header (title + subtitle).
  - Filter tabs: All, Active, Inactive.
  - Pagination controls (page x of y, next/prev) wired to backend query params.
  - Grid of `UserCard` components.
- `UserCard` contents:
  - Avatar (initial or `avatarUrl`).
  - Full name, role badge, email, optional phone.
  - Status chip for Active/Inactive + deactivated date.
  - Three-dot menu (`OptionsMenu`) with admin-only actions (Edit, Make/Remove Admin, Deactivate/Activate, Delete).
- Behavior by role:
  - Non-admin: see cards, filters, pagination; three-dot menu either hidden or disabled.
  - Admin: full action menu, modals for destructive actions, optimistic UI only after success.
- State management:
  - URL query params: `status` (all/active/inactive), `page` for pagination.
  - React state for users list, loading/error, total count, page metadata, modal state.

### 2.2 Backend

- Users API surface (extend if needed):
  - `GET /api/users?status={all|active|inactive}&page={n}&pageSize=20`.
  - `GET /api/users/{id}`.
  - `PATCH /api/users/{id}` for profile + role + `isActive`.
  - `DELETE /api/users/{id}` for soft delete.
- Auth rules:
  - All authenticated users may call `GET /api/users` and `GET /api/users/{id}`.
  - Only Admins may `PATCH` or `DELETE` users.
- Filtering rules:
  - `All`: `IsDeleted == false`.
  - `Active`: `IsDeleted == false` and `IsActive == true`.
  - `Inactive`: `IsDeleted == false` and `IsActive == false`.
- Pagination contract:
  - Request: `page` (1-based), `pageSize` (default 20, max reasonable cap).
  - Response: `items`, `totalCount`, `page`, `pageSize`.

## 3. Phased Plan

### Phase 0 – Inventory & Design

1. **Inventory existing user model & APIs**
   - Locate user entity, DTOs, and any `/api/users` endpoints.
   - Confirm available fields: `fullName`, `email`, `phone`, `role`, `isActive`, `deactivatedAt`, `avatarUrl`, `isDeleted`.
2. **Decide contracts**
   - If `GET /api/users` already exists, extend it to support `status`, `page`, `pageSize` and return paging metadata.
   - If missing, define new controller methods with the above contract.
3. **UX wireframe (mental or quick sketch)**
   - Header, tabs, grid, pagination, card layout, modals.

_Output_: Updated understanding of current model + a concrete API shape to implement.

### Phase 1 – Backend Work

1. **List users with filters + pagination**
   - Implement/extend `GET /api/users`:
     - Apply auth: authenticated only.
     - Apply `status` filter per spec (All/Active/Inactive).
     - Exclude `IsDeleted == true` always.
     - Implement ordering (e.g. by created date or name) and paging (page/pageSize, totalCount).
2. **Single-user GET**
   - Ensure `GET /api/users/{id}` returns the same DTO shape used in the list.
3. **Update user endpoint**
   - Implement/extend `PATCH /api/users/{id}`:
     - Admin-only.
     - Accept updates for name, email, phone, role, `isActive`.
     - When `isActive` flips from true → false, set `deactivatedAt` to now; from false → true, clear `deactivatedAt`.
4. **Soft delete user**
   - Implement/extend `DELETE /api/users/{id}`:
     - Admin-only.
     - Mark `IsDeleted = true` and prevent login if applicable.
     - Ensure soft-deleted users are excluded from all `/api/users` responses.
5. **DTO and validation**
   - Add/confirm user DTO with fields enumerated in spec.
   - Add basic validation (e.g. email format) where appropriate.

_Output_: Users API fully supports Team page (list, filter, paging, edit, deactivate/activate, delete).

### Phase 2 – Frontend Page & Components

1. **Sidebar navigation**
   - Add `Team` item to sidebar.
   - Show it for all authenticated users; highlight when route starts with `/team`.
2. **Team page route**
   - Create `/frontend/src/app/(protected)/team/page.tsx`.
   - Fetch users from `/api/users` using `getUsers` helper in `lib/api.ts`.
   - Bind filter tabs to `status` query param and pagination controls to `page`.
3. **API helpers**
   - In `lib/api.ts` add/update:
     - `getUsers({ status, page, pageSize })`.
     - `getUser(id)`.
     - `updateUser(id, payload)`.
     - `deleteUser(id)`.
4. **UserCard component**
   - New component for card layout with avatar, name, role badge, email, phone, status chip.
   - Accepts props for `readonly` vs `canManage` to hide/disable menu for non-admins.
5. **RoleBadge and shared UI**
   - Implement simple role badge mapping (Admin, Basic, etc.).
6. **Options menu + modals**
   - Admin-only menu actions for Edit, Make/Remove Admin, Deactivate/Activate, Delete.
   - Implement confirmation modals for destructive actions.
   - While an action is in progress, show loading/disabled state and only update UI after success.

_Output_: Fully functional Team UI wired to backend, respecting roles and filters.

### Phase 3 – Polish, Accessibility, and Testing

1. **Accessibility**
   - Verify keyboard navigation for tabs, menus, modals.
   - Add ARIA attributes for dialogs and menus.
2. **Empty/error/loading states**
   - Show skeleton or spinner while loading.
   - Handle empty results for each filter (friendly message).
   - Show inline or toast errors on API failures.
3. **Pagination UX**
   - Confirm page size of 20 feels reasonable; adjust max cap if needed while still matching contract.
4. **Testing checklist**
   - Admin vs Basic behaviors.
   - All/Active/Inactive filters.
   - Pagination navigation.
   - Edit/role change/deactivate/activate/delete flows, including error cases.

_Output_: Production-ready Team Management feature aligned with Spec 021.
