# SPEC 23 – Complete Leaderboard System

**Title:** Performance Leaderboard With Account-Size Based Demo Scoring  
**Version:** 1.0  
**Status:** Draft  
**Owner:** Product / Analytics  
**Date:** 2025-12-11

---

## 1. Goal & Overview

Build a full **Leaderboard module** that allows **Admins** and **Basic users** to view team performance over configurable time ranges:

- Weekly
- Monthly
- Quarterly

The leaderboard must:

- Rank users based on a **points system**
- Use **account creation** and **demo completion** as the primary metrics
- Weight demo points by **Account Size** (Small / Medium / Enterprise)
- Be accessible from the protected app navigation (e.g. "Leaderboard" item)

This spec covers **backend, frontend, DB, and API** requirements for the leaderboard feature.


## 2. Actors & Permissions

- **Admin user**
  - Can view the leaderboard for all users
  - Can switch between weekly / monthly / quarterly views
  - Sees all active users with non-zero points

- **Basic user**
  - Can view the leaderboard for all users (same data as Admin)
  - Can switch between weekly / monthly / quarterly views
  - Cannot change scoring rules or include/exclude users

- **System / API**
  - Computes date ranges per period
  - Aggregates accounts and demos per user
  - Applies the points engine and sorting rules

All access to the leaderboard endpoint requires an **authenticated** user (Admin or Basic). Inactive users are never shown in the leaderboard output.


## 3. Data Model & Database Requirements

### 3.1 Existing Tables (Dependencies)

The leaderboard depends on these existing entities (names from backend models):

#### Users
- `Id` (GUID)
- `FullName` (string)
- `Role` (string, e.g. Admin / Basic)
- `IsActive` (bool)
- `CreatedAt` (DateTimeOffset)

#### Accounts (`Account` model)
- `Id` (GUID)
- `CompanyName` (string)
- `AccountTypeId` (GUID)
- `AccountSizeId` (GUID) – links to `AccountSize`
- `CurrentCrmId` (GUID)
- `ClosedDate` (DateTimeOffset?)
- `LeadSource` (string?)
- `DealStage` (string)
- `CreatedByUserId` (GUID → Users.Id)
- `AssignedToUserId` (GUID?)
- `CreatedAt` (DateTimeOffset)
- `UpdatedAt` (DateTimeOffset)
- `IsDeleted` (bool)
- Navigation: `AccountSize? AccountSize`, `User? CreatedByUser`, etc.

> For scoring, we only need: `Id`, `CreatedByUserId`, `CreatedAt`, and the effective **Account Size**.

#### AccountSize
- `Id` (GUID)
- `Name` (string) – expected values: `Small`, `Medium`, `Enterprise` (per spec)

#### Demos (`Demo` model)
- `Id` (GUID)
- `AccountId` (GUID → Accounts.Id) – required
- `DemoAlignedByUserId` (GUID) – user who scheduled/aligned the demo
- `DemoDoneByUserId` (GUID?) – user who completed the demo (when status = Completed)
- `ScheduledAt` (DateTimeOffset)
- `DoneAt` (DateTimeOffset?) – when actually completed (for Completed)
- `Status` (string) – `Scheduled`, `Completed`, `Cancelled`, `NoShow`
- `CreatedAt` (DateTimeOffset)
- `UpdatedAt` (DateTimeOffset)
- `IsDeleted` (bool)
- Navigation: `Account? Account`

> For leaderboard scoring we use:
> - `DemoAlignedByUserId` as the **owner** of the demo points
> - `Status` and `DoneAt` / `CompletedAt` to filter completed demos in a date range
> - `Account.AccountSize` (via `AccountId`) to determine demo size


### 3.2 New Migration Requirement (Spec placeholder)

The original high-level spec mentions adding an `AccountSize`-like column if missing. In the current codebase, `Account` already has an `AccountSizeId` and navigation property, and there is an `AccountSize` entity.

- **Assumption:** The existing `AccountSize`/`AccountSizeId` infrastructure satisfies the need for size-based scoring.
- **Therefore:** No new migration is required for size in this codebase.

If future environments lack account size information, a migration such as the following would be added (for reference only):

```csharp
migrationBuilder.AddColumn<string>(
    name: "AccountSize",
    table: "Accounts",
    type: "text",
    nullable: true
);
```


## 4. Time Period Logic

The leaderboard supports these **periods**:

- `weekly`
- `monthly`
- `quarterly`

### 4.1 Date Range Definitions

For a given **reference date** (typically `DateTime.UtcNow`):

- **Weekly**
  - Start: Monday of the current week (00:00:00, inclusive)
  - End: Sunday of the current week (23:59:59.999, inclusive)
  - Example label: `Week of Dec 8 – Dec 14, 2025`

- **Monthly**
  - Start: 1st day of the current month (00:00:00)
  - End: last day of the current month (23:59:59.999)
  - Example label: `December 1 – December 31, 2025`

- **Quarterly**
  - Q1: Jan 1 – Mar 31
  - Q2: Apr 1 – Jun 30
  - Q3: Jul 1 – Sep 30
  - Q4: Oct 1 – Dec 31
  - Example label: `Q4 2025 (Oct 1 – Dec 31, 2025)`

Backend computes `startDate` and `endDate` in **UTC** and returns them in the response as ISO-8601 (`YYYY-MM-DD`).


## 5. Backend API Specification

### 5.1 Endpoint

**Route:**
- `GET /leaderboard?period=weekly|monthly|quarterly`

**Auth:**
- Requires authenticated user (Admin or Basic) via existing auth middleware.

**Query Parameters:**

| Name   | Type   | Required | Allowed Values                | Description                      |
|--------|--------|----------|------------------------------|----------------------------------|
| period | string | yes      | `weekly`, `monthly`, `quarterly` | Time bucket for leaderboard data |

If `period` is missing or invalid, API returns `400 Bad Request` with a clear error message.


### 5.2 Processing Steps (High-Level Flow)

1. **Authorize & Parse period**
   - Validate authenticated user.
   - Parse `period` into an enum/known value.
   - Compute `startDate` and `endDate` (inclusive range) using the rules in section 4.

2. **Fetch active users**
   - Query: `SELECT * FROM Users WHERE IsActive = true` (and not deleted, if such a flag exists).
   - Build an in-memory dictionary by `UserId` with `FullName`, `Role`, etc.

3. **Fetch accounts created in range**
   - Filter by both date range and non-deleted state:
     - `CreatedAt BETWEEN startDate AND endDate`
     - `IsDeleted = false`
   - Group by `CreatedByUserId`.
   - For each user, compute:
     - `accountsCreated = COUNT(*)`

4. **Fetch completed demos in range**
   - Filter by:
     - `Status = DemoStatus.Completed`
     - `DoneAt BETWEEN startDate AND endDate`
     - `IsDeleted = false`
   - Join with `Accounts` on `Demo.AccountId = Account.Id` (left join to be defensive).
   - Determine **Account Size** for each demo:
     - If `Account` exists and `Account.AccountSize` (or AccountSize name) is present → use that.
     - If account or size is missing / null → treat as **Small**.
   - Attribute demo to the **scheduling user**:
     - Use `DemoAlignedByUserId` as the **owner** of demo points.
   - For each `(UserId, Size)` combination, compute counts:
     - `smallDemos` – size Small or missing
     - `mediumDemos` – size Medium
     - `enterpriseDemos` – size Enterprise

5. **Scoring Engine**

For each user:

- Inputs:
  - `accountsCreated` (int)
  - `smallDemos` (int)
  - `mediumDemos` (int)
  - `enterpriseDemos` (int)

- Constants (also returned in API response):
  - `accountCreated = 2`
  - `demoSmall    = 2`
  - `demoMedium   = 3`
  - `demoEnterprise = 5`

- Formula:

```text
TotalPoints =
  accountsCreated * 2
  + smallDemos * 2
  + mediumDemos * 3
  + enterpriseDemos * 5
```

- **Note on missing AccountId / AccountSize:**
  - If a demo cannot be linked to an account or has a null size, it is scored as **Small** (2 points) per product decision.

6. **Filtering users**

- Exclude **inactive** users (`IsActive = false`).
- Exclude users with **0 total points**:
  - `TotalPoints == 0` → do not include them in `users` array.

7. **Sorting rules**

Sort descending by:

1. `TotalPoints` (higher first)
2. If tie: higher **total demo count** (`small + medium + enterprise`)
3. If still tie: alphabetical by **user full name** (A–Z)


### 5.3 API Response

**Shape:**

```jsonc
{
  "period": "weekly",              // "weekly" | "monthly" | "quarterly"
  "startDate": "2025-12-08",      // ISO date (UTC-based)
  "endDate": "2025-12-14",        // ISO date (UTC-based)
  "users": [
    {
      "userId": "guid",
      "name": "Jarman Sidhu",
      "accountsCreated": 19,
      "demos": {
        "small": 3,
        "medium": 2,
        "enterprise": 1
      },
      "points": 38
    }
  ],
  "scoring": {
    "accountCreated": 2,
    "demoSmall": 2,
    "demoMedium": 3,
    "demoEnterprise": 5
  }
}
```

- The `users` array is already **sorted** according to the rules above.
- If no users have points in the period, `users` is an **empty array**.

**Error Responses:**

- `400 Bad Request` – invalid or missing `period` query param.
- `401 Unauthorized` – user not authenticated.


## 6. Frontend Specification

### 6.1 Route & Access

- New page under protected app: `/leaderboard`
- Accessible to both Admin and Basic users from the sidebar navigation ("Leaderboard").

### 6.2 UI Components

1. **Header**
   - Title: `Leaderboard`
   - Subtitle: `Track top performers across different time periods`

2. **Period Tabs**
   - Tab buttons: `Weekly`, `Monthly`, `Quarterly`
   - Clicking a tab:
     - Updates local state (`period`)
     - Triggers fetch to `/leaderboard?period=<value>`
     - Shows a skeleton loader while waiting

3. **Date Range Header**
   - Displays a human-readable label derived from API `startDate` / `endDate` and `period`, e.g.:
     - `Week of Dec 8 – Dec 14, 2025`
     - `December 1 – December 31, 2025`
     - `Q4 2025 (Oct 1 – Dec 31, 2025)`

4. **Leaderboard List**

For each user item:

- **Rank number** (1, 2, 3, ...)
- **Icon / badge for top 3**:
  - #1 → 🥇 or themed gold icon
  - #2 → 🥈 or silver icon
  - #3 → 🥉 or bronze icon
- **User name** (full name)
- **Activity stats**:
  - `Accounts: <accountsCreated>`
  - `Demos: <small + medium + enterprise>`
  - (Optional: show breakdown such as `Demos: 3 / 2 / 1` for small/medium/enterprise)
- **Points** on the right:
  - Large number (e.g. `38`)
  - Label: `Points`

List behavior:
- Scrollable if long
- Only shows users provided by API (no 0-point users)

5. **Scoring System Box (Bottom)**

Static informational panel showing the current scoring rules, e.g.:

- `New Account Created: 2 points`
- `Demo Completed (Small): 2 points`
- `Demo Completed (Medium): 3 points`
- `Demo Completed (Enterprise): 5 points`
- Note: `Only users with at least 1 account created or 1 demo completed are shown.`


### 6.3 Frontend Logic

- Component state includes:
  - `period` (`"weekly" | "monthly" | "quarterly"`)
  - `loading` (boolean)
  - `error` (string | null)
  - `data` (API response or null)

- On initial load:
  - Default `period = "weekly"`
  - Fetch `/leaderboard?period=weekly`

- On tab change:
  - Update `period`
  - Trigger a new fetch
  - Show skeleton / loading indicators

- Error handling:
  - Show an error message if API call fails
  - Allow retry by re-clicking tab or via a retry button (optional)


## 7. Testing Requirements

### 7.1 Backend Tests

- **Date range generation**
  - Weekly: ensure Monday–Sunday range is computed correctly for various dates.
  - Monthly: ensure 1st–last day logic works across different month lengths and leap years.
  - Quarterly: ensure each date maps to the correct Q1–Q4 with correct boundaries.

- **Account scoring**
  - Given specific numbers of accounts per user in range, verify `accountsCreated * 2` is correct.

- **Demo scoring per account size**
  - Verify demos against Small, Medium, Enterprise accounts get 2 / 3 / 5 points.
  - Verify demos with missing account or size are treated as Small (2 points).

- **Sorting order**
  - Higher total points first.
  - Ties resolved by higher total demo count.
  - Remaining ties resolved alphabetically by name.

- **Excluding inactive users**
  - Users with `IsActive = false` never appear in the output, even if they have data.

- **Excluding 0-point users**
  - Users with `TotalPoints = 0` are not present in the `users` array.

### 7.2 Frontend Tests (Conceptual)

- Tab switching triggers correct API calls:
  - Weekly → `/leaderboard?period=weekly`
  - Monthly → `/leaderboard?period=monthly`
  - Quarterly → `/leaderboard?period=quarterly`

- Proper rendering order:
  - Items appear in the same order as returned by API.

- Top 3 decoration:
  - First three users show special ranking icons/badges.

- Scoring system box:
  - Displays the correct scoring rules and explanatory notes.


## 8. Edge Cases & Rules

| Case                                | Expected Behavior                                                             |
|-------------------------------------|-------------------------------------------------------------------------------|
| Demo has missing Account or size    | Treat as **Small** demo (2 points)                                           |
| Demo outside date range             | Exclude from counts and points                                               |
| User is inactive (`IsActive=false`) | Exclude from leaderboard entirely                                            |
| User has 0 accounts and 0 demos     | Exclude from leaderboard (not shown)                                         |
| No users with points in period      | Return empty `users` array, still include `period`, `startDate`, `endDate`   |
| Invalid `period` query              | Return `400 Bad Request` with clear error                                    |


## 9. Assumptions

- Only **one timezone** is used for reporting: all date calculations are based on UTC, and labels are formatted for display only.
- `DemoAlignedByUserId` is the correct user to attribute demo points to (scheduling/aligning user).
- `IsDeleted` flags on Accounts and Demos indicate records that should not count towards scoring.
- Existing auth & role system (Admin vs Basic) remains unchanged; leaderboard is read-only for all roles.


## 10. Success Criteria

- Users can open `/leaderboard` and see a ranked list of active team members for
  weekly, monthly, and quarterly periods.
- The scores on the UI match the formula described in this spec for a known test dataset.
- Inactive users and users with 0 points do not appear in the leaderboard.
- The API responds within acceptable performance thresholds for the expected data volume (e.g. under 1s for typical queries).
- The feature can be explained to a sales manager using only terms from this spec (no implementation details needed).

## 11. Functional Requirements

- **FR1 – Period selection**  
  The system shall allow a user to select one of three periods: `weekly`, `monthly`, or `quarterly`, and shall recompute the leaderboard for the selected period.

- **FR2 – Date range computation**  
  The backend shall compute `startDate` and `endDate` for the selected period using the rules in this spec and return them in the API response.

- **FR3 – Active users only**  
  The backend shall only consider users where `IsActive = true` when computing and returning leaderboard data.

- **FR4 – Account aggregation**  
  The backend shall count all non-deleted accounts created within the date range and group them by `CreatedByUserId` to produce `accountsCreated` per user.

- **FR5 – Demo aggregation and size resolution**  
  The backend shall count all non-deleted demos with `Status = Completed` and `DoneAt` within the date range, group them by `DemoAlignedByUserId`, and classify each demo as Small, Medium, or Enterprise based on the linked account’s size; if account or size is missing, the demo shall be treated as Small.

- **FR6 – Points calculation**  
  For each user, the backend shall compute `points` using the scoring formula defined in this spec and include the per-size demo counts and total points in the API response.

- **FR7 – User filtering**  
  The backend shall exclude from the response any user whose computed `points` equals zero.

- **FR8 – Sorting**  
  The backend shall sort users by: (1) `points` descending, (2) total demo count descending, and (3) user name ascending, and return them in this order.

- **FR9 – API contract**  
  The backend shall expose `GET /leaderboard?period=weekly|monthly|quarterly` and return data matching the JSON structure defined in this spec, or an appropriate error for invalid/missing `period` or unauthenticated access.

- **FR10 – Frontend route and access**  
  The frontend shall provide a protected route `/leaderboard` accessible to both Admin and Basic users via the sidebar navigation.

- **FR11 – Tabs and data fetching**  
  The frontend shall render three tabs (Weekly, Monthly, Quarterly) and, when a tab is selected, shall call `/leaderboard?period=<value>`, show a loading state, and then render the returned data.

- **FR12 – Leaderboard rendering**  
  The frontend shall render a ranked list of users using the order provided by the API, displaying for each user: rank, name, accounts created, total demos (and optionally breakdown), and points.

- **FR13 – Top 3 highlighting**  
  The frontend shall visually highlight the top three ranked users (e.g., with special icons or styling) based on their position in the sorted list.

- **FR14 – Scoring system display**  
  The frontend shall display a static scoring system box explaining how points are awarded for accounts and demos of each size.

- **FR15 – Error and empty states**  
  The frontend shall display a user-friendly message if the leaderboard API call fails and shall handle the case where the `users` array is empty by showing an appropriate "no data" state.

