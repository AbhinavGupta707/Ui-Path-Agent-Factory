You are the Checkpoint 1 Factory API Spine implementation lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/orchestration/checkpoint-1/README.md`
- `uipath/service-readiness.md`

Base state:

- Branch: `main`
- Initial orchestration base commit: `342cd1dc93bbac53f1d7bba77e94aa91bc6e7eaa`

Goal:

Implement the local Factory API spine for request intake, clarification, structured spec, governance assessment, build manifest, status timeline, and audit events. The API should be deterministic and honest about local simulation while shaped for later UiPath Data Service persistence.

Ownership:

- You may edit `services/factory-api/**`.
- You may edit `packages/shared-contracts/**` only for shared API schemas/types required by this lane.
- You may add tests under owned packages.
- Avoid editing `apps/factory-console/**` except if absolutely necessary to preserve compile compatibility; prefer exported contracts.
- Do not edit `uipath/**`, broad docs, root package config, generated output, `.env`, `.agents/**`, or `.uipath/**`.

Implementation requirements:

- Add request lifecycle endpoints for:
  - health
  - list/get requests
  - create intake request
  - answer clarifications
  - generate structured spec
  - generate governance assessment
  - generate build manifest
  - update build/run status
  - get audit timeline
- Keep a local store adapter whose methods can later map to UiPath Data Service entities.
- Emit an audit event for every state transition or generated artifact.
- Add deterministic stub logic for clarification, spec, governance, and manifest. Do not call external models.
- Include `platformMode` or equivalent fields so the UI can show local vs UiPath-ready state honestly.
- Preserve and extend Zod schemas/types in `packages/shared-contracts` where useful.
- Keep API tests pure/sandbox-friendly; avoid opening a network listener in tests.

Verification:

```bash
npm run test -w @agent-factory/shared-contracts
npm run build -w @agent-factory/shared-contracts
npm run test -w @agent-factory/factory-api
npm run build -w @agent-factory/factory-api
```

Handoff:

Report changed files, endpoint list, status/state model changes, tests run, pass/fail, risks, env notes, contract changes, and integration instructions for the console lane.
