export interface CustomerRecord {
  account: string;
  segment: "Enterprise" | "Mid-Market" | "Commercial";
  region: "Americas" | "EMEA" | "APAC";
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
