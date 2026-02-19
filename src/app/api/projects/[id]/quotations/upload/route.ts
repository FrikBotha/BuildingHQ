import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUploadDir, ensureDir } from "@/data/store";
import { getQuotation, updateQuotation } from "@/data/quotations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const quotationId = formData.get("quotationId") as string | null;

  if (!file || !quotationId) {
    return NextResponse.json(
      { error: "File and quotationId are required" },
      { status: 400 }
    );
  }

  const uploadDir = getUploadDir(id, "quotations");
  await ensureDir(uploadDir);

  const ext = path.extname(file.name);
  const fileId = uuidv4();
  const fileName = `${fileId}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const quotation = await getQuotation(id, quotationId);
  if (quotation) {
    await updateQuotation(id, quotationId, {
      files: [
        ...quotation.files,
        {
          id: fileId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          storagePath: `files/quotations/${fileName}`,
        },
      ],
    });
  }

  return NextResponse.json({ success: true, fileId, fileName });
}
