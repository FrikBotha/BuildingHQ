import { NextResponse } from "next/server";
import { listQuotations, createQuotation, updateQuotation, deleteQuotation } from "@/data/quotations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quotations = await listQuotations(id);
  return NextResponse.json(quotations);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "create") {
    const quotation = await createQuotation(id, body.data);
    return NextResponse.json(quotation, { status: 201 });
  }

  if (body.action === "update") {
    const quotation = await updateQuotation(id, body.quotationId, body.updates);
    return NextResponse.json(quotation);
  }

  if (body.action === "delete") {
    await deleteQuotation(id, body.quotationId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
