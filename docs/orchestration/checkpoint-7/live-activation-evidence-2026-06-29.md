# Checkpoint 7 Live Activation Evidence - 2026-06-29

Status: partial live activation. The local product, API Workflow contract path,
Build Worker, live Codex runner, and sandbox deployment path were exercised.
Cloud Maestro publish/run did not complete because UiPath rejected the
ProcessOrchestration package/release path before a process instance was created.

## Isolation

- UiPath organization: `galacticus`
- Tenant: `DefaultTenant`
- Folder used for every UiPath scoped check: `AgentFactoryDemo`
- Folder id: `7986306`
- Folder key: `cba41e19-47cc-4a0a-bf73-de88b60a61be`
- Existing Maestro processes in that folder before/after the run: none
- Existing Action Center tasks in that folder before/after the run: none
- Existing Data Service entities before mutation review: system entity only

No visible packages, processes, tasks, or Data Service entities belonging to
other projects were modified. The only package upload attempt used a unique
`AgentFactory...` package id and was not retrievable or listed afterward.

## Product Run

- Local stack ran on isolated ports:
  - Factory API: `http://localhost:9087`
  - Build Worker: `http://localhost:9090`
  - Factory Console: `http://localhost:5185`
  - Customer360 preview: `http://localhost:5186`
- Request id: `REQ-2026-001`
- Manifest id: `MAN-REQ-2026-001`
- Build run id: `BUILD-REQ-2026-001-001`
- Deployment id: `DEP-REQ-2026-001-001`
- Final Factory API request status: `deployed`
- Sandbox deployment URL: `http://localhost:5186`

The request was created through the Factory API, advanced through clarification,
structured spec, governance, scope approval, manifest creation, Build Worker
handoff, release approval evidence, and sandbox deployment evidence.

## Successful Live/Local Evidence

`AgentFactory_StartBuildWorker` ran through the UiPath API Workflow local runner
against `127.0.0.1`, queued the Build Worker, and returned HTTP `202`.

Build Worker live Codex execution was enabled with
`BUILD_WORKER_CODEX_ENABLED=true` in an isolated temp workspace. Results:

- Codex readiness: passed
- Codex readiness session id: `019f14f9-8e3b-7232-9d59-6ee2c428279f`
- Codex build: passed after 2 attempts
- Worker status before deployment: `awaiting_release_approval`
- Worker status after local deployment evidence: `deployed`
- Generated files: 14
- Guardrail checks: `codex-readiness`, `codex-build`, `workspace-inputs`,
  `forbidden-actions`, and `manifest-allowlist` all passed.
- Evidence log:
  `/var/folders/dp/vpvxrph17r3fqqj5bk3cjbb80000gn/T/agent-factory-build-worker/runs/BUILD-REQ-2026-001-001/logs/codex-runner-evidence.json`

Generated worker artifact paths:

- `deployment.json`
- `package.json`
- `README.md`
- `public/data/synthetic_customers.csv`
- `public/data/synthetic_events.csv`
- `public/data/synthetic_orders.csv`
- `public/data/synthetic_returns.csv`
- `src/app.js`
- `src/build.mjs`
- `src/index.html`
- `src/metrics.js`
- `src/server.mjs`
- `src/styles.css`
- `tests/metrics.test.mjs`

## Maestro Activation Attempt

The BPMN still validates locally:

```bash
uip maestro bpmn validate uipath/maestro/customer360-build/agent-factory-customer360-build.bpmn --output json
```

Publishing through the official Maestro command was attempted only against
`AgentFactoryDemo`:

```bash
uip maestro bpmn process publish uipath/maestro/customer360-build /private/tmp/agent-factory-maestro-package --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --name AgentFactoryCustomer360Build --process-name "Governed Agentic Automation Factory - Customer360 Build" --version 1.0.0 --wait --output json
```

Result:

```text
MaestroProcessPublishFailed
HTTP 400: Invalid argument 'Period'
```

Follow-up isolation checks:

- Period-free version `100` was rejected as invalid NuGet version, so the
  blocker is not simply dotted package versions.
- Local `uip maestro bpmn pack` succeeded for
  `AgentFactoryCustomer360Build.processOrchestration.ProcessOrchestration.1.0.3.nupkg`.
- Generic package upload returned success, but the package was not retrievable
  through `uip or packages get`, and no `AgentFactory...` package appeared in
  `uip or packages list`.
- `uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be`
  remained empty.

The official debug path was also attempted using a temporary solution wrapper in
`/private/tmp/AgentFactoryMaestroSolutionLive4778d19` and folder id `7986306`.
The debug command did not produce a process instance, and
`uip maestro bpmn instance list` returned no recent instances.

Conclusion: there is no live Maestro process instance or Action Center task id
yet. The blocker is at UiPath Maestro ProcessOrchestration publish/debug
activation, not at the local BPMN validator or Agent Factory product endpoints.

## Bridge And Data Egress

Temporary ngrok tunnels were opened for health/readiness checks. When an
attempted workflow payload would have sent request and manifest data through the
ngrok relay, the run was blocked by policy as unsafe data egress. The actual
API Workflow and Build Worker payload execution was therefore switched to
`127.0.0.1`.

For a fully cloud-callback Maestro run, use a trusted hosted bridge with access
controls rather than a public relay for request/manifest payloads.

## Data Service And Test Cloud

- Data Service: read-only entity discovery succeeded; only system entities were
  present. No AgentFactory Data Service schema or record writes were performed
  to avoid shared-tenant collisions.
- Test Manager/Test Cloud: live project `AFQG` and seven test cases were already
  discoverable through readiness checks. No live Test Cloud execution was run in
  this activation pass.

## Current Truth Table

| Capability | State |
|---|---|
| Local product lifecycle | Working |
| Factory API evidence/deploy endpoints | Working |
| API Workflow JSON validation | Working |
| API Workflow local runner -> Build Worker | Working |
| Build Worker live Codex readiness/build | Working |
| Sandbox deployment evidence | Working |
| Maestro BPMN validation | Working |
| Maestro cloud publish/run | Blocked by UiPath `Invalid argument 'Period'` |
| Action Center live task | Not created; no Maestro instance reached a user task |
| Data Service live records | Not created; shared-tenant collision risk |
| Test Cloud execution | Not run |
