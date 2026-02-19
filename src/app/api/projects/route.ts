import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/data/projects";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const project = await createProject(body);
  return NextResponse.json(project, { status: 201 });
}
