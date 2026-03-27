"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTelegram } from "@/integrations/telegram";

/** Обёртка основного контента с адаптивными отступами. */
export function MainContent({ children }: { children: ReactNode }) {
  const { safeAreaTop, safeAreaBottom } = useTelegram();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  const cssSafeTop =
    "calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px))";
  const cssSafeBottom =
    "calc(var(--tg-viewport-safe-area-inset-bottom, 0px) + var(--tg-viewport-content-safe-area-inset-bottom, 0px))";

  const hasTopInset = safeAreaTop > 0;
  const hasBottomInset = safeAreaBottom > 0;

  const noTopPadding =
    pathname === "/profile" ||
    pathname.startsWith("/members/") ||
    /^\/events\/\d+/.test(pathname);

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-clip lg:max-w-3xl lg:pb-8"
      style={{
        paddingTop: noTopPadding
          ? undefined
          : hasTopInset
            ? `calc(${cssSafeTop} + 32px)`
            : `max(calc(${cssSafeTop} + 32px), 24px)`,
        paddingBottom: hasBottomInset
          ? `calc(${cssSafeBottom} + 80px)`
          : `max(calc(${cssSafeBottom} + 80px), 96px)`,
      }}
    >
      {children}
    </main>
  );
}
