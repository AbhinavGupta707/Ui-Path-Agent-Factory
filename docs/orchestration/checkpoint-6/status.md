# Checkpoint 6 Status

Setup commit: `9d3375f` (`Prepare checkpoint 6 live orchestration`).

Worker launch base: pending worker creation.

Started: 2026-06-29.

## Lanes

| Lane | Worker | State | Notes |
|---|---|---|---|
| Agent Runtime And Provider Wiring | pending | pending | Server-side Fireworks/LangSmith runtime and lifecycle integration. |
| Codex Build Worker Orchestration | pending | pending | Codex/Git runner wiring and build evidence. |
| Premium Product UI | pending | pending | Reference-led Factory Console redesign. |
| Integration QA And Live Runbook | pending | pending | Cross-lane QA, docs, browser verification. |

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
