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

## Local Services

Build before starting the Factory API because its dev command watches compiled
output:

```bash
npm --workspace @agent-factory/factory-api run build
FACTORY_API_PORT=8787 npm run dev:api
```

Start the generated dashboard sandbox on its documented local URL:

```bash
npm run dev:customer360
```

The Checkpoint 5 deployment contract is available at:

```text
POST http://localhost:8787/deploy
```

See [Deployment](deployment.md) for the idempotent request contract, local
sandbox evidence command, and Vercel preview fallback.

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
