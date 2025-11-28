# Research – Spec 17: Universal Account Visibility & Created-By Attribution

## Decisions

- **D1 – Visibility model**  
  - **Decision**: Both Basic and Admin roles see the full set of Accounts in the main Accounts list; no filtering by creator/owner on the list endpoint.  
  - **Rationale**: Aligns with collaboration needs; avoids duplicating lists ("My Accounts" vs "All Accounts"). RBAC for edit/delete remains at the detail/API level.

- **D2 – Created By projection**  
  - **Decision**: Created By column shows the creator's **current display name / username**, resolved from the User record via `createdByUserId`.  
  - **Rationale**: Matches how the user is identified elsewhere in the app; avoids storing redundant name snapshots. Spec keeps `Unknown` fallback when the user cannot be resolved.

- **D3 – API contract extension**  
  - **Decision**: Extend the `/api/Accounts` list response with a **non-breaking field** `createdByUserDisplayName` (nullable string).  
  - **Rationale**: Simple additive change; avoids nested objects for this spec; aligns with existing flattened projection style (e.g., `AccountTypeName`, `AccountSizeName`).

- **D4 – Backend implementation pattern**  
  - **Decision**: Populate `createdByUserDisplayName` in the Accounts list query via a join from `Accounts.CreatedByUserId` to `Users` (or equivalent) and selecting the display name/username field used at signup.  
  - **Rationale**: Uses existing schema and joins; no new tables. Keeps attribution logic server-side and testable.

- **D5 – Frontend behavior**  
  - **Decision**: Admin and Basic Accounts list pages consume the same projection type (shared `AccountDto`) and render the Created By column from `createdByUserDisplayName` or `"Unknown"` if null/empty.  
  - **Rationale**: Keeps UI in sync between roles; uses a single DTO to avoid branching logic.

## Alternatives Considered

- **A1 – Keep creator email instead of display name**  
  - Rejected because UX wants human-friendly names; email remains available elsewhere for contact but is not the primary label in the list.

- **A2 – Nested `creator` object**  
  - Rejected for now to minimize contract churn. A flat `createdByUserDisplayName` field is sufficient for list rendering; a nested object can be added in a future spec if richer creator metadata is needed.

- **A3 – Per-request user lookup from frontend**  
  - Rejected due to performance and complexity (N+1 calls). Attribution is better handled on the backend inside `/api/Accounts`.
