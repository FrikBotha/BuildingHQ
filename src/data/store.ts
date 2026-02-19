import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    const content = await readFile(fullPath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const fullPath = path.join(DATA_DIR, filePath);
  await ensureDir(path.dirname(fullPath));
  await writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function deleteJsonFile(filePath: string): Promise<void> {
  const fullPath = path.join(DATA_DIR, filePath);
  const { unlink } = await import("fs/promises");
  try {
    await unlink(fullPath);
  } catch {
    // File may not exist
  }
}

export async function listDirectories(dirPath: string): Promise<string[]> {
  try {
    const fullPath = path.join(DATA_DIR, dirPath);
    const entries = await readdir(fullPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function ensureProjectDir(projectId: string): Promise<string> {
  const projectDir = path.join(DATA_DIR, "projects", projectId);
  await ensureDir(projectDir);
  await ensureDir(path.join(projectDir, "files", "quotations"));
  await ensureDir(path.join(projectDir, "files", "drawings"));
  await ensureDir(path.join(projectDir, "files", "renderings"));
  return projectDir;
}

export function getProjectFilePath(projectId: string, file: string): string {
  return path.join("projects", projectId, file);
}

export function getUploadDir(projectId: string, type: "quotations" | "drawings" | "renderings"): string {
  return path.join(DATA_DIR, "projects", projectId, "files", type);
}
