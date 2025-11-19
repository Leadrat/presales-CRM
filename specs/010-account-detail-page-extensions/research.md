# Research — Spec 10: Account Detail Page Extensions

This document captures background research and design decisions used to implement Spec 10.

## Decisions

- **Demos source**
  - Decision: Use a dedicated `Demos` entity/table linked to `Account` as the canonical source.
  - Rationale: Keeps demo data modelled explicitly, allows richer fields and lifecycle, and simplifies querying per account.
  - Alternatives:
    - Reuse generic Activities as demos.
    - Derive demos from external systems.

- **Activity Log source**
  - Decision: Use the existing global activity log/audit mechanism filtered by account, surfacing only relevant event types.
  - Rationale: Reuses existing logging, avoids duplicating event streams, and keeps the tab focused.
  - Alternatives:
    - New `AccountActivity` table.
    - Derived/log-less view from other entities only.

## Open Research Items

- Confirm presence (or absence) of any existing `Demos` entity/table in the current codebase.
- Confirm existing activity log schema and how to filter by account.
