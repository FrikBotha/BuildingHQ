import { v4 as uuidv4 } from "uuid";
import type { BOMData, BOMItem, BOMCategory } from "@/types/bom";
import { BOM_CATEGORY_ORDER } from "@/types/bom";
import { readJsonFile, writeJsonFile, getProjectFilePath } from "./store";
import { SA_VAT_RATE } from "@/lib/currency";
import { NHBRC_BOM_TEMPLATE } from "@/components/bom/bom-templates";

function calculateSubtotals(items: BOMItem[]): Record<BOMCategory, number> {
  const subtotals = {} as Record<BOMCategory, number>;
  for (const cat of BOM_CATEGORY_ORDER) {
    subtotals[cat] = items
      .filter((item) => item.category === cat)
      .reduce((sum, item) => sum + item.quantity * item.rate, 0);
  }
  return subtotals;
}

function recalculate(data: BOMData): BOMData {
  const items = data.items.map((item) => ({
    ...item,
    amount: item.quantity * item.rate,
  }));
  const subtotals = calculateSubtotals(items);
  const grandTotal = Object.values(subtotals).reduce((a, b) => a + b, 0);
  return {
    ...data,
    items,
    subtotalsByCategory: subtotals,
    grandTotal,
    vatRate: SA_VAT_RATE,
    grandTotalInclVat: grandTotal * (1 + SA_VAT_RATE),
    lastUpdated: new Date().toISOString(),
  };
}

export async function getBOM(projectId: string): Promise<BOMData | null> {
  return readJsonFile<BOMData>(getProjectFilePath(projectId, "bom.json"));
}

export async function initializeBOM(projectId: string): Promise<BOMData> {
  const items: BOMItem[] = NHBRC_BOM_TEMPLATE.map((template) => ({
    id: uuidv4(),
    category: template.category,
    itemNumber: template.itemNumber,
    description: template.description,
    unit: template.unit,
    quantity: template.defaultQuantity,
    rate: template.estimatedRate,
    amount: template.defaultQuantity * template.estimatedRate,
    isStandard: true,
    notes: "",
    linkedQuotationIds: [],
  }));

  const subtotals = calculateSubtotals(items);
  const grandTotal = Object.values(subtotals).reduce((a, b) => a + b, 0);

  const bom: BOMData = {
    projectId,
    items,
    lastUpdated: new Date().toISOString(),
    subtotalsByCategory: subtotals,
    grandTotal,
    vatRate: SA_VAT_RATE,
    grandTotalInclVat: grandTotal * (1 + SA_VAT_RATE),
  };

  await writeJsonFile(getProjectFilePath(projectId, "bom.json"), bom);
  return bom;
}

export async function updateBOMItem(
  projectId: string,
  itemId: string,
  updates: Partial<BOMItem>
): Promise<BOMData | null> {
  const bom = await getBOM(projectId);
  if (!bom) return null;

  const updated = {
    ...bom,
    items: bom.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    ),
  };

  const recalced = recalculate(updated);
  await writeJsonFile(getProjectFilePath(projectId, "bom.json"), recalced);
  return recalced;
}

export async function addBOMItem(
  projectId: string,
  item: Omit<BOMItem, "id" | "amount" | "linkedQuotationIds">
): Promise<BOMData | null> {
  const bom = await getBOM(projectId);
  if (!bom) return null;

  const newItem: BOMItem = {
    ...item,
    id: uuidv4(),
    amount: item.quantity * item.rate,
    linkedQuotationIds: [],
  };

  const updated = { ...bom, items: [...bom.items, newItem] };
  const recalced = recalculate(updated);
  await writeJsonFile(getProjectFilePath(projectId, "bom.json"), recalced);
  return recalced;
}

export async function deleteBOMItem(
  projectId: string,
  itemId: string
): Promise<BOMData | null> {
  const bom = await getBOM(projectId);
  if (!bom) return null;

  const updated = {
    ...bom,
    items: bom.items.filter((item) => item.id !== itemId),
  };
  const recalced = recalculate(updated);
  await writeJsonFile(getProjectFilePath(projectId, "bom.json"), recalced);
  return recalced;
}
