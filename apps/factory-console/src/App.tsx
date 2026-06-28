import {
  Bot,
  CheckCircle2,
  GitPullRequest,
  Play,
  Rocket,
  ShieldCheck,
  Workflow
} from "lucide-react";
import { defaultUiPathContext } from "@agent-factory/shared-contracts";

const timeline = [
  {
    icon: Workflow,
    title: "Intake",
    detail: "Request captured and clarified by UiPath agents.",
    state: "Ready"
  },
  {
    icon: ShieldCheck,
    title: "Governance",
    detail: "Risk, permissions, and human approvals are routed.",
    state: "Next"
  },
  {
    icon: Bot,
    title: "Build",
    detail: "Codex receives a structured manifest and creates the app.",
    state: "Queued"
  },
  {
    icon: GitPullRequest,
    title: "Review",
    detail: "Tests, diff, PR, and release approval are recorded.",
    state: "Queued"
  },
  {
    icon: Rocket,
    title: "Deploy",
    detail: "Approved output is published with an audit trail.",
    state: "Queued"
  }
];

export function App() {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Factory navigation">
        <div className="brand">
          <div className="brandMark">AF</div>
          <div>
            <strong>Agent Factory</strong>
            <span>UiPath governed build ops</span>
          </div>
        </div>

        <nav className="nav">
          <a className="active" href="#run">
            Run
          </a>
          <a href="#approvals">Approvals</a>
          <a href="#builds">Builds</a>
          <a href="#audit">Audit</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Governed Agentic Automation Factory</h1>
            <p>
              Request-to-deploy control plane for live UiPath-orchestrated coding agents.
            </p>
          </div>
          <button type="button">
            <Play size={18} aria-hidden="true" />
            New Request
          </button>
        </header>

        <section className="grid" id="run">
          <article className="primaryPanel">
            <div className="panelHeader">
              <div>
                <h2>Customer360 dashboard build</h2>
                <p>Seed workflow prepared for the first live hackathon demo.</p>
              </div>
              <span className="status">Preflight</span>
            </div>

            <div className="timeline">
              {timeline.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="timelineRow" key={item.title}>
                    <div className="timelineIcon">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <small>{item.state}</small>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="sidePanel" aria-label="Platform status">
            <h2>Platform</h2>
            <dl>
              <div>
                <dt>Organization</dt>
                <dd>{defaultUiPathContext.organization}</dd>
              </div>
              <div>
                <dt>Tenant</dt>
                <dd>{defaultUiPathContext.tenant}</dd>
              </div>
              <div>
                <dt>Folder</dt>
                <dd>{defaultUiPathContext.folderName}</dd>
              </div>
            </dl>

            <div className="checkList">
              {["Codex CLI", "GitHub remote", "Vercel login", "UiPath folder"].map((item) => (
                <div className="check" key={item}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
