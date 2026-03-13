"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import {
  authHeaders,
  bootstrapTelegram,
  getIsAdmin,
  getSafeAreaBottom,
  getSafeAreaTop,
  getSnapshot,
  getTgUser,
  refetchUser,
  setupBackButton,
  subscribe,
  type TelegramUser,
} from "@/lib/telegram-store";

/** Хук для доступа к состоянию Telegram (пользователь, авторизация). */
export function useTelegram() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    tgUser: getTgUser(),
    dbUser: snap.dbUser,
    isAdmin: getIsAdmin(),
    isLoading: snap.isLoading,
    safeAreaTop: getSafeAreaTop(),
    safeAreaBottom: getSafeAreaBottom(),
    authHeaders,
    refetchUser,
  };
}

export type { TelegramUser };

/** Компонент инициализации Telegram SDK (монтируется один раз). */
export function TelegramInit() {
  useEffect(() => {
    bootstrapTelegram();
  }, []);
  return null;
}

export function TelegramBackButtonManager() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    return setupBackButton(pathname, () => router.back());
  }, [pathname, router]);

  return null;
}
