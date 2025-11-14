# Research — Spec 3: User Registration with Domain Restriction

## Decisions

- Decision: Allowed domains source = app configuration `Signup:AllowedDomains` (CSV)
  - Rationale: Fast to ship, easy to operate; can migrate to DB later
  - Alternatives: DB table with admin UI; default blocklist; domain ownership verification

- Decision: Empty/missing allowlist → deny all signups (403 DOMAIN_NOT_ALLOWED)
  - Rationale: Secure by default; avoids accidental open registration
  - Alternatives: Allow all; 500 config error; built-in default

- Decision: Password policy baseline only (min 8, ≥1 letter, ≥1 number)
  - Rationale: Balanced UX vs security for MVP; can add zxcvbn or breach checks later
  - Alternatives: Strong 12+ policy; zxcvbn score; HIBP breach check

- Decision: No email verification required for login
  - Rationale: Simplifies MVP; domain allowlist mitigates risk
  - Alternatives: Hard-block until verify; soft verify (allow login but send email)

- Decision: Do not issue tokens on signup; login separate (A1)
  - Rationale: Security boundary; consistent flows; easier auditing
  - Alternatives: Issue tokens on signup (conflicts with Spec 1/2 architecture)

## Conflicts from external input

- External request suggested: issue JWT and refresh token on signup (201 with tokens). Spec 3 defers token issuance to /login per A1. Resolution: keep signup tokenless; tokens via login.
- External request suggested: enforce @leadrat.com only. Spec allows configurable allowlist; configure with `Signup:AllowedDomains=leadrat.com` to match.

## Notes

- Reuse A2 schema (Users, Roles). No new tables.
- Keep partial unique index on lower(Email) where IsDeleted = FALSE (A2).
- Activity logging on signup remains required.
