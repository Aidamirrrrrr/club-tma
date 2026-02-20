"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTelegram } from "@/components/telegram-provider";
import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  const { safeAreaBottom } = useTelegram();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const bottomPadding = safeAreaBottom > 0 ? safeAreaBottom + 80 : 96; // 80 for nav, 96px = pb-24 fallback

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden pt-32 px-4 lg:max-w-3xl lg:pt-8 lg:pb-8"
      style={{
        paddingBottom: `${bottomPadding}px`,
      }}
    >
      {children}
    </main>
  );
}
