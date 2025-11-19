# Table Catalog — Pre-Sales CRM

This document tracks the core PostgreSQL tables used by the Pre-Sales CRM backend and their relationships.

## Users & Auth

- **Users** (`Users`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Email` (unique among non-deleted users, case-insensitive)
    - `PasswordHash`, `FullName`, `Phone`
    - `RoleId` → `Roles.Id`
    - `IsActive`, `IsDeleted`, `CreatedAt`, `UpdatedAt`, `DeletedAt`
  - **Indexes**:
    - Unique partial index on `lower(Email)` where `IsDeleted = false`
    - Index on `RoleId`

- **Roles** (`Roles`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (unique)
    - `Description`, `CreatedAt`, `UpdatedAt`

- **RefreshTokens** (`RefreshTokens`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `UserId` → `Users.Id`
    - `TokenHash`, `ExpiresAt`, `RevokedAt`, `CreatedAt`
  - **Indexes**:
    - `UserId`
    - `ExpiresAt`

- **ActivityLogs** (`ActivityLogs`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `ActivityTypeId` → `ActivityTypes.Id`
    - `ActorUserId` (nullable) → `Users.Id`
    - `EntityType`, `EntityId`, `Message`, `CorrelationId`, `CreatedAt`
  - **Indexes**:
    - `ActivityTypeId`
    - `CreatedAt`

- **ActivityTypes** (`ActivityTypes`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (unique)
    - `CreatedAt`, `UpdatedAt`
  - **Seed Data** (deterministic GUIDs):
    - Call / Email / Meeting / Demo (used for Activities and ActivityLogs)

## Notes

- **Notes** (`Notes`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Title` (required)
    - `CreatedBy` → `Users.Id`
  - **Indexes**:
    - `CreatedBy`

## Accounts & Lookups (Spec 8)

- **Accounts** (`Accounts`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `CompanyName` (required)
    - `AccountTypeId` → `AccountTypes.Id`
    - `AccountSizeId` → `AccountSizes.Id`
    - `CurrentCrmId` → `CrmProviders.Id`
    - `CrmExpiry` (timestamp with time zone)
    - `CreatedByUserId` → `Users.Id`
    - `CreatedAt`, `UpdatedAt`, `IsDeleted`
  - **Indexes**:
    - `CreatedByUserId`
    - `AccountTypeId`
    - `AccountSizeId`
    - `CurrentCrmId`

- **AccountTypes** (`AccountTypes`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (required)
    - `DisplayOrder` (required)

- **AccountSizes** (`AccountSizes`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (required)
    - `DisplayOrder` (required)

- **CrmProviders** (`CrmProviders`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (required)
    - `DisplayOrder` (required)

## Account Detail Children & Lookups (Spec 9)

- **Contacts** (`Contacts`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `AccountId` → `Accounts.Id`
    - `CreatedByUserId` → `Users.Id`
    - `Name` (required)
    - `Email`, `Phone`, `Position`
    - `CreatedAt`, `UpdatedAt`, `IsDeleted`
  - **Indexes**:
    - `AccountId`
    - `CreatedByUserId`

- **Opportunities** (`Opportunities`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `AccountId` → `Accounts.Id`
    - `CreatedByUserId` → `Users.Id`
    - `Title` (required)
    - `Amount` (required)
    - `StageId` → `OpportunityStages.Id`
    - `CloseDate`
    - `CreatedAt`, `UpdatedAt`, `IsDeleted`
  - **Indexes**:
    - `AccountId`
    - `CreatedByUserId`
    - `StageId`

- **Activities** (`Activities`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `AccountId` → `Accounts.Id`
    - `CreatedByUserId` → `Users.Id`
    - `Description` (required)
    - `ActivityTypeId` → `ActivityTypes.Id`
    - `StatusId` → `ActivityStatuses.Id`
    - `DueDate`
    - `CreatedAt`, `UpdatedAt`, `IsDeleted`
  - **Indexes**:
    - `AccountId`
    - `CreatedByUserId`
    - `ActivityTypeId`
    - `StatusId`

- **ActivityStatuses** (`ActivityStatuses`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (required, unique)
    - `DisplayOrder` (required)
  - **Seed Data**:
    - Planned / In Progress / Completed / Cancelled

- **OpportunityStages** (`OpportunityStages`)
  - **PK**: `Id` (uuid)
  - **Key Columns**:
    - `Name` (required, unique)
    - `DisplayOrder` (required)
  - **Seed Data**:
    - Prospecting / Qualification / Proposal / Negotiation / Won

## High-Level Relationships

- `Users` own `Accounts` (via `Accounts.CreatedByUserId`).
- `Accounts` are parents for `Contacts`, `Opportunities`, and `Activities`.
- `Opportunities` reference `OpportunityStages` for pipeline status.
- `Activities` reference `ActivityTypes` and `ActivityStatuses` for classification and lifecycle.
- All child counts on the Account Detail page must **exclude** rows where `IsDeleted = true`.
