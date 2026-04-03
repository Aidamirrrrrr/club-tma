"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/constants/navigation";
import { useTelegram } from "@/integrations/telegram";

/** Нижняя навигация для мобильных устройств. */
export function BottomNav() {
  const pathname = usePathname();
  const { safeAreaBottom } = useTelegram();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up bg-background/80 shadow-[0_-2px_12px_0_rgb(0_0_0/0.08),inset_0_1px_0_0_rgb(255_255_255/0.35)] backdrop-blur-xl lg:hidden"
      style={{
        paddingBottom:
          safeAreaBottom > 0
            ? "var(--tg-viewport-safe-area-inset-bottom, 20px)"
            : "20px",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-2.5 py-3 text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground active:scale-90"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all duration-300 ease-out ${
                  isActive ? "bg-primary px-4 py-1.5 shadow-sm" : "px-2 py-1.5"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-all duration-300 ease-out ${
                    isActive ? "text-black" : "group-active:scale-90"
                  }`}
                />
              </div>
              <span
                className={`tracking-wide transition-all duration-200 ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {item.mobileLabel ?? item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
