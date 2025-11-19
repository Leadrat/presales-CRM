# Implementation Notes — Spec 8: Accounts Table

## Overview
This document records implementation details, decisions, and any deviations for Spec 8.

## Decisions
- Accounts and lookup tables follow Spec 000: GUID PKs, lookup tables instead of enums/JSONB, TitleCase columns, `CreatedByUserId` ownership, `IsDeleted` for soft delete.
- Sample lookup values seeded via EF Core migrations.

## Deviations from Spec (if any)
- [ ] None so far.

## Follow-ups
- [ ] Add additional indexes if performance profiling indicates the need.
- [ ] Extend table catalog entries if new columns are added in future specs.
