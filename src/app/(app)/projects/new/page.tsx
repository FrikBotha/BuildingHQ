import { NewProjectForm } from "@/components/project/new-project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
        <p className="text-muted-foreground">
          Create a new residential building project
        </p>
      </div>
      <NewProjectForm />
    </div>
  );
}
