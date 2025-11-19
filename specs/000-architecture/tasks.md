# Tasks — Spec 000 Architecture & Conventions

## Phase 1 — Establish Architecture Docs

- [ ] T001 Create `specs/000-architecture/spec.md` capturing high-level architecture, backend/frontend structure, and conventions.
- [ ] T002 Create `specs/000-architecture/plan.md` describing how Spec 000 is used as the base for all other specs.
- [ ] T003 Create `specs/000-architecture/tasks.md` defining tasks and checkpoints for maintaining architecture docs.

## Phase 2 — Align Existing Specs

- [ ] T004 Update existing specs (e.g., Spec 006, Spec 009) to reference Spec 000 in their `spec.md` where they depend on shared architecture.
- [ ] T005 Ensure existing `plan.md` files in other specs mention where backend/frontend code lives in terms of Spec 000 (controllers, services, models, routes).

## Phase 3 — Enforce Conventions for New Specs

- [ ] T006 Add a checklist item to each new spec’s `tasks.md` to "Verify alignment with Spec 000" (auth, RBAC, error shape, placement of code).
- [ ] T007 Document any new global error codes in Spec 000 and cross-reference from the feature spec.

## Phase 4 — Maintenance

- [ ] T008 When architecture changes (e.g., new shared service, new global middleware), update Spec 000 first.
- [ ] T009 Review specs periodically to ensure they still conform to Spec 000 (at least when starting a new major feature).

These tasks ensure Spec 000 remains the source of truth for architecture and that all future specs and features follow a consistent, clean structure.
