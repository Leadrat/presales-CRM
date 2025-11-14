# Implementation Plan: Protected Endpoint (Spec 4)

**Branch**: `004-protected-endpoint` | **Date**: 2025-11-13 | **Spec**: specs/004-protected-endpoint/spec.md  
**Input**: Feature specification from `/specs/004-protected-endpoint/spec.md`

## Summary

Implement `GET /api/me` protected by JWT (HS256). Validate token using existing Jwt settings. On success, return `{ id, email, role }` for the authenticated user via DB lookup using `sub` claim. Return 401 for missing, invalid, expired tokens and for users who are soft-deleted or inactive.

## Technical Context

**Language/Version**: .NET 9 ASP.NET Core Web API  
**Primary Dependencies**: EF Core (Npgsql), Microsoft.AspNetCore.Authentication.JwtBearer  
**Storage**: PostgreSQL (UUID PKs via uuid_generate_v4, TitleCase schema)  
**Testing**: Minimal integration via curl/Postman; optional xUnit later  
**Target Platform**: Backend API  
**Project Type**: Web backend  
**Performance Goals**: p95 < 100ms for /api/me  
**Constraints**: No enums/jsonb; UTC timestamps; soft-deletes; consistent JWT validation  
**Scale/Scope**: MVP

## Constitution Check

- GUID PKs: PASS  
- No enums/jsonb: PASS  
- Auditability: PASS (standard logging)  
- Soft deletes: PASS (block access)  
- Security: PASS (JWT Bearer, 401 for invalid/expired)

Gate deviations: None.

## Project Structure

### Documentation (this feature)

```text
specs/004-protected-endpoint/
├── plan.md
├── research.md
├── quickstart.md
└── contracts/
    └── me.yaml
```

### Source Code (repository root)

```text
backend/
├── Controllers/       # Add MeController (or add to AuthController)
├── Services/          # (reuse)
└── Program.cs         # (reuse JWT config)
```

**Structure Decision**: Add a small MeController to keep AuthController focused.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | — | — |
