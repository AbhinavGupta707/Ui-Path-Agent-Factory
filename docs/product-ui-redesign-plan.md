# Product UI Redesign Plan

Status: planning draft for turning the Checkpoint 5 proof console into a customer-facing product.

## Reference Read

The reference images in `UI references/` and `Ui References/` point to a different product posture than the current console:

- dark enterprise shell
- simple left navigation
- focused page titles and user profile chrome
- fewer explanatory paragraphs
- clear request wizard
- separate build plan and governance screen
- live run timeline with progress
- polished output preview

The current Factory Console is useful for judging evidence, but it exposes too much backend language at once. The redesign should hide complexity until the user asks for evidence.

## Product Principle

The UI should feel like a finished automation product, not a proof dashboard.

User-facing surface:

- simple request intake
- visible "what happens next"
- readable governance and approval steps
- live progress
- beautiful preview output
- clear success/failure states

Backend complexity moves into:

- details drawers
- evidence panels
- downloadable audit trail
- demo narration
- technical docs

## Information Architecture

Recommended pages:

| Page | User job |
|---|---|
| Home | See recent requests and start a new one |
| New Request | Describe the app/automation and answer guided questions |
| Build Plan | Review matched template, data sources, metrics, governance summary |
| Run Detail | Watch the live agent/workflow run progress |
| Output Preview | Inspect generated Customer360 app |
| Deployments | See sandbox/previews and release status |
| Settings | Configure providers, UiPath, GitHub, deployment targets |

For the hack/demo, we can ship four primary screens first:

1. New Request
2. Build Plan & Governance
3. Live Run
4. Output Preview

## Screen Direction

### 1. New Request

Primary content:

- conversational request card
- "Agent is preparing a few questions" state
- question list with compact answers
- right rail summary: template, complexity, estimated build time, data sensitivity

Avoid:

- raw endpoint names
- audit jargon
- huge policy blocks

### 2. Build Plan & Governance

Primary content:

- three-step review component: Plan, Governance, Approvals
- generated build plan card
- selected sources, metrics, output artifacts, refresh cadence
- right rail governance summary and required approvals

User action:

- Approve plan
- Request changes

### 3. Live Run

Primary content:

- horizontal progress rail
- current active stage
- progress bar
- live activity log
- right rail: branch, tests, guardrails, current approval/deploy state

Important behavior:

- poll or subscribe to Factory API timeline
- show real timestamps
- show running, passed, blocked, failed, and retry states
- keep technical details in expandable rows

### 4. Output Preview

Primary content:

- generated Customer360 dashboard preview
- privacy-safe notice
- date/filter controls
- KPI cards
- charts
- product/customer behavior sections

Important behavior:

- the preview opens from run output, not as an unrelated separate demo page
- deployment status and sandbox badge should be visible
- underlying data mode can stay in a compact control, not as a large evidence section

## Visual System

Baseline from `webdesign` retrieval:

- pattern: enterprise gateway/product shell
- style: dark OLED product UI
- colors: deep navy/slate background, violet/blue accent, green success, amber approval, red risk
- typography: clean sans with optional mono for run logs and IDs
- motion: subtle progress transitions, active-step glow, reduced-motion support

Implementation tokens:

```css
:root {
  --bg: #070d18;
  --surface: #0d1726;
  --surface-2: #121f33;
  --border: rgba(148, 163, 184, 0.22);
  --text: #f8fafc;
  --muted: #9caec4;
  --accent: #7c5cff;
  --accent-2: #22d3ee;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #fb7185;
  --radius: 8px;
}
```

Use lucide icons already present in the app. Avoid decorative cards nested inside cards. Repeated operational items can remain cards.

## UX Behavior Contract

- The primary action is always obvious: Submit, Approve, Start build, Open preview.
- Every long-running action creates a visible run event.
- If a live provider is missing, show "configuration required" with a specific missing key or connection.
- Do not silently fall back from live to local simulation.
- "Technical evidence" is available, but not the default view.
- No raw PII appears in the UI or trace payloads.

## Frontend Implementation Shape

Refactor `apps/factory-console/src/App.tsx` into smaller pieces:

- `components/AppShell.tsx`
- `components/RequestIntake.tsx`
- `components/BuildPlan.tsx`
- `components/RunTimeline.tsx`
- `components/OutputPreviewLink.tsx`
- `components/EvidenceDrawer.tsx`
- `lib/factoryClient.ts`
- `lib/runState.ts`

Add a route-like state model without bringing in a router unless needed:

```ts
type ProductView = "new-request" | "build-plan" | "run" | "output";
```

The existing `factoryClient.ts` should expand from health/intake only to the full lifecycle client.

## Current UI Issues To Fix

- Timeline/audit text wraps too narrowly in lower scroll positions.
- The console shows backend proof language as primary content.
- The dashboard and factory console feel like separate demos instead of one generated output flow.
- The left rail lists lifecycle internals rather than product navigation.
- The quality gates and platform evidence panels are useful, but should move to an evidence drawer.

## Acceptance Criteria

- A business user can understand the flow without reading docs.
- A technical judge can open evidence and see real runtime state.
- The run view updates from API state rather than static seed arrays.
- The output preview is linked to the run and deploy record.
- The UI remains polished at laptop widths from 1280 to 1920.
- Mobile can be responsive, but laptop is the primary demo target.
