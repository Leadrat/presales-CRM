# Quickstart: Spec 015 – Demo Entity & Demo Activity History

This guide shows how to run and manually test the Demo feature end-to-end.

## Prerequisites

- Backend API running (ASP.NET Core project in `backend/`).  
- Frontend Next.js app running in `frontend/` (usually `npm run dev`).  
- Admin and Basic user accounts configured as in existing environment.

## 1. Apply database migration

1. From the `backend/` project, add the Demo migration (after implementation):
   - Ensure `Demo` entity and DbSet are defined.  
   - Run EF Core migration command (example):

   ```bash
   dotnet ef migrations add AddDemoEntity
   dotnet ef database update
   ```

2. Verify that a new `Demos` table exists with the fields defined in `data-model.md`.

## 2. Start backend and frontend

- Backend (from `backend/`):

  ```bash
  dotnet run
  ```

- Frontend (from `frontend/`):

  ```bash
  npm install   # first time only
  npm run dev
  ```

## 3. Test the Demo API (optional via HTTP client)

Use a REST client (Postman, VS Code REST, curl) authenticated as an Admin.

1. **Create demo**

   ```http
   POST /api/Accounts/{accountId}/demos
   Content-Type: application/json

   {
     "scheduledAt": "2025-11-24T10:00:00Z",
     "demoAlignedByUserId": "{currentUserId}",
     "attendees": "Owner, CTO",
     "notes": "First product walkthrough"
   }
   ```

2. **List demos for account**

   ```http
   GET /api/Accounts/{accountId}/demos
   ```

3. **Update demo**

   ```http
   PUT /api/Accounts/{accountId}/demos/{demoId}
   Content-Type: application/json

   {
     "scheduledAt": "2025-11-24T10:00:00Z",
     "doneAt": "2025-11-24T10:45:00Z",
     "demoAlignedByUserId": "{currentUserId}",
     "demoDoneByUserId": "{demoRunnerUserId}",
     "attendees": "Owner, CTO",
     "notes": "Demo completed, next step: proposal"
   }
   ```

## 4. Test via UI (Admin)

1. Log in as Admin.  
2. Navigate to **Accounts → [choose account]**.  
3. Open the **Demos** tab.  
4. Click **+ Add Demo** and fill the modal: scheduled time, attendees, notes (alignedBy defaults to you).  
5. Submit and verify:
   - Modal closes.  
   - New row appears in the Demos table with the correct values.

## 5. Test via UI (Basic user)

1. Log in as a Basic user.  
2. Create a new account (if necessary) so you are the creator.  
3. Open **My Accounts → [that account] → Demos tab**.  
4. Confirm you see **+ Add Demo**, create a demo, and see it listed.  
5. Open a different account **not created by this user** and confirm:
   - The Demos tab still lists demos.
   - The **+ Add Demo** button is hidden or disabled.

## 6. Soft-delete behavior (if implemented in this spec)

1. Call the soft-delete endpoint as Admin: `DELETE /api/Accounts/{accountId}/demos/{demoId}`.  
2. Refresh the Demos tab and `GET /demos` response.  
3. Confirm the deleted demo no longer appears, but the row remains in the database with `IsDeleted = true`.
