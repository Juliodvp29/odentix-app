# Odentix — Design System

> a quiet clinical instrument

**Theme:** light

This system is original to Odentix, synthesized from two references
(Steep's editorial restraint, shadcn/ui's monochromatic dashboard
vocabulary) but built specifically for a data-dense clinical admin
panel — neither reference needed a semantic status palette or motion
rules, and this product needs both.

Odentix reads like a quiet clinical instrument: a warm off-white canvas,
hairline borders, and a single muted teal accent reserved for primary
actions and focus states. Nothing shouts. Status is communicated
through soft-tinted badges, never saturated alert colors — a critical
inventory warning should feel like information, not an emergency siren.
Elevation is nearly imperceptible, relying on 1px hairlines more than
shadow. The interface trusts restraint: generous breathing room,
contained type weights, and motion that is deliberate and never instant
— actions should feel considered, not abrupt.

---

## Tokens — Colors

### Neutrals

| Name        | Value     | Token                 | Role                                                                  |
| ----------- | --------- | --------------------- | --------------------------------------------------------------------- |
| Canvas      | `#faf9f7` | `--color-canvas`      | Page background — warm off-white, never stark clinical white          |
| Paper       | `#ffffff` | `--color-paper`       | Card surfaces, modal surfaces, popovers                               |
| Surface Alt | `#f5f3f0` | `--color-surface-alt` | Sidebar background, input resting fill, secondary buttons             |
| Hairline    | `#e7e4e0` | `--color-hairline`    | Borders, dividers, card edges — the primary depth cue, not shadow     |
| Ink         | `#1c1b19` | `--color-ink`         | Primary text, headings — warm near-black, never pure `#000`           |
| Ink Soft    | `#33312e` | `--color-ink-soft`    | Filled button backgrounds, secondary headings                         |
| Mid Gray    | `#8a8782` | `--color-mid-gray`    | Muted body text, helper text, breadcrumb separators, placeholder text |
| Faint Gray  | `#b4b1ac` | `--color-faint-gray`  | Disabled labels, tertiary metadata                                    |

### Accent

| Name      | Value     | Token               | Role                                                                                                                  |
| --------- | --------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Teal      | `#3f6b63` | `--color-teal`      | Primary action fill, active nav item, focus ring, links — the one chromatic surface used for emphasis, not decoration |
| Teal Deep | `#244b45` | `--color-teal-deep` | Hover/pressed state of primary actions, text on Teal Soft                                                             |
| Teal Soft | `#e7efed` | `--color-teal-soft` | Active nav background, selected-row tint, info-adjacent badge background                                              |

### Semantic (status) — all muted, none saturated

Every semantic color follows the same three-step pattern: a soft tint
for badge backgrounds, a deep tone for text on that tint, and the base
tone for icons, borders, or small indicators. **Never use the base tone
as a large fill** — it stays reserved for small, precise marks.

| Status  | Base                        | Soft (bg)                        | Deep (text-on-soft)              |
| ------- | --------------------------- | -------------------------------- | -------------------------------- |
| Success | `#5b8a6f` `--color-success` | `#eaf2ed` `--color-success-soft` | `#2f5a40` `--color-success-deep` |
| Warning | `#b08a4e` `--color-warning` | `#f7f0e4` `--color-warning-soft` | `#7a5a26` `--color-warning-deep` |
| Danger  | `#b15a4a` `--color-danger`  | `#f7eae7` `--color-danger-soft`  | `#7a3527` `--color-danger-deep`  |
| Info    | `#5b7a9b` `--color-info`    | `#ebf0f5` `--color-info-soft`    | `#33526e` `--color-info-deep`    |

**Mapping to backend states** (so color usage stays consistent across
the app, not decided ad hoc per screen):

- Appointments: `confirmada`/`atendida` → Success · `programada` →
  Info · `no_show`/`cancelada` → Danger (soft only — a cancelled
  appointment is informational, not alarming)
- Invoices: `pagada` → Success · `pendiente` → Warning · `parcial` →
  Info · `anulada` → Danger
- Inventory critical threshold → Warning, never Danger — it is
  actionable, not urgent, until it's actually out of stock
- Opportunities priority → Teal intensity (soft → base) rather than a
  separate color scale — priority is emphasis, not a status

---

## Tokens — Typography

### Geist — the only typeface in the system

One typeface, three weights. No serif, no display pairing — a
dashboard used many times a day rewards consistency over editorial
flourish. `--font-sans`

- **Substitute:** Inter, ui-sans-serif, system-ui
- **Weights:** 400 (body), 500 (emphasis, buttons, labels), 600
  (headings, large numerals)
- **OpenType features:** `"ss01" on, "cv11" on` (Geist's alternate
  figures — matters here, this product shows a lot of currency and
  counts)

### Type Scale

| Role       | Size | Line Height | Letter Spacing | Weight | Token               |
| ---------- | ---- | ----------- | -------------- | ------ | ------------------- |
| caption    | 12px | 1.4         | 0.02em         | 400    | `--text-caption`    |
| body       | 14px | 1.5         | 0              | 400    | `--text-body`       |
| body-lg    | 16px | 1.5         | 0              | 400    | `--text-body-lg`    |
| subheading | 18px | 1.4         | 0              | 500    | `--text-subheading` |
| heading-sm | 20px | 1.3         | -0.01em        | 600    | `--text-heading-sm` |
| heading    | 24px | 1.25        | -0.02em        | 600    | `--text-heading`    |
| heading-lg | 30px | 1.2         | -0.02em        | 600    | `--text-heading-lg` |
| display    | 36px | 1.15        | -0.03em        | 600    | `--text-display`    |

`display` is reserved for page titles and large KPI numerals (portfolio
totals, recovered-value metrics) — never body copy, never more than one
per screen.

---

## Tokens — Spacing & Shape

**Base unit:** 4px
**Density:** comfortable-compact — dense enough for data tables,
generous enough not to feel cramped

### Spacing Scale

| Name | Value | Token          |
| ---- | ----- | -------------- |
| 4    | 4px   | `--spacing-4`  |
| 8    | 8px   | `--spacing-8`  |
| 12   | 12px  | `--spacing-12` |
| 16   | 16px  | `--spacing-16` |
| 20   | 20px  | `--spacing-20` |
| 24   | 24px  | `--spacing-24` |
| 32   | 32px  | `--spacing-32` |
| 40   | 40px  | `--spacing-40` |
| 48   | 48px  | `--spacing-48` |
| 64   | 64px  | `--spacing-64` |

### Border Radius

| Element                       | Value  | Token              |
| ----------------------------- | ------ | ------------------ |
| cards                         | 16px   | `--radius-card`    |
| modal                         | 20px   | `--radius-modal`   |
| buttons / inputs              | 10px   | `--radius-control` |
| badges / pills                | 9999px | `--radius-pill`    |
| small (checkbox, icon button) | 6px    | `--radius-sm`      |
| avatar                        | 9999px | `--radius-pill`    |

Buttons and inputs are softly rounded rectangles, **not full pills** —
full-pill CTAs read as marketing-site, not clinical software. Only
small tags and avatars go fully round.

### Shadows — whisper-quiet, hairline-first

| Name    | Value                                                              | Token              |
| ------- | ------------------------------------------------------------------ | ------------------ |
| resting | `0 0 0 1px var(--color-hairline)`                                  | `--shadow-resting` |
| raised  | `0 0 0 1px var(--color-hairline), 0 2px 8px rgba(28,27,25,0.06)`   | `--shadow-raised`  |
| overlay | `0 0 0 1px var(--color-hairline), 0 12px 32px rgba(28,27,25,0.10)` | `--shadow-overlay` |

`resting` covers cards and table rows. `raised` covers dropdowns and
popovers. `overlay` is reserved for modals — it is the only shadow
allowed to read as "floating."

### Layout

- **Content max-width:** 1280px
- **Sidebar width:** 264px
- **Section gap:** 32px
- **Card padding:** 20px
- **Element gap:** 8px

---

## Tokens — Motion

This is the section that makes the interface _feel_ like the rest of
this system looks. No transition in the product should be instant
(`0ms`) if it's visually noticeable, and none should exceed 300ms —
past that, fluid starts to feel sluggish.

| Token                | Value                           | Use                                                        |
| -------------------- | ------------------------------- | ---------------------------------------------------------- |
| `--duration-fast`    | 120ms                           | Hover states, button press, checkbox toggle                |
| `--duration-base`    | 200ms                           | Dropdown open/close, tab switch, tooltip                   |
| `--duration-slow`    | 300ms                           | Modal enter/exit, route transitions, toast enter           |
| `--ease-standard`    | `cubic-bezier(0.4, 0, 0.2, 1)`  | Default for anything that both enters and exits            |
| `--ease-decelerate`  | `cubic-bezier(0, 0, 0.2, 1)`    | Entering elements (modal opening, toast appearing)         |
| `--ease-accelerate`  | `cubic-bezier(0.4, 0, 1, 1)`    | Exiting elements (modal closing, item removed from a list) |
| `--duration-shimmer` | 1500ms, `ease-in-out`, infinite | Skeleton loading shimmer                                   |

**Rules:**

- A modal opens with `--duration-slow` + `--ease-decelerate`, and
  closes with `--duration-base` + `--ease-accelerate` — exits should
  feel quicker than entries, they're a lower-attention moment.
- Route transitions use `--duration-slow`. Never a hard cut, but also
  never a heavy, showy animation — a subtle fade/slight-slide is
  enough; this is a tool used dozens of times a day, not a landing page.
- Skeletons, never spinners, for anything that takes longer than one
  frame to resolve — see `AGENTS.md` §7 in the frontend repo.
- Nothing animates its own layout size in a way that shifts neighboring
  content — animate opacity/transform, not width/height, wherever the
  two would otherwise be equivalent.

---

## Components

### Button — Primary

**Role:** highest-emphasis action per screen (Save, Create, Confirm)

Background `--color-teal`, text `--color-paper`, radius
`--radius-control`, padding `8px 16px`, font `--text-body` weight 500.
Hover: `--color-teal-deep`. Loading state replaces label with an inline
spinner at the same footprint — the button never changes size when it
starts loading.

### Button — Secondary

**Role:** paired secondary action (Cancel beside Save)

Background `--color-surface-alt`, text `--color-ink`, no border, same
radius/padding/font as Primary. Hover: `--color-hairline`. Reads as a
tonal sibling, not a weaker option — same shape and weight, differing
only in fill.

### Button — Ghost

**Role:** low-emphasis inline action (table row actions, "View details")

Transparent background, text `--color-ink`, no border. Hover reveals
`--color-surface-alt` background at `--duration-fast`.

### Button — Danger

**Role:** destructive confirmation (Delete, Cancel appointment)

Background `--color-danger`, text `--color-paper`. Hover:
`--color-danger-deep`. Reserved exclusively
for actions with irreversible or costly consequences — never for
ordinary negative actions like "close" or "dismiss."

### Input / Select / FormField

**Role:** all Signal Forms text entry and selection

Background `--color-surface-alt` at rest with a 1px `--color-hairline` border,
`--color-paper` with a 1px `--color-teal` border and ring on focus.
Placeholder text uses `--color-mid-gray`. Radius `--radius-control`, padding
`8px 12px`, font `--text-body`. Error state: 1px `--color-danger`
border plus a `--text-caption` message below in `--color-danger-deep`
— never color alone, always paired with text (accessibility).

### Modal

**Role:** create/edit forms, confirmations

Surface `--color-paper`, radius `--radius-modal`, shadow
`--shadow-overlay`, padding 24px. Built on CDK's overlay/dialog
primitives (focus trap, escape-to-close, scroll lock). Enters/exits per
the Motion rules above — this is one of the components Julio has
called out specifically, treat its transition as non-negotiable
polish, not an afterthought.

### Toast / Alert

**Role:** transient feedback (success/error/info/warning after an action)

Surface `--color-paper`, shadow `--shadow-raised`, radius
`--radius-card`, left border 3px in the relevant semantic base color
(the only place a semantic _base_ tone touches a large surface edge,
not a fill). Auto-dismiss after 4s for success/info, stays until
dismissed for error/warning.

### Table

**Role:** every list view in the app (patients, appointments, invoices,
leads, inventory)

Header row: `--text-caption` weight 500, `--color-mid-gray`, uppercase,
bottom border `--color-hairline`. Body rows: `--text-body`, hover
background `--color-surface-alt` at `--duration-fast`. Loading state is
a skeleton matching the exact column widths — never a spinner replacing
the whole table. Empty state: centered icon + `--text-body` message in
`--color-mid-gray`, never a bare blank area.

### Skeleton

**Role:** loading placeholder for anything async

Background `--color-surface-alt`, animated shimmer per
`--duration-shimmer`, radius matching whatever it's standing in for
(text line: `--radius-sm`; avatar: `--radius-pill`; card: `--radius-card`).

### Badge / Status Pill

**Role:** appointment status, invoice status, lead pipeline stage,
inventory alerts — see the semantic color mapping above

Background `{status}-soft`, text `{status}-deep`, radius
`--radius-pill`, padding `2px 10px`, font `--text-caption` weight 500.
No border, no shadow — the tint alone carries the meaning.

### Sidebar Navigation

**Role:** primary app navigation, role-aware (per user's role from the
backend)

Surface `--color-surface-alt`, width `--sidebar-width` (264px). Active
item: `--color-teal-soft` background, `--color-teal-deep` text, no
border. Inactive item: `--color-mid-gray` text, hover reveals
`--color-hairline`-toned background at `--duration-fast`.

### Stat Card

**Role:** KPI display (portfolio totals, recovered value, conversion
metrics)

Surface `--color-paper`, radius `--radius-card`, shadow
`--shadow-resting`, padding 20px. Label in `--text-caption`
`--color-mid-gray` uppercase, value in `--text-display`
`--color-ink`, optional delta line in `--text-caption` with the
relevant semantic color (green delta = Success base, red = Danger
base — the one place base tones appear as small text, not fills).

### Tabs

**Role:** sectioning within a detail view (patient's clinical
records / odontogram / files)

Underline style: transparent background, active tab text `--color-ink`
with a 2px `--color-teal` bottom border, inactive tabs
`--color-mid-gray`. Transition on switch: `--duration-base`
`--ease-standard`.

### Odontogram chart

**Role:** visual dental chart in the patient detail (32 FDI teeth, 5
surfaces each, grouped in 4 quadrants).

The chart follows the clinical convention, not the app's status
semantics: `--color-danger` = diagnosis pending, `--color-info` =
proposed plan, `--color-success` = completed treatment,
`--color-mid-gray` = current state, neutral `--color-surface-alt`
fill with `--color-hairline` stroke = no data, gray cross = missing
tooth. When a tooth holds several entries, the highest-priority type
wins (diagnosis > proposed > completed > current). The side panel
keeps the standard soft-badge pattern for coherence.

Selected tooth: 2px `--color-teal` border. Keyboard: roving tabindex
with arrow navigation; tooltip per the Tooltip spec.

### Tooltip

**Role:** supplementary context on hover/focus

Surface `--color-ink`, text `--color-paper`, radius `--radius-sm`,
padding `4px 8px`, font `--text-caption`. Appears after a short delay
(~400ms) to avoid flashing on incidental mouse-over.

### Empty State

**Role:** any list/view with no data yet

Centered content: a simple icon or illustration (flat, monochrome —
never a busy illustration that fights the system's restraint), a
`--text-subheading` message, and — where relevant — a Primary button
to create the first item.

### Avatar

**Role:** professional/user presence indicator

Circular, `--radius-pill`, background `--color-teal-soft`, initials in
`--text-caption` weight 500 `--color-teal-deep`. No photo support
needed for v1 — initials only.

---

## Do's and Don'ts

### Do

- Use `--color-teal` for exactly one primary action per screen — if two
  things compete for Primary treatment, one of them is actually
  Secondary.
- Use the three-step semantic pattern (soft bg / deep text / base for
  small marks only) for every status indicator — appointments,
  invoices, leads, inventory, opportunities all read from the same four
  semantic colors, never a fifth ad hoc color.
- Keep shadows hairline-first (`--shadow-resting` as the default);
  reserve `--shadow-overlay` exclusively for modals so "floating" stays
  meaningful.
- Animate every modal, toast, and route change per the Motion tokens —
  treat a missing transition as a bug, not a missing nice-to-have.
- Use skeletons, matched to the real content's shape, for every loading
  state longer than a frame.

### Don't

- Don't introduce a chromatic color outside Teal + the four semantic
  colors — a fifth accent breaks the "nothing shouts" premise this
  system is built on.
- Don't use a semantic _base_ tone as a large fill (a whole badge, a
  whole card) — base tones are for small marks and text; soft tones are
  for backgrounds.
- Don't use full-pill (`9999px`) radius on buttons or inputs — that
  reads as consumer/marketing, not clinical software. Reserve full-pill
  for badges and avatars only.
- Don't use a spinner where a skeleton is possible — a spinner
  communicates "wait, unknown," a skeleton communicates "this is coming,
  here's its shape."
- Don't set any user-visible transition to `0ms` or to more than
  `300ms` — outside that range it reads as either broken or sluggish.
- Don't stack more than one `--text-display` numeral per screen.

---

## Similar Systems

- **shadcn/ui** — shares the monochromatic-first approach and hairline
  card borders; Odentix softens its compact density with more generous
  spacing and a warmer, less stark neutral base
- **Linear** — same restraint on chromatic color and tight heading
  tracking, applied here to a healthcare-admin context instead of
  project management
- **Notion** — similar warm-neutral canvas (not stark white) and
  reliance on subtle tonal shifts over borders for hierarchy

---

## Quick Start

### Tailwind v4

```css
@theme {
  /* Colors — Neutrals */
  --color-canvas: #faf9f7;
  --color-paper: #ffffff;
  --color-surface-alt: #f5f3f0;
  --color-hairline: #e7e4e0;
  --color-ink: #1c1b19;
  --color-ink-soft: #33312e;
  --color-mid-gray: #8a8782;
  --color-faint-gray: #b4b1ac;

  /* Colors — Accent */
  --color-teal: #3f6b63;
  --color-teal-deep: #244b45;
  --color-teal-soft: #e7efed;

  /* Colors — Semantic */
  --color-success: #5b8a6f;
  --color-success-soft: #eaf2ed;
  --color-success-deep: #2f5a40;
  --color-warning: #b08a4e;
  --color-warning-soft: #f7f0e4;
  --color-warning-deep: #7a5a26;
  --color-danger: #b15a4a;
  --color-danger-soft: #f7eae7;
  --color-danger-deep: #7a3527;
  --color-info: #5b7a9b;
  --color-info-soft: #ebf0f5;
  --color-info-deep: #33526e;

  /* Typography */
  --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  --text-caption: 12px;
  --leading-caption: 1.4;
  --tracking-caption: 0.02em;
  --text-body: 14px;
  --leading-body: 1.5;
  --text-body-lg: 16px;
  --leading-body-lg: 1.5;
  --text-subheading: 18px;
  --leading-subheading: 1.4;
  --text-heading-sm: 20px;
  --leading-heading-sm: 1.3;
  --tracking-heading-sm: -0.01em;
  --text-heading: 24px;
  --leading-heading: 1.25;
  --tracking-heading: -0.02em;
  --text-heading-lg: 30px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: -0.02em;
  --text-display: 36px;
  --leading-display: 1.15;
  --tracking-display: -0.03em;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Border Radius */
  --radius-card: 16px;
  --radius-modal: 20px;
  --radius-control: 10px;
  --radius-pill: 9999px;
  --radius-sm: 6px;

  /* Shadows */
  --shadow-resting: 0 0 0 1px var(--color-hairline);
  --shadow-raised: 0 0 0 1px var(--color-hairline), 0 2px 8px rgba(28, 27, 25, 0.06);
  --shadow-overlay: 0 0 0 1px var(--color-hairline), 0 12px 32px rgba(28, 27, 25, 0.1);

  /* Layout */
  --content-max-width: 1280px;
  --sidebar-width: 264px;
}
```

### Motion (plain CSS custom properties — Tailwind v4 has no theme

namespace for durations/easings, so these live alongside `@theme`
rather than inside it)

```css
:root {
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --duration-shimmer: 1500ms;

  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
}
```
