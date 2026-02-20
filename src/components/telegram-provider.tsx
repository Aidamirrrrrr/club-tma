"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  init,
  miniApp,
  backButton,
  setDebug,
  retrieveRawInitData,
  initDataUser,
  mountViewport,
  expandViewport,
  requestFullscreen,
  viewportSafeAreaInsetTop,
  viewportSafeAreaInsetBottom,
  viewportContentSafeAreaInsetTop,
  viewportContentSafeAreaInsetBottom,
} from "@telegram-apps/sdk-react";
import type { User } from "@/db/schema";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramContextType {
  tgUser: TelegramUser | null;
  dbUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasFullscreen: boolean;
  safeAreaTop: number;
  safeAreaBottom: number;
  refetchUser: () => Promise<void>;
  authHeaders: () => Record<string, string>;
}

const TelegramContext = createContext<TelegramContextType>({
  tgUser: null,
  dbUser: null,
  isAdmin: false,
  isLoading: true,
  hasFullscreen: false,
  safeAreaTop: 0,
  safeAreaBottom: 0,
  refetchUser: async () => {},
  authHeaders: () => ({}),
});

export function useTelegram() {
  return useContext(TelegramContext);
}

function initTmaSDK(): boolean {
  try {
    const debug = process.env.NODE_ENV === "development";
    init();
    setDebug(debug);
    return true;
  } catch {
    return false;
  }
}

/** Race a promise against a timeout — returns undefined on timeout. */
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

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFullscreen, setHasFullscreen] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [rawInitData, setRawInitData] = useState<string | undefined>();

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (rawInitData) {
      headers["x-telegram-init-data"] = rawInitData;
    } else if (dbUser) {
      headers["x-user-id"] = String(dbUser.id);
    }
    return headers;
  }, [rawInitData, dbUser]);

  const fetchOrCreateUser = async (
    tgUserData: TelegramUser,
    initDataRaw?: string,
  ) => {
    try {
      const body: Record<string, unknown> = { ...tgUserData };
      if (initDataRaw) {
        body.initData = initDataRaw;
      }
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      }
    } catch (e) {
      console.error("Auth error:", e);
    }
  };

  const refetchUser = useCallback(async () => {
    if (!dbUser) return;
    try {
      const res = await fetch(`/api/users/${dbUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      }
    } catch (e) {
      console.error("Refetch error:", e);
    }
  }, [dbUser]);

  useEffect(() => {
    const bootstrap = async () => {
      const sdkReady = initTmaSDK();

      if (sdkReady) {
        try {
          // Mount mini app
          if (miniApp.mount.isAvailable()) {
            miniApp.mount();
          }
          miniApp.ready();

          // Mount & expand viewport (with timeout to avoid hanging)
          try {
            if (mountViewport.isAvailable()) {
              await withTimeout(mountViewport(), 2000);
            }
            if (expandViewport.isAvailable()) {
              expandViewport();
            }
          } catch {
            // Viewport mount failed, continue anyway
          }

          // Request fullscreen (with timeout)
          if (requestFullscreen.isAvailable()) {
            setHasFullscreen(true);
            try {
              await withTimeout(requestFullscreen(), 2000);
            } catch {
              // Not supported in older versions
            }
          }

          // Read safe area insets from signals
          try {
            const saTop =
              (viewportSafeAreaInsetTop() ?? 0) +
              (viewportContentSafeAreaInsetTop() ?? 0);
            const saBottom =
              (viewportSafeAreaInsetBottom() ?? 0) +
              (viewportContentSafeAreaInsetBottom() ?? 0);
            setSafeAreaTop(saTop);
            setSafeAreaBottom(saBottom);
          } catch {
            // Safe area signals not available
          }

          // Get raw init data for auth headers
          const initDataRaw = retrieveRawInitData();
          if (initDataRaw) {
            setRawInitData(initDataRaw);
          }

          // Get user from init data
          const tgAppUser = initDataUser();

          if (tgAppUser) {
            const user: TelegramUser = {
              id: tgAppUser.id,
              first_name: tgAppUser.first_name,
              last_name: tgAppUser.last_name ?? undefined,
              username: tgAppUser.username ?? undefined,
              photo_url: tgAppUser.photo_url ?? undefined,
              language_code: tgAppUser.language_code ?? undefined,
            };
            setTgUser(user);
            await fetchOrCreateUser(user, initDataRaw);
          } else {
            // SDK initialized but no user data
            const mockUser = createMockUser();
            setTgUser(mockUser);
            await fetchOrCreateUser(mockUser);
          }
        } catch (e) {
          console.error("TMA SDK init error:", e);
          const mockUser = createMockUser();
          setTgUser(mockUser);
          await fetchOrCreateUser(mockUser);
        }
      } else {
        // Dev mode: SDK not available
        const mockUser = createMockUser();
        setTgUser(mockUser);
        await fetchOrCreateUser(mockUser);
      }

      setIsLoading(false);
    };

    bootstrap();
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        tgUser,
        dbUser,
        isAdmin: dbUser?.role === "admin",
        isLoading,
        hasFullscreen,
        safeAreaTop,
        safeAreaBottom,
        refetchUser,
        authHeaders,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
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

// Hook to manage Telegram BackButton on sub-pages
export function useTelegramBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isSubPage =
      pathname !== "/" &&
      pathname !== "/events" &&
      pathname !== "/members" &&
      pathname !== "/profile";

    if (!backButton.mount.isAvailable()) return;

    backButton.mount();

    if (!isSubPage) {
      if (backButton.hide.isAvailable()) {
        backButton.hide();
      }
      return;
    }

    const handleBack = () => {
      router.back();
    };

    backButton.onClick(handleBack);
    if (backButton.show.isAvailable()) {
      backButton.show();
    }

    return () => {
      backButton.offClick(handleBack);
      if (backButton.hide.isAvailable()) {
        backButton.hide();
      }
    };
  }, [pathname, router]);
}
