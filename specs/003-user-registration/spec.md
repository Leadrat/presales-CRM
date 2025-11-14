# Feature Specification: User Registration with Domain Restriction — v1.0.0

**Feature Branch**: `003-user-registration`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: User description: "Create a Spec 3 Implements user registration endpoint with domain restriction, password hashing using BCrypt, and default role assignment. Built using .NET Core 8 Web API, PostgreSQL with GUID primary keys, and Next.js frontend integration. stack: { frontend: \"Next.js 15 with Tailwind CSS\", backend: \".NET Core 8 Web API (C#)\", database: \"PostgreSQL (Entity Framework Core, GUID primary keys, TitleCase naming)\" }"

## Clarifications

### Session 2025-11-13

- Q: Source of allowed email domains? → A: App configuration (env/appsettings), key `Signup:AllowedDomains` as a comma-separated list
- Q: Behavior when allowed list is empty/missing? → A: Deny all signups (403 DOMAIN_NOT_ALLOWED)
- Q: Password strength/breach checks? → A: Baseline policy only (min 8, ≥1 letter, ≥1 number)
- Q: Email verification policy? → A: No verification; allow login immediately

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Register with allowed company email (Priority: P1)

As a visitor, I can create an account using a company-approved email domain so I can access the product.

**Why this priority**: Enables safe growth while controlling who can sign up.

**Independent Test**: Attempt signup with an allowed domain and receive success with user id and email returned.

**Acceptance Scenarios**:

1. Given an allowed domain list includes `example.com`, When a user signs up with `user@example.com`, Then the system creates the user and returns 200 with id/email.
2. Given mixed case email `User@Example.com`, When signing up, Then email is normalized to lowercase and stored uniquely.

---

### User Story 2 - Block disallowed personal domains (Priority: P2)

As a visitor using a personal email domain, I am prevented from creating an account so the system maintains security and posture.

**Why this priority**: Reduces abuse and preserves B2B scope.

**Independent Test**: Attempt signup with a blocked domain (e.g., gmail.com) returns a domain restriction error.

**Acceptance Scenarios**:

1. Given `gmail.com` is not in allowed list, When signing up with `x@gmail.com`, Then API returns 403 with `DOMAIN_NOT_ALLOWED`.

---

### User Story 3 - Default role assignment (Priority: P3)

As a newly registered user, I am automatically assigned the Basic role to get started with minimal privileges.

**Why this priority**: Enforces least privilege.

**Independent Test**: Successful signup sets `RoleId` to Basic and does not accept client-provided role.

**Acceptance Scenarios**:

1. Given signup payload contains no role, When user is created, Then `RoleId` is set to Basic.
2. Given payload attempts to pass a role field, When processing, Then server ignores it and still assigns Basic.

---

### User Story 4 - Password hashing and policy enforcement (Priority: P2)

As a newly registered user, my password is hashed using BCrypt and must meet the password policy to ensure security.

**Why this priority**: Protects user accounts from unauthorized access.

**Independent Test**: Attempt signup with a weak password returns a password policy error.

**Acceptance Scenarios**:

1. Given password is too weak, When signing up, Then API returns 400 with `WEAK_PASSWORD`.
2. Given password meets policy, When signing up, Then password is hashed using BCrypt.

---

### Edge Cases

- Duplicate email with different casing → 409 Conflict
- Deleted account re-registration → allowed (uniqueness only on non-deleted users)
- Password too weak → 400 with code `WEAK_PASSWORD`
- Allowed list empty → deny signups with 403 `DOMAIN_NOT_ALLOWED`

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- FR-001: Provide `POST /api/auth/signup` accepting `{ FullName: string, Email: string, Password: string, Phone?: string }`.
- FR-002: Enforce domain restriction on email; only domains listed in app configuration may register. Source: `Signup:AllowedDomains` (comma-separated list, e.g., `example.com,acme.io`). If list is empty or missing → deny signups with 403 `DOMAIN_NOT_ALLOWED`.
- FR-003: Normalize email to lowercase and enforce uniqueness among non-deleted users.
- FR-004: Hash passwords using BCrypt (Identity `PasswordHasher<User>` acceptable); never store plaintext.
- FR-005: Assign Basic role by default; ignore any client role fields.
- FR-006: Enforce password policy: min 8 chars, ≥1 letter, ≥1 number.
- FR-007: Do not issue tokens on signup; require separate login.
- FR-008: Return 200 `{ data: { id, email } }` on success; 409 `EMAIL_EXISTS` for duplicates; 403 `DOMAIN_NOT_ALLOWED` for blocked domains; 400 `WEAK_PASSWORD` for policy failure.
- FR-009: Emit ActivityLog event `UserCreated` with correlation id if present.
- FR-010: Store timestamps in UTC; GUID primary keys; TitleCase naming; no enums/jsonb.
- FR-011: Email verification is not required for login; users may authenticate immediately after signup.

### Key Entities

- User: Id (UUID), Email (lowercase), PasswordHash, FullName, Phone, RoleId, IsActive, CreatedAt, UpdatedAt, IsDeleted, DeletedAt
- Role: Id (UUID), Name (UNIQUE), Description, CreatedAt, UpdatedAt
- AllowedDomain (config): List of allowed email domains (e.g., via configuration setting `Signup:AllowedDomains`)

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- SC-001: Signups with allowed domains succeed with 200 and return id/email within 300ms p95.
- SC-002: Signups with disallowed domains return 403 `DOMAIN_NOT_ALLOWED` 100% of the time.
- SC-003: Duplicate emails (any casing) return 409 `EMAIL_EXISTS` with no user created.
- SC-004: Password policy violations return 400 `WEAK_PASSWORD` with no user created.
