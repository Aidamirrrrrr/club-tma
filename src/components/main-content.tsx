"use client";

import { useTelegram } from "@/components/telegram-provider";
import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  const { hasFullscreen } = useTelegram();

  return (
    <main
      className={`mx-auto w-full max-w-lg px-4 lg:max-w-3xl lg:pt-8 lg:pb-8 ${
        hasFullscreen ? "pt-28 pb-36" : "pt-16 pb-24"
      }`}
    >
      {children}
    </main>
  );
}
