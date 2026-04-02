"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/** Модальный диалог подтверждения действия. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={onCancel}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      />

      <div className="animate-scale-in relative mx-4 w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl shadow-[0_4px_16px_0_rgb(0_0_0/0.15),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
