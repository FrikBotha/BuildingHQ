import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACTION_PROMPT } from "@/lib/extraction-prompt";
import { parseCSV, parseExcel } from "@/lib/parse-spreadsheet";
import { getAnthropicApiKey } from "@/data/settings";
import type { ExtractedQuotationData, ExtractionResponse } from "@/types/extraction";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

type ImageMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";
type DocumentMediaType = "application/pdf";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ExtractionResponse>> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    const mimeType = file.type || guessMimeType(file.name);

    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${mimeType}. Supported: PDF, PNG, JPG, CSV, XLS, XLSX`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Route by file type
    if (mimeType === "text/csv") {
      const content = buffer.toString("utf-8");
      const data = parseCSV(content);
      return NextResponse.json({ success: true, data });
    }

    if (
      mimeType === "application/vnd.ms-excel" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      const data = await parseExcel(buffer);
      return NextResponse.json({ success: true, data });
    }

    // PDF and images → Claude AI extraction
    const apiKey = await getAnthropicApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No API key configured. Go to Settings to add your Anthropic API key.",
        },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    const base64Data = buffer.toString("base64");

    // Build the content block based on file type
    const isImage = mimeType.startsWith("image/");
    const contentBlock = isImage
      ? {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as ImageMediaType,
            data: base64Data,
          },
        }
      : {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: mimeType as DocumentMediaType,
            data: base64Data,
          },
        };

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse the JSON response
    const data = parseExtractionResponse(responseText);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Extraction error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown extraction error";

    // Handle specific Anthropic API errors
    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      return NextResponse.json(
        {
          success: false,
          error: "The document analysis timed out. Try a smaller or clearer document.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Extraction failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/** Parse Claude's response text into ExtractedQuotationData */
function parseExtractionResponse(text: string): ExtractedQuotationData {
  // Try to extract JSON from the response (handle markdown fences if present)
  let jsonStr = text.trim();

  // Remove markdown code fences if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Find the first { and last } to extract JSON object
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start >= 0 && end > start) {
    jsonStr = jsonStr.slice(start, end + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and sanitize the parsed data
    return {
      supplierName: typeof parsed.supplierName === "string" ? parsed.supplierName : null,
      supplierContact: typeof parsed.supplierContact === "string" ? parsed.supplierContact : null,
      supplierEmail: typeof parsed.supplierEmail === "string" ? parsed.supplierEmail : null,
      supplierPhone: typeof parsed.supplierPhone === "string" ? parsed.supplierPhone : null,
      quotationNumber: typeof parsed.quotationNumber === "string" ? parsed.quotationNumber : null,
      quotationDate: typeof parsed.quotationDate === "string" ? parsed.quotationDate : null,
      validUntil: typeof parsed.validUntil === "string" ? parsed.validUntil : null,
      tradeCategory: typeof parsed.tradeCategory === "string" ? parsed.tradeCategory : null,
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((item: Record<string, unknown>) => ({
            description: String(item.description || ""),
            unit: String(item.unit || "item"),
            quantity: Number(item.quantity) || 1,
            unitRate: Number(item.unitRate) || 0,
            amount: Number(item.amount) || 0,
          }))
        : [],
      subtotal: typeof parsed.subtotal === "number" ? parsed.subtotal : null,
      vatAmount: typeof parsed.vatAmount === "number" ? parsed.vatAmount : null,
      totalInclVat: typeof parsed.totalInclVat === "number" ? parsed.totalInclVat : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : null,
      confidence: ["high", "medium", "low"].includes(parsed.confidence)
        ? parsed.confidence
        : "medium",
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.map(String)
        : [],
    };
  } catch {
    // If JSON parsing fails, return a minimal result with the error
    return {
      supplierName: null,
      supplierContact: null,
      supplierEmail: null,
      supplierPhone: null,
      quotationNumber: null,
      quotationDate: null,
      validUntil: null,
      tradeCategory: null,
      lineItems: [],
      subtotal: null,
      vatAmount: null,
      totalInclVat: null,
      notes: null,
      confidence: "low",
      warnings: [
        "Could not parse the AI response. The document may be too complex or unclear.",
        "Please enter the quotation details manually.",
      ],
    };
  }
}

/** Guess MIME type from file extension */
function guessMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "csv":
      return "text/csv";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
  }
}
