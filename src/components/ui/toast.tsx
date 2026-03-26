"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

/** Хук для показа уведомлений (toast). */
export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string) => toast(message, "success"),
    [toast],
  );
  const error = useCallback(
    (message: string) => toast(message, "error"),
    [toast],
  );
  const info = useCallback(
    (message: string) => toast(message, "info"),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}

      <div className="fixed bottom-24 left-1/2 z-100 flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgClass =
    toast.type === "success"
      ? "bg-primary text-primary-foreground"
      : toast.type === "error"
        ? "bg-destructive text-white"
        : "bg-foreground text-background";

  return (
    <div
      className={`${bgClass} animate-slide-up rounded-xl px-4 py-2.5 text-center text-sm font-medium shadow-lg cursor-pointer`}
      role="button"
      tabIndex={0}
      onClick={() => onRemove(toast.id)}
      onKeyDown={(e) => e.key === "Enter" && onRemove(toast.id)}
    >
      {toast.message}
    </div>
  );
}
