You are the Checkpoint 1 Factory Console UX implementation lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/orchestration/checkpoint-1/README.md`
- `packages/shared-contracts/src/index.ts`

Base state:

- Branch: `main`
- Initial orchestration base commit: `342cd1dc93bbac53f1d7bba77e94aa91bc6e7eaa`

Goal:

Implement a polished, enterprise-focused Factory Console experience for the Checkpoint 1 request lifecycle. The user should be able to compose a Customer360 dashboard request, see clarification questions/answers, inspect governance, review a build manifest, and follow timeline/audit/quality gate state.

Ownership:

- You may edit `apps/factory-console/**`.
- You may add app-local UI helpers, mock data, and client modules inside `apps/factory-console/src/**`.
- Do not edit `services/factory-api/**`, `packages/shared-contracts/**`, `uipath/**`, root config, generated output, `.env`, `.agents/**`, or `.uipath/**`.

Implementation requirements:

- Build the real usable console as the first screen; no marketing landing page.
- Use a dense but beautiful enterprise operations aesthetic.
- Include these surfaces:
  - request intake composer
  - source system toggles and policy controls
  - clarification workspace
  - structured spec preview
  - governance/approval panel
  - build manifest viewer
  - timeline/audit trail
  - quality gate placeholder with UiPath/Test Cloud-ready status
- Show UiPath product labels where relevant: Maestro, Agents, Action Center, Data Service, API Workflow, Orchestrator, Test Cloud, Codex worker.
- Use local deterministic seeded state if the API lane has not yet landed. Make the API client boundary easy to swap to live endpoints after merge.
- Include loading, empty, degraded/offline, and success states.
- Make the UI responsive down to mobile widths without overlapping text.
- Keep colors restrained and not one-note; avoid marketing hero patterns.

Verification:

```bash
npm run typecheck -w @agent-factory/factory-console
npm run build -w @agent-factory/factory-console
```

Manual smoke:

- Render the console.
- Fill the request form or use seed data.
- Navigate clarification, governance, manifest, timeline, and quality sections.

Handoff:

Report changed files, UX flow, local/API boundary assumptions, commands run, pass/fail, remaining visual risks, and integration instructions.
