import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUploadDir, ensureDir } from "@/data/store";
import { addRevision } from "@/data/drawings";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const drawingId = formData.get("drawingId") as string | null;
  const revisionNumber = formData.get("revisionNumber") as string || "Rev A";
  const notes = formData.get("notes") as string || "";

  if (!file || !drawingId) {
    return NextResponse.json(
      { error: "File and drawingId are required" },
      { status: 400 }
    );
  }

  const uploadDir = getUploadDir(id, "drawings");
  await ensureDir(uploadDir);

  const ext = path.extname(file.name);
  const fileId = uuidv4();
  const fileName = `${fileId}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  await addRevision(id, drawingId, {
    revisionNumber,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    storagePath: `files/drawings/${fileName}`,
    uploadedAt: new Date().toISOString(),
    notes,
  });

  return NextResponse.json({ success: true, fileId, fileName });
}
