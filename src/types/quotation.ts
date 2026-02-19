import type { UUID, TradeCategory } from "./common";

export type QuotationStatus =
  | "received"
  | "under_review"
  | "accepted"
  | "rejected"
  | "expired"
  | "superseded";

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  received: "Received",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  superseded: "Superseded",
};

export type QuotationLineItem = {
  id: UUID;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  bomItemId: UUID | null;
};

export type QuotationFile = {
  id: UUID;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  storagePath: string;
};

export type Quotation = {
  id: UUID;
  projectId: UUID;
  supplierName: string;
  supplierContact: string;
  supplierEmail: string;
  supplierPhone: string;
  tradeCategory: TradeCategory;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  status: QuotationStatus;
  totalAmount: number;
  vatAmount: number;
  totalInclVat: number;
  lineItems: QuotationLineItem[];
  files: QuotationFile[];
  notes: string;
  receivedDate: string;
  reviewedDate: string | null;
  acceptedDate: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateQuotationInput = {
  supplierName: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  tradeCategory: TradeCategory;
  quotationNumber?: string;
  quotationDate: string;
  validUntil: string;
  totalAmount: number;
  vatAmount?: number;
  notes?: string;
};
