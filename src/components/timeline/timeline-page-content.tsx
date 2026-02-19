"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  GanttChart,
  Play,
  CheckCircle2,
  Pause,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { TimelineData, BuildPhase, PhaseStatus } from "@/types/timeline";
import { PHASE_STATUS_LABELS } from "@/types/timeline";
import { formatDate } from "@/lib/dates";

interface TimelinePageContentProps {
  projectId: string;
  initialTimeline: TimelineData | null;
}

const STATUS_COLORS: Record<PhaseStatus, string> = {
  not_started: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  delayed: "bg-red-100 text-red-700 border-red-300",
  on_hold: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

const STATUS_ICONS: Record<PhaseStatus, React.ReactNode> = {
  not_started: <Calendar className="h-3.5 w-3.5" />,
  in_progress: <Play className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  delayed: <AlertTriangle className="h-3.5 w-3.5" />,
  on_hold: <Pause className="h-3.5 w-3.5" />,
};

export function TimelinePageContent({
  projectId,
  initialTimeline,
}: TimelinePageContentProps) {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineData | null>(initialTimeline);
  const [startDate, setStartDate] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [editingPhase, setEditingPhase] = useState<BuildPhase | null>(null);
  const [editStatus, setEditStatus] = useState<PhaseStatus>("not_started");
  const [editPercent, setEditPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  async function handleInitialize() {
    if (!startDate) {
      toast.error("Please select a start date.");
      return;
    }

    setIsInitializing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize", startDate }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initialize timeline");
      }

      const data = await res.json();
      setTimeline(data);
      toast.success("Timeline initialized successfully.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initialize timeline");
    } finally {
      setIsInitializing(false);
    }
  }

  function openEditDialog(phase: BuildPhase) {
    setEditingPhase(phase);
    setEditStatus(phase.status);
    setEditPercent(phase.percentComplete);
  }

  async function handleSavePhase() {
    if (!editingPhase) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePhase",
          phaseId: editingPhase.id,
          updates: {
            status: editStatus,
            percentComplete: editPercent,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update phase");
      }

      const data = await res.json();
      setTimeline(data);
      setEditingPhase(null);
      toast.success(`Phase "${editingPhase.name}" updated.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update phase");
    } finally {
      setIsSaving(false);
    }
  }

  // ---- Initialization Screen ----
  if (!timeline) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Timeline</h1>
          <p className="text-muted-foreground">
            Plan and track your build phases and milestones
          </p>
        </div>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GanttChart className="h-5 w-5" />
              Initialize Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a project start date to generate a timeline from the default
              build phase template.
            </p>
            <div className="space-y-2">
              <Label htmlFor="start-date">Project Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleInitialize}
              disabled={!startDate || isInitializing}
              className="w-full"
            >
              {isInitializing ? "Initializing..." : "Initialize Timeline"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Timeline Data ----
  const { phases, milestones } = timeline;

  // Calculate date range for the Gantt chart
  const phasesWithDates = phases.filter((p) => p.startDate && p.endDate);
  const allStartDates = phasesWithDates.map((p) => new Date(p.startDate!).getTime());
  const allEndDates = phasesWithDates.map((p) => new Date(p.endDate!).getTime());

  const earliestStart =
    allStartDates.length > 0 ? Math.min(...allStartDates) : Date.now();
  const latestEnd =
    allEndDates.length > 0 ? Math.max(...allEndDates) : Date.now();
  const totalRange = latestEnd - earliestStart || 1;

  // Generate month markers for the time axis
  function getMonthMarkers() {
    const markers: { label: string; leftPercent: number }[] = [];
    const start = new Date(earliestStart);
    const end = new Date(latestEnd);

    // Start at the first day of the start month
    const current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const offset = current.getTime() - earliestStart;
      const percent = (offset / totalRange) * 100;
      if (percent >= 0 && percent <= 100) {
        markers.push({
          label: current.toLocaleDateString("en-ZA", {
            month: "short",
            year: "2-digit",
          }),
          leftPercent: percent,
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
    return markers;
  }

  const monthMarkers = getMonthMarkers();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Timeline</h1>
        <p className="text-muted-foreground">
          Plan and track your build phases and milestones
        </p>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChart className="h-5 w-5" />
            Gantt Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phasesWithDates.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No phases with date ranges to display.
            </p>
          ) : (
            <div className="overflow-x-auto">
              {/* Time Axis */}
              <div className="flex">
                <div className="w-[200px] shrink-0" />
                <div className="relative flex-1 h-6 border-b">
                  {monthMarkers.map((marker, i) => (
                    <div
                      key={i}
                      className="absolute text-xs text-muted-foreground whitespace-nowrap"
                      style={{ left: `${marker.leftPercent}%`, top: 0 }}
                    >
                      <div className="border-l border-muted h-4 mb-0.5" />
                      {marker.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Bars */}
              <div className="space-y-1 mt-2">
                {phases
                  .sort((a, b) => a.order - b.order)
                  .map((phase) => {
                    if (!phase.startDate || !phase.endDate) {
                      return (
                        <div key={phase.id} className="flex items-center h-10">
                          <div className="w-[200px] shrink-0 pr-3 text-sm font-medium truncate">
                            {phase.name}
                          </div>
                          <div className="flex-1 flex items-center">
                            <span className="text-xs text-muted-foreground italic">
                              No dates set
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const phaseStart = new Date(phase.startDate).getTime();
                    const phaseEnd = new Date(phase.endDate).getTime();
                    const startPercent =
                      ((phaseStart - earliestStart) / totalRange) * 100;
                    const widthPercent =
                      ((phaseEnd - phaseStart) / totalRange) * 100;

                    return (
                      <div key={phase.id} className="flex items-center h-10">
                        <div className="w-[200px] shrink-0 pr-3 text-sm font-medium truncate">
                          {phase.name}
                        </div>
                        <div className="relative flex-1 h-8">
                          {/* Background track */}
                          <div className="absolute inset-0 bg-muted/30 rounded" />
                          {/* Phase bar */}
                          <div
                            className="absolute h-8 rounded flex items-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                              left: `${startPercent}%`,
                              width: `${Math.max(widthPercent, 1)}%`,
                              backgroundColor: phase.color,
                            }}
                            onClick={() => openEditDialog(phase)}
                            title={`${phase.name}: ${formatDate(phase.startDate)} - ${formatDate(phase.endDate)}`}
                          >
                            <span className="text-xs text-white font-medium px-2 whitespace-nowrap drop-shadow-sm">
                              {phase.percentComplete}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase List */}
      <Card>
        <CardHeader>
          <CardTitle>Build Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {phases
              .sort((a, b) => a.order - b.order)
              .map((phase) => (
                <Card
                  key={phase.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openEditDialog(phase)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm leading-tight">
                        {phase.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${STATUS_COLORS[phase.status]}`}
                      >
                        <span className="mr-1">{STATUS_ICONS[phase.status]}</span>
                        {PHASE_STATUS_LABELS[phase.status]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(phase.startDate)} &mdash; {formatDate(phase.endDate)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{phase.percentComplete}%</span>
                      </div>
                      <Progress value={phase.percentComplete} />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No milestones defined.
            </p>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {milestone.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          milestone.isCompleted ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {milestone.name}
                      </p>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium">
                      {formatDate(milestone.targetDate)}
                    </p>
                    {milestone.isCompleted && milestone.completedDate && (
                      <p className="text-xs text-green-600">
                        Completed {formatDate(milestone.completedDate)}
                      </p>
                    )}
                    {!milestone.isCompleted && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Phase Dialog */}
      <Dialog
        open={editingPhase !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPhase(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Phase: {editingPhase?.name}</DialogTitle>
          </DialogHeader>
          {editingPhase && (
            <div className="space-y-4 pt-2">
              <div className="text-sm text-muted-foreground">
                {formatDate(editingPhase.startDate)} &mdash;{" "}
                {formatDate(editingPhase.endDate)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase-status">Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(value) => setEditStatus(value as PhaseStatus)}
                >
                  <SelectTrigger id="phase-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(PHASE_STATUS_LABELS) as [PhaseStatus, string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase-percent">Percent Complete</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="phase-percent"
                    type="number"
                    min={0}
                    max={100}
                    value={editPercent}
                    onChange={(e) =>
                      setEditPercent(
                        Math.max(0, Math.min(100, Number(e.target.value)))
                      )
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <div className="flex-1">
                    <Progress value={editPercent} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingPhase(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePhase} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
