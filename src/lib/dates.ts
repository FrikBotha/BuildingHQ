import { format, formatDistanceToNow, parseISO, differenceInDays } from "date-fns";

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return format(parseISO(date), "dd MMM yyyy");
}

export function formatDateShort(date: string | null): string {
  if (!date) return "—";
  return format(parseISO(date), "dd/MM/yyyy");
}

export function formatRelative(date: string | null): string {
  if (!date) return "—";
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
}

export function daysRemaining(date: string | null): number | null {
  if (!date) return null;
  return differenceInDays(parseISO(date), new Date());
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
