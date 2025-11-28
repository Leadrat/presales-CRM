# Quickstart – Spec 17: Universal Account Visibility & Created-By Attribution

## Goal

Show all accounts to both Basic and Admin users in the Accounts list and surface a Created By column using the creator's display name.

## Steps

1. **Backend – `/api/Accounts` list**

   - Extend the Accounts list DTO to include `createdByUserDisplayName?: string | null` (or equivalent).  
   - In the list query, join `Accounts.CreatedByUserId` to `Users.Id` and project the display name field used at signup (e.g., `FullName`).  
   - Ensure the endpoint **no longer filters** by the current user; it should return all non-deleted accounts, subject only to global RBAC rules.  
   - Keep the change **additive** so existing clients remain compatible.

2. **Frontend – shared Account DTO**

   - Update the frontend `AccountDto` type to include `createdByUserDisplayName?: string | null`.  
   - Use the same DTO on both the Admin and Basic Accounts pages.

3. **Frontend – Accounts list UI**

   - Ensure both Admin (`/accounts`) and Basic (`/my-accounts` → to be unified as "Accounts") tables use the unified columns:  
     `Company Name | Account Type | Size | City | Deal Stage | Created By | Created Date | Actions`.  
   - Render Created By as:  
     - `account.createdByUserDisplayName` when non-empty.  
     - `"Unknown"` when null/empty.

4. **RBAC & navigation**

   - Keep existing edit/delete permissions enforced by the backend.  
   - Allow both Basic and Admin users to open any account’s detail view from the list.

5. **Testing**

   - Backend integration tests for `/api/Accounts`:  
     - Basic and Admin roles receive the same set of accounts.  
     - Response includes `createdByUserDisplayName` populated from the correct User.  
   - Frontend tests for Accounts table:  
     - Both roles see identical columns and Created By values.  
     - "Unknown" appears when the creator cannot be resolved.

This quickstart is intentionally high-level; see `research.md` and `data-model.md` for design rationale and field definitions.
