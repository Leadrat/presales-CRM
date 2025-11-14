# Implementation Plan: JWT Authentication Setup (A1)

**Branch**: `1-jwt-auth-setup` | **Date**: 2025-11-12 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/1-jwt-auth-setup/spec.md`

## Summary

Implement secure login sessions using JWT with access and refresh tokens. Endpoints: POST /api/auth/login, /api/auth/refresh, /api/auth/logout. Store refresh tokens hashed in RefreshTokens with expiry and revocation.

## Technical Context

**Language/Version**: .NET Core (backend), Next.js (frontend)
**Primary Dependencies**: JWT library for .NET, BCrypt hashing library
**Storage**: PostgreSQL
**Testing**: xUnit/NUnit (backend), Jest/RTL & Playwright (frontend)
**Target Platform**: Web app (frontend + backend)
**Project Type**: web
**Performance Goals**: p95 login < 300ms (server time)
**Constraints**: HTTPS only; JWT validation on protected routes
**Scale/Scope**: Initial MVP

## Constitution Check

- TitleCase tables/columns: PASS
- GUID PKs: PASS
- No JSONB or Enums: PASS
- Soft deletes & timestamps on entities: PASS (Users already; RefreshTokens not an entity with soft delete)
- Auditability via ActivityLogs: PASS (to be emitted on login/refresh)
- Security: JWT short-lived access, hashed refresh tokens: PASS
- Algorithm preference (RS/ES vs HS256): PARTIAL (user requests HS256; Constitution prefers RS/ES) → Mitigation in research
- Claims minimality (avoid PII): PARTIAL (user includes Email); allow with caution

## Project Structure

```text
specs/1-jwt-auth-setup/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart
└── contracts/
    └── auth.yaml        # API contracts
```

**Structure Decision**: Web application (frontend + backend)

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| HS256 (symmetric) | Faster MVP, simpler key mgmt | RS/ES rotation adds key infra; planned later |
| Email in JWT | Convenience in UI caching | Can read from user endpoint; accepted temporarily |

