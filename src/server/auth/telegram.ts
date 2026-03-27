import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import type { User } from "@/db/schema";

function isDevAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.BOT_TOKEN;
}

/**
 * Валидирует initData Telegram Mini App через HMAC-SHA256.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): boolean {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    if (isDevAuthBypassEnabled()) return true;
    console.error("BOT_TOKEN is not set");
    return false;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  const authDate = params.get("auth_date");
  if (authDate) {
    const authTimestamp = Number(authDate);
    const now = Math.floor(Date.now() / 1000);
    const MAX_AGE_SECONDS = 86400;
    if (now - authTimestamp > MAX_AGE_SECONDS) {
      return false;
    }
  }

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash.length !== hash.length) return false;
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Парсит данные пользователя из строки initData. */
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
 * Возвращает авторизованного пользователя из запроса.
 * Проверяет заголовок `x-telegram-init-data` или `x-user-id` в локальной dev-среде.
 */
export async function getAuthUser(request: Request): Promise<User | null> {
  const initData = request.headers.get("x-telegram-init-data");
  if (initData) {
    if (!validateInitData(initData)) return null;
    const tgUser = parseInitDataUser(initData);
    if (!tgUser) return null;

    const user = await db.user.findFirst({
      where: { telegramId: String(tgUser.id) },
    });
    return user ?? null;
  }

  if (isDevAuthBypassEnabled()) {
    const userId = request.headers.get("x-user-id");
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: Number(userId) },
      });
      return user ?? null;
    }
  }

  return null;
}

/** Требует авторизованного, незаблокированного пользователя. */
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

/** Требует роль администратора. */
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
