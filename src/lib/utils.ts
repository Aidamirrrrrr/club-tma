import { type ClassValue, clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

/** Объединяет CSS-классы через clsx + tailwind-merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Форматирует ISO-дату в русскую локаль. */
export function formatDate(dateStr: string, fmt = "d MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: ru });
  } catch {
    return dateStr;
  }
}

/** Возвращает инициалы из имени и фамилии. */
export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

/** Метки статусов мероприятий для отображения. */
export const statusLabels: Record<string, string> = {
  open: "Открыта регистрация",
  closed: "Закрыта",
  cancelled: "Отменено",
  completed: "Завершено",
};

/** Варианты стилей бейджа по статусу мероприятия. */
export const statusVariants: Record<
  string,
  "success" | "warning" | "danger" | "default"
> = {
  open: "success",
  closed: "warning",
  cancelled: "danger",
  completed: "default",
};

/** CSS-градиент профиля по умолчанию. */
export const defaultGradient =
  "linear-gradient(to bottom, oklch(0.868 0.057 251.7 / 0.35), transparent)";

/** Проверяет, является ли значение URL изображения. */
export function isImageUrl(value: string | undefined): boolean {
  if (!value) return false;
  return value.startsWith("/uploads/") || value.startsWith("https://");
}
