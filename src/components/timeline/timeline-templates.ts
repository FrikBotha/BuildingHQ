export type PhaseTemplate = {
  name: string;
  description: string;
  durationDays: number;
  color: string;
};

export const SA_BUILD_PHASES_TEMPLATE: PhaseTemplate[] = [
  {
    name: "Pre-construction",
    description: "Plan approval, NHBRC enrolment, contractor appointment",
    durationDays: 21,
    color: "#8b5cf6", // violet
  },
  {
    name: "Site Preparation",
    description: "Site clearing, setting out, temporary services",
    durationDays: 10,
    color: "#f59e0b", // amber
  },
  {
    name: "Foundations",
    description: "Excavation, foundation concrete, DPC, backfill",
    durationDays: 18,
    color: "#f97316", // orange
  },
  {
    name: "Floor Slab",
    description: "Sub-base preparation, reinforcement, concrete pour",
    durationDays: 10,
    color: "#ef4444", // red
  },
  {
    name: "Brickwork / Structure",
    description: "External walls, internal walls, lintels, ring beam",
    durationDays: 35,
    color: "#3b82f6", // blue
  },
  {
    name: "Roof Structure",
    description: "Roof trusses, roof sheeting/tiles, ridging, fascia",
    durationDays: 18,
    color: "#14b8a6", // teal
  },
  {
    name: "Plumbing First Fix",
    description: "Drainage, water supply rough-in",
    durationDays: 10,
    color: "#a855f7", // purple
  },
  {
    name: "Electrical First Fix",
    description: "Conduit, wiring rough-in, DB box",
    durationDays: 10,
    color: "#eab308", // yellow
  },
  {
    name: "Plastering",
    description: "Internal plaster, external plaster/render",
    durationDays: 18,
    color: "#6366f1", // indigo
  },
  {
    name: "Waterproofing",
    description: "Wet areas, external walls",
    durationDays: 7,
    color: "#06b6d4", // cyan
  },
  {
    name: "Floor Screeds & Tiling",
    description: "Screeds, floor tiling, wall tiling",
    durationDays: 18,
    color: "#10b981", // emerald
  },
  {
    name: "Plumbing Second Fix",
    description: "Fixtures, geyser, taps",
    durationDays: 7,
    color: "#a855f7", // purple
  },
  {
    name: "Electrical Second Fix",
    description: "Switches, plugs, light fittings, DB connections",
    durationDays: 7,
    color: "#eab308", // yellow
  },
  {
    name: "Joinery & Carpentry",
    description: "Doors, frames, built-in cupboards, skirting",
    durationDays: 10,
    color: "#92400e", // brown/amber-dark
  },
  {
    name: "Painting",
    description: "Internal painting, external painting",
    durationDays: 18,
    color: "#22c55e", // green
  },
  {
    name: "External Works",
    description: "Driveway, paving, landscaping, boundary wall",
    durationDays: 18,
    color: "#84cc16", // lime
  },
  {
    name: "Snag List & Handover",
    description: "Defect inspection, remedial work, NHBRC inspection, occupancy certificate",
    durationDays: 10,
    color: "#059669", // emerald-dark
  },
];
