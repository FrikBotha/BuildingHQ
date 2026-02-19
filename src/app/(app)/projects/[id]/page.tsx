import { getProject } from "@/data/projects";
import { getBOM } from "@/data/bom";
import { listQuotations } from "@/data/quotations";
import { getTimeline } from "@/data/timeline";
import { notFound } from "next/navigation";
import { ProjectOverview } from "@/components/project/project-overview";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [bom, quotations, timeline] = await Promise.all([
    getBOM(id),
    listQuotations(id),
    getTimeline(id),
  ]);

  return (
    <ProjectOverview
      project={project}
      bom={bom}
      quotations={quotations}
      timeline={timeline}
    />
  );
}
