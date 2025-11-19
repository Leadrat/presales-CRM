# Quickstart — Spec 10: Account Detail Page Extensions

This quickstart shows how to exercise the extended Account Detail Page once implemented.

1. **Login as Admin**
   - Use existing login flow (Spec 006) to obtain an access token for the Admin user.

2. **Create or locate an Account**
   - Use the Accounts list and create functionality from earlier specs to ensure you have at least one account.

3. **Seed child data**
   - Create a few Contacts, Demos, Notes, and actions that generate Activity Log entries for this account (via existing flows or direct DB seeding during development).

4. **Call backend APIs**
   - `GET /api/accounts/{id}/detail` — verify core fields and counts.
   - `GET /api/accounts/{id}/contacts` — verify contacts for the account.
   - `GET /api/accounts/{id}/demos` — verify demos for the account.
   - `GET /api/accounts/{id}/notes` — verify notes for the account.
   - `GET /api/accounts/{id}/activity-log` — verify relevant activity entries.

5. **Use the frontend page**
   - Navigate to `/accounts/{id}` as Admin.
   - Switch between tabs: Company Info, Contacts, Demos, Notes, Activity Log.
   - Confirm loading, empty, and error states behave as specified.

6. **RBAC checks**
   - As a Basic user, attempt to access:
     - An account you own → detail and tabs should load.
     - An account you do not own → expect redirect to `/not-authorized`.
