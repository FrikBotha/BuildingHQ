import { NextResponse } from "next/server";
import { listDrawings, createDrawing, deleteDrawing } from "@/data/drawings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const drawings = await listDrawings(id);
  return NextResponse.json(drawings);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "create") {
    const drawing = await createDrawing(id, body.data);
    return NextResponse.json(drawing, { status: 201 });
  }

  if (body.action === "delete") {
    await deleteDrawing(id, body.drawingId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
