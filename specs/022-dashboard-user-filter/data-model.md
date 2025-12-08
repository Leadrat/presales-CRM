# Dashboard User Filter - Data Model

## Overview

The Dashboard User Filter feature does not require any database schema changes. It leverages existing data models and adds filtering capabilities to the API endpoints.

## Relevant Existing Entities

### User

```
User {
  Id: UUID (PK)
  Email: string
  PasswordHash: string
  FirstName: string
  LastName: string
  IsActive: boolean
  CreatedAt: datetime
  UpdatedAt: datetime
  IsDeleted: boolean
  DeletedAt: datetime?
}
```

### UserRole

```
UserRole {
  Id: UUID (PK)
  UserId: UUID (FK -> User.Id)
  RoleId: UUID (FK -> Role.Id)
  CreatedAt: datetime
  UpdatedAt: datetime
}
```

### Role

```
Role {
  Id: UUID (PK)
  Name: string
  Description: string?
  CreatedAt: datetime
  UpdatedAt: datetime
}
```

### Account

```
Account {
  Id: UUID (PK)
  Name: string
  OwnerUserId: UUID? (FK -> User.Id)
  Website: string?
  Industry: string?
  CreatedAt: datetime
  UpdatedAt: datetime
  IsDeleted: boolean
  DeletedAt: datetime?
}
```

### Demo

```
Demo {
  Id: UUID (PK)
  AccountId: UUID (FK -> Account.Id)
  ScheduledAt: datetime
  StatusId: UUID (FK -> DemoStatus.Id)
  Title: string
  Notes: string?
  CreatedAt: datetime
  UpdatedAt: datetime
  IsDeleted: boolean
  DeletedAt: datetime?
}
```

## Data Flow

### API Request/Response

#### GET /api/Accounts/dashboard-summary

**Request Parameters:**
- `userId` (optional): Single user ID to filter by (for backward compatibility)
- `userIds` (optional): Comma-separated list of user IDs to filter by

**Response:**
```json
{
  "totalAccountsCreated": 123,
  "demosScheduled": 45,
  "demosCompleted": 32,
  "revisitDemos": 13,
  "conversionRate": 71.11
}
```

#### GET /api/analytics/accounts

**Request Parameters:**
- `startDate` (optional): Start date for date range filter
- `endDate` (optional): End date for date range filter
- `userId` (optional): Single user ID to filter by (for backward compatibility)
- `userIds` (optional): Comma-separated list of user IDs to filter by

**Response:**
```json
{
  "data": [
    {
      "date": "2025-01-01",
      "count": 5
    },
    // ...more data points
  ]
}
```

#### GET /api/analytics/demos-by-size

**Request Parameters:**
- `userId` (optional): Single user ID to filter by (for backward compatibility)
- `userIds` (optional): Comma-separated list of user IDs to filter by

**Response:**
```json
{
  "small": 10,
  "medium": 15,
  "large": 7,
  "enterprise": 3
}
```

### Frontend State

#### Filter State (sessionStorage)

The filter selection is stored in sessionStorage under the key `dashboard_user_filter`:

- `"ALL"` string for all team members selected or no selection
- JSON array of user IDs for specific selections, e.g., `["user1", "user2"]`

#### Component State

```typescript
interface FilterState {
  teamUsers: UserSummary[];
  selectedUserIds: string[] | null;
  isLoading: boolean;
  error: string | null;
}

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}
```

## Query Logic

### Role-Based Filtering

1. **Admin Users**:
   - If `userIds` is provided: Filter by the specified user IDs
   - If `userId` is provided (backward compatibility): Filter by the single user ID
   - If neither is provided: Show global data (all users)

2. **Basic Users**:
   - Always filter by the current user's ID, regardless of provided parameters

### Filter Application

For each endpoint, the filter is applied to the relevant queries:

1. **Dashboard Summary**:
   - Filter accounts by creator user ID
   - Filter demos by associated user ID

2. **Analytics Accounts**:
   - Filter accounts by creator user ID

3. **Demos By Size**:
   - Filter demos by associated user ID

## Performance Considerations

1. **Query Optimization**:
   - Use appropriate indexes on user ID columns
   - Consider caching frequently accessed data

2. **Frontend Performance**:
   - Debounce filter changes if needed
   - Show loading indicators during data fetching
