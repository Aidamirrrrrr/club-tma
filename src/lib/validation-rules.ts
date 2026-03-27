/**
 * Парсит число и ограничивает в пределах `[min, max]`.
 * @returns Целое число в диапазоне или `fallback`.
 */
export function parseIntClamped(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === null || value === undefined) return fallback;
  const n =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/** Проверяет формат ISO-даты (`YYYY-MM-DD`). */
export function isValidDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Проверяет формат времени (`HH:MM`). Пустая строка допустима. */
export function isValidTime(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value === "") return true;
  return /^\d{2}:\d{2}$/.test(value);
}

/** Проверяет, входит ли значение в допустимый список (type guard). */
export function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

/** Парсит числовой ID из строки. Возвращает `NaN` при невалидном значении. */
export function parseId(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return Number.NaN;
  return n;
}
