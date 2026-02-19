import { listProjects } from "@/data/projects";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const projects = await listProjects();

  return <DashboardContent projects={projects} />;
}
