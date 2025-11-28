# API Contracts Checklist: Spec 015 – Demo Entity & Demo Activity History

## Requirement Completeness

- [x] CHK001 Are all Demo-related endpoints (`POST/GET/PUT/DELETE /api/Accounts/{accountId}/demos`) explicitly listed in the spec or contracts? [Completeness]
- [x] CHK002 Does the spec/contracts describe required and optional fields for all Demo request DTOs (create/update) including types and nullability? [Completeness]
- [x] CHK003 Are all Demo response fields (DemoDto) documented, including any derived fields like aligned/done user display names? [Completeness]
- [x] CHK004 Is RBAC behavior for each Demo endpoint (who can create, list, update, delete) fully specified and consistent with Accounts/Contacts rules? [Completeness]
- [x] CHK005 Are soft-delete semantics for demos (IsDeleted handling) clearly defined for all relevant endpoints? [Completeness]

## Requirement Clarity

- [x] CHK006 Are request/response timestamp fields (ScheduledAt, DoneAt, CreatedAt, UpdatedAt) clearly defined as UTC with expected format (e.g., ISO 8601)? [Clarity]
- [x] CHK007 Are validation rules for required fields (e.g., ScheduledAt, DemoAlignedByUserId, AccountId) explicitly stated, including what constitutes an invalid value? [Clarity]
- [x] CHK008 Is the behavior when optional fields are omitted or empty (attendees, notes, DemoDoneByUserId, DoneAt) clearly specified for both API and UI? [Clarity]
- [x] CHK009 Are error responses (status codes and error body shape) for common failures (validation, RBAC, not found) documented or referenced from a shared standard? [Clarity]

## Requirement Consistency

- [x] CHK010 Do Demo endpoint paths, naming, and casing follow the same conventions as existing Accounts and Contacts APIs in this project? [Consistency]
- [x] CHK011 Are RBAC rules for Admin and Basic users on Demo endpoints consistent with how ownership and permissions are defined for Accounts/Contacts? [Consistency]
- [x] CHK012 Are soft-delete rules for demos (filtering IsDeleted in GET, behavior on DELETE) aligned with soft-delete rules used elsewhere (e.g., Accounts, Contacts)? [Consistency]

## Acceptance Criteria Quality

- [x] CHK013 Are there measurable success criteria for Demo API performance (e.g., list latency) or are they explicitly out of scope for this spec? [Acceptance Criteria]
- [x] CHK014 Do acceptance scenarios cover both successful and failing Demo API calls (e.g., unauthorized create, invalid account, invalid payload)? [Acceptance Criteria]

## Scenario & Edge Case Coverage

- [x] CHK015 Does the spec describe behavior when a demo is scheduled in the past (backfilled) vs future (upcoming), including how both appear in lists? [Scenario Coverage]
- [x] CHK016 Is behavior defined for listing demos on a soft-deleted account (e.g., demos should no longer be visible through normal routes)? [Scenario & Edge Case]
- [x] CHK017 Is the behavior of GET/PUT/DELETE when `demoId` does not exist or does not belong to the given `accountId` explicitly described (e.g., 404 Not Found)? [Edge Case]
- [x] CHK018 Are concurrent updates to the same Demo (e.g., two users editing) considered, or explicitly out of scope for this spec? [Edge Case]

## Non-Functional API Requirements

- [x] CHK019 Are authentication and authorization expectations (JWT, required headers) for Demo endpoints explicitly tied to the project’s global security standards? [Non-Functional]
- [x] CHK020 Is any logging/audit requirement for Demo create/update/delete operations specified or referenced from ActivityLog patterns? [Non-Functional]
- [x] CHK021 Are pagination or filtering needs for Demo lists (if needed for scale) addressed or explicitly marked as out of scope? [Non-Functional]

## Dependencies & Assumptions

- [x] CHK022 Are dependencies on existing entities (Accounts, Users) and their lifecycles documented for Demo behavior (e.g., what happens if user is deactivated)? [Dependencies]
- [x] CHK023 Are assumptions about consumer clients (only this frontend vs external clients) stated for the Demo API (e.g., versioning, backward compatibility expectations)? [Assumptions]

## Ambiguities & Conflicts

- [x] CHK024 Are any ambiguous terms in the Demo API spec (e.g., "attendees", "notes", "aligned by") clarified sufficiently to avoid misinterpretation across teams? [Ambiguities]
- [x] CHK025 Are there any conflicts between Demo API requirements and the Constitution’s database/API standards, and if so, are they identified and resolved in the spec? [Conflicts]
