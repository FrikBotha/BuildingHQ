import { calculateCostSummary } from "@/data/costs";
import { CostsPageContent } from "@/components/costs/costs-page-content";

export default async function CostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const costSummary = await calculateCostSummary(id);

  return <CostsPageContent projectId={id} costSummary={costSummary} />;
}
