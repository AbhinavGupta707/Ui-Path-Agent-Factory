import { StrictMode, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  seedCustomerRecords,
  summarizeCustomer360,
  type CustomerRecord
} from "@agent-factory/customer360-metrics";
import "./styles.css";

type DataMode = "ready" | "degraded" | "empty";
type RefreshState = "idle" | "loading";

interface Kpi {
  label: string;
  value: string;
  detail: string;
  tone: "revenue" | "neutral" | "positive" | "warning";
}

interface RevenuePoint {
  month: string;
  value: number;
}

interface SegmentMetric {
  segment: CustomerRecord["segment"];
  revenue: number;
  accounts: number;
  averageHealth: number;
  share: number;
}

interface FunnelStep {
  label: string;
  value: number;
  detail: string;
}

interface RetentionCohort {
  label: string;
  values: number[];
}

interface RiskRow {
  id: string;
  segment: CustomerRecord["segment"];
  risk: "High" | "Medium" | "Low";
  signal: string;
  ownerAction: string;
  opportunity: string;
}

interface CategoryMetric {
  name: string;
  revenue: number;
  share: number;
}

interface DashboardModel {
  kpis: Kpi[];
  revenueTrend: RevenuePoint[];
  segments: SegmentMetric[];
  funnel: FunnelStep[];
  retention: RetentionCohort[];
  risks: RiskRow[];
  categories: CategoryMetric[];
  totalRevenue: number;
  averageHealth: number;
}

const segmentOrder: CustomerRecord["segment"][] = ["Enterprise", "Mid-Market", "Commercial"];

const revenueMultipliers = [0.68, 0.74, 0.71, 0.8, 0.86, 0.9, 0.96, 1];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const retentionLabels = ["New", "Repeat", "Expansion"];

const retentionOffsets = [
  [0, -5, -8, -12],
  [-2, -6, -10, -14],
  [1, -4, -7, -11]
];

const categoryWeights = [
  { name: "Subscriptions", weight: 0.42 },
  { name: "Services", weight: 0.28 },
  { name: "Add-ons", weight: 0.18 },
  { name: "Support", weight: 0.12 }
];

const modeLabels: Record<DataMode, string> = {
  ready: "Current dataset",
  degraded: "Degraded feed",
  empty: "Empty dataset"
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard"
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function customerLabel(record: CustomerRecord, index: number): string {
  const segmentPrefix: Record<CustomerRecord["segment"], string> = {
    Enterprise: "ENT",
    "Mid-Market": "MID",
    Commercial: "COM"
  };

  const regionSuffix: Record<CustomerRecord["region"], string> = {
    Americas: "AM",
    EMEA: "EU",
    APAC: "AP"
  };

  return `${segmentPrefix[record.segment]}-${String(index + 1).padStart(3, "0")}-${regionSuffix[record.region]}`;
}

function recordsForMode(mode: DataMode): CustomerRecord[] {
  if (mode === "empty") {
    return [];
  }

  if (mode === "degraded") {
    return seedCustomerRecords.slice(0, Math.max(1, seedCustomerRecords.length - 1));
  }

  return seedCustomerRecords;
}

function riskFor(record: CustomerRecord): RiskRow["risk"] {
  if (record.healthScore < 70 || record.openRisks >= 3) {
    return "High";
  }

  if (record.healthScore < 78 || record.openRisks > 0 || record.productUsage < 80) {
    return "Medium";
  }

  return "Low";
}

function signalFor(record: CustomerRecord): string {
  if (record.openRisks >= 3) {
    return `${record.openRisks} unresolved service risks`;
  }

  if (record.healthScore < 70) {
    return `Health score ${record.healthScore}`;
  }

  if (record.productUsage < 80) {
    return `Usage at ${record.productUsage}%`;
  }

  return `Healthy usage at ${record.productUsage}%`;
}

function buildDashboardModel(records: CustomerRecord[]): DashboardModel {
  const summary = summarizeCustomer360(records);
  const totalRevenue = summary.totalArr;
  const totalAccounts = records.length;
  const averageProductUsage = average(records.map((record) => record.productUsage));
  const repeatPurchaseRate =
    totalAccounts === 0
      ? 0
      : (records.filter((record) => record.productUsage >= 75).length / totalAccounts) * 100;
  const returnRate =
    totalAccounts === 0
      ? 0
      : Math.min(18, Math.max(2, (records.reduce((sum, record) => sum + record.openRisks, 0) / totalAccounts) * 3.6));
  const averageOrderValue = totalAccounts === 0 ? 0 : Math.round(totalRevenue / (totalAccounts * 24));

  const segments = segmentOrder.map((segment) => {
    const segmentRecords = records.filter((record) => record.segment === segment);
    const revenue = summary.segmentArr[segment] ?? 0;

    return {
      segment,
      revenue,
      accounts: segmentRecords.length,
      averageHealth: average(segmentRecords.map((record) => record.healthScore)),
      share: totalRevenue === 0 ? 0 : (revenue / totalRevenue) * 100
    };
  });

  const revenueTrend = revenueMultipliers.map((multiplier, index) => ({
    month: monthLabels[index] ?? `M${index + 1}`,
    value: Math.round(totalRevenue * multiplier)
  }));

  const funnelBase = Math.max(totalAccounts, 1);
  const funnel = [
    {
      label: "Known customers",
      value: totalAccounts,
      detail: "Synthetic CRM records"
    },
    {
      label: "Active usage",
      value: records.filter((record) => record.productUsage >= 70).length,
      detail: `${formatPercent(averageProductUsage)} avg usage`
    },
    {
      label: "Repeat purchase",
      value: Math.round((repeatPurchaseRate / 100) * funnelBase),
      detail: `${formatPercent(repeatPurchaseRate)} repeat proxy`
    },
    {
      label: "Expansion ready",
      value: summary.expansionCandidates,
      detail: "High health + usage"
    }
  ];

  const retentionBase = Math.max(58, Math.min(96, summary.averageHealthScore + 8));
  const retention = retentionLabels.map((label, index) => ({
    label,
    values: (retentionOffsets[index] ?? []).map((offset) =>
      Math.max(32, Math.min(98, retentionBase + offset - index * 4))
    )
  }));

  const risks = records
    .map((record, index) => {
      const risk = riskFor(record);

      return {
        id: customerLabel(record, index),
        segment: record.segment,
        risk,
        signal: signalFor(record),
        ownerAction:
          risk === "High"
            ? "Create retention play"
            : risk === "Medium"
              ? "Schedule adoption review"
              : "Queue expansion outreach",
        opportunity:
          record.productUsage >= 90 && record.healthScore >= 85
            ? "Expansion"
            : risk === "High"
              ? "Save"
              : "Nurture"
      };
    })
    .sort((a, b) => {
      const weight: Record<RiskRow["risk"], number> = { High: 0, Medium: 1, Low: 2 };
      return weight[a.risk] - weight[b.risk] || a.id.localeCompare(b.id);
    });

  const categories = categoryWeights.map((category) => ({
    name: category.name,
    revenue: Math.round(totalRevenue * category.weight),
    share: category.weight * 100
  }));

  return {
    kpis: [
      {
        label: "Revenue",
        value: formatCurrency(totalRevenue),
        detail: `${totalAccounts} masked accounts in scope`,
        tone: "revenue"
      },
      {
        label: "Avg order value",
        value: formatCurrency(averageOrderValue),
        detail: "Proxy from approved seed set",
        tone: "neutral"
      },
      {
        label: "Repeat purchase",
        value: formatPercent(repeatPurchaseRate),
        detail: `${summary.averageHealthScore} avg health score`,
        tone: "positive"
      },
      {
        label: "Return rate",
        value: formatPercent(returnRate),
        detail: "Derived from open risk events",
        tone: "warning"
      },
      {
        label: "Churn risk",
        value: String(summary.accountsAtRisk),
        detail: `${summary.expansionCandidates} expansion candidates`,
        tone: "warning"
      }
    ],
    revenueTrend,
    segments,
    funnel,
    retention,
    risks,
    categories,
    totalRevenue,
    averageHealth: summary.averageHealthScore
  };
}

function App() {
  const [mode, setMode] = useState<DataMode>("ready");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [lastRefresh, setLastRefresh] = useState(() => new Date("2026-06-29T09:12:00+01:00"));

  const records = useMemo(() => recordsForMode(mode), [mode]);
  const model = useMemo(() => buildDashboardModel(records), [records]);
  const isEmpty = records.length === 0;
  const isDegraded = mode === "degraded";

  const handleRefresh = () => {
    setRefreshState("loading");
    window.setTimeout(() => {
      setLastRefresh(new Date());
      setRefreshState("idle");
    }, 420);
  };

  return (
    <main className="dashboard-shell">
      <Header
        mode={mode}
        refreshState={refreshState}
        lastRefresh={lastRefresh}
        onModeChange={setMode}
        onRefresh={handleRefresh}
      />

      {refreshState === "loading" ? <LoadingState /> : null}

      <StatusRail mode={mode} lastRefresh={lastRefresh} />

      {isDegraded ? (
        <section className="alert-band" aria-label="Degraded data notice">
          <strong>Degraded metric path</strong>
          <span>Returns and event feeds are unavailable, so retention and return-rate panels are using local account-health proxies.</span>
        </section>
      ) : null}

      {isEmpty ? (
        <EmptyDashboard onReset={() => setMode("ready")} />
      ) : (
        <>
          <KpiStrip kpis={model.kpis} />

          <section className="dashboard-grid dashboard-grid-primary">
            <RevenuePanel points={model.revenueTrend} totalRevenue={model.totalRevenue} />
            <SegmentPanel segments={model.segments} totalRevenue={model.totalRevenue} />
          </section>

          <section className="dashboard-grid dashboard-grid-secondary">
            <RetentionPanel cohorts={model.retention} averageHealth={model.averageHealth} />
            <FunnelPanel funnel={model.funnel} />
            <CategoryPanel categories={model.categories} />
          </section>

          <RiskTable risks={model.risks} />
        </>
      )}
    </main>
  );
}

interface HeaderProps {
  mode: DataMode;
  refreshState: RefreshState;
  lastRefresh: Date;
  onModeChange: (mode: DataMode) => void;
  onRefresh: () => void;
}

function Header({ mode, refreshState, lastRefresh, onModeChange, onRefresh }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="title-block">
        <p className="request-link">Factory audit REQ-2026-001</p>
        <h1>Customer360 Insight Dashboard</h1>
        <p className="header-copy">
          Revenue, retention, and risk analytics.
          <br />
          Masked synthetic data.
        </p>
      </div>

      <div className="header-actions" aria-label="Dashboard controls">
        <div className="mode-toggle" aria-label="Dataset state">
          {(Object.keys(modeLabels) as DataMode[]).map((option) => (
            <button
              className={option === mode ? "mode-button mode-button-active" : "mode-button"}
              key={option}
              onClick={() => onModeChange(option)}
              type="button"
            >
              {modeLabels[option]}
            </button>
          ))}
        </div>
        <button className="refresh-button" disabled={refreshState === "loading"} onClick={onRefresh} type="button">
          {refreshState === "loading" ? "Refreshing" : "Refresh"}
        </button>
        <span className="refresh-time">Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </header>
  );
}

function StatusRail({ mode, lastRefresh }: { mode: DataMode; lastRefresh: Date }) {
  const freshness = lastRefresh.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <section className="status-rail" aria-label="Data protection and freshness">
      <StatusItem label="Data mode" value={modeLabels[mode]} detail="Local simulated source" />
      <StatusItem label="Freshness" value={freshness} detail="No network dependency" />
      <StatusItem label="PII masking" value="Enabled" detail="Names tokenized; email and phone suppressed" />
      <StatusItem label="UiPath state" value="uipath-ready" detail="Sandbox artifact, approval-gated" />
    </section>
  );
}

function StatusItem({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="status-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function LoadingState() {
  return (
    <section className="loading-strip" aria-live="polite">
      <span className="loading-dot" />
      Recalculating synthetic Customer360 metrics locally.
    </section>
  );
}

function EmptyDashboard({ onReset }: { onReset: () => void }) {
  return (
    <section className="empty-state" aria-label="Empty dataset state">
      <div>
        <p className="section-kicker">No eligible records</p>
        <h2>Customer360 has no approved synthetic rows for this filter.</h2>
        <p>
          The dashboard remains safe to render: KPI values are zeroed, PII remains masked, and reviewers can return to
          the seeded dataset without a network call.
        </p>
      </div>
      <button className="refresh-button" onClick={onReset} type="button">
        Restore seed data
      </button>
    </section>
  );
}

function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <section className="kpi-strip" aria-label="Customer360 KPI cards">
      {kpis.map((kpi) => (
        <article className={`kpi-card kpi-${kpi.tone}`} key={kpi.label}>
          <span>{kpi.label}</span>
          <strong>{kpi.value}</strong>
          <small>{kpi.detail}</small>
        </article>
      ))}
    </section>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = ""
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

function RevenuePanel({ points, totalRevenue }: { points: RevenuePoint[]; totalRevenue: number }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(maxValue - minValue, 1);
  const coordinates = points.map((point, index) => {
    const x = 20 + index * (360 / Math.max(points.length - 1, 1));
    const y = 188 - ((point.value - minValue) / range) * 132;
    return { x, y, point };
  });
  const polyline = coordinates.map((coordinate) => `${coordinate.x},${coordinate.y}`).join(" ");
  const area = `20,200 ${polyline} ${coordinates[coordinates.length - 1]?.x ?? 20},200`;

  return (
    <Panel
      className="revenue-panel"
      subtitle="Chart-like view backed by the current metrics summary"
      title="Revenue trend"
    >
      <div className="chart-summary">
        <span>Current run-rate</span>
        <strong>{formatCurrency(totalRevenue)}</strong>
      </div>
      <svg className="revenue-chart" role="img" aria-label="Revenue time series from January through August" viewBox="0 0 420 232">
        <polygon className="chart-area" points={area} />
        <polyline className="chart-line" points={polyline} />
        {coordinates.map(({ x, y, point }) => (
          <g key={point.month}>
            <circle className="chart-point" cx={x} cy={y} r="4" />
            <text className="chart-label" x={x} y="220" textAnchor="middle">
              {point.month}
            </text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

function SegmentPanel({ segments, totalRevenue }: { segments: SegmentMetric[]; totalRevenue: number }) {
  return (
    <Panel subtitle="Segment revenue, share, and health distribution" title="Segment revenue">
      <div className="segment-list">
        {segments.map((segment) => (
          <div className="segment-row" key={segment.segment}>
            <div className="segment-row-head">
              <strong>{segment.segment}</strong>
              <span>{formatCurrency(segment.revenue)}</span>
            </div>
            <div className="bar-track" aria-label={`${segment.segment} revenue share ${formatPercent(segment.share)}`}>
              <span style={{ width: `${Math.max(segment.share, totalRevenue > 0 ? 4 : 0)}%` }} />
            </div>
            <div className="segment-meta">
              <span>{segment.accounts} accounts</span>
              <span>{formatPercent(segment.share)} share</span>
              <span>{segment.averageHealth} health</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RetentionPanel({ cohorts, averageHealth }: { cohorts: RetentionCohort[]; averageHealth: number }) {
  return (
    <Panel subtitle={`Health-adjusted proxy, average score ${averageHealth}`} title="Retention proxy">
      <div className="retention-grid" role="table" aria-label="Retention proxy by cohort">
        <div className="retention-header" role="row">
          <span />
          <span>M0</span>
          <span>M1</span>
          <span>M2</span>
          <span>M3</span>
        </div>
        {cohorts.map((cohort) => (
          <div className="retention-row" key={cohort.label} role="row">
            <strong>{cohort.label}</strong>
            {cohort.values.map((value, index) => (
              <span className={`retention-cell retention-${Math.floor(value / 10)}`} key={`${cohort.label}-${index}`}>
                {value}%
              </span>
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FunnelPanel({ funnel }: { funnel: FunnelStep[] }) {
  const maxValue = Math.max(...funnel.map((step) => step.value), 1);

  return (
    <Panel subtitle="Event summary derived from approved synthetic account behaviour" title="Behaviour funnel">
      <div className="funnel-list">
        {funnel.map((step) => (
          <div className="funnel-step" key={step.label}>
            <div className="funnel-step-head">
              <strong>{step.label}</strong>
              <span>{step.value}</span>
            </div>
            <div className="bar-track">
              <span style={{ width: `${Math.max(8, (step.value / maxValue) * 100)}%` }} />
            </div>
            <small>{step.detail}</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CategoryPanel({ categories }: { categories: CategoryMetric[] }) {
  return (
    <Panel subtitle="Top product categories allocated from current revenue" title="Category mix">
      <div className="category-list">
        {categories.map((category) => (
          <div className="category-row" key={category.name}>
            <div>
              <strong>{category.name}</strong>
              <span>{formatCurrency(category.revenue)}</span>
            </div>
            <div className="category-meter">
              <span style={{ width: `${category.share}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RiskTable({ risks }: { risks: RiskRow[] }) {
  return (
    <section className="risk-section" aria-label="Churn risk and opportunity table">
      <div className="section-heading">
        <div>
          <h2>Churn risk and opportunities</h2>
          <p>Customer labels are tokenized; rows show action signals without raw contact data.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Masked customer</th>
              <th>Segment</th>
              <th>Risk</th>
              <th>Primary signal</th>
              <th>Owner action</th>
              <th>Opportunity</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk.id}>
                <td>{risk.id}</td>
                <td>{risk.segment}</td>
                <td>
                  <span className={`risk-pill risk-${risk.risk.toLowerCase()}`}>{risk.risk}</span>
                </td>
                <td>{risk.signal}</td>
                <td>{risk.ownerAction}</td>
                <td>{risk.opportunity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
