# Contract Snapshot – Accounts Listing (Spec 17)

## Endpoint

- **GET** `/api/Accounts`

## Response (per account item – conceptual)

```jsonc
{
  "id": "guid",
  "companyName": "string",
  "accountTypeId": "guid",
  "accountTypeName": "string",
  "accountSizeId": "guid",
  "accountSizeName": "string",
  "currentCrmId": "guid",
  "crmProviderName": "string",
  "leadSource": "string | null",
  "dealStage": "string | null",
  "createdByUserId": "guid",
  "createdByUserDisplayName": "string | null", // NEW – used by Created By column
  "createdAt": "ISO-8601 timestamp",
  "isDeleted": false
}
```

- The new field `createdByUserDisplayName` is **additive** and nullable.  
- Semantics: display name / username resolved from the current `Users` record for `createdByUserId`.  
- Clients render `"Unknown"` when this field is null/empty.
