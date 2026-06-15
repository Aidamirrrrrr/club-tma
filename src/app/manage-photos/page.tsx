"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slot = { slot: number; url: string | null };

export default function ManagePhotosPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [images, setImages] = useState<Slot[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  async function loadSession() {
    const res = await fetch("/api/manage-photos/session", {
      cache: "no-store",
    });
    const data = await res.json();
    setAuthed(Boolean(data.authed));
    if (data.authed) setImages(data.images ?? []);
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/manage-photos/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      await loadSession();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "Wrong password" ? "Неверный пароль" : "Ошибка входа");
    }
  }

  async function handleReplace(slot: number, file: File) {
    setBusySlot(slot);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/manage-photos/${slot}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось загрузить");
        return;
      }
      await loadSession();
    } finally {
      setBusySlot(null);
    }
  }

  async function handleDelete(slot: number) {
    setBusySlot(slot);
    setError("");
    try {
      const res = await fetch(`/api/manage-photos/${slot}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Не удалось удалить");
        return;
      }
      await loadSession();
    } finally {
      setBusySlot(null);
    }
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={handleLogin}
          className="flex w-full max-w-xs flex-col gap-4"
        >
          <h1 className="text-xl font-bold tracking-tight">
            Управление фото
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="h-11 rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="h-11 rounded-xl bg-primary text-sm font-medium text-black transition-colors hover:bg-primary/90"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Фото на главной</h1>
        <p className="text-sm text-muted-foreground">
          Три превью в карточке «Мероприятия клуба»
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {images.map(({ slot, url }) => {
          const src = url ?? null;
          const busy = busySlot === slot;
          return (
            <div
              key={slot}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
                {src ? (
                  <Image
                    src={src}
                    alt={`Слот ${slot}`}
                    fill
                    sizes="200px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Пусто
                  </div>
                )}
              </div>

              <input
                ref={(el) => {
                  fileInputs.current[slot] = el;
                }}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReplace(slot, file);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputs.current[slot]?.click()}
                className="h-9 rounded-lg bg-primary text-xs font-medium text-black transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {busy ? "…" : "Заменить"}
              </button>
              <button
                type="button"
                disabled={busy || !url}
                onClick={() => handleDelete(slot)}
                className="h-9 rounded-lg border border-border text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
              >
                Удалить
              </button>
              {url?.startsWith("/uploads/") && (
                <p className="truncate text-[10px] text-muted-foreground">
                  загружено
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
