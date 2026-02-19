import { v4 as uuidv4 } from "uuid";
import type { TimelineData, BuildPhase, Milestone } from "@/types/timeline";
import { readJsonFile, writeJsonFile, getProjectFilePath } from "./store";
import { SA_BUILD_PHASES_TEMPLATE } from "@/components/timeline/timeline-templates";

export async function getTimeline(projectId: string): Promise<TimelineData | null> {
  return readJsonFile<TimelineData>(getProjectFilePath(projectId, "timeline.json"));
}

export async function initializeTimeline(projectId: string, startDate: string): Promise<TimelineData> {
  let currentDate = new Date(startDate);
  const phases: BuildPhase[] = SA_BUILD_PHASES_TEMPLATE.map((template, index) => {
    const phaseStart = new Date(currentDate);
    const phaseEnd = new Date(currentDate);
    phaseEnd.setDate(phaseEnd.getDate() + template.durationDays - 1);
    currentDate = new Date(phaseEnd);
    currentDate.setDate(currentDate.getDate() + 1);

    return {
      id: uuidv4(),
      name: template.name,
      description: template.description,
      order: index + 1,
      status: "not_started",
      startDate: phaseStart.toISOString().split("T")[0],
      endDate: phaseEnd.toISOString().split("T")[0],
      actualStartDate: null,
      actualEndDate: null,
      percentComplete: 0,
      dependsOn: [],
      color: template.color,
    };
  });

  // Set dependencies (each phase depends on the previous)
  for (let i = 1; i < phases.length; i++) {
    phases[i].dependsOn = [phases[i - 1].id];
  }

  const timeline: TimelineData = {
    projectId,
    phases,
    milestones: [],
    lastUpdated: new Date().toISOString(),
  };

  await writeJsonFile(getProjectFilePath(projectId, "timeline.json"), timeline);
  return timeline;
}

export async function updatePhase(
  projectId: string,
  phaseId: string,
  updates: Partial<BuildPhase>
): Promise<TimelineData | null> {
  const timeline = await getTimeline(projectId);
  if (!timeline) return null;

  timeline.phases = timeline.phases.map((p) =>
    p.id === phaseId ? { ...p, ...updates } : p
  );
  timeline.lastUpdated = new Date().toISOString();

  await writeJsonFile(getProjectFilePath(projectId, "timeline.json"), timeline);
  return timeline;
}

export async function addMilestone(
  projectId: string,
  milestone: Omit<Milestone, "id">
): Promise<TimelineData | null> {
  const timeline = await getTimeline(projectId);
  if (!timeline) return null;

  timeline.milestones.push({ ...milestone, id: uuidv4() });
  timeline.lastUpdated = new Date().toISOString();

  await writeJsonFile(getProjectFilePath(projectId, "timeline.json"), timeline);
  return timeline;
}
