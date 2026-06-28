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

Install the optional product tools that are required for this repo:

```bash
uip tools install @uipath/integrationservice-tool --output json
uip tools install @uipath/test-manager-tool --output json
```

Then verify discovery:

```bash
uip tools list --output json
uip is connectors list --filter github --output json
uip tm project list --limit 1 --output json
uip df entities list --native-only --output json
uip tasks list --folder-id 7986306 --limit 1 --output json
uip maestro bpmn process list --folder-key cba41e19-47cc-4a0a-bf73-de88b60a61be --output json
```

## GitHub Remote

```bash
git remote -v
```

Expected remote:

```text
origin  https://github.com/AbhinavGupta707/Ui-Path-Agent-Factory.git
```
