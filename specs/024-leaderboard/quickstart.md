# Leaderboard Feature Quickstart

This document provides instructions on how to run and test the Leaderboard feature.

## Running the Backend

1. Open a terminal and navigate to the backend directory:

```powershell
cd "d:\Pre- Sales\backend"
```

2. Build the backend:

```powershell
dotnet build
```

3. Run the backend API:

```powershell
dotnet run --urls=http://localhost:5034
```

The API will be available at `http://localhost:5034`.

## Running the Frontend

1. Open a new terminal and navigate to the frontend directory:

```powershell
cd "d:\Pre- Sales\frontend"
```

2. Make sure the API URL is correctly set in `src/lib/api.ts`:

```typescript
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5034";
```

3. Start the Next.js development server:

```powershell
npm run dev
```

The frontend will be available at `http://localhost:3000` (or another port if 3000 is already in use).

## Testing the Leaderboard Feature

1. Open your browser and navigate to `http://localhost:3000/login`
2. Log in with valid credentials
3. Click on the "Leaderboard" item in the sidebar navigation
4. The leaderboard page will load with the weekly view by default
5. Test the following functionality:
   - Switch between Weekly, Monthly, and Quarterly tabs
   - Verify the date range updates correctly
   - Check that users are ranked by points (highest first)
   - Verify that the top 3 users have special badge styling
   - Confirm that account and demo counts are displayed correctly

## Running Tests

### Backend Tests

```powershell
cd "d:\Pre- Sales\backend"
dotnet test
```

### Frontend Tests

```powershell
cd "d:\Pre- Sales\frontend"
npm test
```

## API Endpoint

The leaderboard data is available at:

```
GET /api/leaderboard?period={weekly|monthly|quarterly}
```

Example response:

```json
{
  "data": {
    "period": "weekly",
    "startDate": "2025-12-08",
    "endDate": "2025-12-14",
    "users": [
      {
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "John Doe",
        "accountsCreated": 2,
        "demos": {
          "small": 1,
          "medium": 2,
          "enterprise": 1
        },
        "points": 15
      }
    ],
    "scoring": {
      "accountCreated": 2,
      "demoSmall": 2,
      "demoMedium": 3,
      "demoEnterprise": 5
    }
  }
}
```
