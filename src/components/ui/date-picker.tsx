"use client";

import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DatePicker({
  label,
  id,
  value,
  onChange,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

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
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate
            ? format(selectedDate, "d MMMM yyyy", { locale: ru })
            : "Выберите дату"}
        </Button>
        {open && (
          <div className="animate-in fade-in-0 duration-150 absolute left-0 top-full z-50 mt-1 rounded-md border bg-popover p-0 shadow-md">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onChange(date ? format(date, "yyyy-MM-dd") : "");
                setOpen(false);
              }}
              locale={ru}
            />
          </div>
        )}
      </div>
    </div>
  );
}
