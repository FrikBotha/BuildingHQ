import type { UUID } from "./common";

export type DrawingCategory =
  | "site_plan"
  | "floor_plan"
  | "elevation"
  | "section"
  | "detail"
  | "structural"
  | "electrical"
  | "plumbing"
  | "render_3d"
  | "other";

export const DRAWING_CATEGORY_LABELS: Record<DrawingCategory, string> = {
  site_plan: "Site Plan",
  floor_plan: "Floor Plan",
  elevation: "Elevation",
  section: "Section",
  detail: "Detail",
  structural: "Structural",
  electrical: "Electrical",
  plumbing: "Plumbing",
  render_3d: "3D Render",
  other: "Other",
};

export type DrawingRevision = {
  id: UUID;
  revisionNumber: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: string;
  notes: string;
};

export type Drawing = {
  id: UUID;
  projectId: UUID;
  title: string;
  drawingNumber: string;
  category: DrawingCategory;
  description: string;
  currentRevision: string;
  revisions: DrawingRevision[];
  createdAt: string;
  updatedAt: string;
};
