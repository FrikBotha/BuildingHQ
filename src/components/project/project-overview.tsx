"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, ClipboardList, FileText, GanttChart } from "lucide-react";
import type { Project } from "@/types/project";
import type { BOMData } from "@/types/bom";
import type { Quotation } from "@/types/quotation";
import type { TimelineData } from "@/types/timeline";
import { formatZAR } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export function ProjectOverview({
  project,
  bom,
  quotations,
  timeline,
}: {
  project: Project;
  bom: BOMData | null;
  quotations: Quotation[];
  timeline: TimelineData | null;
}) {
  const acceptedQuotations = quotations.filter((q) => q.status === "accepted");
  const totalQuoted = acceptedQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const completedPhases = timeline?.phases.filter((p) => p.status === "completed").length || 0;
  const totalPhases = timeline?.phases.length || 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatZAR(project.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              +{project.contingencyPercent}% contingency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">BOM Total</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bom ? formatZAR(bom.grandTotal) : "Not initialized"}
            </div>
            {bom && (
              <p className="text-xs text-muted-foreground">{bom.items.length} items</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatZAR(totalQuoted)}</div>
            <p className="text-xs text-muted-foreground">
              {acceptedQuotations.length} accepted of {quotations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
            <GanttChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPhases > 0 ? `${completedPhases}/${totalPhases}` : "Not set up"}
            </div>
            <p className="text-xs text-muted-foreground">phases completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Erf Number" value={project.erfNumber || "—"} />
            <DetailRow label="Local Authority" value={project.localAuthority || "—"} />
            <DetailRow label="Stand Size" value={project.standSize ? `${project.standSize} m²` : "—"} />
            <DetailRow label="Building Size" value={project.buildingSize ? `${project.buildingSize} m²` : "—"} />
            <DetailRow label="Floors" value={String(project.floors)} />
            <DetailRow label="NHBRC Number" value={project.nhbrcEnrolmentNumber || "—"} />
            <DetailRow label="Plan Approval" value={formatDate(project.buildingPlanApprovalDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Start Date" value={formatDate(project.startDate)} />
            <DetailRow label="Est. Completion" value={formatDate(project.estimatedCompletionDate)} />
            <DetailRow label="Actual Completion" value={formatDate(project.actualCompletionDate)} />
            {project.description && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
