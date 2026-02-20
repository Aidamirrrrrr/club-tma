"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
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
  refetchUser: () => Promise<void>;
  authHeaders: () => Record<string, string>;
}

const TelegramContext = createContext<TelegramContextType>({
  tgUser: null,
  dbUser: null,
  isAdmin: false,
  isLoading: true,
  hasFullscreen: false,
  refetchUser: async () => {},
  authHeaders: () => ({}),
});

export function useTelegram() {
  return useContext(TelegramContext);
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          query_id?: string;
        };
        ready: () => void;
        expand: () => void;
        requestFullscreen?: () => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          isVisible: boolean;
        };
        themeParams: Record<string, string>;
        colorScheme: "light" | "dark";
        headerColor: string;
        backgroundColor: string;
        isFullscreen?: boolean;
        safeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
        contentSafeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
      };
    };
  }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFullscreen, setHasFullscreen] = useState(false);
  const [initData, setInitData] = useState<string | undefined>();

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (initData) {
      headers["x-telegram-init-data"] = initData;
    } else if (dbUser) {
      headers["x-user-id"] = String(dbUser.id);
    }
    return headers;
  };

  const fetchOrCreateUser = async (
    tgUserData: TelegramUser,
    initData?: string,
  ) => {
    try {
      const body: Record<string, unknown> = { ...tgUserData };
      if (initData) {
        body.initData = initData;
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

  const refetchUser = async () => {
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
  };

  useEffect(() => {
    const initTelegram = async () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        // Request fullscreen if available
        if (typeof tg.requestFullscreen === "function") {
          setHasFullscreen(true);
          try {
            tg.requestFullscreen();
          } catch (e) {
            // Not supported in older versions
          }
        }
        const user = tg.initDataUnsafe?.user;
        if (user) {
          setTgUser(user);
          setInitData(tg.initData);
          await fetchOrCreateUser(user, tg.initData);
        } else {
          // Telegram script loaded but no user (opened outside Telegram)
          const mockUser: TelegramUser = {
            id: 123456789,
            first_name: "Алексей",
            last_name: "Смирнов",
            username: "alexsmirnov",
            photo_url: "https://i.pravatar.cc/300?img=11",
          };
          setTgUser(mockUser);
          await fetchOrCreateUser(mockUser);
        }
      } else {
        // Dev mode: mock user
        const mockUser: TelegramUser = {
          id: 123456789,
          first_name: "Алексей",
          last_name: "Смирнов",
          username: "alexsmirnov",
          photo_url: "https://i.pravatar.cc/300?img=11",
        };
        setTgUser(mockUser);
        await fetchOrCreateUser(mockUser);
      }
      setIsLoading(false);
    };
    initTelegram();
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        tgUser,
        dbUser,
        isAdmin: dbUser?.role === "admin",
        isLoading,
        hasFullscreen,
        refetchUser,
        authHeaders,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

// Hook to manage Telegram BackButton on sub-pages
export function useTelegramBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const isSubPage =
      pathname !== "/" &&
      pathname !== "/events" &&
      pathname !== "/members" &&
      pathname !== "/profile";

    if (!isSubPage) {
      tg?.BackButton.hide();
      return;
    }

    const handleBack = () => {
      router.back();
    };

    tg?.BackButton.onClick(handleBack);
    tg?.BackButton.show();

    return () => {
      tg?.BackButton.offClick(handleBack);
      tg?.BackButton.hide();
    };
  }, [pathname, router]);
}
