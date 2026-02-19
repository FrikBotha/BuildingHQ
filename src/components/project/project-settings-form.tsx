"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Project, ProjectStatus } from "@/types/project";
import { PROJECT_STATUS_LABELS } from "@/types/project";

export function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(project.projectStatus);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      address: formData.get("address") as string,
      erfNumber: formData.get("erfNumber") as string,
      localAuthority: formData.get("localAuthority") as string,
      totalBudget: Number(formData.get("totalBudget")) || 0,
      contingencyPercent: Number(formData.get("contingencyPercent")) || 10,
      nhbrcEnrolmentNumber: formData.get("nhbrcEnrolmentNumber") as string,
      standSize: Number(formData.get("standSize")) || null,
      buildingSize: Number(formData.get("buildingSize")) || null,
      floors: Number(formData.get("floors")) || 1,
      startDate: (formData.get("startDate") as string) || null,
      estimatedCompletionDate: (formData.get("estimatedCompletionDate") as string) || null,
      projectStatus: status,
    };

    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Project updated");
      router.refresh();
    } catch {
      toast.error("Failed to update project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" name="name" defaultValue={project.name} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={project.description} rows={3} />
            </div>
            <div>
              <Label>Project Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={project.address} />
              </div>
              <div>
                <Label htmlFor="erfNumber">Erf Number</Label>
                <Input id="erfNumber" name="erfNumber" defaultValue={project.erfNumber} />
              </div>
            </div>
            <div>
              <Label htmlFor="localAuthority">Local Authority</Label>
              <Input id="localAuthority" name="localAuthority" defaultValue={project.localAuthority} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="standSize">Stand Size (m²)</Label>
                <Input id="standSize" name="standSize" type="number" defaultValue={project.standSize || ""} />
              </div>
              <div>
                <Label htmlFor="buildingSize">Building Size (m²)</Label>
                <Input id="buildingSize" name="buildingSize" type="number" defaultValue={project.buildingSize || ""} />
              </div>
              <div>
                <Label htmlFor="floors">Floors</Label>
                <Input id="floors" name="floors" type="number" defaultValue={project.floors} min={1} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="totalBudget">Total Budget (ZAR)</Label>
                <Input id="totalBudget" name="totalBudget" type="number" defaultValue={project.totalBudget} />
              </div>
              <div>
                <Label htmlFor="contingencyPercent">Contingency %</Label>
                <Input id="contingencyPercent" name="contingencyPercent" type="number" defaultValue={project.contingencyPercent} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={project.startDate || ""} />
              </div>
              <div>
                <Label htmlFor="estimatedCompletionDate">Est. Completion</Label>
                <Input id="estimatedCompletionDate" name="estimatedCompletionDate" type="date" defaultValue={project.estimatedCompletionDate || ""} />
              </div>
            </div>
            <div>
              <Label htmlFor="nhbrcEnrolmentNumber">NHBRC Enrolment Number</Label>
              <Input id="nhbrcEnrolmentNumber" name="nhbrcEnrolmentNumber" defaultValue={project.nhbrcEnrolmentNumber || ""} />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
