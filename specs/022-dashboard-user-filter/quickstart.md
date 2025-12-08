# Dashboard User Filter - Implementation Quickstart

This guide provides step-by-step instructions for implementing the Dashboard User Filter feature.

## Prerequisites

1. Ensure you have the latest code from the main branch
2. Verify that the following components are working:
   - Dashboard page with metrics
   - Analytics endpoints
   - User authentication and role-based access control

## Backend Implementation

### 1. Update AccountsController.cs

Add support for multi-user filtering to the `GetDashboardSummary` endpoint:

```csharp
[HttpGet("dashboard-summary")]
public async Task<ActionResult<DashboardSummaryResponse>> GetDashboardSummary(
    [FromQuery] string? userId = null,
    [FromQuery] string? userIds = null)
{
    var currentUser = await _userManager.GetUserAsync(User);
    if (currentUser == null)
    {
        return Unauthorized();
    }

    var isAdmin = User.IsInRole("Admin");
    var userIdList = new List<Guid>();

    // Parse userIds if provided (comma-separated GUIDs)
    if (!string.IsNullOrEmpty(userIds))
    {
        try
        {
            userIdList = userIds.Split(',')
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => Guid.Parse(id.Trim()))
                .ToList();
        }
        catch (FormatException)
        {
            return BadRequest("Invalid userIds format. Expected comma-separated GUIDs.");
        }
    }

    // For non-admin users, always filter to their own ID
    if (!isAdmin)
    {
        userIdList = new List<Guid> { currentUser.Id };
    }
    // If admin provided a single userId (for backward compatibility)
    else if (!string.IsNullOrEmpty(userId))
    {
        try
        {
            userIdList = new List<Guid> { Guid.Parse(userId) };
        }
        catch (FormatException)
        {
            return BadRequest("Invalid userId format. Expected GUID.");
        }
    }

    // Apply filtering to queries based on userIdList
    // If userIdList is empty and user is admin, show global data
    // Otherwise filter by the IDs in userIdList

    // Rest of the implementation...
}
```

### 2. Update AnalyticsController.cs

Apply similar changes to the `GetAccountAnalytics` and `GetDemosBySize` endpoints.

## Frontend Implementation

### 1. Update API Helpers (api.ts)

Enhance API helpers to support multi-user filtering:

```typescript
export const getDashboardSummary = async (
  userId?: string,
  userIds?: string[]
): Promise<DashboardSummaryResponse> => {
  const params = new URLSearchParams();
  if (userId) {
    params.append('userId', userId);
  }
  if (userIds && userIds.length > 0) {
    params.append('userIds', userIds.join(','));
  }

  const response = await fetch(`/api/Accounts/dashboard-summary?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }

  return response.json();
};

// Apply similar changes to getAnalyticsAccounts and getDemosBySize
```

### 2. Update Authentication Service (tokenService.ts)

Update the logout function to clear the filter from sessionStorage:

```typescript
export const logout = async (): Promise<void> => {
  try {
    // Clear dashboard filter from sessionStorage
    sessionStorage.removeItem('dashboard_user_filter');
    
    // Existing logout code...
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Update broadcast channel handler
broadcastChannel.onmessage = (event) => {
  if (event.data.type === 'LOGOUT') {
    // Clear dashboard filter from sessionStorage
    try {
      sessionStorage.removeItem('dashboard_user_filter');
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
    
    // Existing handler code...
  }
};
```

### 3. Update Dashboard Page (dashboard/page.tsx)

Add the user filter UI and logic:

```tsx
// Import necessary components and hooks
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUsers, getDashboardSummary, getAnalyticsAccounts, getDemosBySize } from '@/lib/api';
import { UserSummary } from '@/types';

// Add state for team users and filter
const [teamUsers, setTeamUsers] = useState<UserSummary[]>([]);
const [selectedUserIds, setSelectedUserIds] = useState<string[] | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const { user, isAdmin } = useAuth();

// Load team users and restore filter selection
useEffect(() => {
  const loadTeamUsers = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const users = await getUsers();
      setTeamUsers(users.filter(u => u.isActive));
      
      // Restore filter selection from sessionStorage
      try {
        const storedFilter = sessionStorage.getItem('dashboard_user_filter');
        if (storedFilter) {
          if (storedFilter === 'ALL') {
            setSelectedUserIds(null);
          } else {
            const parsedIds = JSON.parse(storedFilter);
            // Filter out any IDs that don't match active users
            const validIds = parsedIds.filter(id => 
              users.some(u => u.id === id && u.isActive)
            );
            
            if (validIds.length > 0) {
              setSelectedUserIds(validIds);
            } else {
              // If no valid IDs remain, reset to "ALL"
              setSelectedUserIds(null);
              sessionStorage.setItem('dashboard_user_filter', 'ALL');
            }
          }
        } else {
          // Default to "ALL" if no stored filter
          setSelectedUserIds(null);
          sessionStorage.setItem('dashboard_user_filter', 'ALL');
        }
      } catch (error) {
        console.error('Error accessing sessionStorage:', error);
        setSelectedUserIds(null);
      }
    } catch (error) {
      console.error('Error loading team users:', error);
      setError('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };
  
  loadTeamUsers();
}, [isAdmin]);

// Update dashboard metrics based on filter selection
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard summary with selected user IDs
      const summary = await getDashboardSummary(
        undefined, // No single userId
        selectedUserIds || undefined // Pass selected IDs or undefined for "ALL"
      );
      
      // Update dashboard state with summary data
      
      // Fetch analytics data with selected user IDs
      const accountsData = await getAnalyticsAccounts(
        undefined, // date range params
        undefined, // No single userId
        selectedUserIds || undefined // Pass selected IDs or undefined for "ALL"
      );
      
      // Update accounts chart with data
      
      const demosData = await getDemosBySize(
        undefined, // No single userId
        selectedUserIds || undefined // Pass selected IDs or undefined for "ALL"
      );
      
      // Update demos chart with data
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };
  
  fetchDashboardData();
}, [selectedUserIds]);

// Handle user selection
const handleUserSelectionChange = useCallback((selectedIds: string[]) => {
  try {
    if (selectedIds.length === 0 || selectedIds.length === teamUsers.length) {
      // "All team members" selected
      setSelectedUserIds(null);
      sessionStorage.setItem('dashboard_user_filter', 'ALL');
    } else {
      // Specific users selected
      setSelectedUserIds(selectedIds);
      sessionStorage.setItem('dashboard_user_filter', JSON.stringify(selectedIds));
    }
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
}, [teamUsers.length]);

// Render the filter UI (only for admin users)
{isAdmin && (
  <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
    <h2 className="text-lg font-semibold mb-2">View Dashboard For</h2>
    <p className="text-sm text-gray-500 mb-3">Filter dashboard metrics by team member</p>
    
    {isLoading ? (
      <div className="flex items-center text-sm text-gray-500">
        <span className="mr-2">Loading team members...</span>
        {/* Add loading spinner */}
      </div>
    ) : error ? (
      <div className="text-sm text-red-500">{error}</div>
    ) : (
      <MultiSelect
        options={teamUsers.map(user => ({
          value: user.id,
          label: user.fullName
        }))}
        selectedValues={selectedUserIds || teamUsers.map(user => user.id)}
        onChange={handleUserSelectionChange}
        placeholder="All team members"
        disabled={isLoading}
      />
    )}
  </div>
)}
```

## Testing

### Backend Tests

Test the role-based filtering logic in the controllers:

```csharp
[Fact]
public async Task GetDashboardSummary_AdminUser_WithUserIds_FiltersByUserIds()
{
    // Arrange
    // Set up admin user and test data
    
    // Act
    var result = await controller.GetDashboardSummary(null, "user1,user2");
    
    // Assert
    // Verify that data is filtered by the specified user IDs
}

[Fact]
public async Task GetDashboardSummary_BasicUser_AlwaysFiltersByOwnId()
{
    // Arrange
    // Set up basic user and test data
    
    // Act
    var result = await controller.GetDashboardSummary(null, "user1,user2");
    
    // Assert
    // Verify that data is filtered by the user's own ID regardless of provided userIds
}
```

### Frontend Tests

Test the filter UI and sessionStorage persistence:

```typescript
test('restores filter selection from sessionStorage', () => {
  // Arrange
  sessionStorage.setItem('dashboard_user_filter', JSON.stringify(['user1', 'user2']));
  
  // Act
  render(<DashboardPage />);
  
  // Assert
  // Verify that the filter is initialized with the stored user IDs
});

test('updates sessionStorage when filter selection changes', () => {
  // Arrange
  render(<DashboardPage />);
  
  // Act
  // Simulate user selection in the filter
  
  // Assert
  // Verify that sessionStorage is updated with the new selection
});
```

## Deployment

1. Deploy backend changes first
2. Verify API endpoints with Postman
3. Deploy frontend changes
4. Test the complete feature in the browser

## Troubleshooting

- If filter selection is not persisting, check browser console for sessionStorage errors
- If metrics are not updating, verify that API calls include the correct userIds parameter
- If Basic users see the filter, check that isAdmin is correctly determined
- If filter is not clearing on logout, verify that both logout function and broadcast handler are updated
