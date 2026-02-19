import { NextResponse } from "next/server";
import { getTimeline, initializeTimeline, updatePhase, addMilestone } from "@/data/timeline";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const timeline = await getTimeline(id);
  return NextResponse.json(timeline);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "initialize") {
    const timeline = await initializeTimeline(id, body.startDate);
    return NextResponse.json(timeline, { status: 201 });
  }

  if (body.action === "updatePhase") {
    const timeline = await updatePhase(id, body.phaseId, body.updates);
    return NextResponse.json(timeline);
  }

  if (body.action === "addMilestone") {
    const timeline = await addMilestone(id, body.milestone);
    return NextResponse.json(timeline);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
