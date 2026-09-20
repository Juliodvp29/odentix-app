# ROADMAP.md

**Scope of this document:** frontend only (Angular 22 + Tailwind CSS v4).
Complements `odentix-backend`'s roadmap, which is already at v1.

**How to read this:** each phase has tickets in GitHub-issue format
(type, estimate, dependencies, description, tasks, acceptance criteria).
Follow the mandatory workflow in `AGENTS.md` §10 for every ticket: plan →
approval → execution → tests → mark complete + commit message.

---

# Phase map

```text
FASE 0  → Project foundations
FASE 1  → Shared UI kit (design-system-driven components)
FASE 2  → Auth, app shell, and routing
FASE 3  → Patients module
FASE 4  → Agenda & appointments module
FASE 5  → Treatment plans & billing module
FASE 6  → CRM / leads module
FASE 7  → Portfolio (cartera) module
FASE 8  → Specialists & inventory module
FASE 9  → Tasks & notifications
FASE 10 → Opportunities dashboard
FASE 11 → AI assistant UI
FASE 12 → Subscription & plan-gating UI
FASE 13 → Performance, accessibility, and production readiness
```

**Note on plan gating:** the backend already enforces `plan_features` /
`plan_limits` server-side (its Fase 11). This frontend must always
degrade gracefully when a feature is gated off for the tenant's plan —
hide or explain, never show a broken/error UI for a feature the plan
doesn't include. Keep this in mind from Fase 3 onward, not only in
Fase 12.

---

# FASE 0 — Project foundations

**Objective:** a running Angular 22 + Tailwind v4 project, with linting,
testing, and API type generation wired up, before any real feature work.

**Suggested labels:** `frontend`, `fase-0`

---

### 🎫 FASE0-01 — Create the Angular 22 project

**Type:** setup
**Estimate:** S (1h)
**Depends on:** —

**Description:**
Base project, stylesheet format must be CSS (not SCSS) — required for
Tailwind v4 compatibility.

**Tasks:**

- [x] `ng new odentix-frontend` with: stylesheet format **CSS**, SSR
      **as decided with Julio** (not yet confirmed — ask before
      enabling it if it isn't already settled).
- [x] Confirm the generated project uses standalone components and
      zoneless by default (Angular 22's default — verify, don't assume
      silently).
- [x] Push the empty project to GitHub with an appropriate
      `.gitignore` (`node_modules`, `dist`, `.angular/cache`, `.env`).

**Acceptance criteria:**

- [x] `npm start` serves the default app without errors.

---

### 🎫 FASE0-02 — Install and configure Tailwind CSS v4

**Type:** setup
**Estimate:** S (1h)
**Depends on:** FASE0-01

**Description:**
CSS-first configuration — no `tailwind.config.js`.

**Tasks:**

- [x] Install `tailwindcss` and the Angular/PostCSS integration
      following Tailwind's current official docs (verify the exact
      steps at install time — this has changed between v3 and v4).
- [x] `@import "tailwindcss";` in `src/styles.css`, with `@source`
      directives if needed for anything outside the default scan path.
- [x] Verify a Tailwind utility class actually applies in a test
      element.

**Acceptance criteria:**

- [x] A component using a Tailwind class (e.g. `class="text-red-500"`)
      renders with that style applied.

---

### 🎫 FASE0-03 — ESLint + Prettier setup

**Type:** setup
**Estimate:** S (1h)
**Depends on:** FASE0-01

**Tasks:**

- [x] Configure ESLint with Angular's recommended rules plus a rule set
      that flags legacy patterns (`*ngIf`/`*ngFor`, `@Input()`
      decorators, NgModules) as errors, not warnings — this project
      should not be able to silently drift back into pre-signals
      patterns.
- [x] Configure Prettier, consistent with what's already used in
      `odentix-backend` where applicable (e.g. print width).
- [x] `npm run lint` and `npm run format` scripts in `package.json`.

**Acceptance criteria:**

- [x] Writing a component with `*ngIf` triggers a lint error, not just
      a style nitpick.

---

### 🎫 FASE0-04 — Folder structure

**Type:** decision / setup
**Estimate:** S (1h)
**Depends on:** FASE0-01

**Description:**
Establish the `core/` / `shared/` / `features/` convention from
`AGENTS.md` §4 before real feature code exists.

**Tasks:**

- [x] Create the base folders with a short `README.md` inside each
      explaining its purpose (mirrors what the backend did for its
      package convention in FASE0-03).
- [x] Confirm routing is set up for lazy-loaded feature routes from the
      start (even with just a placeholder route).

**Acceptance criteria:**

- [x] The folder structure and its rationale are documented in the repo,
      not only in this roadmap.

---

### 🎫 FASE0-05 — Vitest setup and first test

**Type:** setup / testing
**Estimate:** S (1h)
**Depends on:** FASE0-01

**Tasks:**

- [x] Confirm Vitest is wired up as the test runner (Angular 22 default
      — verify the exact config Angular CLI generated).
- [x] Write one trivial test (e.g. the root component renders) to prove
      the pipeline works end to end.

**Acceptance criteria:**

- [x] `npm test` runs and passes that one test.

---

### 🎫 FASE0-06 — API type generation pipeline

**Type:** setup
**Estimate:** S (1–2h)
**Depends on:** FASE0-04, `odentix-backend` running locally on :8081

**Description:**
Types are generated from the backend's live OpenAPI spec, never
hand-written.

**Tasks:**

- [x] `npm run generate:api-types` script wrapping:
      `openapi-typescript http://localhost:8081/v3/api-docs -o src/app/core/api/schema.ts`.
- [x] Run it once against the real backend and commit the resulting
      `schema.ts` (so the project builds without requiring the backend
      to be running).
- [x] Document in `core/api/README.md` (or similar) that this file is
      generated and must be regenerated, never hand-edited, whenever
      the backend's API changes.

**Acceptance criteria:**

- [x] `schema.ts` exists, is committed, and its types match the
      backend's current OpenAPI spec.

---

### 🎫 FASE0-07 — Environment files

**Type:** setup / security
**Estimate:** S (30min–1h)
**Depends on:** FASE0-01

**Tasks:**

- [x] `environment.ts` (dev) and `environment.prod.ts` — both
      git-ignored once they contain real values.
- [x] `environment.example.ts` — committed, with placeholder values
      (`apiUrl: 'http://localhost:8081/api/v1'`, etc.) so anyone cloning
      the repo knows what to fill in.

**Acceptance criteria:**

- [x] `environment.ts` and `environment.prod.ts` are in `.gitignore`;
      `environment.example.ts` is committed with no real values.

---

### 🎫 FASE0-08 — CI pipeline (build + test + lint)

**Type:** infra / CI
**Estimate:** M (2h)
**Depends on:** FASE0-03, FASE0-05

**Tasks:**

- [x] GitHub Actions workflow: checkout, install, lint, `npm run
  test:ci`, build — triggered on push/PR to `dev` and `main`.
- [x] Protect `main` (and `dev` if applicable) requiring the pipeline to
      pass before merge.

**Acceptance criteria:**

- [x] A PR with a failing test or lint error is blocked automatically.

---

### ✅ Fase 0 exit checklist

- [x] `npm start`, `npm test`, `npm run build`, `npm run lint`, and
      `npm run generate:api-types` all work.
- [x] CI blocks a broken PR.
- [x] First commit pushed to GitHub.

---

# FASE 1 — Shared UI kit

**Objective:** the reusable building blocks every feature will use,
built once, correctly, instead of rebuilt ad hoc per feature. **This
phase cannot start in earnest until `DESIGN.md` exists** — if it
doesn't yet, build structure/behavior only and flag styling as
deferred (see `AGENTS.md`'s current-state note).

**Suggested labels:** `frontend`, `fase-1`, `design-system`

---

### 🎫 FASE1-01 — Design tokens as CSS custom properties

**Type:** feature
**Estimate:** M (2–3h, depends on `DESIGN.md` being ready)
**Depends on:** `DESIGN.md`

**Tasks:**

- [x] Translate `DESIGN.md`'s colors, spacing, typography, and radii
      into CSS custom properties and/or Tailwind v4 `@theme` tokens in
      `styles.css`.
- [x] No component may use a raw hex color or arbitrary spacing value
      after this ticket — everything routes through these tokens.

**Acceptance criteria:**

- [x] Changing a token's value in one place visibly updates every
      component using it.

---

### 🎫 FASE1-02 — Button, link, and icon-button components

**Type:** feature
**Estimate:** M (2h)
**Depends on:** FASE1-01

**Tasks:**

- [x] `Button` component with variants (primary/secondary/danger/ghost,
      per `DESIGN.md`) and states (default/hover/focus/disabled/loading).
- [x] Loading state shows a spinner/inline indicator without shifting
      the button's size.
- [x] Tests covering each variant renders and the disabled state blocks
      clicks.

**Acceptance criteria:**

- [x] Every state in `DESIGN.md` for buttons is represented and covered
      by a test.

---

### 🎫 FASE1-03 — Input, select, and form field components

**Type:** feature
**Estimate:** L (4h — this is the base every Signal Form will use)
**Depends on:** FASE1-01

**Tasks:**

- [x] Text input, select, and a `FormField` wrapper (label + control +
      error message) designed to plug into Signal Forms cleanly.
- [x] Error state styling and screen-reader-friendly error association
      (`aria-describedby` or equivalent via CDK).
- [x] Tests: renders, shows validation error, is keyboard-navigable.

**Acceptance criteria:**

- [x] A Signal Form using these components shows validation errors
      correctly without extra glue code per field.

---

### 🎫 FASE1-04 — Modal component (CDK Overlay + Dialog)

**Type:** feature
**Estimate:** L (3–4h)
**Depends on:** FASE1-01, FASE1-02

**Description:**
This is one of the components Julio specifically called out for
fluidity — pay particular attention to entry/exit transitions.

**Tasks:**

- [ ] Built on Angular CDK's overlay/dialog primitives (focus trap,
      escape-to-close, backdrop click, scroll lock — all free from CDK,
      don't reimplement).
- [ ] Enter/exit animation that feels smooth, not instant pop-in/out —
      per `DESIGN.md`'s motion guidance if it defines one, otherwise a
      short, consistent transition.
- [ ] Tests: opens, closes on escape/backdrop, traps focus.

**Acceptance criteria:**

- [ ] Opening and closing the modal has no visible jank or layout
      shift, verified manually and noted as such when marking the
      ticket done.

---

### 🎫 FASE1-05 — Alert / toast notification system

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE1-01

**Tasks:**

- [ ] A signal-based service to trigger toasts (`success`/`error`/
      `info`/`warning`) from anywhere in the app.
- [ ] Toast component with auto-dismiss and manual dismiss, animated
      in/out consistently with the modal's approach (FASE1-04).
- [ ] Tests: triggering a toast shows it; it auto-dismisses after its
      configured time.

**Acceptance criteria:**

- [ ] Any feature can show a toast via the service without importing a
      component directly into its template.

---

### 🎫 FASE1-06 — Table component with pagination

**Type:** feature
**Estimate:** L (4h — this is reused by nearly every feature module)
**Depends on:** FASE1-01

**Tasks:**

- [ ] Generic, reusable table (column definitions passed in, not
      hardcoded per feature) supporting pagination, loading state, and
      empty state.
- [ ] Loading state is a skeleton matching the table's shape, not a
      spinner (per `AGENTS.md` §7).
- [ ] Tests: renders rows, shows skeleton while loading, shows empty
      state with no rows.

**Acceptance criteria:**

- [ ] The patients list (Fase 3) can be built on top of this table
      without any table-specific logic duplicated in that feature.

---

### 🎫 FASE1-07 — Skeleton loader primitives

**Type:** feature
**Estimate:** S (1–2h)
**Depends on:** FASE1-01

**Tasks:**

- [ ] Reusable skeleton primitives (line, block, avatar/circle) that
      compose into feature-specific skeletons (e.g. a "patient card
      skeleton" built from these pieces).

**Acceptance criteria:**

- [ ] At least one real loading state elsewhere in the shared kit
      (e.g. the table in FASE1-06) uses these primitives instead of a
      one-off skeleton.

---

### ✅ Fase 1 exit checklist

- [ ] Every component built here has tests and follows `DESIGN.md`
      tokens exclusively (no raw values).
- [ ] A short Storybook-less "kit preview" route (even a simple internal
      page listing all shared components) exists so new components can
      be checked visually without hunting through features for one.

---

# FASE 2 — Auth, app shell, and routing

**Suggested labels:** `frontend`, `fase-2`, `auth`

---

### 🎫 FASE2-01 — HTTP client setup with the generated API types

**Type:** feature
**Estimate:** M (2h)
**Depends on:** FASE0-06

**Tasks:**

- [ ] Base API client/service using `httpResource()` or `HttpClient`
      typed against `core/api/schema.ts`.
- [ ] Central place for the API base URL (from `environment.ts`).

**Acceptance criteria:**

- [ ] A call to any backend endpoint is fully typed end to end, with no
      manually-written response interfaces duplicating `schema.ts`.

---

### 🎫 FASE2-02 — Auth interceptor and token storage

**Type:** feature / security
**Estimate:** M (2–3h)
**Depends on:** FASE2-01

**Tasks:**

- [ ] HTTP interceptor attaching the JWT (from the backend's login) to
      outgoing requests.
- [ ] Decide and document where the token lives (memory vs. storage) —
      this is a security-relevant decision, flag it explicitly in the
      plan step before implementing.
- [ ] Handle `401` responses by redirecting to login and clearing the
      stored session.

**Acceptance criteria:**

- [ ] An authenticated request includes the token; a `401` response
      redirects to `/login` without a manual page reload.

---

### 🎫 FASE2-03 — Login page

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE2-02, FASE1-02, FASE1-03

**Tasks:**

- [ ] Login form using Signal Forms and the shared input/button
      components.
- [ ] Error state for invalid credentials, loading state while the
      request is in flight.

**Acceptance criteria:**

- [ ] A successful login stores the session and navigates to the app
      shell; a failed one shows a clear error without a page reload.

---

### 🎫 FASE2-04 — Auth guard for protected routes

**Type:** feature
**Estimate:** S (1h)
**Depends on:** FASE2-02

**Tasks:**

- [ ] Functional route guard (Angular 22 style, not class-based)
      redirecting unauthenticated users to `/login`.

**Acceptance criteria:**

- [ ] Navigating directly to a protected URL while logged out redirects
      to login instead of rendering the protected page.

---

### 🎫 FASE2-05 — App shell (layout, navigation)

**Type:** feature
**Estimate:** L (3–4h)
**Depends on:** FASE1-01, FASE1-02

**Description:**
The persistent frame (sidebar/topbar, whatever `DESIGN.md` specifies)
that every feature route renders inside.

**Tasks:**

- [ ] Layout component with navigation reflecting the user's role
      (`propietario`/`odontologo`/`recepcion`/etc. from the backend).
- [ ] Route transition handling — this is one of the places Julio
      explicitly wants to feel fluid, not an instant swap; use view
      transitions if `DESIGN.md`/Angular's support make that
      straightforward, otherwise a deliberate, consistent fade/slide.

**Acceptance criteria:**

- [ ] Navigating between two feature routes doesn't show a blank flash
      or unstyled flicker.

---

### 🎫 FASE2-06 — Lazy-loaded route structure for all features

**Type:** setup
**Estimate:** S (1–2h)
**Depends on:** FASE2-05

**Tasks:**

- [ ] Route definitions (even as placeholders) for every feature module
      planned in Fases 3–12, all lazy-loaded.

**Acceptance criteria:**

- [ ] The initial bundle does not include code for any feature module —
      verify with a bundle analysis, not just by assumption.

---

# FASE 3 — Patients module

**Suggested labels:** `frontend`, `fase-3`, `patients`

---

### 🎫 FASE3-01 — Patients list

**Type:** feature
**Estimate:** M (3h)
**Depends on:** FASE1-06, FASE2-06

**Tasks:**

- [ ] Paginated list using the shared table (FASE1-06), backed by the
      backend's patients endpoint.
- [ ] Search by name/document, debounced (this is a good first real use
      of a signal-based `debounced()` pattern per Angular 22 §2).

**Acceptance criteria:**

- [ ] Typing in the search field updates results without a full page
      reload or visible flicker; loading state is the skeleton table,
      not a spinner.

---

### 🎫 FASE3-02 — Create/edit patient form

**Type:** feature
**Estimate:** M (3h)
**Depends on:** FASE1-03, FASE1-04

**Tasks:**

- [ ] Modal (FASE1-04) containing a Signal Form for creating/editing a
      patient, validated against the backend's required fields.

**Acceptance criteria:**

- [ ] Submitting invalid data shows field-level errors without closing
      the modal; a successful submit closes it and refreshes the list.

---

### 🎫 FASE3-03 — Patient detail view

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE3-01

**Tasks:**

- [ ] Detail route showing the patient's core data, with tabs/sections
      for clinical records, odontogram, and files (each can start as a
      placeholder if its backend endpoint isn't the focus yet).

**Acceptance criteria:**

- [ ] Navigating from the list to a patient's detail feels like a
      continuation, not a jarring context switch (transition + no
      layout shift while data loads).

---

### 🎫 FASE3-04 — Clinical records and odontogram views

**Type:** feature
**Estimate:** L (4h)
**Depends on:** FASE3-03

**Tasks:**

- [ ] Timeline/list of clinical record entries.
- [ ] Odontogram data view (visual representation can start simple —
      this is explicitly one of the harder design problems, coordinate
      with `DESIGN.md` before investing in a polished version).

**Acceptance criteria:**

- [ ] Clinical entries and odontogram entries are readable and clearly
      separated by type (current state vs. diagnosis vs. plan vs.
      completed treatment — matching the backend's model).

---

### 🎫 FASE3-05 — Patient files (upload/download)

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE3-03

**Tasks:**

- [ ] File upload UI with progress feedback, and a list of existing
      files with download links.

**Acceptance criteria:**

- [ ] Uploading a file shows progress and updates the list without a
      manual refresh; the loading/uploading state never leaves the UI
      in an ambiguous "did it work?" state.

---

# FASE 4 — Agenda & appointments module

**Suggested labels:** `frontend`, `fase-4`, `appointments`

---

### 🎫 FASE4-01 — Agenda / calendar view

**Type:** feature
**Estimate:** L (4–5h — this is the most visually complex screen so far)
**Depends on:** FASE2-06, FASE1-01

**Tasks:**

- [ ] Day/week view of appointments per professional.
- [ ] Loading and empty states designed deliberately, not an
      afterthought, given how central this screen is.

**Acceptance criteria:**

- [ ] Switching between days/weeks feels immediate — prefetch adjacent
      ranges if needed to avoid a visible loading state on every click.

---

### 🎫 FASE4-02 — Create/edit appointment

**Type:** feature
**Estimate:** M (3h)
**Depends on:** FASE4-01, FASE1-04

**Tasks:**

- [ ] Modal form to create/edit an appointment, surfacing the backend's
      overlap-conflict error (`409`) as a clear, specific message —
      not a generic "something went wrong."

**Acceptance criteria:**

- [ ] Attempting to double-book a professional shows a message
      explaining the conflict, not a raw error.

---

### 🎫 FASE4-03 — Appointment status transitions

**Type:** feature
**Estimate:** S (1–2h)
**Depends on:** FASE4-02

**Tasks:**

- [ ] UI to move an appointment through its states, disabling invalid
      transitions in the UI itself (in addition to the backend
      rejecting them).

**Acceptance criteria:**

- [ ] Invalid transitions aren't even selectable in the UI, not just
      rejected after the fact.

---

### 🎫 FASE4-04 — Waitlist and cancellation recovery UI

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE4-03

**Tasks:**

- [ ] UI to register a waitlist entry.
- [ ] When cancelling a high-value appointment, surface the backend's
      suggested waitlist candidates directly in that flow.

**Acceptance criteria:**

- [ ] Cancelling a qualifying appointment shows candidates inline,
      without navigating away from the cancellation flow.

---

# FASE 5 — Treatment plans & billing module

**Suggested labels:** `frontend`, `fase-5`, `billing`

---

### 🎫 FASE5-01 — Treatment plan builder

**Type:** feature
**Estimate:** L (4h)
**Depends on:** FASE3-03

**Tasks:**

- [ ] UI to build a treatment plan with multiple procedure items,
      running total updating live as items are added/removed.

**Acceptance criteria:**

- [ ] The total updates instantly on every item change, no
      round-trip needed for basic arithmetic that can happen client-side.

---

### 🎫 FASE5-02 — Treatment plan status transitions

**Type:** feature
**Estimate:** S (1–2h)
**Depends on:** FASE5-01

**Tasks:**

- [ ] Same pattern as FASE4-03, applied to `TreatmentPlan` states.

**Acceptance criteria:**

- [ ] Invalid transitions aren't selectable; valid ones update the UI
      immediately on confirmation.

---

### 🎫 FASE5-03 — Invoicing UI

**Type:** feature
**Estimate:** M (3h)
**Depends on:** FASE5-01

**Tasks:**

- [ ] Generate an invoice from a treatment plan; view invoice detail
      with its line items.

**Acceptance criteria:**

- [ ] An invoice's total always matches the sum of its visible line
      items — no discrepancy the user has to trust blindly.

---

### 🎫 FASE5-04 — Payment registration

**Type:** feature
**Estimate:** M (2h)
**Depends on:** FASE5-03

**Tasks:**

- [ ] Register a payment against an invoice; invoice status
      (pending/partial/paid) updates immediately in the UI.

**Acceptance criteria:**

- [ ] Registering a payment that completes the invoice visibly updates
      its status without requiring a manual refresh.

---

# FASE 6 — CRM / leads module

**Suggested labels:** `frontend`, `fase-6`, `crm`

---

### 🎫 FASE6-01 — Leads pipeline board

**Type:** feature
**Estimate:** L (4h)
**Depends on:** FASE2-06

**Tasks:**

- [ ] Kanban-style or list view of leads by pipeline stage.

**Acceptance criteria:**

- [ ] The view clearly communicates how many leads are in each stage
      at a glance.

---

### 🎫 FASE6-02 — Lead detail and activity log

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE6-01

**Tasks:**

- [ ] Detail view with contact history (`LeadActivity`) and a way to
      log a new contact attempt.

**Acceptance criteria:**

- [ ] Logging a new activity appears in the timeline immediately.

---

### 🎫 FASE6-03 — Lead-to-patient conversion flow

**Type:** feature
**Estimate:** M (2h)
**Depends on:** FASE6-02, FASE3-02

**Tasks:**

- [ ] UI action to convert a qualified lead, reusing the patient
      creation flow's components where sensible instead of duplicating
      them.

**Acceptance criteria:**

- [ ] Converting a lead navigates to the resulting patient record
      directly, closing the loop visibly.

---

### 🎫 FASE6-04 — Conversion metrics dashboard

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE6-01

**Tasks:**

- [ ] Charts/summary for conversion by source/campaign and average
      response time, backed by the corresponding backend endpoints.

**Acceptance criteria:**

- [ ] Numbers shown match what the backend endpoints return for the
      same date range, spot-checked manually.

---

# FASE 7 — Portfolio (cartera) module

**Suggested labels:** `frontend`, `fase-7`, `billing`

---

### 🎫 FASE7-01 — Payment plan (installments) UI

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE5-01

**Tasks:**

- [ ] UI to define a payment plan in installments and view each
      installment's status.

**Acceptance criteria:**

- [ ] Marking an installment as paid updates its status and the
      portfolio summary (FASE7-02) without a manual refresh.

---

### 🎫 FASE7-02 — Portfolio dashboard

**Type:** feature
**Estimate:** M (2h)
**Depends on:** FASE7-01

**Tasks:**

- [ ] Summary view: total, overdue, upcoming, and current balances.

**Acceptance criteria:**

- [ ] Totals match the backend's portfolio summary endpoint.

---

# FASE 8 — Specialists & inventory module

**Suggested labels:** `frontend`, `fase-8`

---

### 🎫 FASE8-01 — Specialists and settlements UI

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE2-06

**Tasks:**

- [ ] List of specialists, and a view to generate/review a settlement
      for a given period.

**Acceptance criteria:**

- [ ] Generating a settlement shows the computed amount clearly
      attributed to the underlying appointments/treatments.

---

### 🎫 FASE8-02 — Inventory list and stock movements

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE2-06

**Tasks:**

- [ ] Inventory item list with current stock, and a form to register a
      stock movement.
- [ ] Visually flag items at or below their critical threshold.

**Acceptance criteria:**

- [ ] An item at/below threshold is visually distinct in the list
      without needing to open it.

---

# FASE 9 — Tasks & notifications

**Suggested labels:** `frontend`, `fase-9`

---

### 🎫 FASE9-01 — Task list and "my tasks" view

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE2-06

**Tasks:**

- [ ] List of tasks assigned to the current user, with the ability to
      complete/reassign.

**Acceptance criteria:**

- [ ] Completing a task removes it from the active list immediately.

---

### 🎫 FASE9-02 — Notification status view (internal/admin)

**Type:** feature
**Estimate:** S (1–2h)
**Depends on:** FASE9-01

**Tasks:**

- [ ] A view (likely admin-facing) showing recent notification attempts
      and their status (sent/failed), useful for debugging WhatsApp/
      email delivery issues without touching the backend directly.

**Acceptance criteria:**

- [ ] A failed notification's error detail is visible without needing
      backend log access.

---

# FASE 10 — Opportunities dashboard

**Suggested labels:** `frontend`, `fase-10`

---

### 🎫 FASE10-01 — Opportunities list, grouped by type/priority

**Type:** feature
**Estimate:** L (3–4h)
**Depends on:** FASE2-06

**Tasks:**

- [ ] List/board of open opportunities, sorted by priority, grouped by
      type.

**Acceptance criteria:**

- [ ] The highest-priority, highest-value opportunities are visually
      the most prominent — this view exists specifically to make acting
      on them effortless, design it with that in mind.

---

### 🎫 FASE10-02 — Execute a suggested action

**Type:** feature
**Estimate:** M (2–3h)
**Depends on:** FASE10-01

**Tasks:**

- [ ] UI to review and execute (or edit before executing) an
      opportunity's suggested action.

**Acceptance criteria:**

- [ ] Executing an action gives immediate, clear feedback that it
      happened (toast + the opportunity updating state), never a
      silent success.

---

### 🎫 FASE10-03 — Recovered value metric view

**Type:** feature
**Estimate:** S (1–2h)
**Depends on:** FASE10-02

**Tasks:**

- [ ] Summary of recovered value by category over a period.

**Acceptance criteria:**

- [ ] Numbers match the backend's recovered-value endpoint.

---

# FASE 11 — AI assistant UI

**Suggested labels:** `frontend`, `fase-11`, `ai`

---

### 🎫 FASE11-01 — Assistant chat/question interface

**Type:** feature
**Estimate:** M (3h)
**Depends on:** FASE2-06

**Tasks:**

- [ ] A simple interface to ask the backend's assistant endpoint a
      question and display the answer, with a clear loading state
      (this is a network call to an LLM provider — it will not be
      instant, design the wait accordingly).

**Acceptance criteria:**

- [ ] The loading state makes it obvious the assistant is "thinking,"
      not that the app is frozen.

---

### 🎫 FASE11-02 — Suggested message review UI

**Type:** feature
**Estimate:** M (2h)
**Depends on:** FASE11-01, FASE8-03 in backend (message sending flow)

**Tasks:**

- [ ] UI to review and edit an AI-suggested message before it's sent —
      per the backend's principle, this must never auto-send.

**Acceptance criteria:**

- [ ] There is no path in the UI that sends an AI-generated message
      without an explicit user confirmation step.

---

# FASE 12 — Subscription & plan-gating UI

**Suggested labels:** `frontend`, `fase-12`, `billing`

---

### 🎫 FASE12-01 — Plan-aware navigation and feature gating

**Type:** feature
**Estimate:** L (3–4h)
**Depends on:** all feature modules whose access depends on plan

**Description:**
The backend already rejects gated endpoints with `403`. The frontend
must not let a user reach a dead end — hide or clearly explain gated
features before the request is even made.

**Tasks:**

- [ ] A service exposing the current tenant's plan/features/limits
      (fetched once, cached as a signal).
- [ ] Navigation items and feature entry points check this before
      rendering — a gated feature is either hidden or shown with a
      clear "upgrade to access this" affordance, never a broken link.

**Acceptance criteria:**

- [ ] A tenant on the Esencial plan never sees a navigation item that
      would immediately 403 if clicked.

---

### 🎫 FASE12-02 — Plan selection / upgrade UI

**Type:** feature
**Estimate:** M (3h)
**Depends on:** FASE12-01

**Tasks:**

- [ ] Screen presenting the three plans (Esencial/Profesional/Clínica)
      with their limits and features, and a way to initiate an upgrade.

**Acceptance criteria:**

- [ ] Plan details shown match `plan_features`/`plan_limits` exactly —
      never hardcode plan details separately from what the backend
      returns.

---

### 🎫 FASE12-03 — Usage limit indicators

**Type:** feature
**Estimate:** S (1–2h)
**Depends on:** FASE12-01

**Tasks:**

- [ ] Where a tenant is approaching a numeric limit (e.g. patients,
      WhatsApp conversations), show a subtle indicator before they hit
      the hard limit and get blocked.

**Acceptance criteria:**

- [ ] A tenant near a limit sees a warning before the limit blocks
      their next action, not only after.

---

# FASE 13 — Performance, accessibility, and production readiness

**Suggested labels:** `frontend`, `fase-13`, `production-readiness`

---

### 🎫 FASE13-01 — Bundle size audit

**Type:** hardening
**Estimate:** M (2–3h)
**Depends on:** all feature phases

**Tasks:**

- [ ] Analyze the production bundle, confirm every feature route is
      actually lazy-loaded (not accidentally pulled into the main
      bundle), set/verify Angular's budget warnings in `angular.json`.

**Acceptance criteria:**

- [ ] No feature-specific code appears in the initial/main bundle.

---

### 🎫 FASE13-02 — Accessibility audit

**Type:** hardening
**Estimate:** M (3h)
**Depends on:** FASE1 (shared kit) and all features built on it

**Tasks:**

- [ ] Keyboard-only pass through the app's critical flows (login,
      create patient, book appointment).
- [ ] Automated audit (e.g. axe) on key screens, fixing what it flags.

**Acceptance criteria:**

- [ ] Critical flows are fully completable without a mouse.

---

### 🎫 FASE13-03 — E2E test suite for critical flows

**Type:** testing
**Estimate:** L (4–5h)
**Depends on:** Playwright decision confirmed (see `AGENTS.md`)

**Tasks:**

- [ ] E2E coverage for: login, create/edit patient, book/cancel an
      appointment, create a treatment plan and register a payment.

**Acceptance criteria:**

- [ ] All listed flows are covered and run in CI.

---

### 🎫 FASE13-04 — Perceived-performance pass

**Type:** hardening
**Estimate:** M (3h)
**Depends on:** all feature phases

**Description:**
A dedicated pass specifically on the requirement that started this
whole roadmap — this ticket exists to make sure it didn't get
diluted feature by feature.

**Tasks:**

- [ ] Review every route transition, modal, and async list for: layout
      shift, missing loading state, or an instant/jarring pop-in
      instead of a deliberate transition.
- [ ] Fix whatever this review finds before considering the frontend
      production-ready.

**Acceptance criteria:**

- [ ] A full click-through of the app, done deliberately looking for
      jank, finds none worth fixing further.

---

### 🎫 FASE13-05 — CI/CD deploy pipeline

**Type:** infra
**Estimate:** M (2–3h)
**Depends on:** FASE0-08, deployment target decided

**Tasks:**

- [ ] Extend CI to deploy automatically on merge to `main`, once a
      deployment target is chosen (see `AGENTS.md`'s current-state
      note — not yet decided).

**Acceptance criteria:**

- [ ] A merge to `main` that passes tests deploys without manual steps.

---

### ✅ Fase 13 exit checklist — frontend v1

- [ ] Every phase's exit criteria met.
- [ ] Perceived-performance pass (FASE13-04) completed, not skipped.
- [ ] E2E suite green in CI.
- [ ] Deployed and reachable at a real URL, talking to the production
      backend.
