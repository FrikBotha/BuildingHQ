import { NextResponse } from "next/server";
import { getBOM, initializeBOM, updateBOMItem, addBOMItem, deleteBOMItem } from "@/data/bom";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bom = await getBOM(id);
  return NextResponse.json(bom);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "initialize") {
    const bom = await initializeBOM(id);
    return NextResponse.json(bom, { status: 201 });
  }

  if (body.action === "add") {
    const bom = await addBOMItem(id, body.item);
    return NextResponse.json(bom);
  }

  if (body.action === "update") {
    const bom = await updateBOMItem(id, body.itemId, body.updates);
    return NextResponse.json(bom);
  }

  if (body.action === "delete") {
    const bom = await deleteBOMItem(id, body.itemId);
    return NextResponse.json(bom);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
