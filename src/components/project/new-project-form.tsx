"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      standSize: Number(formData.get("standSize")) || undefined,
      buildingSize: Number(formData.get("buildingSize")) || undefined,
      floors: Number(formData.get("floors")) || 1,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const project = await res.json();
      toast.success("Project created successfully");
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error("Failed to create project");
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
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" name="name" placeholder="e.g., 123 Main Street Residence" required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief project description" rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="address">Site Address</Label>
                <Input id="address" name="address" placeholder="Full site address" />
              </div>
              <div>
                <Label htmlFor="erfNumber">Erf Number</Label>
                <Input id="erfNumber" name="erfNumber" placeholder="e.g., Erf 1234" />
              </div>
            </div>

            <div>
              <Label htmlFor="localAuthority">Local Authority</Label>
              <Input id="localAuthority" name="localAuthority" placeholder="e.g., City of Cape Town" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="standSize">Stand Size (m²)</Label>
                <Input id="standSize" name="standSize" type="number" placeholder="e.g., 500" />
              </div>
              <div>
                <Label htmlFor="buildingSize">Building Size (m²)</Label>
                <Input id="buildingSize" name="buildingSize" type="number" placeholder="e.g., 180" />
              </div>
              <div>
                <Label htmlFor="floors">Number of Floors</Label>
                <Input id="floors" name="floors" type="number" defaultValue={1} min={1} max={5} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="totalBudget">Total Budget (ZAR)</Label>
                <Input id="totalBudget" name="totalBudget" type="number" placeholder="e.g., 2500000" />
              </div>
              <div>
                <Label htmlFor="contingencyPercent">Contingency %</Label>
                <Input id="contingencyPercent" name="contingencyPercent" type="number" defaultValue={10} min={0} max={50} />
              </div>
            </div>

            <div>
              <Label htmlFor="nhbrcEnrolmentNumber">NHBRC Enrolment Number</Label>
              <Input id="nhbrcEnrolmentNumber" name="nhbrcEnrolmentNumber" placeholder="e.g., NHBRC-12345" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
