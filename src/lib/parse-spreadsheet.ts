import type { ExtractedQuotationData, ExtractedLineItem } from "@/types/extraction";

/**
 * Attempts to identify which columns correspond to description, unit, quantity, rate, and amount.
 * Uses fuzzy header matching for common South African quotation spreadsheet formats.
 */
function identifyColumns(headers: string[]): {
  descCol: number;
  unitCol: number;
  qtyCol: number;
  rateCol: number;
  amountCol: number;
} {
  const lower = headers.map((h) => (h || "").toString().toLowerCase().trim());

  const descCol = lower.findIndex(
    (h) =>
      h.includes("description") ||
      h.includes("item") ||
      h.includes("detail") ||
      h.includes("work") ||
      h.includes("material")
  );

  const unitCol = lower.findIndex(
    (h) => h.includes("unit") || h === "uom" || h === "u/m"
  );

  const qtyCol = lower.findIndex(
    (h) =>
      h.includes("qty") ||
      h.includes("quantity") ||
      h.includes("quant") ||
      h === "no"
  );

  const rateCol = lower.findIndex(
    (h) =>
      h.includes("rate") ||
      h.includes("price") ||
      h.includes("unit cost") ||
      h.includes("unit price")
  );

  const amountCol = lower.findIndex(
    (h) =>
      h.includes("amount") ||
      h.includes("total") ||
      h.includes("value") ||
      h.includes("cost") ||
      h.includes("sum")
  );

  return {
    descCol: descCol >= 0 ? descCol : 0,
    unitCol: unitCol >= 0 ? unitCol : -1,
    qtyCol: qtyCol >= 0 ? qtyCol : -1,
    rateCol: rateCol >= 0 ? rateCol : -1,
    amountCol: amountCol >= 0 ? amountCol : -1,
  };
}

/** Parse a numeric value, stripping currency symbols and spaces */
function parseNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const str = val
    .toString()
    .replace(/[R$€£,\s]/g, "")
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/** Parse rows of string arrays into ExtractedLineItems */
function parseRows(
  rows: string[][],
  cols: ReturnType<typeof identifyColumns>
): ExtractedLineItem[] {
  const items: ExtractedLineItem[] = [];

  for (const row of rows) {
    const desc = (row[cols.descCol] || "").toString().trim();
    if (!desc) continue;

    // Skip rows that look like headers or totals
    const descLower = desc.toLowerCase();
    if (
      descLower === "description" ||
      descLower === "item" ||
      descLower.startsWith("total") ||
      descLower.startsWith("subtotal") ||
      descLower.startsWith("sub-total") ||
      descLower.startsWith("vat") ||
      descLower.startsWith("grand total")
    )
      continue;

    const quantity =
      cols.qtyCol >= 0 ? parseNumber(row[cols.qtyCol]) : 1;
    const unitRate =
      cols.rateCol >= 0 ? parseNumber(row[cols.rateCol]) : 0;
    const amount =
      cols.amountCol >= 0
        ? parseNumber(row[cols.amountCol])
        : quantity * unitRate;
    const unit =
      cols.unitCol >= 0
        ? (row[cols.unitCol] || "item").toString().trim()
        : "item";

    // Only include rows that have some monetary value
    if (amount === 0 && unitRate === 0) continue;

    items.push({
      description: desc,
      unit: unit || "item",
      quantity: quantity || 1,
      unitRate: unitRate || amount,
      amount: amount || quantity * unitRate,
    });
  }

  return items;
}

/** Parse CSV content into ExtractedQuotationData */
export function parseCSV(content: string): ExtractedQuotationData {
  const warnings: string[] = [];

  // Split into lines, handling both \r\n and \n
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
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
      warnings: ["CSV file has too few rows to extract data"],
    };
  }

  // Simple CSV parsing (handles basic quoted fields)
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const allRows = lines.map(parseCsvLine);
  const headers = allRows[0];
  const dataRows = allRows.slice(1);

  const cols = identifyColumns(headers);
  const lineItems = parseRows(dataRows, cols);

  if (lineItems.length === 0) {
    warnings.push("No cost line items could be identified in the CSV");
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = subtotal * 0.15;

  return {
    supplierName: null,
    supplierContact: null,
    supplierEmail: null,
    supplierPhone: null,
    quotationNumber: null,
    quotationDate: null,
    validUntil: null,
    tradeCategory: null,
    lineItems,
    subtotal,
    vatAmount,
    totalInclVat: subtotal + vatAmount,
    notes: null,
    confidence: lineItems.length > 0 ? "medium" : "low",
    warnings: [
      ...warnings,
      "Parsed from CSV - supplier details not available",
      "VAT calculated at 15% (standard SA rate)",
    ],
  };
}

/** Parse Excel buffer into ExtractedQuotationData */
export async function parseExcel(
  buffer: Buffer | ArrayBuffer
): Promise<ExtractedQuotationData> {
  const warnings: string[] = [];

  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as ArrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) {
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
        warnings: ["Excel file has no data or too few rows"],
      };
    }

    // Convert worksheet rows to string arrays
    const allRows: string[][] = [];
    worksheet.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text || "");
      });
      allRows.push(cells);
    });

    if (allRows.length < 2) {
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
        warnings: ["Could not parse Excel rows"],
      };
    }

    const headers = allRows[0];
    const dataRows = allRows.slice(1);

    const cols = identifyColumns(headers);
    const lineItems = parseRows(dataRows, cols);

    if (lineItems.length === 0) {
      warnings.push(
        "No cost line items could be identified in the Excel file"
      );
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = subtotal * 0.15;

    return {
      supplierName: null,
      supplierContact: null,
      supplierEmail: null,
      supplierPhone: null,
      quotationNumber: null,
      quotationDate: null,
      validUntil: null,
      tradeCategory: null,
      lineItems,
      subtotal,
      vatAmount,
      totalInclVat: subtotal + vatAmount,
      notes: null,
      confidence: lineItems.length > 0 ? "medium" : "low",
      warnings: [
        ...warnings,
        "Parsed from Excel - supplier details not available",
        "VAT calculated at 15% (standard SA rate)",
      ],
    };
  } catch {
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
      warnings: ["Failed to parse Excel file - it may be corrupted or in an unsupported format"],
    };
  }
}
