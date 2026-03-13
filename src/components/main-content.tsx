"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTelegram } from "@/components/telegram";

/** Обёртка основного контента с адаптивными отступами. */
export function MainContent({ children }: { children: ReactNode }) {
  const { safeAreaTop, safeAreaBottom } = useTelegram();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const topPadding = safeAreaTop > 0 ? safeAreaTop + 56 : 24;
  const bottomPadding = safeAreaBottom > 0 ? safeAreaBottom + 80 : 96;

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-clip lg:max-w-3xl lg:pb-8"
      style={{
        paddingTop: topPadding > 0 ? `${topPadding}px` : undefined,
        paddingBottom: `${bottomPadding}px`,
      }}
    >
      {children}
    </main>
  );
}
