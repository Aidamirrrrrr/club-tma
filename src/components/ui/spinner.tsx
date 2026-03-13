/** Компонент спиннера загрузки. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary ${className}`}
      role="status"
    >
      <span className="sr-only">Загрузка...</span>
    </div>
  );
}

/** Полностраничный индикатор загрузки. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 animate-fade-in">
      <Spinner className="h-8 w-8" />
      <span className="text-xs text-muted-foreground animate-pulse-soft">
        Загрузка...
      </span>
    </div>
  );
}
