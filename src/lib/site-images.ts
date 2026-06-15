import { db } from "@/db";

/** Слоты управляемых фото на главной (карточка «Мероприятия клуба»). */
export const SITE_IMAGE_SLOTS = [1, 2, 3] as const;

/** Исходные (дефолтные) картинки для каждого слота. */
export const DEFAULT_SITE_IMAGES: Record<number, string> = {
  1: "/networking_brunch.png",
  2: "/kava_no_ringu.png",
  3: "/portfolio_rebalance.png",
};

export type SiteImageSlot = {
  slot: number;
  url: string | null;
};

/**
 * Возвращает текущее состояние всех слотов (slot → url).
 * При первом обращении лениво создаёт строки с дефолтными картинками.
 */
export async function getSiteImages(): Promise<SiteImageSlot[]> {
  const rows = await db.siteImage.findMany({ orderBy: { slot: "asc" } });
  const bySlot = new Map(rows.map((r) => [r.slot, r]));

  const missing = SITE_IMAGE_SLOTS.filter((s) => !bySlot.has(s));
  if (missing.length > 0) {
    await db.siteImage.createMany({
      data: missing.map((slot) => ({ slot, url: DEFAULT_SITE_IMAGES[slot] })),
      skipDuplicates: true,
    });
    const fresh = await db.siteImage.findMany({ orderBy: { slot: "asc" } });
    return fresh.map((r) => ({ slot: r.slot, url: r.url }));
  }

  return SITE_IMAGE_SLOTS.map((slot) => ({
    slot,
    url: bySlot.get(slot)?.url ?? null,
  }));
}
