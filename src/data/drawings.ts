import { v4 as uuidv4 } from "uuid";
import type { Drawing, DrawingCategory, DrawingRevision } from "@/types/drawing";
import { readJsonFile, writeJsonFile, getProjectFilePath } from "./store";

async function readDrawings(projectId: string): Promise<Drawing[]> {
  return (await readJsonFile<Drawing[]>(getProjectFilePath(projectId, "drawings.json"))) || [];
}

async function saveDrawings(projectId: string, drawings: Drawing[]): Promise<void> {
  await writeJsonFile(getProjectFilePath(projectId, "drawings.json"), drawings);
}

export async function listDrawings(projectId: string): Promise<Drawing[]> {
  return readDrawings(projectId);
}

export async function getDrawing(projectId: string, drawingId: string): Promise<Drawing | null> {
  const drawings = await readDrawings(projectId);
  return drawings.find((d) => d.id === drawingId) || null;
}

export async function createDrawing(
  projectId: string,
  input: {
    title: string;
    drawingNumber: string;
    category: DrawingCategory;
    description?: string;
  }
): Promise<Drawing> {
  const drawings = await readDrawings(projectId);
  const now = new Date().toISOString();

  const drawing: Drawing = {
    id: uuidv4(),
    projectId,
    title: input.title,
    drawingNumber: input.drawingNumber,
    category: input.category,
    description: input.description || "",
    currentRevision: "—",
    revisions: [],
    createdAt: now,
    updatedAt: now,
  };

  drawings.push(drawing);
  await saveDrawings(projectId, drawings);
  return drawing;
}

export async function addRevision(
  projectId: string,
  drawingId: string,
  revision: Omit<DrawingRevision, "id">
): Promise<Drawing | null> {
  const drawings = await readDrawings(projectId);
  const index = drawings.findIndex((d) => d.id === drawingId);
  if (index === -1) return null;

  const newRevision: DrawingRevision = { ...revision, id: uuidv4() };
  drawings[index].revisions.push(newRevision);
  drawings[index].currentRevision = revision.revisionNumber;
  drawings[index].updatedAt = new Date().toISOString();

  await saveDrawings(projectId, drawings);
  return drawings[index];
}

export async function deleteDrawing(projectId: string, drawingId: string): Promise<boolean> {
  const drawings = await readDrawings(projectId);
  const filtered = drawings.filter((d) => d.id !== drawingId);
  if (filtered.length === drawings.length) return false;
  await saveDrawings(projectId, filtered);
  return true;
}
