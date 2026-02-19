import { getProject } from "@/data/projects";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project/project-tabs";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS } from "@/types/project";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <Badge variant="secondary">
            {PROJECT_STATUS_LABELS[project.projectStatus]}
          </Badge>
        </div>
        {project.address && (
          <p className="text-muted-foreground">{project.address}</p>
        )}
      </div>
      <ProjectTabs projectId={id} />
      {children}
    </div>
  );
}
