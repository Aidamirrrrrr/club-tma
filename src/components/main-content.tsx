"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTelegram } from "@/components/telegram-provider";
import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  const { hasFullscreen } = useTelegram();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <main
      className={`mx-auto w-full max-w-lg px-4 lg:max-w-3xl lg:pt-8 lg:pb-8 ${
        hasFullscreen
          ? "max-lg:pt-28 max-lg:pb-36"
          : "max-lg:pt-16 max-lg:pb-24"
      }`}
    >
      {children}
    </main>
  );
}
