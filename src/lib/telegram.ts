import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { User } from "@/db/schema";
import { users } from "@/db/schema";

/**
 * Validate Telegram WebApp initData using HMAC-SHA256.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): boolean {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    // In dev mode without BOT_TOKEN, skip validation
    if (process.env.NODE_ENV === "development") return true;
    console.error("BOT_TOKEN is not set");
    return false;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  // Check auth_date expiration (max 24 hours)
  const authDate = params.get("auth_date");
  if (authDate) {
    const authTimestamp = Number(authDate);
    const now = Math.floor(Date.now() / 1000);
    const MAX_AGE_SECONDS = 86400; // 24 hours
    if (now - authTimestamp > MAX_AGE_SECONDS) {
      return false;
    }
  }

  // Remove hash from params and sort alphabetically
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // HMAC-SHA256 with "WebAppData" as key
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  if (computedHash.length !== hash.length) return false;
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Parse user data from initData string.
 */
export function parseInitDataUser(initData: string): {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
} | null {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Get the authenticated user from the request.
 * Checks the X-Telegram-Init-Data header for initData validation,
 * or X-User-Id header as fallback (set after auth).
 */
export async function getAuthUser(request: Request): Promise<User | null> {
  // Try initData header first
  const initData = request.headers.get("x-telegram-init-data");
  if (initData) {
    if (!validateInitData(initData)) return null;
    const tgUser = parseInitDataUser(initData);
    if (!tgUser) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.telegramId, String(tgUser.id)),
    });
    return user ?? null;
  }

  // Fallback: userId header — only allowed in development (no BOT_TOKEN)
  if (process.env.NODE_ENV === "development" && !process.env.BOT_TOKEN) {
    const userId = request.headers.get("x-user-id");
    if (userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, Number(userId)),
      });
      return user ?? null;
    }
  }

  return null;
}

/**
 * Require an authenticated, non-blocked user.
 */
export async function requireAuth(
  request: Request,
): Promise<{ user: User; error: null } | { user: null; error: Response }> {
  const user = await getAuthUser(request);
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (user.blocked) {
    return {
      user: null,
      error: Response.json({ error: "User is blocked" }, { status: 403 }),
    };
  }
  return { user, error: null };
}

/**
 * Require admin role.
 */
export async function requireAdmin(
  request: Request,
): Promise<{ user: User; error: null } | { user: null; error: Response }> {
  const result = await requireAuth(request);
  if (result.error) return result;
  if (result.user.role !== "admin") {
    return {
      user: null,
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
