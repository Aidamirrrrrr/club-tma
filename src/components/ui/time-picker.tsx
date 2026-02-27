"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export function TimePicker({
  label,
  id,
  value,
  onChange,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""];

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open && selectedHour && hourRef.current) {
      const el = hourRef.current.querySelector(
        `[data-hour="${selectedHour}"]`,
      ) as HTMLElement | null;
      if (el) {
        hourRef.current.scrollTop =
          el.offsetTop - hourRef.current.clientHeight / 2 + el.clientHeight / 2;
      }
    }
  }, [open, selectedHour]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div ref={ref} className="relative">
        <Button
          id={id}
          type="button"
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full justify-start text-left font-normal rounded-xl bg-card",
            !value && "text-muted-foreground",
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Время"}
        </Button>
        {open && (
          <div className="animate-in fade-in-0 duration-150 absolute left-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-0 shadow-md">
            <div className="flex h-56">
              <div
                ref={hourRef}
                className="flex flex-1 flex-col overflow-y-auto border-r py-1 scrollbar-none"
              >
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    data-hour={h}
                    className={cn(
                      "px-3 py-1.5 text-center text-sm hover:bg-accent",
                      selectedHour === h &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    onClick={() => onChange(`${h}:${selectedMinute || "00"}`)}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto py-1 scrollbar-none">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 text-center text-sm hover:bg-accent",
                      selectedMinute === m &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    onClick={() => onChange(`${selectedHour || "12"}:${m}`)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
