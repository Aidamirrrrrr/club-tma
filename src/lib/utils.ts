import { type ClassValue, clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO date string to Russian locale. */
export function formatDate(dateStr: string, fmt = "d MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: ru });
  } catch {
    return dateStr;
  }
}

/** Get initials from first & last name. */
export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

/** Event status labels */
export const statusLabels: Record<string, string> = {
  open: "Открыта регистрация",
  closed: "Закрыта",
  cancelled: "Отменено",
  completed: "Завершено",
};

/** Event status badge variants */
export const statusVariants: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  open: "success",
  closed: "warning",
  cancelled: "danger",
  completed: "default",
};

/** Default profile gradient */
export const defaultGradient =
  "linear-gradient(to bottom, oklch(0.881 0.18 130.6 / 0.12), transparent)";

/** Check if value looks like an image URL */
export function isImageUrl(value: string | undefined): boolean {
  if (!value) return false;
  return value.startsWith("/") || value.startsWith("http");
}
