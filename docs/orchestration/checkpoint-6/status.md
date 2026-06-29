# Checkpoint 6 Status

Setup commit: `9d3375f` (`Prepare checkpoint 6 live orchestration`).

Worker launch base: `7d02d37`.

Started: 2026-06-29.

## Lanes

| Lane | Worker | Thread | Worktree | State | Notes |
|---|---|---|---|---|---|
| Agent Runtime And Provider Wiring | `local:7db51020-7d77-404e-8b62-1ab9a15066a0` | `019f1326-800b-7e52-83fe-f98dbedb5739` | `/Users/abhinavgupta/.codex/worktrees/0448/Agent Factory` | merged | Worktree commit `cf852a9`, merged via `a1be2ef`; shared contracts and Factory API build/test passed, plus `git diff --check`. |
| Codex Build Worker Orchestration | `local:b3219824-2e66-4b38-a08c-aa5836dc3182` | `019f1326-8037-7a71-a3d9-b54e52f726e8` | `/Users/abhinavgupta/.codex/worktrees/1363/Agent Factory` | merged | Worktree commit `0572c9b`, merged via `9b9d6ba`; build, tests, `npm run smoke:build-worker`, and `git diff --check` passed on main. |
| Premium Product UI | `local:5d7d8231-ef53-431b-b14c-154ad52e7af9` | `019f1326-801c-7ec0-82b3-3fcacb584c96` | `/Users/abhinavgupta/.codex/worktrees/eb9a/Agent Factory` | merged | Worktree commit `6510898`, merged via `5cb68d7`; console typecheck/build, `git diff --check`, and `npm run smoke` passed on main. Laptop screenshots captured under `/tmp/agent-factory-console-*.png`. |
| Integration QA And Live Runbook | `local:045b9f0e-ad87-465c-bf37-7ac5b0776b2f` | `019f1326-83e5-7743-bf00-a6e9d014f11b` | `/Users/abhinavgupta/.codex/worktrees/20ba/Agent Factory` | merged | Worktree commit `808bd02`; added Checkpoint 6 live demo runbook, no-secret validation guidance, and fresh-worktree demo smoke preflight. `npm run demo:scan`, `git diff --check`, and `npm run smoke:demo` passed in the worker worktree. |

## Setup Facts

- `.env.local` is git-ignored and contains user-provided provider keys.
- Fireworks `/models` probe passed with HTTP 200.
- LangSmith sessions probe passed with HTTP 200.
- Model profiles selected:
  - fast: `accounts/fireworks/models/gpt-oss-120b`
  - reasoning: `accounts/fireworks/models/deepseek-v4-pro`
  - code: `accounts/fireworks/models/kimi-k2p6`
  - fallback: `accounts/fireworks/models/glm-5p2`

## Open Risks

- Models can produce reasoning-heavy output, so strict JSON schema validation and repair are required.
- UiPath live mutation remains approval-gated.
- The reference images are currently untracked in `Ui References/`; worker prompts describe the desired style rather than requiring image access in isolated worktrees.
- Rerun `npm run smoke:demo` and a manual browser pass on the integrated branch before recording final footage.

## Integration QA Notes

- Canonical Checkpoint 6 runbook: `docs/live-demo-runbook.md`.
- Required lane checks passed: `npm run demo:scan` and `git diff --check`.
- Optional final integration check also passed in this worktree: `npm run smoke:demo`.
- No live UiPath mutation, provider paid call, or provider value capture is part of this lane.
