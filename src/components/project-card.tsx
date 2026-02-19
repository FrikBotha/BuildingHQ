"use client";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar } from "lucide-react";
import type { Project } from "@/types/project";
import { PROJECT_STATUS_LABELS } from "@/types/project";
import { formatZARCompact } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800",
    in_progress: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{project.name}</CardTitle>
            </div>
            <Badge className={statusColors[project.projectStatus] || ""} variant="secondary">
              {PROJECT_STATUS_LABELS[project.projectStatus]}
            </Badge>
          </div>
          {project.address && (
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.address}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-semibold">{formatZARCompact(project.totalBudget)}</span>
          </div>
          {project.buildingSize && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Size</span>
              <span>{project.buildingSize} m²</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Created
            </span>
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
