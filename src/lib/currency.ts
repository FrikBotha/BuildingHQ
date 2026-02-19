const ZAR_FORMAT = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ZAR_COMPACT = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatZAR(amount: number): string {
  return ZAR_FORMAT.format(amount);
}

export function formatZARCompact(amount: number): string {
  return ZAR_COMPACT.format(amount);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export const SA_VAT_RATE = 0.15;

export function calculateVAT(amount: number): number {
  return amount * SA_VAT_RATE;
}

export function addVAT(amount: number): number {
  return amount * (1 + SA_VAT_RATE);
}
