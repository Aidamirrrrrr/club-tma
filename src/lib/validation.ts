/**
 * Input validation & sanitization utilities.
 * No external dependencies — pure string/number checks.
 */

// ── String sanitization ──

/** Strip HTML tags to prevent XSS via stored data. */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/** Truncate string to max length. */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) : str;
}

/** Sanitize a text field: strip HTML, trim, truncate. */
export function sanitizeText(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return truncate(stripHtml(value), maxLength);
}

/** Sanitize a required text field. Returns null if empty after sanitization. */
export function sanitizeRequiredText(
  value: unknown,
  maxLength: number,
): string | null {
  const clean = sanitizeText(value, maxLength);
  if (!clean || clean.length === 0) return null;
  return clean;
}

// ── Specific field sanitizers ──

/** Sanitize social handle (Instagram/Telegram): remove tags, allow @, alphanumeric, _, . */
export function sanitizeHandle(value: unknown, maxLength = 64): string {
  if (typeof value !== "string") return "";
  let clean = stripHtml(value).replace(/[^a-zA-Z0-9@_.-]/g, "");
  clean = truncate(clean, maxLength);
  return clean;
}

/** Sanitize phone number: allow digits, +, -, spaces, () */
export function sanitizePhone(value: unknown, maxLength = 30): string {
  if (typeof value !== "string") return "";
  let clean = stripHtml(value).replace(/[^0-9+\-() ]/g, "");
  clean = truncate(clean, maxLength);
  return clean;
}

/** Sanitize URL: must start with / or https:// */
export function sanitizeUrl(value: unknown, maxLength = 2048): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (!trimmed.startsWith("/uploads/") && !trimmed.startsWith("https://")) {
    return "";
  }
  return truncate(trimmed, maxLength);
}

// ── Number validation ──

/** Parse and clamp integer within bounds. */
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

// ── Date validation ──

/** Validate ISO date string (YYYY-MM-DD). */
export function isValidDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Validate time string (HH:MM). */
export function isValidTime(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value === "") return true; // time is optional
  return /^\d{2}:\d{2}$/.test(value);
}

// ── Enum validation ──

/** Check if value is one of the allowed values. */
export function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

// ── Event status ──

export const EVENT_STATUSES = [
  "open",
  "closed",
  "cancelled",
  "completed",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

// ── User role ──

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ── Search sanitization (escape SQL LIKE special chars) ──

/** Escape SQL LIKE wildcards in search input. */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

// ── File upload ──

/**
 * Allowed extensions for image uploads.
 * Keys are MIME types, values are allowed file extensions.
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

/** Validate file extension matches its MIME type. */
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

/** Check magic bytes to verify real file type. */
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
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

// ── Rate limiting (in-memory, per-process) ──

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean expired entries periodically (every 5 minutes)
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
 * Simple in-memory rate limiter.
 * @param key Unique key (e.g. userId + action)
 * @param limit Max requests allowed
 * @param windowMs Time window in ms
 * @returns true if rate limit exceeded
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

// ── Validate ID parameter ──

/** Parse and validate a numeric ID from route params. Returns NaN if invalid. */
export function parseId(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return Number.NaN;
  return n;
}
