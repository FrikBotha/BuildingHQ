import { v4 as uuidv4 } from "uuid";
import type { Project, CreateProjectInput } from "@/types/project";
import {
  readJsonFile,
  writeJsonFile,
  listDirectories,
  ensureProjectDir,
  getProjectFilePath,
} from "./store";

export async function listProjects(): Promise<Project[]> {
  const ids = await listDirectories("projects");
  const projects: Project[] = [];
  for (const id of ids) {
    const project = await getProject(id);
    if (project) projects.push(project);
  }
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProject(id: string): Promise<Project | null> {
  return readJsonFile<Project>(getProjectFilePath(id, "project.json"));
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const project: Project = {
    id,
    name: input.name,
    description: input.description || "",
    address: input.address || "",
    erfNumber: input.erfNumber || "",
    localAuthority: input.localAuthority || "",
    projectStatus: "planning",
    startDate: null,
    estimatedCompletionDate: null,
    actualCompletionDate: null,
    totalBudget: input.totalBudget || 0,
    contingencyPercent: input.contingencyPercent || 10,
    nhbrcEnrolmentNumber: input.nhbrcEnrolmentNumber || null,
    buildingPlanApprovalDate: null,
    standSize: input.standSize || null,
    buildingSize: input.buildingSize || null,
    floors: input.floors || 1,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  await ensureProjectDir(id);
  await writeJsonFile(getProjectFilePath(id, "project.json"), project);
  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const project = await getProject(id);
  if (!project) return null;

  const updated: Project = {
    ...project,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(getProjectFilePath(id, "project.json"), updated);
  return updated;
}
