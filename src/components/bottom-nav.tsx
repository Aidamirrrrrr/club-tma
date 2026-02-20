"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Users, UserCircle } from "lucide-react";

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/events", label: "События", icon: CalendarDays },
  { href: "/members", label: "Участники", icon: Users },
  { href: "/profile", label: "Профиль", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up bg-background/80 shadow-[0_-2px_12px_0_rgb(0_0_0/0.06)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-90"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-all duration-300 ease-out ${
                    isActive
                      ? "scale-110 text-primary"
                      : "group-active:scale-90"
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary animate-bounce-in" />
                )}
              </div>
              <span
                className={`tracking-wide transition-all duration-200 ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary animate-scale-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
