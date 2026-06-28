import { StrictMode, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  calculateCustomer360Metrics,
  growthCustomer360Dataset,
  mutateCustomer360Dataset,
  seedCustomer360Dataset,
  type Customer360Dataset,
  type CustomerSegment,
  type DataFreshnessMetric,
  type OpportunityMetric
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
  segment: CustomerSegment;
  revenue: number;
  customers: number;
  averageOrderValue: number;
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
  segment: CustomerSegment;
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
  datasetId: string;
  freshness: DataFreshnessMetric;
  warnings: string[];
}

const modeLabels: Record<DataMode, string> = {
  ready: "Baseline dataset",
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

function formatRatio(value: number): string {
  return formatPercent(value * 100);
}

function riskLabel(tier: "low" | "medium" | "high"): RiskRow["risk"] {
  if (tier === "high") {
    return "High";
  }
  if (tier === "medium") {
    return "Medium";
  }
  return "Low";
}

function emptyDataset(generatedAt: string): Customer360Dataset {
  return {
    metadata: {
      datasetId: "customer360-empty",
      seed: 0,
      scenario: "baseline",
      generatedAt,
      piiPolicy: "mask_email_name_phone",
      source: "synthetic"
    },
    customers: [],
    orders: [],
    events: [],
    returns: []
  };
}

function degradedDataset(generatedAt: string): Customer360Dataset {
  return {
    metadata: {
      ...growthCustomer360Dataset.metadata,
      datasetId: "customer360-degraded-feed",
      scenario: "risk",
      generatedAt
    },
    customers: growthCustomer360Dataset.customers.map((customer) => ({ ...customer })),
    orders: growthCustomer360Dataset.orders.slice(0, -2).map((order) => ({ ...order })),
    events: growthCustomer360Dataset.events
      .filter((event) => event.eventType !== "purchase" && event.eventType !== "support_ticket")
      .map((event) => ({ ...event })),
    returns: []
  };
}

export function datasetForMode(mode: DataMode, refreshRevision = 0, generatedAt = seedCustomer360Dataset.metadata.generatedAt): Customer360Dataset {
  if (mode === "empty") {
    return emptyDataset(generatedAt);
  }

  if (mode === "degraded") {
    return degradedDataset(generatedAt);
  }

  if (refreshRevision > 0) {
    return mutateCustomer360Dataset(seedCustomer360Dataset, {
      seed: 20260715 + refreshRevision,
      generatedAt,
      scenario: "mutated"
    });
  }

  return seedCustomer360Dataset;
}

function monthLabel(value: string): string {
  const [year, month] = value.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString("en-US", { month: "short" });
}

function buildRevenueTrend(dataset: Customer360Dataset): RevenuePoint[] {
  const revenueByOrder = new Map(dataset.orders.map((order) => [order.orderId, Math.max(0, order.amount - order.discount)]));
  const monthByOrder = new Map(dataset.orders.map((order) => [order.orderId, order.orderDate.slice(0, 7)]));
  const revenueByMonth = new Map<string, number>();

  for (const order of dataset.orders) {
    const month = order.orderDate.slice(0, 7);
    revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + (revenueByOrder.get(order.orderId) ?? 0));
  }

  for (const returned of dataset.returns) {
    const month = monthByOrder.get(returned.orderId) ?? returned.returnDate.slice(0, 7);
    revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) - returned.amount);
  }

  const points = [...revenueByMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, value]) => ({ month: monthLabel(month), value: Math.max(0, Math.round(value)) }));

  return points.length > 0 ? points : [{ month: "No data", value: 0 }];
}

function opportunityFor(risk: { customerId: string }, opportunities: OpportunityMetric[]): OpportunityMetric | undefined {
  return opportunities.find((opportunity) => opportunity.id.includes(risk.customerId.toLowerCase()));
}

export function buildDashboardModel(dataset: Customer360Dataset): DashboardModel {
  const metrics = calculateCustomer360Metrics(dataset);
  const totalRevenue = metrics.kpis.revenue;
  const maxCohortRevenue = Math.max(...metrics.retentionCohorts.map((cohort) => cohort.revenue), 1);

  const segments = metrics.segmentRevenue.map((segment) => ({
    segment: segment.segment,
    revenue: segment.revenue,
    customers: segment.customerCount,
    averageOrderValue: segment.averageOrderValue,
    share: segment.shareOfRevenue * 100
  }));

  const funnel = metrics.behaviorFunnel.map((stage) => ({
    label: stage.label,
    value: stage.customerCount,
    detail:
      stage.dropOffFromPrevious > 0
        ? `${stage.dropOffFromPrevious} drop-off; ${formatRatio(stage.overallConversion)} overall`
        : `${formatRatio(stage.overallConversion)} overall conversion`
  }));

  const retention = metrics.retentionCohorts.slice(0, 4).map((cohort) => ({
    label: cohort.cohort,
    values: [
      Math.round(cohort.retentionRate * 100),
      Math.round(cohort.repeatPurchaseRate * 100),
      cohort.customerCount === 0 ? 0 : Math.round((cohort.activeCustomersLast90Days / cohort.customerCount) * 100),
      Math.round((cohort.revenue / maxCohortRevenue) * 100)
    ]
  }));

  const risks = metrics.churnRisk.slice(0, 8).map((risk) => {
    const opportunity = opportunityFor(risk, metrics.topOpportunities);
    return {
      id: risk.label,
      segment: risk.segment,
      risk: riskLabel(risk.riskTier),
      signal: risk.riskFactors.join("; ") || `${risk.daysSinceLastActivity} days since last activity`,
      ownerAction:
        risk.riskTier === "high"
          ? "Create retention task"
          : risk.riskTier === "medium"
            ? "Schedule adoption review"
            : "Queue expansion outreach",
      opportunity: opportunity ? `${opportunity.title} (${formatCurrency(opportunity.impact)})` : formatCurrency(risk.revenue)
    };
  });

  const categories = metrics.topCategories.map((category) => ({
    name: category.productCategory,
    revenue: category.revenue,
    share: totalRevenue === 0 ? 0 : (category.revenue / totalRevenue) * 100
  }));

  return {
    kpis: [
      {
        label: "Revenue",
        value: formatCurrency(totalRevenue),
        detail: `${metrics.kpis.orderCount} orders; ${metrics.kpis.returnCount} returns`,
        tone: "revenue"
      },
      {
        label: "Avg order value",
        value: formatCurrency(metrics.kpis.averageOrderValue),
        detail: `${metrics.kpis.activeCustomers} active customers`,
        tone: "neutral"
      },
      {
        label: "Repeat purchase",
        value: formatRatio(metrics.kpis.repeatPurchaseRate),
        detail: `${metrics.kpis.purchaseFrequency} purchases per active customer`,
        tone: "positive"
      },
      {
        label: "Return rate",
        value: formatRatio(metrics.kpis.returnRate),
        detail: `${formatCurrency(metrics.kpis.returnedRevenue)} returned revenue`,
        tone: "warning"
      },
      {
        label: "Churn risk",
        value: String(metrics.kpis.highRiskCustomers),
        detail: `${metrics.topOpportunities.length} ranked opportunities`,
        tone: "warning"
      }
    ],
    revenueTrend: buildRevenueTrend(dataset),
    segments,
    funnel,
    retention,
    risks,
    categories,
    totalRevenue,
    datasetId: metrics.metadata.datasetId,
    freshness: metrics.dataFreshness,
    warnings: [...metrics.validation.warnings, ...metrics.dataFreshness.warnings]
  };
}

export function App() {
  const [mode, setMode] = useState<DataMode>("ready");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [lastRefresh, setLastRefresh] = useState(() => new Date("2026-06-29T09:12:00+01:00"));
  const [refreshRevision, setRefreshRevision] = useState(0);

  const dataset = useMemo(
    () => datasetForMode(mode, refreshRevision, lastRefresh.toISOString()),
    [lastRefresh, mode, refreshRevision]
  );
  const model = useMemo(() => buildDashboardModel(dataset), [dataset]);
  const isEmpty = dataset.customers.length === 0;
  const isDegraded = mode === "degraded";

  const handleRefresh = () => {
    setRefreshState("loading");
    window.setTimeout(() => {
      setLastRefresh(new Date());
      setRefreshRevision((revision) => revision + 1);
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

      <StatusRail datasetId={model.datasetId} freshness={model.freshness} mode={mode} warnings={model.warnings} />

      {isDegraded ? (
        <section className="alert-band" aria-label="Degraded data notice">
          <strong>Degraded metric path</strong>
          <span>Return records and purchase events are unavailable, so the metric layer is rendering validated partial-feed warnings.</span>
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
            <RetentionPanel cohorts={model.retention} />
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

function StatusRail({
  datasetId,
  freshness,
  mode,
  warnings
}: {
  datasetId: string;
  freshness: DataFreshnessMetric;
  mode: DataMode;
  warnings: string[];
}) {
  const generatedAt = new Date(freshness.generatedAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <section className="status-rail" aria-label="Data protection and freshness">
      <StatusItem label="Data mode" value={modeLabels[mode]} detail={datasetId} />
      <StatusItem label="Freshness" value={freshness.isStale ? "Review needed" : "Fresh"} detail={`Generated ${generatedAt}`} />
      <StatusItem label="PII masking" value="Enabled" detail="Names tokenized; email and phone suppressed" />
      <StatusItem
        label="Rows"
        value={`${freshness.rowCounts.customers}/${freshness.rowCounts.orders}/${freshness.rowCounts.events}/${freshness.rowCounts.returns}`}
        detail={warnings[0] ?? "Customers/orders/events/returns"}
      />
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
      subtitle="Monthly net revenue from synthetic orders minus returns"
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
    <Panel subtitle="Segment revenue, customer count, and calculated AOV" title="Segment revenue">
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
              <span>{segment.customers} customers</span>
              <span>{formatPercent(segment.share)} share</span>
              <span>{formatCurrency(segment.averageOrderValue)} AOV</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RetentionPanel({ cohorts }: { cohorts: RetentionCohort[] }) {
  return (
    <Panel subtitle="Cohort retention, repeat purchase, activity, and revenue share" title="Retention proxy">
      <div className="retention-grid" role="table" aria-label="Retention metrics by cohort">
        <div className="retention-header" role="row">
          <span />
          <span>Ret</span>
          <span>Repeat</span>
          <span>Active</span>
          <span>Rev</span>
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
    <Panel subtitle="Customer-level event progression from the synthetic behavior feed" title="Behaviour funnel">
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
    <Panel subtitle="Top product categories from validated order and return data" title="Category mix">
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
              <th>Opportunity impact</th>
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

if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");

  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
