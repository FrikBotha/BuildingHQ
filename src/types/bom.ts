import type { UUID } from "./common";

export type BOMCategory =
  | "preliminaries"
  | "foundations"
  | "structural"
  | "roofing"
  | "plumbing"
  | "electrical"
  | "finishes_internal"
  | "finishes_external"
  | "external_works"
  | "provisional_sums";

export const BOM_CATEGORY_LABELS: Record<BOMCategory, string> = {
  preliminaries: "Preliminaries",
  foundations: "Foundations",
  structural: "Structural",
  roofing: "Roofing",
  plumbing: "Plumbing",
  electrical: "Electrical",
  finishes_internal: "Internal Finishes",
  finishes_external: "External Finishes",
  external_works: "External Works",
  provisional_sums: "Provisional Sums",
};

export const BOM_CATEGORY_ORDER: BOMCategory[] = [
  "preliminaries",
  "foundations",
  "structural",
  "roofing",
  "plumbing",
  "electrical",
  "finishes_internal",
  "finishes_external",
  "external_works",
  "provisional_sums",
];

export type BOMUnit =
  | "m3"
  | "m2"
  | "m"
  | "no"
  | "kg"
  | "bag"
  | "item"
  | "prov"
  | "day"
  | "load";

export const BOM_UNIT_LABELS: Record<BOMUnit, string> = {
  m3: "m³",
  m2: "m²",
  m: "m",
  no: "No.",
  kg: "kg",
  bag: "Bag",
  item: "Item",
  prov: "Prov. Sum",
  day: "Day",
  load: "Load",
};

export type BOMItem = {
  id: UUID;
  category: BOMCategory;
  itemNumber: string;
  description: string;
  unit: BOMUnit;
  quantity: number;
  rate: number;
  amount: number;
  isStandard: boolean;
  notes: string;
  linkedQuotationIds: UUID[];
};

export type BOMData = {
  projectId: UUID;
  items: BOMItem[];
  lastUpdated: string;
  subtotalsByCategory: Record<BOMCategory, number>;
  grandTotal: number;
  vatRate: number;
  grandTotalInclVat: number;
};
