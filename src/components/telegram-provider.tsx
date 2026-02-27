"use client";

import {
  backButton,
  expandViewport,
  init,
  initDataUser,
  miniApp,
  mountViewport,
  requestFullscreen,
  retrieveRawInitData,
  setDebug,
  viewportContentSafeAreaInsetBottom,
  viewportContentSafeAreaInsetTop,
  viewportSafeAreaInsetBottom,
  viewportSafeAreaInsetTop,
} from "@telegram-apps/sdk-react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

/** Parse user from raw initData string on the client side. */
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

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFullscreen, setHasFullscreen] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [rawInitData, setRawInitData] = useState<string | undefined>();
  const bootstrappedRef = useRef(false);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (rawInitData) {
      headers["x-telegram-init-data"] = rawInitData;
    } else if (dbUser) {
      headers["x-user-id"] = String(dbUser.id);
    }
    return headers;
  };

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
      } else {
        console.error("Auth failed:", res.status, await res.text());
      }
    } catch (e) {
      console.error("Auth error:", e);
    }
  };

  const refetchUser = async () => {
    if (!dbUser) return;
    try {
      const res = await fetch(`/api/users/${dbUser.id}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      }
    } catch (e) {
      console.error("Refetch error:", e);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const sdkReady = initTmaSDK();

      if (sdkReady) {
        // Mount UI components — errors here should NOT block auth
        try {
          if (miniApp.mount.isAvailable()) {
            miniApp.mount();
          }
          miniApp.ready();
        } catch (e) {
          console.warn("miniApp mount/ready failed:", e);
        }

        try {
          if (mountViewport.isAvailable()) {
            await withTimeout(mountViewport(), 2000);
          }
          if (expandViewport.isAvailable()) {
            expandViewport();
          }
        } catch {
          // Viewport mount failed
        }

        if (requestFullscreen.isAvailable()) {
          setHasFullscreen(true);
          try {
            await withTimeout(requestFullscreen(), 2000);
          } catch {
            // Not supported
          }
        }

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

        // Auth — this is the critical part
        try {
          const initDataRaw = retrieveRawInitData();
          if (initDataRaw) {
            setRawInitData(initDataRaw);
          }

          // Try SDK signal first, then parse raw initData manually
          let user: TelegramUser | null = null;
          try {
            const tgAppUser = initDataUser();
            if (tgAppUser) {
              user = {
                id: tgAppUser.id,
                first_name: tgAppUser.first_name,
                last_name: tgAppUser.last_name ?? undefined,
                username: tgAppUser.username ?? undefined,
                photo_url: tgAppUser.photo_url ?? undefined,
                language_code: tgAppUser.language_code ?? undefined,
              };
            }
          } catch {
            // initDataUser signal not ready
          }

          // Fallback: parse user directly from raw initData
          if (!user && initDataRaw) {
            user = parseUserFromInitData(initDataRaw);
          }

          if (user) {
            setTgUser(user);
            await fetchOrCreateUser(user, initDataRaw);
          } else if (process.env.NODE_ENV === "development") {
            // Mock user ONLY in development
            const mockUser = createMockUser();
            setTgUser(mockUser);
            await fetchOrCreateUser(mockUser);
          } else {
            console.error("No Telegram user data available");
          }
        } catch (e) {
          console.error("Auth flow error:", e);
          if (process.env.NODE_ENV === "development") {
            const mockUser = createMockUser();
            setTgUser(mockUser);
            await fetchOrCreateUser(mockUser);
          }
        }
      } else {
        // SDK not available — only use mock in development
        if (process.env.NODE_ENV === "development") {
          const mockUser = createMockUser();
          setTgUser(mockUser);
          await fetchOrCreateUser(mockUser);
        } else {
          console.error("TMA SDK failed to initialize");
        }
      }

      setIsLoading(false);
    };

    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrCreateUser]);

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
