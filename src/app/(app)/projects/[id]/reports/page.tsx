import { getProject } from "@/data/projects";
import { getBOM } from "@/data/bom";
import { listQuotations } from "@/data/quotations";
import { calculateCostSummary } from "@/data/costs";
import { getTimeline } from "@/data/timeline";
import { notFound } from "next/navigation";
import { ReportsPageContent } from "@/components/reports/reports-page-content";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [bom, quotations, costSummary, timeline] = await Promise.all([
    getBOM(id),
    listQuotations(id),
    calculateCostSummary(id),
    getTimeline(id),
  ]);

  return (
    <ReportsPageContent
      project={project}
      bom={bom}
      quotations={quotations}
      costSummary={costSummary}
      timeline={timeline}
    />
  );
}
