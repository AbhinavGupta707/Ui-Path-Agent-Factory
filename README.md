# Governed Agentic Automation Factory

UiPath AgentHack project for a governed agentic software factory. A business user submits an automation request, UiPath triages and governs the work, Codex builds the requested artifact, humans approve critical gates, and the final dashboard is deployed with auditability.

## Current Baseline

This repo is in the pre-orchestration scaffold phase. It contains:

- `apps/factory-console` - operator-facing request and run console.
- `apps/customer360-template` - the initial generated dashboard template target.
- `services/factory-api` - local API spine for intake/status/audit simulation.
- `services/build-worker` - local worker contract for Codex execution.
- `packages/shared-contracts` - shared schemas and runtime contracts.
- `packages/customer360-metrics` - deterministic analytics utilities for the Customer360 demo.
- `uipath/` - platform readiness notes and later Maestro/API workflow assets.
- `docs/` - setup, readiness, and orchestration notes.

## Prerequisites

- Node.js 22+
- npm 10+
- OpenAI Codex CLI 0.142+
- UiPath CLI authenticated to `galacticus / DefaultTenant`
- GitHub CLI authenticated as `AbhinavGupta707`
- Vercel CLI authenticated for deployment

## Setup

```bash
npm install
npm run smoke
```

## Local Development

```bash
npm run dev:console
npm run dev:api
npm run dev:worker
```

## UiPath Local Skills

For a fresh clone, install UiPath Codex skills locally:

```bash
uip skills install --agent codex --local
uip login status --output json
uip or folders list --output json
```

The local skill bundles are intentionally ignored by git.

## Submission Notes

The Devpost submission should eventually include a public GitHub repository, open-source license, setup instructions, and a demo video under five minutes showing the live request-to-deploy path.
