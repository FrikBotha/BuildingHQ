import type { UUID } from "./common";

export type PhaseStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "delayed"
  | "on_hold";

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  delayed: "Delayed",
  on_hold: "On Hold",
};

export type BuildPhase = {
  id: UUID;
  name: string;
  description: string;
  order: number;
  status: PhaseStatus;
  startDate: string | null;
  endDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  percentComplete: number;
  dependsOn: UUID[];
  color: string;
};

export type Milestone = {
  id: UUID;
  phaseId: UUID;
  name: string;
  description: string;
  targetDate: string;
  completedDate: string | null;
  isCompleted: boolean;
};

export type TimelineData = {
  projectId: UUID;
  phases: BuildPhase[];
  milestones: Milestone[];
  lastUpdated: string;
};
