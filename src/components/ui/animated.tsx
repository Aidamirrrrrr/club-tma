"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function PageWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("page-enter", className)}>{children}</div>;
}

/** Анимированный счётчик (числа нарастают). */
export function AnimatedCounter({
  value,
  duration = 600,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }

    hasAnimated.current = true;
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </span>
  );
}

/** Список с поочерёдной анимацией дочерних элементов. */
export function StaggeredList({
  children,
  className,
  animation = "slide-up",
  baseDelay = 0.05,
}: {
  children: ReactNode;
  className?: string;
  animation?: "slide-up" | "fade-in" | "scale-in" | "slide-in-right";
  baseDelay?: number;
}) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className={`animate-${animation}`}
              style={{ animationDelay: `${baseDelay * (i + 1)}s` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-[0_2px_8px_0_rgb(0_0_0/0.08),0_1px_3px_-1px_rgb(0_0_0/0.06),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3"
            style={{ width: `${65 + Math.random() * 30}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Скелетон карточки статистики. */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-[0_2px_8px_0_rgb(0_0_0/0.08),0_1px_3px_-1px_rgb(0_0_0/0.06),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      <Skeleton className="mb-2 h-5 w-5 rounded-lg" />
      <Skeleton className="mb-1.5 h-7 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Скелетон карточки участника. */
export function MemberCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-[0_2px_8px_0_rgb(0_0_0/0.08),0_1px_3px_-1px_rgb(0_0_0/0.06),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Скелетон карточки мероприятия. */
export function EventCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border bg-card p-4 shadow-[0_2px_8px_0_rgb(0_0_0/0.08),0_1px_3px_-1px_rgb(0_0_0/0.06),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

/** Заглушка для пустого состояния с иконкой. */
export function EmptyState({
  icon: Icon,
  message,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  className?: string;
}) {
  return (
    <div className={cn("py-12 text-center", className)}>
      <Icon className="empty-icon mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="animate-fade-in text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
