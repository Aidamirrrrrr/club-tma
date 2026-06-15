"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MainContent } from "@/components/layout/main-content";
import {
  TelegramBackButtonManager,
  TelegramGate,
  TelegramInit,
} from "@/integrations/telegram";

/** Пути, доступные в обычном вебе (вне Telegram), без навигации и гейта. */
const STANDALONE_PREFIXES = ["/manage-photos"];

/**
 * Оболочка приложения: для Telegram Mini App рендерит навигацию + гейт,
 * для standalone-страниц (например /manage-photos) — голый контент.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_PREFIXES.some((p) => pathname.startsWith(p));

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <TelegramInit />
      <TelegramGate>
        <TelegramBackButtonManager />
        <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
          <DesktopSidebar />
          <div className="min-w-0 flex-1 overflow-x-hidden lg:overflow-y-auto">
            <MainContent>{children}</MainContent>
          </div>
        </div>
        <BottomNav />
      </TelegramGate>
    </>
  );
}
