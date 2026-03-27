/** Удаляет HTML-теги из строки для предотвращения XSS. */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/** Обрезает строку до указанной максимальной длины. */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) : str;
}

/**
 * Очищает текстовое поле: удаляет HTML, пробелы, обрезает.
 * @returns Очищенная строка или `undefined`.
 */
export function sanitizeText(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return truncate(stripHtml(value), maxLength);
}

/**
 * Очищает обязательное текстовое поле.
 * @returns Очищенная строка или `null`, если поле пустое.
 */
export function sanitizeRequiredText(
  value: unknown,
  maxLength: number,
): string | null {
  const clean = sanitizeText(value, maxLength);
  if (!clean || clean.length === 0) return null;
  return clean;
}

/** Очищает хэндл соцсети: допускает `@`, буквы, цифры, `_`, `.` */
export function sanitizeHandle(value: unknown, maxLength = 64): string {
  if (typeof value !== "string") return "";
  let clean = stripHtml(value).replace(/[^a-zA-Z0-9@_.-]/g, "");
  clean = truncate(clean, maxLength);
  return clean;
}

/** Очищает номер телефона: допускает цифры, `+`, `-`, пробелы, скобки. */
export function sanitizePhone(value: unknown, maxLength = 30): string {
  if (typeof value !== "string") return "";
  let clean = stripHtml(value).replace(/[^0-9+\-() ]/g, "");
  clean = truncate(clean, maxLength);
  return clean;
}

/** Очищает URL: допускает только `/uploads/...` и `https://...`. */
export function sanitizeUrl(value: unknown, maxLength = 2048): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (!trimmed.startsWith("/uploads/") && !trimmed.startsWith("https://")) {
    return "";
  }
  return truncate(trimmed, maxLength);
}

/** Экранирует спецсимволы SQL LIKE. */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}
