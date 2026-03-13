import type * as React from "react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  onChange,
  ...props
}: React.ComponentProps<"textarea">) {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: props.value нужен для пересчёта высоты
  useEffect(() => {
    resize();
  }, [resize, props.value]);

  return (
    <textarea
      ref={innerRef}
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-10 w-full resize-none rounded-xl border bg-card px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "[&:not(:placeholder-shown)]:border-foreground/25",
        className,
      )}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      {...props}
    />
  );
}

export { Textarea };
