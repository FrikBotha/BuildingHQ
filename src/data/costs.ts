import type { CostSummary, CostEntry } from "@/types/cost";
import type { TradeCategory, TRADE_CATEGORY_LABELS } from "@/types/common";
import { getProject } from "./projects";
import { getBOM } from "./bom";
import { listQuotations } from "./quotations";

export async function calculateCostSummary(projectId: string): Promise<CostSummary | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const bom = await getBOM(projectId);
  const quotations = await listQuotations(projectId);

  const totalBudget = project.totalBudget || (bom?.grandTotal ?? 0);
  const contingencyPercent = project.contingencyPercent;
  const contingencyAmount = totalBudget * (contingencyPercent / 100);

  const acceptedQuotations = quotations.filter((q) => q.status === "accepted");
  const totalQuoted = acceptedQuotations.reduce((sum, q) => sum + q.totalAmount, 0);

  // Build cost entries by trade
  const trades = new Set<TradeCategory>();
  acceptedQuotations.forEach((q) => trades.add(q.tradeCategory));

  const entriesByTrade: CostEntry[] = Array.from(trades).map((trade) => {
    const tradeQuotations = acceptedQuotations.filter((q) => q.tradeCategory === trade);
    const quotedAmount = tradeQuotations.reduce((sum, q) => sum + q.totalAmount, 0);

    return {
      tradeCategory: trade,
      budgetAmount: 0, // Would link to BOM categories in a fuller implementation
      quotedAmount,
      actualAmount: 0,
      variance: -quotedAmount,
      variancePercent: 0,
    };
  });

  return {
    projectId,
    totalBudget,
    contingencyPercent,
    contingencyAmount,
    budgetInclContingency: totalBudget + contingencyAmount,
    totalQuoted,
    totalActual: 0,
    totalVariance: totalBudget - totalQuoted,
    entriesByTrade,
    lastCalculated: new Date().toISOString(),
  };
}
