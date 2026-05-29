"use client";

import { useEffect } from "react";

const MARKER = "Failed to find Server Action";
// Защита от цикла перезагрузок: перезагружаемся максимум раз в это окно времени.
const GUARD_KEY = "stale-deploy-reload-at";
const GUARD_WINDOW_MS = 30_000;

/**
 * Фолбэк для агрессивного кеша Telegram-вебвью: если у клиента остался старый
 * бандл и сервер не находит Server Action, один раз форсим перезагрузку, чтобы
 * подтянулся свежий билд. Стабильный NEXT_SERVER_ACTIONS_ENCRYPTION_KEY убирает
 * основную причину, это — страховка на случай реально изменившегося экшена.
 */
export function StaleDeployReload() {
  useEffect(() => {
    const isStaleActionError = (value: unknown) =>
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof (value as { message: unknown }).message === "string" &&
      (value as { message: string }).message.includes(MARKER);

    const reloadOnce = () => {
      const last = Number(sessionStorage.getItem(GUARD_KEY) ?? 0);
      if (Date.now() - last < GUARD_WINDOW_MS) return;
      sessionStorage.setItem(GUARD_KEY, String(Date.now()));
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (isStaleActionError(e.error)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (isStaleActionError(e.reason)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
