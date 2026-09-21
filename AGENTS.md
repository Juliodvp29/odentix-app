# AGENTS.md

These are the instructions for any coding agent (Claude Code, Cursor,
Copilot Workspace, etc.) working in this repository.

**Language rule — read this first:** all code, comments, commit messages,
file names, and documentation in this project are written in **English**.
This file itself is in English for that reason. However, when a coding
agent is talking _to Julio_ in a chat/conversation (not writing code),
**it must always respond in Spanish**, regardless of the language used
elsewhere in the project. These are two separate rules for two separate
audiences — do not mix them up in either direction.

If an instruction from Julio in chat contradicts something critical here
(especially the design-system or performance rules), point out the
contradiction instead of silently applying it.

---

## 1. What this project is

Frontend for **Odentix**, a multi-tenant SaaS for managing dental clinics
in Colombia. It consumes the API exposed by
[`odentix-backend`](https://github.com/Juliodvp29/odentix-backend)
(Spring Boot 4.1, already at a stable v1).

The product's differentiator is not just record-keeping — the backend
detects missed business opportunities (unanswered leads, treatments with
no follow-up, overdue balances, etc.) and proposes an action. The
frontend's job is to make all of that feel effortless to act on.

**The single biggest differentiator this frontend must have is feel, not
features.** Route transitions, opening a modal, showing an alert,
loading a list — all of it must feel fluid and stable. This is not a
nice-to-have; it is treated as a hard requirement throughout this
document (see section 7).

Reference documents:

- `DESIGN.md` — the visual system (colors, typography, spacing,
  component states). **Any UI work must follow it.** If `DESIGN.md`
  doesn't cover a case you need, stop and ask instead of inventing a
  generic-looking pattern.
- `ROADMAP.md` — phases and tickets for this project.

### Skills available

There is a `.agents/skills/` folder in the repo root with instructions
for specific tasks. **Check `.agents/skills/` before starting any task**
— it takes priority over your default judgment, same as the rest of this
file. If there's no relevant skill for the current task, just follow the
rules in this file.

---

## 2. Stack and exact versions

- **Angular 22** — stable release (May 2026). This version matters for
  what it makes default, not just what it adds:
  - **Zoneless + `OnPush` by default** for new components. Never opt
    back into Zone.js-based patterns or `ChangeDetectionStrategy.Default`
    (now called `Eager`) without an explicit, documented reason.
  - **Signal Forms** (`@angular/forms/signals`) are stable — use them
    for all forms in this project. Do not use Reactive Forms or
    Template-driven Forms for new work.
  - **`resource()` / `httpResource()`** are stable — prefer them over
    hand-rolled RxJS + `HttpClient` combinations for data fetching.
  - **Vitest is the CLI's default test runner** in this version — this
    lines up with the project's testing requirement (section 8), no
    extra setup needed to swap out Karma/Jasmine.
  - Standalone components only. No `NgModule`.
- **TypeScript** — whatever version Angular 22 requires; strict mode
  enabled in `tsconfig.json`, no exceptions without a documented reason.
- **Tailwind CSS v4.x** — CSS-first configuration. There is **no**
  `tailwind.config.js`; configuration lives in the stylesheet itself via
  `@import "tailwindcss"` and `@source` directives. **Tailwind v4 is not
  compatible with Sass/SCSS** — this project's stylesheets are plain
  CSS, not `.scss`. Do not introduce Sass anywhere.
- **Angular CDK** — for headless, accessible behavior (overlay, portal,
  focus trap, a11y primitives) behind custom-styled, Tailwind-based
  components. Do not pull in a themed component library (Angular
  Material, PrimeNG, etc.) — it fights against `DESIGN.md` by design.
- **State management: plain Angular Signals** (services exposing
  `signal()`/`computed()`), no NgRx. If a specific slice of state
  genuinely outgrows this (complex cross-cutting real-time state, for
  example), raise it explicitly before introducing a state library —
  it is not a default, ever.
- **API types are generated, never hand-written.** They come from the
  backend's OpenAPI spec:
  ```bash
  npx openapi-typescript http://localhost:8081/v3/api-docs -o src/app/core/api/schema.ts
  ```
  This requires `odentix-backend` running locally on port 8081 (its
  established dev port — see that repo's `AGENTS.md`). **Never edit
  `src/app/core/api/schema.ts` by hand** — if it looks wrong, the fix is
  in the backend's API or in the generation command, not in that file.
- **Testing:** Vitest for unit tests. Playwright for E2E — **this is an
  assumption, not yet confirmed with Julio**; flag it if it matters for
  what you're doing, and update this line once it's settled.
- **CI/CD:** GitHub Actions, same pattern as `odentix-backend`.

---

## 3. Essential commands

```bash
npm start                      # dev server
npm test                       # Vitest, watch mode
npm run test:ci                # Vitest, single run (for CI)
npm run build                  # production build
npm run lint                   # ESLint
npm run format                 # Prettier

# Regenerate API types from the local backend (must be running on :8081)
npm run generate:api-types
```

If any of these scripts don't exist yet in `package.json`, that's a sign
we're early in Fase 0 of the roadmap — don't invent behavior for a
command that isn't wired up yet, say so instead.

---

## 4. Architecture and conventions

```
src/app/
├── core/              # singletons: API client, schema.ts, interceptors,
│                      # guards, app-wide services
│   └── api/
│       └── schema.ts  # GENERATED — never hand-edit
├── shared/            # reusable, feature-agnostic building blocks:
│                      # buttons, modals, tables, alerts, skeletons,
│                      # pipes, directives
└── features/          # one folder per business feature (patients,
                        # appointments, treatment-plans, leads, ...),
                        # each lazy-loaded via routes
```

- Modern Angular syntax only: `@if`/`@for`/`@switch` control flow (never
  `*ngIf`/`*ngFor`), `input()`/`output()` signal-based APIs (never
  `@Input()`/`@Output()` decorators), `inject()` function (never
  constructor injection).
- `@defer` for anything heavy or below the fold — this is one of the
  main tools for the performance requirement in section 7, use it
  deliberately, not only when convenient.
- Component hosts default to `display: inline`, where vertical margins
  from `space-y` layouts silently do nothing. Any component rendered as
  a direct child of a stacked layout needs `host: { class: 'block' }` —
  keep `Icon`/`Link` inline (they live in text and flex flows).
- **No component file over ~200 lines.** If a component is approaching
  that, it's telling you to extract a child component, move logic into a
  service, or split a template into smaller pieces. This is a hard
  guideline, not a suggestion — Julio has explicitly said he does not
  want 500-line components that are unclear about what they do.
- One clear responsibility per component/service/pipe. If you can't
  describe what a file does in one sentence, it's doing too much.

---

## 5. Non-negotiable rules

1. **Never hardcode secrets, API keys, or environment-specific URLs in
   code.** They live in `environment.ts` (dev) and `environment.prod.ts`
   (prod), neither of which is committed with real values.
   `environment.example.ts` — with placeholder values — is the one that
   _is_ committed, so anyone cloning the repo knows what to fill in.
2. **Never hand-edit `core/api/schema.ts`.** Regenerate it instead (see
   section 3). If the generated types don't match what you need, the
   backend's OpenAPI spec needs to change first.
3. **Every route transition, modal, alert, and async operation needs a
   defined loading/empty/error state before it's considered done.** No
   blank screens, no layout shift while data resolves. This is the
   direct, literal implementation of "the UI must feel fluid and
   stable" — treat it with the same seriousness as multi-tenancy is
   treated in the backend's `AGENTS.md`.
4. **All interactive elements must be keyboard-accessible with a visible
   focus state.** This comes largely for free from Angular CDK — don't
   bypass it with custom `div`-based "buttons" or similar.
5. **Follow `DESIGN.md`'s tokens.** No ad-hoc hex colors, arbitrary
   spacing values, or one-off font sizes in Tailwind classes. If a value
   you need isn't in `DESIGN.md`, that's a signal to update `DESIGN.md`
   first, not to improvise around it — improvising is exactly how a UI
   ends up looking like generic AI output.
6. **No `NgModule`, ever.** This is a fully standalone-components
   project.
7. **No file in `core/api/` is written by hand** except the generation
   script/config itself.

---

## 6. Code style

- Comments in English, describing _what_ non-obvious code does and,
  where it matters, _why_ — not restating the line above it.
- No first-person voice in comments ("I did this because...").
- No emojis in code or comments.
- **Never reference `AGENTS.md`, `ROADMAP.md`, or ticket IDs
  inside code comments.** Those documents are for planning; code should
  be self-explanatory to someone who has never seen them.
- Strict TypeScript: avoid `any`; if unavoidable, comment why.
- Prettier + ESLint are the source of truth for formatting — don't
  hand-format against what they'd produce.

---

## 7. Performance & UX — treated as a hard requirement

This is the part of the project Julio cares about most, so it gets its
own section instead of being folded into "code style."

- Every route is lazy-loaded. Never add a feature to the main bundle
  by default.
- Use `@defer` for below-the-fold content and anything not needed for
  first paint.
- Prefer skeleton loaders over spinners for content that takes a
  moment to arrive — they reduce perceived wait time and prevent layout
  shift once the real content arrives, because the skeleton already
  reserves the right amount of space.
- Never let content pop in and shift what's below/around it. Reserve
  space before data resolves.
- Where it's safe to do so (the action is very likely to succeed),
  prefer optimistic UI updates over waiting for a round-trip before
  reflecting a change.
- Keep an eye on bundle size as features are added — a route that pulls
  in a heavy dependency for a small feature works against everything
  else in this section.
- Zoneless + `OnPush` are already the default in Angular 22 — never
  fight that default by introducing patterns that force full-tree
  change detection.

---

## 8. Testing

- **Every component, service, and pipe needs tests before it's
  considered done.** This is not optional, same as the backend.
- Test files are colocated (`thing.spec.ts` next to `thing.ts`), run
  with Vitest.
- E2E tests with Playwright cover critical user flows (login, creating
  a patient, booking an appointment, etc.) — confirm this tool choice
  with Julio before building out a large E2E suite around it.

---

## 9. What NOT to do

- No `NgModule`.
- No Reactive/Template-driven Forms — Signal Forms only.
- No RxJS where a signal/`resource()` does the job just as well; RxJS is
  for genuinely stream-like problems (websockets, combining multiple
  async sources over time), not the default for every async operation.
- No hardcoded secrets or backend URLs outside the environment files.
- No introducing a themed component library or a state management
  library "because it's common practice" — both are explicit
  non-defaults in this project (section 2).
- No generic, undifferentiated UI. If a screen looks like it could be
  any AI-generated admin dashboard, it does not follow `DESIGN.md`
  closely enough — go back to it.
- No marking a ticket done without passing tests and without Julio
  having reviewed the result (see workflow below).

---

## 10. Mandatory workflow for every task

Same cycle as `odentix-backend`'s `AGENTS.md`, applied here too — for a
full phase, a single ticket, or a small adjustment inside a ticket
already in progress:

1. **Plan before code.** Present what you're going to do, which files
   you'll touch or create, and any non-trivial decision (state shape,
   component boundaries, naming) before writing anything.
2. **Wait for explicit approval** before executing the plan.
3. **Execute exactly what was approved.** If something doesn't work as
   planned, stop and explain rather than improvising silently.
4. **Test before calling it done.** Run the relevant Vitest suite (and
   Playwright E2E if the change touches a covered flow), and check the
   ticket's acceptance criteria in `ROADMAP.md`.
5. **Only after all of the above:** mark the ticket's checklist items
   complete in `ROADMAP.md`, and give Julio the commit message
   to use.

### Commit convention

English, same ticket-prefixed short format as the backend:
`[FASE0-01] Set up Angular 22 project with Tailwind v4`.

---

## 11. Current state / living notes

_(Keep this section current as the project moves — an outdated note here
is more useful than none, but a stale one that misleads is worse than
either.)_

- Backend: **v1 stable**, repo at
  `github.com/Juliodvp29/odentix-backend`, exposes OpenAPI docs at
  `/v3/api-docs` (dev, port 8081).
- Frontend repo: not yet created — this file and `ROADMAP.md`
  are being written before Fase 0 starts.
- E2E tool: **assumed Playwright, not yet confirmed** with Julio.
- Deployment target: **Vercel** (decided after FASE0-01 — SPA fallback
  and Node version pinned in `vercel.json` / `.nvmrc`).
- Phase status: **Fase 0 complete** (project foundations, CI + Vercel
  deploy wired). Next: Fase 1 shared UI kit.
- Fase 3 reminder: the shared table deferred configurable columns
  (show/hide) and density options — add them when the patients list
  defines the real need.
- UI language: **Spanish** for user-facing strings (code stays in
  English). The temporary placeholder demo is still in English; its fate
  (formal kit-preview route vs. deletion) is decided at the Fase 1 exit.
- App shell: `src/app/shell/` (layout frame with role-aware nav). It is
  neither a lazy business feature nor a singleton service, so it lives
  outside `core/`/`shared/`/`features/` by design.
- `DESIGN.md`: exists at the repo root (full token system + component
  specs). All UI work must follow it; Fase 1 can start in earnest.

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
