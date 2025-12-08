# Specification: Dashboard User Filter

## Feature Description

Integrate a multi-user filter on the Dashboard page that allows Admin users to filter dashboard metrics by selected team members. The filter should persist selections across page reloads using sessionStorage, reset on logout, and ensure Basic users always see only their own data.

## Clarifications

### Session 2025-12-08

- Q: How should the filter behave when a user is deactivated after being selected in the filter? → A: Filter out inactive users automatically when loading the filter
- Q: What should happen if sessionStorage is not available or fails? → A: Fall back to in-memory state for the current page session
- Q: Should the filter selection affect the URL or be shareable between users? → A: No URL parameters, selection is personal
- Q: How frequently should the dashboard metrics update when filter selection changes? → A: Immediately after selection changes
- Q: What should happen if all selected users are deactivated or deleted? → A: Reset to "All team members"

## User Scenarios & Testing

### Scenario 1: Admin User Filtering Dashboard Metrics
1. Admin logs into the application
2. Admin navigates to the Dashboard page
3. Admin sees a "View Dashboard For" filter card above the KPI cards
4. Admin clicks on the filter dropdown
5. Admin selects specific team members from the list
6. Dashboard metrics update to show data only for selected team members
7. Admin refreshes the page
8. Filter selection is preserved and metrics remain filtered

### Scenario 2: Admin User Session Management
1. Admin selects specific team members in the filter
2. Admin opens a new tab with the Dashboard
3. The same filter selection appears in the new tab
4. Admin logs out in one tab
5. Both tabs redirect to login
6. Admin logs back in
7. Filter is reset to "All team members"

### Scenario 3: Basic User Experience
1. Basic user logs into the application
2. Basic user navigates to the Dashboard page
3. Basic user does not see any user filter option
4. Dashboard metrics show only the Basic user's own data

## Functional Requirements

1. **Admin-Only Multi-User Filter UI**
   - Display a "View Dashboard For" filter card only for users with Admin role
   - The filter must be positioned above the KPI cards on the Dashboard page
   - The filter must match the multi-select design with:
     - A dropdown trigger showing selected users as pills
     - A dropdown menu with "Select All" and "Clear All" buttons
     - A scrollable list of checkboxes for team members
     - Visual indication of selected state for each team member

2. **Filter Persistence**
   - Store filter selection in sessionStorage under key "dashboard_user_filter"
   - Store "ALL" for all team members selected or no selection
   - Store JSON array of user IDs for specific selections
   - Restore filter selection on page load/refresh
   - Reset filter to "ALL" on new login
   - Fall back to in-memory state for the current page session if sessionStorage is unavailable

3. **Logout Behavior**
   - Clear "dashboard_user_filter" from sessionStorage on logout
   - Ensure cross-tab logout also clears the filter from all tabs

4. **Backend API Support**
   - Extend `/api/Accounts/dashboard-summary` endpoint to accept optional `userIds` query parameter
   - Extend `/api/analytics/accounts` endpoint to accept optional `userIds` query parameter
   - Extend `/api/analytics/demos-by-size` endpoint to accept optional `userIds` query parameter
   - Parse comma-separated GUIDs from `userIds` parameter
   - Apply filtering based on role:
     - Admin: Filter by provided userIds or show global data if none provided
     - Basic: Always filter to current user's ID regardless of provided parameters

5. **Frontend API Integration**
   - Update `getDashboardSummary()` to accept optional userIds parameter
   - Update `getAnalyticsAccounts()` to accept optional userIds parameter
   - Update `getDemosBySize()` to accept optional userIds parameter
   - Pass selected user IDs to API calls when filter is active

6. **Metrics Update**
   - All dashboard metrics must update immediately after filter selection changes:
     - Total Accounts Created
     - Demos Scheduled
     - Demos Completed
     - Revisit Demos (calculated)
     - Conversion Rate (calculated)
   - Analytics cards must also update immediately based on filter selection
   - No separate "Apply" button is required

7. **Edge Case Handling**
   - Handle invalid stored user IDs by filtering them out and reverting to "ALL" if none remain valid
   - Automatically filter out inactive/deactivated users when loading the filter
   - Reset to "All team members" if all selected users are deactivated or deleted
   - Show loading state during team member fetching
   - Display error message if team member loading fails
   - Handle empty team member list gracefully

## Success Criteria

1. Admin users can filter dashboard metrics by selecting specific team members
2. Filter selection persists across page refreshes within the same session
3. Filter selection is cleared on logout
4. Basic users always see only their own data
5. All dashboard metrics update correctly based on filter selection
6. The filter UI matches the provided design specification
7. The filter is accessible only to Admin users

## Assumptions

1. The application already has a working authentication system with role-based access control
2. The application already has endpoints for fetching team members
3. The application already has dashboard metrics that can be filtered by user ID
4. The UI will be implemented using React and TailwindCSS
5. The backend is implemented in C# with ASP.NET Core
6. The sessionStorage API is available in the target browsers

## Key Entities

1. **User**
   - id: string (GUID)
   - fullName: string
   - email: string
   - role: string ("Admin" or "Basic")

2. **Dashboard Metrics**
   - totalAccountsCreated: number
   - demosScheduled: number
   - demosCompleted: number
   - revisitDemos: number (calculated)
   - conversionRate: number (calculated)

3. **Filter State**
   - selectedUserIds: string[] | null
   - isAllTeamMembersSelected: boolean

## Technical Constraints

1. The filter selection must be stored in sessionStorage, not localStorage
2. The filter must be cleared on logout, including cross-tab logout
3. Backend filtering must be role-aware and enforce access control
4. The UI must match the provided design specification exactly
5. Filter selection should not be added to URL parameters or made shareable between users

## Implementation Notes

1. Frontend changes:
   - Update `dashboard/page.tsx` to add the filter UI and logic
   - Update `api.ts` to support multi-user filtering
   - Update `tokenService.ts` to clear filter on logout

2. Backend changes:
   - Update `AccountsController.cs` to support userIds filtering
   - Update `AnalyticsController.cs` to support userIds filtering
   - Ensure role-based access control is enforced

3. UI Components:
   - Multi-select dropdown with checkboxes
   - Pills for selected users
   - Select All / Clear All buttons
   - Loading and error states
