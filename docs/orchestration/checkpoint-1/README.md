# Checkpoint 1 - Factory Console And API Spine

## Outcome

Build the first live product spine for the Governed Agentic Automation Factory. A user should be able to submit a Customer360 build request, answer deterministic clarification questions, see governance and approval state, inspect a build manifest, and follow the audit timeline in a polished Factory Console backed by the local Factory API.

This checkpoint is intentionally local-first. UiPath platform assets are documented and mapped, but full live Maestro/API Workflow/Data Service execution belongs to Checkpoint 4.

## Base

- Integration branch: `main`
- Initial orchestration base: `342cd1dc93bbac53f1d7bba77e94aa91bc6e7eaa`
- Repo: `AbhinavGupta707/Ui-Path-Agent-Factory`

## Lanes

### Lane 1 - Factory API Spine

- Prompt: [factory-api.md](../worker-prompts/checkpoint-1-factory-api.md)
- Owns: `services/factory-api/**`, `packages/shared-contracts/**` only for API-facing schemas/types.
- Produces: request lifecycle endpoints, local store adapter, deterministic clarification/governance/manifest generation, audit events, tests.

### Lane 2 - Factory Console UX

- Prompt: [factory-console.md](../worker-prompts/checkpoint-1-factory-console.md)
- Owns: `apps/factory-console/**`.
- Produces: polished request lifecycle UI, local API client, clarification/governance/manifest/timeline panels, quality-gate placeholder, responsive states.

### Lane 3 - UiPath Mapping Docs

- Prompt: [uipath-docs.md](../worker-prompts/checkpoint-1-uipath-docs.md)
- Owns: `uipath/**`, `docs/uipath-setup.md`, `docs/maestro-bpmn.md`, `docs/action-center-approvals.md`, `docs/data-service-schema.md`.
- Produces: platform mapping from the implemented lifecycle to Maestro, Agents, Action Center, Data Service, API Workflow, Orchestrator, Test Manager/Test Cloud, and Apps.

## Merge Order

1. Factory API Spine
2. Factory Console UX
3. UiPath Mapping Docs
4. Integration patch by orchestrator session

## Shared Rules

- Read `AGENTS.md`, this checkpoint doc, and the implementation plan before editing.
- Do not edit generated folders: `dist/`, `node_modules/`, `.agents/`, `.uipath/`.
- Do not write secrets or local `.env` values.
- Preserve the hackathon positioning: UiPath is a core orchestration/governance layer, not a bolt-on.
- Keep unavailable/live-platform gaps honest. Use names such as `platformMode: "local-simulated"` or `platformMode: "uipath-ready"` where appropriate.

## Verification

Each lane runs its own narrow checks. The orchestrator runs final integration:

```bash
npm run smoke
npm audit --audit-level=moderate
git diff --check
```

Manual smoke after merge:

1. Start API and console.
2. Submit a request.
3. Answer clarifications.
4. Generate or view governance.
5. Generate or view manifest.
6. Inspect audit timeline and quality gate placeholder.

## Non-Goals

- Real Codex invocation from Build Worker. That is Checkpoint 3.
- Live Maestro deployment and Data Service entity creation. That is Checkpoint 4.
- Final Vercel deployment and demo polish. That is Checkpoint 5.
