"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTelegram } from "@/components/telegram-provider";
import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  const { safeAreaTop, safeAreaBottom } = useTelegram();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Dynamic padding based on safe area insets from Telegram
  const topPadding = safeAreaTop > 0 ? safeAreaTop + 12 : 64; // 64px = pt-16 fallback
  const bottomPadding = safeAreaBottom > 0 ? safeAreaBottom + 80 : 96; // 80 for nav, 96px = pb-24 fallback

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 lg:max-w-3xl lg:pt-8 lg:pb-8"
      style={{
        paddingTop: `${topPadding}px`,
        paddingBottom: `${bottomPadding}px`,
      }}
    >
      {children}
    </main>
  );
}
