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
    isTelegramApp: snap.isTelegramApp,
    safeAreaTop: getSafeAreaTop(),
    safeAreaBottom: getSafeAreaBottom(),
    authHeaders,
    refetchUser,
  };
}

export type { TelegramUser };

/** Экран-заглушка для доступа не из Telegram. */
export function TelegramGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isTelegramApp } = useTelegram();

  if (isLoading) return null;

  if (!isTelegramApp) {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Откройте в Telegram
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Это приложение работает только как Telegram Mini App. Откройте его
              через бота в Telegram.
            </p>
          </div>

          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Открыть в Telegram
            </a>
          )}
        </div>
      </div>
    );
  }

  return children;
}

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
