export type UUID = string;

export type Currency = "ZAR";

export type TradeCategory =
  | "general_builder"
  | "plumber"
  | "electrician"
  | "roofing"
  | "tiling"
  | "painting"
  | "carpentry"
  | "glazing"
  | "waterproofing"
  | "plastering"
  | "landscaping"
  | "structural_steel"
  | "hvac"
  | "security"
  | "other";

export const TRADE_CATEGORY_LABELS: Record<TradeCategory, string> = {
  general_builder: "General Builder",
  plumber: "Plumber",
  electrician: "Electrician",
  roofing: "Roofing",
  tiling: "Tiling",
  painting: "Painting",
  carpentry: "Carpentry",
  glazing: "Glazing",
  waterproofing: "Waterproofing",
  plastering: "Plastering",
  landscaping: "Landscaping",
  structural_steel: "Structural Steel",
  hvac: "HVAC",
  security: "Security",
  other: "Other",
};
