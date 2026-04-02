"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/constants/navigation";

/** Боковое меню для десктопа. */
export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden bg-card shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)] lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border">
      <div className="flex h-full flex-col gap-2 px-4 py-6">
        <div className="mb-6 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-sm">
            <Image src="/logo.png" alt="Клуб" width={22} height={22} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Клуб</p>
            <p className="text-[10px] text-muted-foreground">Управление</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
