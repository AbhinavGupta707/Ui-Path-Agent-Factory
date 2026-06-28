# Setup

## Local Machine

```bash
node --version
npm --version
codex --version
uip --version
gh --version
vercel --version
```

Expected working state:

- Codex CLI is `0.142.3` or newer.
- UiPath CLI is installed and authenticated.
- GitHub CLI is authenticated with `repo` and `workflow` scopes.
- Vercel CLI is authenticated.

## Install Dependencies

```bash
npm install
npm run smoke
```

## UiPath Checks

```bash
uip login status --output json
uip or folders list --output json
```

The primary folder for the demo is `AgentFactoryDemo`.

## GitHub Remote

```bash
git remote -v
```

Expected remote:

```text
origin  https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory.git
```
