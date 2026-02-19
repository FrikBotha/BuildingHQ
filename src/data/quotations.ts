import { v4 as uuidv4 } from "uuid";
import type { Quotation, CreateQuotationInput } from "@/types/quotation";
import { readJsonFile, writeJsonFile, getProjectFilePath } from "./store";
import { SA_VAT_RATE } from "@/lib/currency";

async function readQuotations(projectId: string): Promise<Quotation[]> {
  return (await readJsonFile<Quotation[]>(getProjectFilePath(projectId, "quotations.json"))) || [];
}

async function saveQuotations(projectId: string, quotations: Quotation[]): Promise<void> {
  await writeJsonFile(getProjectFilePath(projectId, "quotations.json"), quotations);
}

export async function listQuotations(projectId: string): Promise<Quotation[]> {
  return readQuotations(projectId);
}

export async function getQuotation(projectId: string, quotationId: string): Promise<Quotation | null> {
  const quotations = await readQuotations(projectId);
  return quotations.find((q) => q.id === quotationId) || null;
}

export async function createQuotation(
  projectId: string,
  input: CreateQuotationInput
): Promise<Quotation> {
  const quotations = await readQuotations(projectId);
  const now = new Date().toISOString();
  const vatAmount = input.vatAmount ?? input.totalAmount * SA_VAT_RATE;

  const quotation: Quotation = {
    id: uuidv4(),
    projectId,
    supplierName: input.supplierName,
    supplierContact: input.supplierContact || "",
    supplierEmail: input.supplierEmail || "",
    supplierPhone: input.supplierPhone || "",
    tradeCategory: input.tradeCategory,
    quotationNumber: input.quotationNumber || "",
    quotationDate: input.quotationDate,
    validUntil: input.validUntil,
    status: "received",
    totalAmount: input.totalAmount,
    vatAmount,
    totalInclVat: input.totalAmount + vatAmount,
    lineItems: [],
    files: [],
    notes: input.notes || "",
    receivedDate: now,
    reviewedDate: null,
    acceptedDate: null,
    rejectedReason: null,
    createdAt: now,
    updatedAt: now,
  };

  quotations.push(quotation);
  await saveQuotations(projectId, quotations);
  return quotation;
}

export async function updateQuotation(
  projectId: string,
  quotationId: string,
  updates: Partial<Quotation>
): Promise<Quotation | null> {
  const quotations = await readQuotations(projectId);
  const index = quotations.findIndex((q) => q.id === quotationId);
  if (index === -1) return null;

  quotations[index] = {
    ...quotations[index],
    ...updates,
    id: quotationId,
    projectId,
    updatedAt: new Date().toISOString(),
  };

  await saveQuotations(projectId, quotations);
  return quotations[index];
}

export async function deleteQuotation(projectId: string, quotationId: string): Promise<boolean> {
  const quotations = await readQuotations(projectId);
  const filtered = quotations.filter((q) => q.id !== quotationId);
  if (filtered.length === quotations.length) return false;
  await saveQuotations(projectId, filtered);
  return true;
}
