import type { BOMCategory, BOMUnit } from "@/types/bom";

export type BOMTemplateItem = {
  category: BOMCategory;
  itemNumber: string;
  description: string;
  unit: BOMUnit;
  defaultQuantity: number;
  estimatedRate: number;
};

export const NHBRC_BOM_TEMPLATE: BOMTemplateItem[] = [
  // PRELIMINARIES
  { category: "preliminaries", itemNumber: "P-001", description: "Building plan approval fees", unit: "item", defaultQuantity: 1, estimatedRate: 15000 },
  { category: "preliminaries", itemNumber: "P-002", description: "NHBRC enrolment fee", unit: "item", defaultQuantity: 1, estimatedRate: 8500 },
  { category: "preliminaries", itemNumber: "P-003", description: "Site establishment and temporary services", unit: "item", defaultQuantity: 1, estimatedRate: 25000 },
  { category: "preliminaries", itemNumber: "P-004", description: "Builder's all-risk insurance", unit: "item", defaultQuantity: 1, estimatedRate: 12000 },
  { category: "preliminaries", itemNumber: "P-005", description: "Health and safety file", unit: "item", defaultQuantity: 1, estimatedRate: 5000 },
  { category: "preliminaries", itemNumber: "P-006", description: "Setting out by surveyor", unit: "item", defaultQuantity: 1, estimatedRate: 8000 },
  { category: "preliminaries", itemNumber: "P-007", description: "Temporary fencing and site security", unit: "item", defaultQuantity: 1, estimatedRate: 15000 },

  // FOUNDATIONS
  { category: "foundations", itemNumber: "F-001", description: "Excavation for strip foundations", unit: "m3", defaultQuantity: 35, estimatedRate: 350 },
  { category: "foundations", itemNumber: "F-002", description: "Anti-termite treatment to foundation", unit: "m2", defaultQuantity: 150, estimatedRate: 45 },
  { category: "foundations", itemNumber: "F-003", description: "Concrete strip foundations (25 MPa)", unit: "m3", defaultQuantity: 18, estimatedRate: 2800 },
  { category: "foundations", itemNumber: "F-004", description: "Steel reinforcement to foundations", unit: "kg", defaultQuantity: 800, estimatedRate: 22 },
  { category: "foundations", itemNumber: "F-005", description: "Damp proof course (DPC) 375mm wide", unit: "m", defaultQuantity: 80, estimatedRate: 65 },
  { category: "foundations", itemNumber: "F-006", description: "Formwork to foundations", unit: "m2", defaultQuantity: 40, estimatedRate: 180 },
  { category: "foundations", itemNumber: "F-007", description: "Backfill and compaction", unit: "m3", defaultQuantity: 20, estimatedRate: 280 },
  { category: "foundations", itemNumber: "F-008", description: "Surface bed concrete (25 MPa) 100mm thick", unit: "m2", defaultQuantity: 150, estimatedRate: 320 },
  { category: "foundations", itemNumber: "F-009", description: "Damp proof membrane under surface bed", unit: "m2", defaultQuantity: 150, estimatedRate: 35 },

  // STRUCTURAL
  { category: "structural", itemNumber: "S-001", description: "External walls - 230mm brick", unit: "m2", defaultQuantity: 180, estimatedRate: 650 },
  { category: "structural", itemNumber: "S-002", description: "Internal walls - 115mm brick", unit: "m2", defaultQuantity: 120, estimatedRate: 380 },
  { category: "structural", itemNumber: "S-003", description: "Precast concrete lintels", unit: "m", defaultQuantity: 40, estimatedRate: 450 },
  { category: "structural", itemNumber: "S-004", description: "Reinforced concrete ring beam", unit: "m", defaultQuantity: 80, estimatedRate: 380 },
  { category: "structural", itemNumber: "S-005", description: "Concrete columns 230x230mm", unit: "m", defaultQuantity: 12, estimatedRate: 1200 },
  { category: "structural", itemNumber: "S-006", description: "Steel reinforcement to structural elements", unit: "kg", defaultQuantity: 1200, estimatedRate: 22 },
  { category: "structural", itemNumber: "S-007", description: "Expansion joints", unit: "m", defaultQuantity: 8, estimatedRate: 250 },

  // ROOFING
  { category: "roofing", itemNumber: "R-001", description: "Roof trusses (engineered timber)", unit: "m2", defaultQuantity: 170, estimatedRate: 380 },
  { category: "roofing", itemNumber: "R-002", description: "Concrete roof tiles", unit: "m2", defaultQuantity: 170, estimatedRate: 220 },
  { category: "roofing", itemNumber: "R-003", description: "Ridging tiles", unit: "m", defaultQuantity: 15, estimatedRate: 280 },
  { category: "roofing", itemNumber: "R-004", description: "Fascia boards (fibre cement)", unit: "m", defaultQuantity: 50, estimatedRate: 180 },
  { category: "roofing", itemNumber: "R-005", description: "Barge boards", unit: "m", defaultQuantity: 20, estimatedRate: 200 },
  { category: "roofing", itemNumber: "R-006", description: "Gutters and downpipes (PVC)", unit: "m", defaultQuantity: 40, estimatedRate: 150 },
  { category: "roofing", itemNumber: "R-007", description: "Waterproofing membrane under tiles", unit: "m2", defaultQuantity: 170, estimatedRate: 45 },
  { category: "roofing", itemNumber: "R-008", description: "Roof insulation (135mm Think Pink)", unit: "m2", defaultQuantity: 150, estimatedRate: 95 },

  // PLUMBING
  { category: "plumbing", itemNumber: "PL-001", description: "Water supply pipework (complete)", unit: "item", defaultQuantity: 1, estimatedRate: 18000 },
  { category: "plumbing", itemNumber: "PL-002", description: "Drainage pipework (110mm PVC)", unit: "m", defaultQuantity: 30, estimatedRate: 350 },
  { category: "plumbing", itemNumber: "PL-003", description: "Geyser 200L (installed)", unit: "no", defaultQuantity: 1, estimatedRate: 12000 },
  { category: "plumbing", itemNumber: "PL-004", description: "Toilet suite (complete)", unit: "no", defaultQuantity: 3, estimatedRate: 4500 },
  { category: "plumbing", itemNumber: "PL-005", description: "Basin with mixer tap", unit: "no", defaultQuantity: 3, estimatedRate: 3500 },
  { category: "plumbing", itemNumber: "PL-006", description: "Bath (acrylic, installed)", unit: "no", defaultQuantity: 2, estimatedRate: 5500 },
  { category: "plumbing", itemNumber: "PL-007", description: "Shower complete with mixer", unit: "no", defaultQuantity: 2, estimatedRate: 6000 },
  { category: "plumbing", itemNumber: "PL-008", description: "Kitchen sink (stainless steel, double bowl)", unit: "no", defaultQuantity: 1, estimatedRate: 4000 },
  { category: "plumbing", itemNumber: "PL-009", description: "Solar geyser provision (pipework only)", unit: "item", defaultQuantity: 1, estimatedRate: 8000 },

  // ELECTRICAL
  { category: "electrical", itemNumber: "E-001", description: "Distribution board (complete)", unit: "no", defaultQuantity: 1, estimatedRate: 8500 },
  { category: "electrical", itemNumber: "E-002", description: "Circuit breakers and earth leakage", unit: "item", defaultQuantity: 1, estimatedRate: 4500 },
  { category: "electrical", itemNumber: "E-003", description: "Power points (double socket)", unit: "no", defaultQuantity: 25, estimatedRate: 850 },
  { category: "electrical", itemNumber: "E-004", description: "Light points (ceiling)", unit: "no", defaultQuantity: 20, estimatedRate: 650 },
  { category: "electrical", itemNumber: "E-005", description: "Geyser element circuit", unit: "item", defaultQuantity: 1, estimatedRate: 3500 },
  { category: "electrical", itemNumber: "E-006", description: "Stove connection point", unit: "no", defaultQuantity: 1, estimatedRate: 3000 },
  { category: "electrical", itemNumber: "E-007", description: "Prepaid meter provision", unit: "item", defaultQuantity: 1, estimatedRate: 5000 },
  { category: "electrical", itemNumber: "E-008", description: "TV points", unit: "no", defaultQuantity: 4, estimatedRate: 550 },
  { category: "electrical", itemNumber: "E-009", description: "Data/network points (CAT6)", unit: "no", defaultQuantity: 4, estimatedRate: 750 },
  { category: "electrical", itemNumber: "E-010", description: "Outdoor light points", unit: "no", defaultQuantity: 6, estimatedRate: 750 },

  // INTERNAL FINISHES
  { category: "finishes_internal", itemNumber: "FI-001", description: "Internal wall plastering", unit: "m2", defaultQuantity: 350, estimatedRate: 85 },
  { category: "finishes_internal", itemNumber: "FI-002", description: "Ceiling plastering (skim coat)", unit: "m2", defaultQuantity: 150, estimatedRate: 75 },
  { category: "finishes_internal", itemNumber: "FI-003", description: "Floor screed (40mm)", unit: "m2", defaultQuantity: 150, estimatedRate: 95 },
  { category: "finishes_internal", itemNumber: "FI-004", description: "Floor tiling (ceramic)", unit: "m2", defaultQuantity: 120, estimatedRate: 450 },
  { category: "finishes_internal", itemNumber: "FI-005", description: "Wall tiling (bathroom/kitchen)", unit: "m2", defaultQuantity: 50, estimatedRate: 480 },
  { category: "finishes_internal", itemNumber: "FI-006", description: "Internal painting (PVA, 2 coats)", unit: "m2", defaultQuantity: 450, estimatedRate: 45 },
  { category: "finishes_internal", itemNumber: "FI-007", description: "Enamel paint to doors and frames", unit: "no", defaultQuantity: 12, estimatedRate: 650 },
  { category: "finishes_internal", itemNumber: "FI-008", description: "Internal doors (hollow core, hung)", unit: "no", defaultQuantity: 10, estimatedRate: 2800 },
  { category: "finishes_internal", itemNumber: "FI-009", description: "Built-in cupboards (bedroom)", unit: "m", defaultQuantity: 8, estimatedRate: 4500 },
  { category: "finishes_internal", itemNumber: "FI-010", description: "Kitchen cupboards and countertops", unit: "item", defaultQuantity: 1, estimatedRate: 65000 },
  { category: "finishes_internal", itemNumber: "FI-011", description: "Skirting (pine, painted)", unit: "m", defaultQuantity: 100, estimatedRate: 85 },

  // EXTERNAL FINISHES
  { category: "finishes_external", itemNumber: "FE-001", description: "External wall plastering", unit: "m2", defaultQuantity: 200, estimatedRate: 95 },
  { category: "finishes_external", itemNumber: "FE-002", description: "External painting (acrylic, 2 coats)", unit: "m2", defaultQuantity: 200, estimatedRate: 55 },
  { category: "finishes_external", itemNumber: "FE-003", description: "Aluminium window frames (installed)", unit: "m2", defaultQuantity: 25, estimatedRate: 2800 },
  { category: "finishes_external", itemNumber: "FE-004", description: "External doors (solid, hung)", unit: "no", defaultQuantity: 3, estimatedRate: 6500 },
  { category: "finishes_external", itemNumber: "FE-005", description: "Garage door (sectional, automated)", unit: "no", defaultQuantity: 1, estimatedRate: 18000 },
  { category: "finishes_external", itemNumber: "FE-006", description: "Waterproofing to external walls", unit: "m2", defaultQuantity: 200, estimatedRate: 65 },

  // EXTERNAL WORKS
  { category: "external_works", itemNumber: "EW-001", description: "Driveway (concrete paving)", unit: "m2", defaultQuantity: 40, estimatedRate: 450 },
  { category: "external_works", itemNumber: "EW-002", description: "Pathways and paving", unit: "m2", defaultQuantity: 30, estimatedRate: 380 },
  { category: "external_works", itemNumber: "EW-003", description: "Stormwater drainage", unit: "m", defaultQuantity: 20, estimatedRate: 450 },
  { category: "external_works", itemNumber: "EW-004", description: "Boundary wall (1.8m brick)", unit: "m", defaultQuantity: 60, estimatedRate: 2200 },
  { category: "external_works", itemNumber: "EW-005", description: "Palisade fencing", unit: "m", defaultQuantity: 30, estimatedRate: 1200 },
  { category: "external_works", itemNumber: "EW-006", description: "Gate (sliding, automated)", unit: "no", defaultQuantity: 1, estimatedRate: 25000 },
  { category: "external_works", itemNumber: "EW-007", description: "Landscaping and topsoil", unit: "item", defaultQuantity: 1, estimatedRate: 20000 },

  // PROVISIONAL SUMS
  { category: "provisional_sums", itemNumber: "PS-001", description: "Unforeseen ground conditions", unit: "prov", defaultQuantity: 1, estimatedRate: 30000 },
  { category: "provisional_sums", itemNumber: "PS-002", description: "Municipal water connection", unit: "prov", defaultQuantity: 1, estimatedRate: 15000 },
  { category: "provisional_sums", itemNumber: "PS-003", description: "Municipal sewer connection", unit: "prov", defaultQuantity: 1, estimatedRate: 12000 },
  { category: "provisional_sums", itemNumber: "PS-004", description: "Electricity connection (Eskom/Municipality)", unit: "prov", defaultQuantity: 1, estimatedRate: 25000 },
  { category: "provisional_sums", itemNumber: "PS-005", description: "Occupancy certificate fees", unit: "prov", defaultQuantity: 1, estimatedRate: 5000 },
  { category: "provisional_sums", itemNumber: "PS-006", description: "Professional fees (engineer, architect)", unit: "prov", defaultQuantity: 1, estimatedRate: 80000 },
];
