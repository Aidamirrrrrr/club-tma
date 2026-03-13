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

  // CSS-переменные от SDK (bindViewportCssVars) обновляются реактивно.
  // JS-значения используются как фоллбэк, а CSS calc — как основной источник.
  const cssSafeTop =
    "calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px))";
  const cssSafeBottom =
    "calc(var(--tg-viewport-safe-area-inset-bottom, 0px) + var(--tg-viewport-content-safe-area-inset-bottom, 0px))";

  // Используем JS-значения для проверки наличия отступов
  const hasTopInset = safeAreaTop > 0;
  const hasBottomInset = safeAreaBottom > 0;

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-clip lg:max-w-3xl lg:pb-8"
      style={{
        paddingTop: hasTopInset
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
