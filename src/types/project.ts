import type { UUID } from "./common";

export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type Project = {
  id: UUID;
  name: string;
  description: string;
  address: string;
  erfNumber: string;
  localAuthority: string;
  projectStatus: ProjectStatus;
  startDate: string | null;
  estimatedCompletionDate: string | null;
  actualCompletionDate: string | null;
  totalBudget: number;
  contingencyPercent: number;
  nhbrcEnrolmentNumber: string | null;
  buildingPlanApprovalDate: string | null;
  standSize: number | null;
  buildingSize: number | null;
  floors: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  address?: string;
  erfNumber?: string;
  localAuthority?: string;
  totalBudget?: number;
  contingencyPercent?: number;
  nhbrcEnrolmentNumber?: string;
  standSize?: number;
  buildingSize?: number;
  floors?: number;
};
