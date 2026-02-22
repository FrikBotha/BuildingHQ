import type { TradeCategory } from "./common";

/** A single line item extracted from a quotation document */
export type ExtractedLineItem = {
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
};

/** Full extraction result from AI or spreadsheet parsing */
export type ExtractedQuotationData = {
  supplierName: string | null;
  supplierContact: string | null;
  supplierEmail: string | null;
  supplierPhone: string | null;
  quotationNumber: string | null;
  quotationDate: string | null;
  validUntil: string | null;
  tradeCategory: TradeCategory | null;
  lineItems: ExtractedLineItem[];
  subtotal: number | null;
  vatAmount: number | null;
  totalInclVat: number | null;
  notes: string | null;
  confidence: "high" | "medium" | "low";
  warnings: string[];
};

/** Response from the extraction API */
export type ExtractionResponse = {
  success: boolean;
  data?: ExtractedQuotationData;
  error?: string;
};
