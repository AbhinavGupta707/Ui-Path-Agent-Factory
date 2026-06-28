export type CustomerSegment = "Enterprise" | "Mid-Market" | "Commercial" | "Starter";
export type Region = "Americas" | "EMEA" | "APAC";
export type AcquisitionChannel = "Paid Search" | "Organic" | "Referral" | "Partner" | "Webinar";
export type OrderChannel = "Web" | "Sales" | "Partner" | "Marketplace";
export type ProductCategory = "Analytics" | "Automation" | "Insights" | "Commerce" | "Support";
export type EventType =
  | "visit"
  | "product_view"
  | "add_to_cart"
  | "checkout_started"
  | "purchase"
  | "support_ticket"
  | "negative_feedback";

export interface CustomerProfile {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  signupDate: string;
  country: string;
  region: Region;
  channel: AcquisitionChannel;
  segment: CustomerSegment;
  acquisitionCohort: string;
}

export interface OrderRecord {
  orderId: string;
  customerId: string;
  orderDate: string;
  productCategory: ProductCategory;
  amount: number;
  discount: number;
  channel: OrderChannel;
}

export interface CustomerEventRecord {
  eventId: string;
  customerId: string;
  timestamp: string;
  eventType: EventType;
  productCategory: ProductCategory;
  source: string;
}

export interface ReturnRecord {
  returnId: string;
  customerId: string;
  orderId: string;
  returnDate: string;
  amount: number;
  reason: string;
}

export interface RefreshMetadata {
  datasetId: string;
  seed: number;
  scenario: "baseline" | "growth" | "risk" | "mutated";
  generatedAt: string;
  piiPolicy: "mask_email_name_phone";
  source: "synthetic";
}

export interface Customer360Dataset {
  metadata: RefreshMetadata;
  customers: CustomerProfile[];
  orders: OrderRecord[];
  events: CustomerEventRecord[];
  returns: ReturnRecord[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface RevenueMetric {
  grossRevenue: number;
  returnedRevenue: number;
  revenue: number;
  orderCount: number;
  returnCount: number;
}

export interface SegmentRevenueMetric {
  segment: CustomerSegment;
  customerCount: number;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  shareOfRevenue: number;
}

export interface CategoryMetric {
  productCategory: ProductCategory;
  revenue: number;
  orderCount: number;
  customerCount: number;
  returnedRevenue: number;
}

export interface BehaviorFunnelStage {
  stage: EventType;
  label: string;
  customerCount: number;
  conversionFromPrevious: number;
  dropOffFromPrevious: number;
  overallConversion: number;
}

export interface CohortMetric {
  cohort: string;
  customerCount: number;
  activeCustomersLast90Days: number;
  repeatCustomers: number;
  retentionRate: number;
  repeatPurchaseRate: number;
  revenue: number;
}

export interface ChurnRiskCustomer {
  customerId: string;
  label: string;
  segment: CustomerSegment;
  riskScore: number;
  riskTier: "low" | "medium" | "high";
  daysSinceLastActivity: number;
  revenue: number;
  riskFactors: string[];
}

export interface OpportunityMetric {
  id: string;
  type: "growth" | "retention" | "conversion" | "returns";
  title: string;
  segment?: CustomerSegment;
  productCategory?: ProductCategory;
  impact: number;
  reason: string;
  recommendedAction: string;
}

export interface DataFreshnessMetric {
  generatedAt: string;
  latestOrderAt: string | null;
  latestEventAt: string | null;
  latestReturnAt: string | null;
  ageHours: number | null;
  isStale: boolean;
  rowCounts: {
    customers: number;
    orders: number;
    events: number;
    returns: number;
  };
  warnings: string[];
}

export interface MaskedCustomerProfile {
  customerId: string;
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region: Region;
  channel: AcquisitionChannel;
  segment: CustomerSegment;
  acquisitionCohort: string;
}

export interface Customer360Metrics {
  metadata: RefreshMetadata;
  validation: ValidationResult;
  kpis: {
    revenue: number;
    grossRevenue: number;
    returnedRevenue: number;
    averageOrderValue: number;
    repeatPurchaseRate: number;
    purchaseFrequency: number;
    returnRate: number;
    activeCustomers: number;
    totalCustomers: number;
    orderCount: number;
    returnCount: number;
    highRiskCustomers: number;
  };
  segmentRevenue: SegmentRevenueMetric[];
  topCategories: CategoryMetric[];
  retentionCohorts: CohortMetric[];
  churnRisk: ChurnRiskCustomer[];
  topOpportunities: OpportunityMetric[];
  behaviorFunnel: BehaviorFunnelStage[];
  dataFreshness: DataFreshnessMetric;
  maskedCustomers: MaskedCustomerProfile[];
}

export interface CustomerRecord {
  account: string;
  segment: "Enterprise" | "Mid-Market" | "Commercial";
  region: Region;
  arr: number;
  healthScore: number;
  openRisks: number;
  productUsage: number;
}

export interface Customer360Summary {
  totalArr: number;
  averageHealthScore: number;
  accountsAtRisk: number;
  expansionCandidates: number;
  segmentArr: Record<CustomerRecord["segment"], number>;
}

const CUSTOMER_SEGMENTS: CustomerSegment[] = ["Enterprise", "Mid-Market", "Commercial", "Starter"];
const FUNNEL_STAGES: Array<{ stage: EventType; label: string }> = [
  { stage: "visit", label: "Visited" },
  { stage: "product_view", label: "Viewed product" },
  { stage: "add_to_cart", label: "Added to cart" },
  { stage: "checkout_started", label: "Started checkout" },
  { stage: "purchase", label: "Purchased" }
];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const seedCustomerRecords: CustomerRecord[] = [
  {
    account: "Northstar Retail",
    segment: "Enterprise",
    region: "Americas",
    arr: 420000,
    healthScore: 86,
    openRisks: 1,
    productUsage: 91
  },
  {
    account: "Helio Finance",
    segment: "Enterprise",
    region: "EMEA",
    arr: 375000,
    healthScore: 68,
    openRisks: 3,
    productUsage: 72
  },
  {
    account: "Kitewell Health",
    segment: "Mid-Market",
    region: "Americas",
    arr: 155000,
    healthScore: 74,
    openRisks: 1,
    productUsage: 84
  },
  {
    account: "Blueforge Labs",
    segment: "Commercial",
    region: "APAC",
    arr: 92000,
    healthScore: 91,
    openRisks: 0,
    productUsage: 95
  }
];

export const seedCustomer360Dataset: Customer360Dataset = {
  metadata: {
    datasetId: "customer360-baseline",
    seed: 20260628,
    scenario: "baseline",
    generatedAt: "2026-06-28T10:00:00.000Z",
    piiPolicy: "mask_email_name_phone",
    source: "synthetic"
  },
  customers: [
    {
      customerId: "CUS-1001",
      firstName: "Avery",
      lastName: "Morgan",
      email: "avery.morgan@example.invalid",
      phone: "+1-415-555-0101",
      signupDate: "2025-01-15",
      country: "United States",
      region: "Americas",
      channel: "Paid Search",
      segment: "Enterprise",
      acquisitionCohort: "2025-01"
    },
    {
      customerId: "CUS-1002",
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan.lee@example.invalid",
      phone: "+44-20-5555-0102",
      signupDate: "2025-02-03",
      country: "United Kingdom",
      region: "EMEA",
      channel: "Referral",
      segment: "Mid-Market",
      acquisitionCohort: "2025-02"
    },
    {
      customerId: "CUS-1003",
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@example.invalid",
      phone: "+91-80-5555-0103",
      signupDate: "2025-03-21",
      country: "India",
      region: "APAC",
      channel: "Organic",
      segment: "Commercial",
      acquisitionCohort: "2025-03"
    },
    {
      customerId: "CUS-1004",
      firstName: "Mateo",
      lastName: "Rossi",
      email: "mateo.rossi@example.invalid",
      phone: "+49-30-5555-0104",
      signupDate: "2025-01-30",
      country: "Germany",
      region: "EMEA",
      channel: "Partner",
      segment: "Enterprise",
      acquisitionCohort: "2025-01"
    },
    {
      customerId: "CUS-1005",
      firstName: "Sofia",
      lastName: "Chen",
      email: "sofia.chen@example.invalid",
      phone: "+65-5555-0105",
      signupDate: "2025-04-12",
      country: "Singapore",
      region: "APAC",
      channel: "Paid Search",
      segment: "Starter",
      acquisitionCohort: "2025-04"
    },
    {
      customerId: "CUS-1006",
      firstName: "Noa",
      lastName: "Williams",
      email: "noa.williams@example.invalid",
      phone: "+1-212-555-0106",
      signupDate: "2025-05-08",
      country: "United States",
      region: "Americas",
      channel: "Organic",
      segment: "Mid-Market",
      acquisitionCohort: "2025-05"
    },
    {
      customerId: "CUS-1007",
      firstName: "Lina",
      lastName: "Okafor",
      email: "lina.okafor@example.invalid",
      phone: "+1-647-555-0107",
      signupDate: "2025-06-17",
      country: "Canada",
      region: "Americas",
      channel: "Referral",
      segment: "Commercial",
      acquisitionCohort: "2025-06"
    },
    {
      customerId: "CUS-1008",
      firstName: "Samir",
      lastName: "Patel",
      email: "samir.patel@example.invalid",
      phone: "+971-4-555-0108",
      signupDate: "2025-02-18",
      country: "United Arab Emirates",
      region: "EMEA",
      channel: "Partner",
      segment: "Enterprise",
      acquisitionCohort: "2025-02"
    }
  ],
  orders: [
    {
      orderId: "ORD-5001",
      customerId: "CUS-1001",
      orderDate: "2026-01-10",
      productCategory: "Analytics",
      amount: 4200,
      discount: 200,
      channel: "Web"
    },
    {
      orderId: "ORD-5002",
      customerId: "CUS-1001",
      orderDate: "2026-03-15",
      productCategory: "Automation",
      amount: 6800,
      discount: 300,
      channel: "Sales"
    },
    {
      orderId: "ORD-5003",
      customerId: "CUS-1001",
      orderDate: "2026-06-18",
      productCategory: "Insights",
      amount: 5100,
      discount: 0,
      channel: "Web"
    },
    {
      orderId: "ORD-5004",
      customerId: "CUS-1002",
      orderDate: "2026-02-20",
      productCategory: "Analytics",
      amount: 1900,
      discount: 100,
      channel: "Web"
    },
    {
      orderId: "ORD-5005",
      customerId: "CUS-1002",
      orderDate: "2026-05-02",
      productCategory: "Support",
      amount: 2300,
      discount: 0,
      channel: "Sales"
    },
    {
      orderId: "ORD-5006",
      customerId: "CUS-1003",
      orderDate: "2026-01-27",
      productCategory: "Commerce",
      amount: 800,
      discount: 0,
      channel: "Marketplace"
    },
    {
      orderId: "ORD-5007",
      customerId: "CUS-1004",
      orderDate: "2026-02-11",
      productCategory: "Automation",
      amount: 7600,
      discount: 600,
      channel: "Partner"
    },
    {
      orderId: "ORD-5008",
      customerId: "CUS-1004",
      orderDate: "2026-04-28",
      productCategory: "Analytics",
      amount: 8300,
      discount: 500,
      channel: "Partner"
    },
    {
      orderId: "ORD-5009",
      customerId: "CUS-1005",
      orderDate: "2026-03-05",
      productCategory: "Commerce",
      amount: 450,
      discount: 0,
      channel: "Web"
    },
    {
      orderId: "ORD-5010",
      customerId: "CUS-1006",
      orderDate: "2026-04-08",
      productCategory: "Insights",
      amount: 1250,
      discount: 50,
      channel: "Web"
    },
    {
      orderId: "ORD-5011",
      customerId: "CUS-1006",
      orderDate: "2026-06-21",
      productCategory: "Analytics",
      amount: 2100,
      discount: 100,
      channel: "Web"
    },
    {
      orderId: "ORD-5012",
      customerId: "CUS-1007",
      orderDate: "2026-05-16",
      productCategory: "Automation",
      amount: 900,
      discount: 0,
      channel: "Marketplace"
    },
    {
      orderId: "ORD-5013",
      customerId: "CUS-1008",
      orderDate: "2026-01-22",
      productCategory: "Insights",
      amount: 5400,
      discount: 400,
      channel: "Partner"
    },
    {
      orderId: "ORD-5014",
      customerId: "CUS-1008",
      orderDate: "2026-06-10",
      productCategory: "Automation",
      amount: 7200,
      discount: 200,
      channel: "Partner"
    }
  ],
  events: [
    {
      eventId: "EVT-7001",
      customerId: "CUS-1001",
      timestamp: "2026-06-18T09:00:00.000Z",
      eventType: "visit",
      productCategory: "Insights",
      source: "web"
    },
    {
      eventId: "EVT-7002",
      customerId: "CUS-1001",
      timestamp: "2026-06-18T09:04:00.000Z",
      eventType: "product_view",
      productCategory: "Insights",
      source: "web"
    },
    {
      eventId: "EVT-7003",
      customerId: "CUS-1001",
      timestamp: "2026-06-18T09:07:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Insights",
      source: "web"
    },
    {
      eventId: "EVT-7004",
      customerId: "CUS-1001",
      timestamp: "2026-06-18T09:10:00.000Z",
      eventType: "checkout_started",
      productCategory: "Insights",
      source: "web"
    },
    {
      eventId: "EVT-7005",
      customerId: "CUS-1001",
      timestamp: "2026-06-18T09:15:00.000Z",
      eventType: "purchase",
      productCategory: "Insights",
      source: "web"
    },
    {
      eventId: "EVT-7006",
      customerId: "CUS-1002",
      timestamp: "2026-05-01T10:00:00.000Z",
      eventType: "visit",
      productCategory: "Support",
      source: "email"
    },
    {
      eventId: "EVT-7007",
      customerId: "CUS-1002",
      timestamp: "2026-05-01T10:03:00.000Z",
      eventType: "product_view",
      productCategory: "Support",
      source: "email"
    },
    {
      eventId: "EVT-7008",
      customerId: "CUS-1002",
      timestamp: "2026-05-01T10:05:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Support",
      source: "email"
    },
    {
      eventId: "EVT-7009",
      customerId: "CUS-1002",
      timestamp: "2026-05-01T10:08:00.000Z",
      eventType: "checkout_started",
      productCategory: "Support",
      source: "email"
    },
    {
      eventId: "EVT-7010",
      customerId: "CUS-1002",
      timestamp: "2026-05-01T10:14:00.000Z",
      eventType: "purchase",
      productCategory: "Support",
      source: "email"
    },
    {
      eventId: "EVT-7011",
      customerId: "CUS-1002",
      timestamp: "2026-05-22T12:35:00.000Z",
      eventType: "support_ticket",
      productCategory: "Support",
      source: "support"
    },
    {
      eventId: "EVT-7012",
      customerId: "CUS-1003",
      timestamp: "2026-02-03T08:00:00.000Z",
      eventType: "visit",
      productCategory: "Commerce",
      source: "web"
    },
    {
      eventId: "EVT-7013",
      customerId: "CUS-1003",
      timestamp: "2026-02-03T08:06:00.000Z",
      eventType: "product_view",
      productCategory: "Commerce",
      source: "web"
    },
    {
      eventId: "EVT-7014",
      customerId: "CUS-1003",
      timestamp: "2026-02-03T08:12:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Commerce",
      source: "web"
    },
    {
      eventId: "EVT-7015",
      customerId: "CUS-1003",
      timestamp: "2026-02-17T15:30:00.000Z",
      eventType: "negative_feedback",
      productCategory: "Commerce",
      source: "survey"
    },
    {
      eventId: "EVT-7016",
      customerId: "CUS-1004",
      timestamp: "2026-06-20T11:00:00.000Z",
      eventType: "visit",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7017",
      customerId: "CUS-1004",
      timestamp: "2026-06-20T11:05:00.000Z",
      eventType: "product_view",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7018",
      customerId: "CUS-1004",
      timestamp: "2026-06-20T11:09:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7019",
      customerId: "CUS-1004",
      timestamp: "2026-06-20T11:16:00.000Z",
      eventType: "checkout_started",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7020",
      customerId: "CUS-1004",
      timestamp: "2026-06-20T11:21:00.000Z",
      eventType: "purchase",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7021",
      customerId: "CUS-1005",
      timestamp: "2026-05-30T07:30:00.000Z",
      eventType: "visit",
      productCategory: "Commerce",
      source: "ad"
    },
    {
      eventId: "EVT-7022",
      customerId: "CUS-1005",
      timestamp: "2026-05-30T07:33:00.000Z",
      eventType: "product_view",
      productCategory: "Commerce",
      source: "ad"
    },
    {
      eventId: "EVT-7023",
      customerId: "CUS-1005",
      timestamp: "2026-06-01T16:40:00.000Z",
      eventType: "negative_feedback",
      productCategory: "Commerce",
      source: "survey"
    },
    {
      eventId: "EVT-7024",
      customerId: "CUS-1006",
      timestamp: "2026-06-21T13:00:00.000Z",
      eventType: "visit",
      productCategory: "Analytics",
      source: "web"
    },
    {
      eventId: "EVT-7025",
      customerId: "CUS-1006",
      timestamp: "2026-06-21T13:03:00.000Z",
      eventType: "product_view",
      productCategory: "Analytics",
      source: "web"
    },
    {
      eventId: "EVT-7026",
      customerId: "CUS-1006",
      timestamp: "2026-06-21T13:05:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Analytics",
      source: "web"
    },
    {
      eventId: "EVT-7027",
      customerId: "CUS-1006",
      timestamp: "2026-06-21T13:09:00.000Z",
      eventType: "checkout_started",
      productCategory: "Analytics",
      source: "web"
    },
    {
      eventId: "EVT-7028",
      customerId: "CUS-1006",
      timestamp: "2026-06-21T13:16:00.000Z",
      eventType: "purchase",
      productCategory: "Analytics",
      source: "web"
    },
    {
      eventId: "EVT-7029",
      customerId: "CUS-1007",
      timestamp: "2026-05-15T09:00:00.000Z",
      eventType: "visit",
      productCategory: "Automation",
      source: "referral"
    },
    {
      eventId: "EVT-7030",
      customerId: "CUS-1007",
      timestamp: "2026-05-15T09:04:00.000Z",
      eventType: "product_view",
      productCategory: "Automation",
      source: "referral"
    },
    {
      eventId: "EVT-7031",
      customerId: "CUS-1007",
      timestamp: "2026-05-15T09:08:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Automation",
      source: "referral"
    },
    {
      eventId: "EVT-7032",
      customerId: "CUS-1008",
      timestamp: "2026-06-10T14:00:00.000Z",
      eventType: "visit",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7033",
      customerId: "CUS-1008",
      timestamp: "2026-06-10T14:02:00.000Z",
      eventType: "product_view",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7034",
      customerId: "CUS-1008",
      timestamp: "2026-06-10T14:05:00.000Z",
      eventType: "add_to_cart",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7035",
      customerId: "CUS-1008",
      timestamp: "2026-06-10T14:09:00.000Z",
      eventType: "checkout_started",
      productCategory: "Automation",
      source: "partner"
    },
    {
      eventId: "EVT-7036",
      customerId: "CUS-1008",
      timestamp: "2026-06-10T14:14:00.000Z",
      eventType: "purchase",
      productCategory: "Automation",
      source: "partner"
    }
  ],
  returns: [
    {
      returnId: "RET-9001",
      customerId: "CUS-1003",
      orderId: "ORD-5006",
      returnDate: "2026-02-14",
      amount: 200,
      reason: "Fit mismatch"
    },
    {
      returnId: "RET-9002",
      customerId: "CUS-1005",
      orderId: "ORD-5009",
      returnDate: "2026-03-20",
      amount: 450,
      reason: "Buyer remorse"
    },
    {
      returnId: "RET-9003",
      customerId: "CUS-1002",
      orderId: "ORD-5005",
      returnDate: "2026-05-25",
      amount: 300,
      reason: "Service issue"
    }
  ]
};

const emptySegmentArr: Record<CustomerRecord["segment"], number> = {
  Enterprise: 0,
  "Mid-Market": 0,
  Commercial: 0
};

export function summarizeCustomer360(records: CustomerRecord[]): Customer360Summary {
  if (records.length === 0) {
    return {
      totalArr: 0,
      averageHealthScore: 0,
      accountsAtRisk: 0,
      expansionCandidates: 0,
      segmentArr: { ...emptySegmentArr }
    };
  }

  const totals = records.reduce(
    (acc, record) => {
      acc.totalArr += record.arr;
      acc.healthScore += record.healthScore;
      acc.segmentArr[record.segment] += record.arr;
      if (record.healthScore < 70 || record.openRisks >= 3) {
        acc.accountsAtRisk += 1;
      }
      if (record.healthScore >= 85 && record.productUsage >= 90) {
        acc.expansionCandidates += 1;
      }
      return acc;
    },
    {
      totalArr: 0,
      healthScore: 0,
      accountsAtRisk: 0,
      expansionCandidates: 0,
      segmentArr: { ...emptySegmentArr }
    }
  );

  return {
    totalArr: totals.totalArr,
    averageHealthScore: Math.round(totals.healthScore / records.length),
    accountsAtRisk: totals.accountsAtRisk,
    expansionCandidates: totals.expansionCandidates,
    segmentArr: totals.segmentArr
  };
}

export function validateCustomer360Dataset(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: ["dataset must be an object"],
      warnings
    };
  }

  validateMetadata(input.metadata, errors);
  const customers = arrayAt(input, "customers", errors);
  const orders = arrayAt(input, "orders", errors);
  const events = arrayAt(input, "events", errors);
  const returns = arrayAt(input, "returns", errors);

  if (!customers || !orders || !events || !returns) {
    return { ok: false, errors, warnings };
  }

  if (customers.length === 0) {
    warnings.push("customers is empty; metrics will return zeroed customer analytics");
  }
  if (orders.length === 0) {
    warnings.push("orders is empty; revenue, AOV, repeat purchase, and purchase frequency will be zero");
  }
  if (events.length === 0) {
    warnings.push("events is empty; behavior funnel and freshness signals will be limited");
  }

  const customerIds = new Set<string>();
  const orderIds = new Set<string>();
  const eventIds = new Set<string>();
  const returnIds = new Set<string>();
  const orderNetAmounts = new Map<string, number>();

  for (const [index, customer] of customers.entries()) {
    const path = `customers[${index}]`;
    if (!isRecord(customer)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    requiredString(customer, "customerId", path, errors);
    requiredString(customer, "firstName", path, errors);
    requiredString(customer, "lastName", path, errors);
    requiredString(customer, "email", path, errors);
    requiredString(customer, "phone", path, errors);
    requiredDate(customer, "signupDate", path, errors);
    requiredString(customer, "country", path, errors);
    requiredEnum(customer, "region", ["Americas", "EMEA", "APAC"], path, errors);
    requiredEnum(customer, "channel", ["Paid Search", "Organic", "Referral", "Partner", "Webinar"], path, errors);
    requiredEnum(customer, "segment", CUSTOMER_SEGMENTS, path, errors);
    requiredString(customer, "acquisitionCohort", path, errors);
    addUnique(customer, "customerId", customerIds, path, errors);
  }

  for (const [index, order] of orders.entries()) {
    const path = `orders[${index}]`;
    if (!isRecord(order)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    requiredString(order, "orderId", path, errors);
    requiredString(order, "customerId", path, errors);
    requiredDate(order, "orderDate", path, errors);
    requiredEnum(order, "productCategory", ["Analytics", "Automation", "Insights", "Commerce", "Support"], path, errors);
    requiredNonNegativeNumber(order, "amount", path, errors);
    requiredNonNegativeNumber(order, "discount", path, errors);
    requiredEnum(order, "channel", ["Web", "Sales", "Partner", "Marketplace"], path, errors);
    addUnique(order, "orderId", orderIds, path, errors);
    if (typeof order.orderId === "string" && typeof order.amount === "number" && typeof order.discount === "number") {
      orderNetAmounts.set(order.orderId, Math.max(0, order.amount - order.discount));
    }
    if (typeof order.customerId === "string" && !customerIds.has(order.customerId)) {
      errors.push(`${path}.customerId references missing customer ${order.customerId}`);
    }
    if (typeof order.amount === "number" && typeof order.discount === "number" && order.discount > order.amount) {
      errors.push(`${path}.discount cannot exceed amount`);
    }
  }

  for (const [index, event] of events.entries()) {
    const path = `events[${index}]`;
    if (!isRecord(event)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    requiredString(event, "eventId", path, errors);
    requiredString(event, "customerId", path, errors);
    requiredDate(event, "timestamp", path, errors);
    requiredEnum(event, "eventType", FUNNEL_STAGES.map((stage) => stage.stage).concat(["support_ticket", "negative_feedback"]), path, errors);
    requiredEnum(event, "productCategory", ["Analytics", "Automation", "Insights", "Commerce", "Support"], path, errors);
    requiredString(event, "source", path, errors);
    addUnique(event, "eventId", eventIds, path, errors);
    if (typeof event.customerId === "string" && !customerIds.has(event.customerId)) {
      errors.push(`${path}.customerId references missing customer ${event.customerId}`);
    }
  }

  for (const [index, returned] of returns.entries()) {
    const path = `returns[${index}]`;
    if (!isRecord(returned)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    requiredString(returned, "returnId", path, errors);
    requiredString(returned, "customerId", path, errors);
    requiredString(returned, "orderId", path, errors);
    requiredDate(returned, "returnDate", path, errors);
    requiredNonNegativeNumber(returned, "amount", path, errors);
    requiredString(returned, "reason", path, errors);
    addUnique(returned, "returnId", returnIds, path, errors);
    if (typeof returned.customerId === "string" && !customerIds.has(returned.customerId)) {
      errors.push(`${path}.customerId references missing customer ${returned.customerId}`);
    }
    if (typeof returned.orderId === "string" && !orderIds.has(returned.orderId)) {
      errors.push(`${path}.orderId references missing order ${returned.orderId}`);
    }
    if (
      typeof returned.orderId === "string" &&
      typeof returned.amount === "number" &&
      orderNetAmounts.has(returned.orderId) &&
      returned.amount > (orderNetAmounts.get(returned.orderId) ?? 0)
    ) {
      errors.push(`${path}.amount cannot exceed the net amount for order ${returned.orderId}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

export function assertValidCustomer360Dataset(input: unknown): asserts input is Customer360Dataset {
  const validation = validateCustomer360Dataset(input);
  if (!validation.ok) {
    throw new Error(`Invalid Customer360 dataset: ${validation.errors.join("; ")}`);
  }
}

export function calculateCustomer360Metrics(
  dataset: Customer360Dataset,
  options: { asOf?: string } = {}
): Customer360Metrics {
  const validation = validateCustomer360Dataset(dataset);
  if (!validation.ok) {
    throw new Error(`Invalid Customer360 dataset: ${validation.errors.join("; ")}`);
  }

  const revenue = calculateRevenue(dataset);
  const averageOrderValue = calculateAverageOrderValue(dataset);
  const repeatPurchaseRate = calculateRepeatPurchaseRate(dataset);
  const purchaseFrequency = calculatePurchaseFrequency(dataset);
  const returnRate = calculateReturnRate(dataset);
  const churnRisk = calculateChurnRisk(dataset, options);

  return {
    metadata: dataset.metadata,
    validation,
    kpis: {
      revenue: revenue.revenue,
      grossRevenue: revenue.grossRevenue,
      returnedRevenue: revenue.returnedRevenue,
      averageOrderValue,
      repeatPurchaseRate,
      purchaseFrequency,
      returnRate,
      activeCustomers: countActiveCustomers(dataset),
      totalCustomers: dataset.customers.length,
      orderCount: revenue.orderCount,
      returnCount: revenue.returnCount,
      highRiskCustomers: churnRisk.filter((customer) => customer.riskTier === "high").length
    },
    segmentRevenue: calculateSegmentRevenue(dataset),
    topCategories: calculateTopCategories(dataset),
    retentionCohorts: calculateRetentionCohorts(dataset, options),
    churnRisk,
    topOpportunities: calculateTopOpportunities(dataset, options),
    behaviorFunnel: calculateBehaviorFunnel(dataset),
    dataFreshness: calculateDataFreshness(dataset, options),
    maskedCustomers: dataset.customers.map((customer) => maskCustomerProfile(customer))
  };
}

export function calculateRevenue(dataset: Customer360Dataset): RevenueMetric {
  const grossRevenue = dataset.orders.reduce((sum, order) => sum + orderNetAmount(order), 0);
  const returnedRevenue = dataset.returns.reduce((sum, returned) => sum + returned.amount, 0);

  return {
    grossRevenue: round(grossRevenue),
    returnedRevenue: round(returnedRevenue),
    revenue: round(Math.max(0, grossRevenue - returnedRevenue)),
    orderCount: dataset.orders.length,
    returnCount: dataset.returns.length
  };
}

export function calculateAverageOrderValue(dataset: Customer360Dataset): number {
  const revenue = calculateRevenue(dataset);
  if (revenue.orderCount === 0) {
    return 0;
  }
  return round(revenue.revenue / revenue.orderCount);
}

export function calculateRepeatPurchaseRate(dataset: Customer360Dataset): number {
  const orderCounts = ordersByCustomer(dataset.orders);
  const purchasingCustomers = [...orderCounts.values()].filter((orders) => orders.length > 0);
  if (purchasingCustomers.length === 0) {
    return 0;
  }
  const repeatCustomers = purchasingCustomers.filter((orders) => orders.length > 1).length;
  return round(repeatCustomers / purchasingCustomers.length);
}

export function calculatePurchaseFrequency(dataset: Customer360Dataset): number {
  const activeCustomers = countActiveCustomers(dataset);
  if (activeCustomers === 0) {
    return 0;
  }
  return round(dataset.orders.length / activeCustomers);
}

export function calculateReturnRate(dataset: Customer360Dataset): number {
  if (dataset.orders.length === 0) {
    return 0;
  }
  const returnedOrderIds = new Set(dataset.returns.map((returned) => returned.orderId));
  return round(returnedOrderIds.size / dataset.orders.length);
}

export function calculateSegmentRevenue(dataset: Customer360Dataset): SegmentRevenueMetric[] {
  const revenueBySegment = new Map<CustomerSegment, { customerCount: number; orderCount: number; revenue: number }>();
  const customersById = mapCustomersById(dataset.customers);
  const returnAmounts = returnAmountsByOrder(dataset.returns);

  for (const segment of CUSTOMER_SEGMENTS) {
    revenueBySegment.set(segment, { customerCount: 0, orderCount: 0, revenue: 0 });
  }

  for (const customer of dataset.customers) {
    const metric = revenueBySegment.get(customer.segment);
    if (metric) {
      metric.customerCount += 1;
    }
  }

  for (const order of dataset.orders) {
    const customer = customersById.get(order.customerId);
    if (!customer) {
      continue;
    }
    const metric = revenueBySegment.get(customer.segment);
    if (!metric) {
      continue;
    }
    metric.orderCount += 1;
    metric.revenue += orderNetAmount(order) - (returnAmounts.get(order.orderId) ?? 0);
  }

  const totalRevenue = Math.max(
    0,
    [...revenueBySegment.values()].reduce((sum, metric) => sum + metric.revenue, 0)
  );

  return CUSTOMER_SEGMENTS.map((segment) => {
    const metric = revenueBySegment.get(segment) ?? { customerCount: 0, orderCount: 0, revenue: 0 };
    const revenue = Math.max(0, metric.revenue);
    return {
      segment,
      customerCount: metric.customerCount,
      orderCount: metric.orderCount,
      revenue: round(revenue),
      averageOrderValue: metric.orderCount === 0 ? 0 : round(revenue / metric.orderCount),
      shareOfRevenue: totalRevenue === 0 ? 0 : round(revenue / totalRevenue)
    };
  });
}

export function calculateTopCategories(dataset: Customer360Dataset, limit = 5): CategoryMetric[] {
  const byCategory = new Map<ProductCategory, { revenue: number; orderCount: number; customers: Set<string>; returnedRevenue: number }>();
  const returnAmounts = returnAmountsByOrder(dataset.returns);

  for (const order of dataset.orders) {
    const current = byCategory.get(order.productCategory) ?? {
      revenue: 0,
      orderCount: 0,
      customers: new Set<string>(),
      returnedRevenue: 0
    };
    const returnedRevenue = returnAmounts.get(order.orderId) ?? 0;
    current.revenue += orderNetAmount(order) - returnedRevenue;
    current.returnedRevenue += returnedRevenue;
    current.orderCount += 1;
    current.customers.add(order.customerId);
    byCategory.set(order.productCategory, current);
  }

  return [...byCategory.entries()]
    .map(([productCategory, metric]) => ({
      productCategory,
      revenue: round(Math.max(0, metric.revenue)),
      orderCount: metric.orderCount,
      customerCount: metric.customers.size,
      returnedRevenue: round(metric.returnedRevenue)
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, limit);
}

export function calculateBehaviorFunnel(dataset: Customer360Dataset): BehaviorFunnelStage[] {
  const customersByStage = new Map<EventType, Set<string>>();

  for (const { stage } of FUNNEL_STAGES) {
    customersByStage.set(stage, new Set<string>());
  }

  for (const event of dataset.events) {
    const customers = customersByStage.get(event.eventType);
    if (customers) {
      customers.add(event.customerId);
    }
  }

  const firstStageCount = customersByStage.get(FUNNEL_STAGES[0]?.stage ?? "visit")?.size ?? 0;
  let previousCount = firstStageCount;

  return FUNNEL_STAGES.map(({ stage, label }, index) => {
    const customerCount = customersByStage.get(stage)?.size ?? 0;
    const conversionFromPrevious = index === 0 ? (customerCount === 0 ? 0 : 1) : previousCount === 0 ? 0 : customerCount / previousCount;
    const dropOffFromPrevious = index === 0 ? 0 : Math.max(0, previousCount - customerCount);
    const overallConversion = firstStageCount === 0 ? 0 : customerCount / firstStageCount;
    previousCount = customerCount;

    return {
      stage,
      label,
      customerCount,
      conversionFromPrevious: round(conversionFromPrevious),
      dropOffFromPrevious,
      overallConversion: round(overallConversion)
    };
  });
}

export function calculateRetentionCohorts(
  dataset: Customer360Dataset,
  options: { asOf?: string } = {}
): CohortMetric[] {
  const asOf = parseDate(options.asOf ?? dataset.metadata.generatedAt);
  const orders = ordersByCustomer(dataset.orders);
  const events = eventsByCustomer(dataset.events);
  const revenueByCustomer = netRevenueByCustomer(dataset);
  const cohorts = new Map<string, CustomerProfile[]>();

  for (const customer of dataset.customers) {
    const cohort = customer.acquisitionCohort || monthKey(customer.signupDate);
    const customers = cohorts.get(cohort) ?? [];
    customers.push(customer);
    cohorts.set(cohort, customers);
  }

  return [...cohorts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([cohort, customers]) => {
      const activeCustomersLast90Days = customers.filter((customer) =>
        hasActivityWithinDays(customer.customerId, orders, events, asOf, 90)
      ).length;
      const repeatCustomers = customers.filter((customer) => (orders.get(customer.customerId)?.length ?? 0) > 1).length;
      const revenue = customers.reduce((sum, customer) => sum + (revenueByCustomer.get(customer.customerId) ?? 0), 0);

      return {
        cohort,
        customerCount: customers.length,
        activeCustomersLast90Days,
        repeatCustomers,
        retentionRate: customers.length === 0 ? 0 : round(activeCustomersLast90Days / customers.length),
        repeatPurchaseRate: customers.length === 0 ? 0 : round(repeatCustomers / customers.length),
        revenue: round(revenue)
      };
    });
}

export function calculateChurnRisk(
  dataset: Customer360Dataset,
  options: { asOf?: string } = {}
): ChurnRiskCustomer[] {
  const asOf = parseDate(options.asOf ?? dataset.metadata.generatedAt);
  const orders = ordersByCustomer(dataset.orders);
  const events = eventsByCustomer(dataset.events);
  const returns = returnsByCustomer(dataset.returns);
  const revenueByCustomer = netRevenueByCustomer(dataset);

  return dataset.customers
    .map((customer) => {
      const customerOrders = orders.get(customer.customerId) ?? [];
      const customerEvents = events.get(customer.customerId) ?? [];
      const customerReturns = returns.get(customer.customerId) ?? [];
      const negativeEvents = customerEvents.filter((event) => event.eventType === "negative_feedback").length;
      const supportTickets = customerEvents.filter((event) => event.eventType === "support_ticket").length;
      const lastActivity = latestIso([
        ...customerOrders.map((order) => order.orderDate),
        ...customerEvents.map((event) => event.timestamp),
        ...customerReturns.map((returned) => returned.returnDate)
      ]);
      const daysSinceLastActivity = lastActivity ? Math.max(0, Math.floor((asOf.getTime() - parseDate(lastActivity).getTime()) / MS_PER_DAY)) : 999;

      const recencyScore = daysSinceLastActivity > 120 ? 45 : daysSinceLastActivity > 90 ? 35 : daysSinceLastActivity > 60 ? 20 : daysSinceLastActivity > 30 ? 10 : 0;
      const frequencyScore = customerOrders.length <= 1 ? 20 : 0;
      const returnScore = Math.min(25, customerReturns.length * 12);
      const sentimentScore = Math.min(25, negativeEvents * 15 + supportTickets * 8);
      const riskScore = Math.min(100, recencyScore + frequencyScore + returnScore + sentimentScore);
      const riskTier: ChurnRiskCustomer["riskTier"] = riskScore >= 65 ? "high" : riskScore >= 35 ? "medium" : "low";
      const riskFactors: string[] = [];

      if (daysSinceLastActivity > 60) {
        riskFactors.push(`${daysSinceLastActivity} days since last activity`);
      }
      if (customerOrders.length <= 1) {
        riskFactors.push("limited purchase history");
      }
      if (customerReturns.length > 0) {
        riskFactors.push(`${customerReturns.length} return event${customerReturns.length === 1 ? "" : "s"}`);
      }
      if (negativeEvents > 0 || supportTickets > 0) {
        riskFactors.push("negative service or feedback signal");
      }

      return {
        customerId: customer.customerId,
        label: renderCustomerLabel(customer),
        segment: customer.segment,
        riskScore,
        riskTier,
        daysSinceLastActivity,
        revenue: round(revenueByCustomer.get(customer.customerId) ?? 0),
        riskFactors
      };
    })
    .sort((left, right) => right.riskScore - left.riskScore || right.revenue - left.revenue);
}

export function calculateTopOpportunities(
  dataset: Customer360Dataset,
  options: { asOf?: string } = {},
  limit = 5
): OpportunityMetric[] {
  const opportunities: OpportunityMetric[] = [];
  const topCategory = calculateTopCategories(dataset, 1)[0];
  const churnRisk = calculateChurnRisk(dataset, options);
  const averageOrderValue = calculateAverageOrderValue(dataset);
  const funnel = calculateBehaviorFunnel(dataset);
  const revenue = calculateRevenue(dataset);

  if (topCategory) {
    opportunities.push({
      id: `growth-${topCategory.productCategory.toLowerCase()}`,
      type: "growth",
      title: `${topCategory.productCategory} expansion play`,
      productCategory: topCategory.productCategory,
      impact: round(topCategory.revenue * 0.12),
      reason: `${topCategory.productCategory} leads category revenue with ${topCategory.customerCount} buying customers.`,
      recommendedAction: "Prioritize cross-sell messaging for customers who viewed this category but did not buy."
    });
  }

  const highValueRisk = churnRisk.find((customer) => customer.riskTier === "high" && customer.revenue > 0);
  if (highValueRisk) {
    opportunities.push({
      id: `retention-${highValueRisk.customerId.toLowerCase()}`,
      type: "retention",
      title: `Retain ${highValueRisk.label}`,
      segment: highValueRisk.segment,
      impact: round(highValueRisk.revenue),
      reason: `Risk score ${highValueRisk.riskScore} with ${highValueRisk.riskFactors.join(", ") || "multiple risk signals"}.`,
      recommendedAction: "Route an owner follow-up before the next renewal or purchase cycle."
    });
  }

  const largestDrop = funnel.slice(1).sort((left, right) => right.dropOffFromPrevious - left.dropOffFromPrevious)[0];
  if (largestDrop && largestDrop.dropOffFromPrevious > 0) {
    opportunities.push({
      id: `conversion-${largestDrop.stage}`,
      type: "conversion",
      title: `${largestDrop.label} conversion recovery`,
      impact: round(largestDrop.dropOffFromPrevious * averageOrderValue),
      reason: `${largestDrop.dropOffFromPrevious} customer(s) dropped before ${largestDrop.label.toLowerCase()}.`,
      recommendedAction: "Test a guided nudge for customers stuck at this funnel stage."
    });
  }

  if (revenue.returnedRevenue > 0) {
    opportunities.push({
      id: "returns-recovery",
      type: "returns",
      title: "Return leakage reduction",
      impact: round(revenue.returnedRevenue),
      reason: `Returns reduced revenue by ${formatCurrency(revenue.returnedRevenue)} in the current seed.`,
      recommendedAction: "Inspect return reasons and trigger recovery offers for affected customers."
    });
  }

  for (const segment of calculateSegmentRevenue(dataset).filter((metric) => metric.revenue > 0)) {
    opportunities.push({
      id: `segment-${segment.segment.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      type: "growth",
      title: `${segment.segment} segment focus`,
      segment: segment.segment,
      impact: round(segment.revenue * 0.08),
      reason: `${segment.segment} contributes ${Math.round(segment.shareOfRevenue * 100)}% of net revenue.`,
      recommendedAction: "Package the strongest category bundle for this segment."
    });
  }

  return opportunities.sort((left, right) => right.impact - left.impact).slice(0, limit);
}

export function calculateDataFreshness(
  dataset: Customer360Dataset,
  options: { asOf?: string } = {}
): DataFreshnessMetric {
  const asOf = parseDate(options.asOf ?? dataset.metadata.generatedAt);
  const latestOrderAt = latestIso(dataset.orders.map((order) => order.orderDate));
  const latestEventAt = latestIso(dataset.events.map((event) => event.timestamp));
  const latestReturnAt = latestIso(dataset.returns.map((returned) => returned.returnDate));
  const latestAny = latestIso([latestOrderAt, latestEventAt, latestReturnAt].filter((value): value is string => Boolean(value)));
  const ageHours = latestAny ? round((asOf.getTime() - parseDate(latestAny).getTime()) / (60 * 60 * 1000)) : null;
  const warnings: string[] = [];

  if (ageHours === null) {
    warnings.push("No dated orders, events, or returns are available for freshness checks.");
  } else if (ageHours > 72) {
    warnings.push(`Latest activity is ${ageHours} hours old.`);
  }
  if (dataset.events.length === 0) {
    warnings.push("No behavioral events loaded.");
  }

  return {
    generatedAt: dataset.metadata.generatedAt,
    latestOrderAt,
    latestEventAt,
    latestReturnAt,
    ageHours,
    isStale: ageHours === null || ageHours > 72,
    rowCounts: {
      customers: dataset.customers.length,
      orders: dataset.orders.length,
      events: dataset.events.length,
      returns: dataset.returns.length
    },
    warnings
  };
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return "***";
  }
  return `${localPart.slice(0, 1)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const lastFour = digits.slice(-4) || "****";
  return `***-***-${lastFour}`;
}

export function maskName(firstName: string, lastName: string): string {
  const firstInitial = firstName.trim().slice(0, 1).toUpperCase() || "C";
  const lastInitial = lastName.trim().slice(0, 1).toUpperCase() || "U";
  return `${firstInitial}. ${lastInitial}.`;
}

export function renderCustomerLabel(
  customer: CustomerProfile,
  options: { includeRawPii?: boolean; includeSegment?: boolean } = {}
): string {
  const name = options.includeRawPii ? `${customer.firstName} ${customer.lastName}` : maskName(customer.firstName, customer.lastName);
  const segment = options.includeSegment ? ` - ${customer.segment}` : "";
  return `${name} (${customer.customerId})${segment}`;
}

export function maskCustomerProfile(customer: CustomerProfile): MaskedCustomerProfile {
  return {
    customerId: customer.customerId,
    label: renderCustomerLabel(customer),
    firstName: maskName(customer.firstName, customer.lastName),
    lastName: customer.customerId,
    email: maskEmail(customer.email),
    phone: maskPhone(customer.phone),
    country: customer.country,
    region: customer.region,
    channel: customer.channel,
    segment: customer.segment,
    acquisitionCohort: customer.acquisitionCohort
  };
}

export function containsRawCustomerPii(value: unknown, customers: CustomerProfile[] = seedCustomer360Dataset.customers): boolean {
  const text = JSON.stringify(value).toLowerCase();
  const digits = text.replace(/\D/g, "");

  return customers.some((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const phoneDigits = customer.phone.replace(/\D/g, "");
    return text.includes(fullName) || text.includes(customer.email.toLowerCase()) || (phoneDigits.length >= 7 && digits.includes(phoneDigits));
  });
}

export function mutateCustomer360Dataset(
  dataset: Customer360Dataset = seedCustomer360Dataset,
  options: { seed?: number; generatedAt?: string; scenario?: RefreshMetadata["scenario"] } = {}
): Customer360Dataset {
  const seed = options.seed ?? dataset.metadata.seed + 101;
  const random = seededRandom(seed);
  const customerIndex = Math.floor(random() * Math.max(1, dataset.customers.length));
  const customer = dataset.customers[customerIndex] ?? dataset.customers[0];
  const productCategories: ProductCategory[] = ["Analytics", "Automation", "Insights", "Commerce", "Support"];
  const productCategory = productCategories[Math.floor(random() * productCategories.length)] ?? "Analytics";
  const amount = 1200 + Math.floor(random() * 4800);
  const discount = Math.floor(random() * 4) * 50;
  const generatedAt = options.generatedAt ?? addDays(dataset.metadata.generatedAt, 1);
  const date = generatedAt.slice(0, 10);
  const suffix = String(seed).slice(-5);

  if (!customer) {
    return {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        datasetId: `${dataset.metadata.datasetId}-mutated-${suffix}`,
        seed,
        scenario: options.scenario ?? "mutated",
        generatedAt
      }
    };
  }

  const newOrder: OrderRecord = {
    orderId: `ORD-M${suffix}`,
    customerId: customer.customerId,
    orderDate: date,
    productCategory,
    amount,
    discount,
    channel: "Web"
  };

  const newEvents: CustomerEventRecord[] = [
    {
      eventId: `EVT-M${suffix}-1`,
      customerId: customer.customerId,
      timestamp: generatedAt,
      eventType: "visit",
      productCategory,
      source: "refresh-proof"
    },
    {
      eventId: `EVT-M${suffix}-2`,
      customerId: customer.customerId,
      timestamp: generatedAt,
      eventType: "purchase",
      productCategory,
      source: "refresh-proof"
    }
  ];

  return {
    metadata: {
      ...dataset.metadata,
      datasetId: `${dataset.metadata.datasetId}-mutated-${suffix}`,
      seed,
      scenario: options.scenario ?? "mutated",
      generatedAt
    },
    customers: dataset.customers.map((record) => ({ ...record })),
    orders: [...dataset.orders.map((record) => ({ ...record })), newOrder],
    events: [...dataset.events.map((record) => ({ ...record })), ...newEvents],
    returns: dataset.returns.map((record) => ({ ...record }))
  };
}

export const growthCustomer360Dataset: Customer360Dataset = mutateCustomer360Dataset(seedCustomer360Dataset, {
  seed: 20260701,
  generatedAt: "2026-06-29T10:00:00.000Z",
  scenario: "growth"
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateMetadata(value: unknown, errors: string[]): void {
  const path = "metadata";
  if (!isRecord(value)) {
    errors.push("metadata must be an object");
    return;
  }
  requiredString(value, "datasetId", path, errors);
  requiredNonNegativeNumber(value, "seed", path, errors);
  requiredEnum(value, "scenario", ["baseline", "growth", "risk", "mutated"], path, errors);
  requiredDate(value, "generatedAt", path, errors);
  requiredEnum(value, "piiPolicy", ["mask_email_name_phone"], path, errors);
  requiredEnum(value, "source", ["synthetic"], path, errors);
}

function arrayAt(record: Record<string, unknown>, key: string, errors: string[]): unknown[] | null {
  const value = record[key];
  if (!Array.isArray(value)) {
    errors.push(`${key} must be an array`);
    return null;
  }
  return value;
}

function requiredString(record: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  if (typeof record[key] !== "string" || String(record[key]).trim().length === 0) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function requiredDate(record: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  requiredString(record, key, path, errors);
  if (typeof record[key] === "string" && Number.isNaN(Date.parse(record[key]))) {
    errors.push(`${path}.${key} must be a valid date`);
  }
}

function requiredEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  path: string,
  errors: string[]
): void {
  if (typeof record[key] !== "string" || !allowed.includes(record[key] as T)) {
    errors.push(`${path}.${key} must be one of ${allowed.join(", ")}`);
  }
}

function requiredNonNegativeNumber(record: Record<string, unknown>, key: string, path: string, errors: string[]): void {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push(`${path}.${key} must be a non-negative number`);
  }
}

function addUnique(record: Record<string, unknown>, key: string, seen: Set<string>, path: string, errors: string[]): void {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    return;
  }
  if (seen.has(value)) {
    errors.push(`${path}.${key} duplicates ${value}`);
  }
  seen.add(value);
}

function orderNetAmount(order: OrderRecord): number {
  return Math.max(0, order.amount - order.discount);
}

function ordersByCustomer(orders: OrderRecord[]): Map<string, OrderRecord[]> {
  const grouped = new Map<string, OrderRecord[]>();
  for (const order of orders) {
    const customerOrders = grouped.get(order.customerId) ?? [];
    customerOrders.push(order);
    grouped.set(order.customerId, customerOrders);
  }
  return grouped;
}

function eventsByCustomer(events: CustomerEventRecord[]): Map<string, CustomerEventRecord[]> {
  const grouped = new Map<string, CustomerEventRecord[]>();
  for (const event of events) {
    const customerEvents = grouped.get(event.customerId) ?? [];
    customerEvents.push(event);
    grouped.set(event.customerId, customerEvents);
  }
  return grouped;
}

function returnsByCustomer(returns: ReturnRecord[]): Map<string, ReturnRecord[]> {
  const grouped = new Map<string, ReturnRecord[]>();
  for (const returned of returns) {
    const customerReturns = grouped.get(returned.customerId) ?? [];
    customerReturns.push(returned);
    grouped.set(returned.customerId, customerReturns);
  }
  return grouped;
}

function returnAmountsByOrder(returns: ReturnRecord[]): Map<string, number> {
  const grouped = new Map<string, number>();
  for (const returned of returns) {
    grouped.set(returned.orderId, (grouped.get(returned.orderId) ?? 0) + returned.amount);
  }
  return grouped;
}

function mapCustomersById(customers: CustomerProfile[]): Map<string, CustomerProfile> {
  return new Map(customers.map((customer) => [customer.customerId, customer]));
}

function netRevenueByCustomer(dataset: Customer360Dataset): Map<string, number> {
  const revenue = new Map<string, number>();
  const returnAmounts = returnAmountsByOrder(dataset.returns);

  for (const order of dataset.orders) {
    const current = revenue.get(order.customerId) ?? 0;
    revenue.set(order.customerId, current + orderNetAmount(order) - (returnAmounts.get(order.orderId) ?? 0));
  }

  return revenue;
}

function countActiveCustomers(dataset: Customer360Dataset): number {
  return new Set(dataset.orders.map((order) => order.customerId)).size;
}

function hasActivityWithinDays(
  customerId: string,
  orders: Map<string, OrderRecord[]>,
  events: Map<string, CustomerEventRecord[]>,
  asOf: Date,
  days: number
): boolean {
  const since = asOf.getTime() - days * MS_PER_DAY;
  const orderDates = orders.get(customerId)?.map((order) => order.orderDate) ?? [];
  const eventDates = events.get(customerId)?.map((event) => event.timestamp) ?? [];
  return [...orderDates, ...eventDates].some((value) => parseDate(value).getTime() >= since);
}

function latestIso(values: string[]): string | null {
  const dates = values
    .filter((value) => value && !Number.isNaN(Date.parse(value)))
    .map((value) => parseDate(value).toISOString())
    .sort();
  return dates.at(-1) ?? null;
}

function monthKey(value: string): string {
  return value.slice(0, 7);
}

function parseDate(value: string): Date {
  return new Date(value);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
