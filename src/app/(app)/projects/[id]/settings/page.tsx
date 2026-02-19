import { getProject } from "@/data/projects";
import { notFound } from "next/navigation";
import { ProjectSettingsForm } from "@/components/project/project-settings-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update project details and configuration
        </p>
      </div>
      <ProjectSettingsForm project={project} />
    </div>
  );
}
