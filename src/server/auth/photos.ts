import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const PHOTOS_COOKIE = "photos_session";

function getPassword(): string | null {
  return process.env.PHOTOS_ADMIN_PASSWORD || null;
}

function getSecret(): string {
  // Стабильный серверный секрет (тот же, что подписывает Server Actions).
  return (
    process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ||
    process.env.BOT_TOKEN ||
    "dev-secret"
  );
}

/** Токен сессии = HMAC(пароль) — кладётся в httpOnly-куку. */
export function expectedToken(): string | null {
  const password = getPassword();
  if (!password) return null;
  return createHmac("sha256", getSecret()).update(password).digest("hex");
}

/** Проверяет введённый пароль. */
export function checkPassword(input: unknown): boolean {
  const password = getPassword();
  if (!password || typeof input !== "string") return false;
  const a = Buffer.from(input);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True, если в запросе валидная кука-сессия. */
export async function isPhotosAuthed(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(PHOTOS_COOKIE)?.value;
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
