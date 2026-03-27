"use client";

import {
  backButton,
  bindViewportCssVars,
  expandViewport,
  init,
  initDataUser,
  miniApp,
  mountViewport,
  requestContentSafeAreaInsets,
  requestFullscreen,
  requestSafeAreaInsets,
  retrieveRawInitData,
  setDebug,
  viewportContentSafeAreaInsetBottom,
  viewportContentSafeAreaInsetTop,
  viewportSafeAreaInsetBottom,
  viewportSafeAreaInsetTop,
} from "@telegram-apps/sdk-react";
import type { User } from "@/db/schema";

/** Данные пользователя из Telegram SDK. */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

let dbUser: User | null = null;
let rawInitData: string | undefined;
let isLoading = true;
let sdkReady = false;
let isTelegramApp = true;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Текущий пользователь из БД. */
export function getDbUser() {
  return dbUser;
}

/** Флаг загрузки авторизации. */
export function getIsLoading() {
  return isLoading;
}

/** Проверяет, является ли текущий пользователь администратором. */
export function getIsAdmin() {
  return dbUser?.role === "admin";
}

/** Формирует заголовки авторизации для API-запросов. */
export function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (rawInitData) {
    h["x-telegram-init-data"] = rawInitData;
  } else if (process.env.NODE_ENV === "development" && dbUser) {
    h["x-user-id"] = String(dbUser.id);
  }
  return h;
}

/** Безопасный отступ сверху (Telegram viewport). */
export function getSafeAreaTop(): number {
  if (!sdkReady) return 0;
  try {
    return (
      (viewportSafeAreaInsetTop() ?? 0) +
      (viewportContentSafeAreaInsetTop() ?? 0)
    );
  } catch {
    return 0;
  }
}

/** Безопасный отступ снизу (Telegram viewport). */
export function getSafeAreaBottom(): number {
  if (!sdkReady) return 0;
  try {
    return (
      (viewportSafeAreaInsetBottom() ?? 0) +
      (viewportContentSafeAreaInsetBottom() ?? 0)
    );
  } catch {
    return 0;
  }
}

/** Возвращает данные пользователя из Telegram SDK. */
export function getTgUser(): TelegramUser | null {
  if (!sdkReady) return null;
  try {
    const u = initDataUser();
    if (!u) return null;
    return {
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name ?? undefined,
      username: u.username ?? undefined,
      photo_url: u.photo_url ?? undefined,
      language_code: u.language_code ?? undefined,
    };
  } catch {
    return null;
  }
}

/** Подписка на изменения стора (для `useSyncExternalStore`). */
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let snapshot: {
  dbUser: User | null;
  isLoading: boolean;
  isTelegramApp: boolean;
} = {
  dbUser,
  isLoading,
  isTelegramApp,
};
/** Снимок состояния (для `useSyncExternalStore`). */
export function getSnapshot() {
  if (
    snapshot.dbUser !== dbUser ||
    snapshot.isLoading !== isLoading ||
    snapshot.isTelegramApp !== isTelegramApp
  ) {
    snapshot = { dbUser, isLoading, isTelegramApp };
  }
  return snapshot;
}

/** Перезагружает данные пользователя из API. */
export async function refetchUser() {
  if (!dbUser) return;
  try {
    const res = await fetch(`/api/users/${dbUser.id}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      dbUser = await res.json();
      notify();
    }
  } catch (e) {
    console.error("Refetch error:", e);
  }
}

let bootstrapped = false;

function parseUserFromInitData(raw: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(raw);
    const userJson = params.get("user");
    if (!userJson) return null;
    const u = JSON.parse(userJson);
    return {
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name ?? undefined,
      username: u.username ?? undefined,
      photo_url: u.photo_url ?? undefined,
      language_code: u.language_code ?? undefined,
    };
  } catch {
    return null;
  }
}

function createMockUser(): TelegramUser {
  return {
    id: 123456789,
    first_name: "Алексей",
    last_name: "Смирнов",
    username: "alexsmirnov",
    photo_url: "https://i.pravatar.cc/300?img=11",
  };
}

async function fetchOrCreateUser(tgUser: TelegramUser, initData?: string) {
  try {
    const body: Record<string, unknown> = { ...tgUser };
    if (initData) body.initData = initData;
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      dbUser = data.user;
    } else {
      console.error("Auth failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("Auth error:", e);
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), ms),
    ),
  ]);
}

/** Инициализирует Telegram SDK, авторизует пользователя. */
export async function bootstrapTelegram() {
  if (bootstrapped) return;
  bootstrapped = true;

  try {
    const debug = process.env.NODE_ENV === "development";
    init();
    setDebug(debug);
    sdkReady = true;
  } catch {
    sdkReady = false;
  }

  if (sdkReady) {
    try {
      if (miniApp.mount.isAvailable()) miniApp.mount();
      miniApp.ready();
    } catch (e) {
      console.warn("miniApp mount/ready failed:", e);
    }

    try {
      if (mountViewport.isAvailable()) await withTimeout(mountViewport(), 2000);
      if (expandViewport.isAvailable()) expandViewport();
    } catch {}

    try {
      if (bindViewportCssVars.isAvailable()) bindViewportCssVars();
    } catch {}

    viewportSafeAreaInsetTop.sub(notify);
    viewportSafeAreaInsetBottom.sub(notify);
    viewportContentSafeAreaInsetTop.sub(notify);
    viewportContentSafeAreaInsetBottom.sub(notify);

    if (requestFullscreen.isAvailable()) {
      try {
        await withTimeout(requestFullscreen(), 2000);
      } catch {}
    }

    try {
      if (requestSafeAreaInsets.isAvailable()) requestSafeAreaInsets();
      if (requestContentSafeAreaInsets.isAvailable())
        requestContentSafeAreaInsets();
    } catch {}

    try {
      const initData = retrieveRawInitData();
      if (initData) rawInitData = initData;

      let user: TelegramUser | null = null;
      try {
        const u = initDataUser();
        if (u) {
          user = {
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name ?? undefined,
            username: u.username ?? undefined,
            photo_url: u.photo_url ?? undefined,
            language_code: u.language_code ?? undefined,
          };
        }
      } catch {}

      if (!user && initData) {
        user = parseUserFromInitData(initData);
      }

      if (user) {
        await fetchOrCreateUser(user, initData);
      } else if (process.env.NODE_ENV === "development") {
        await fetchOrCreateUser(createMockUser());
      } else {
        console.error("No Telegram user data available");
        isTelegramApp = false;
      }
    } catch (e) {
      console.error("Auth flow error:", e);
      if (process.env.NODE_ENV === "development") {
        await fetchOrCreateUser(createMockUser());
      }
    }
  } else if (process.env.NODE_ENV === "development") {
    await fetchOrCreateUser(createMockUser());
  } else {
    console.error("TMA SDK failed to initialize");
    isTelegramApp = false;
  }

  isLoading = false;
  notify();
}

/** Настраивает кнопку «Назад» Telegram для навигации. */
export function setupBackButton(pathname: string, goBack: () => void) {
  if (!sdkReady || !backButton.mount.isAvailable()) return;

  backButton.mount();

  const isSubPage =
    pathname !== "/" &&
    pathname !== "/events" &&
    pathname !== "/members" &&
    pathname !== "/profile";

  if (!isSubPage) {
    if (backButton.hide.isAvailable()) backButton.hide();
    return;
  }

  const handleBack = () => goBack();
  backButton.onClick(handleBack);
  if (backButton.show.isAvailable()) backButton.show();

  return () => {
    backButton.offClick(handleBack);
    if (backButton.hide.isAvailable()) backButton.hide();
  };
}
