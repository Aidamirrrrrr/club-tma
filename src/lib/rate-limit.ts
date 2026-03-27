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
