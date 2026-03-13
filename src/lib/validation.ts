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

/** Допустимые статусы мероприятия. */
export const EVENT_STATUSES = [
  "open",
  "closed",
  "cancelled",
  "completed",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Допустимые роли пользователя. */
export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Экранирует спецсимволы SQL LIKE. */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

/** Допустимые MIME-типы и расширения для загрузки изображений. */
export const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

/** Проверяет, что расширение файла соответствует MIME-типу. */
export function isValidImageExtension(
  filename: string,
  mimeType: string,
): boolean {
  const ext =
    filename.lastIndexOf(".") >= 0
      ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
      : "";
  const allowed = ALLOWED_IMAGE_TYPES[mimeType];
  if (!allowed) return false;
  return allowed.includes(ext);
}

/** Определяет тип изображения по magic bytes (JPEG, PNG, GIF, WebP). */
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * In-memory rate limiter (per-process).
 * @param key Уникальный ключ (напр. `userId:action`).
 * @param limit Максимум запросов за окно.
 * @param windowMs Длительность окна в мс.
 * @returns `true`, если лимит превышен.
 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > limit) {
    return true;
  }
  return false;
}

/** Парсит числовой ID из строки. Возвращает `NaN` при невалидном значении. */
export function parseId(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return Number.NaN;
  return n;
}
