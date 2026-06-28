You are the Checkpoint 1 UiPath Mapping Docs lane for the Governed Agentic Automation Factory.

Read first:

- `AGENTS.md`
- `governed_agentic_automation_factory_implementation_plan.md`
- `docs/orchestration/checkpoint-1/README.md`
- `uipath/service-readiness.md`
- `docs/setup.md`

Base state:

- Branch: `main`
- Initial orchestration base commit: `342cd1dc93bbac53f1d7bba77e94aa91bc6e7eaa`

Goal:

Create precise implementation guidance that maps the Checkpoint 1 local lifecycle to UiPath platform assets we will build in later checkpoints. The docs should let a future worker implement Maestro, Agents, Action Center, Data Service, API Workflow, Orchestrator, Test Manager/Test Cloud, and Apps without redoing discovery.

Ownership:

- You may edit `uipath/**`.
- You may create or edit:
  - `docs/uipath-setup.md`
  - `docs/maestro-bpmn.md`
  - `docs/action-center-approvals.md`
  - `docs/data-service-schema.md`
  - `docs/api-workflow-contract.md`
  - `docs/test-cloud-quality-gates.md`
- Do not edit `apps/**`, `services/**`, `packages/**`, root config, generated output, `.env`, `.agents/**`, or `.uipath/**`.

Implementation requirements:

- Preserve the actual verified tenant/folder facts:
  - org `galacticus`
  - tenant `DefaultTenant`
  - folder `AgentFactoryDemo`
  - folder key `cba41e19-47cc-4a0a-bf73-de88b60a61be`
  - folder id `7986306`
- Define a BPMN state map from intake through release approval.
- Define Data Service entity shapes aligned with the shared contracts and API lifecycle.
- Define Action Center approval payloads and decision outcomes.
- Define API Workflow call contracts for triggering the Build Worker and posting status updates.
- Define Test Cloud/Test Manager quality-gate mapping.
- Define how UiPath Apps fits as a companion intake/status surface while the custom Factory Console remains the polished primary UI.
- Keep live/unavailable claims honest; if something is not created yet, label it planned or checkpoint-scoped.

Verification:

```bash
git diff --check -- uipath docs
```

Handoff:

Report changed files, platform mapping summary, open assumptions, commands run, and exact next steps for Checkpoint 4.
