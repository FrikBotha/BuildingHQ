import type { UUID, TradeCategory } from "./common";

export type CostEntry = {
  tradeCategory: TradeCategory;
  budgetAmount: number;
  quotedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
};

export type CostSummary = {
  projectId: UUID;
  totalBudget: number;
  contingencyPercent: number;
  contingencyAmount: number;
  budgetInclContingency: number;
  totalQuoted: number;
  totalActual: number;
  totalVariance: number;
  entriesByTrade: CostEntry[];
  lastCalculated: string;
};
