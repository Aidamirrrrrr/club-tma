"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { useTelegram } from "@/components/telegram";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { PageLoader } from "@/components/ui/spinner";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/components/ui/toast";

/** Страница создания мероприятия (обёртка с Suspense). */
export default function CreateEventPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CreateEventForm />
    </Suspense>
  );
}

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dbUser, isAdmin, isLoading, authHeaders } = useTelegram();
  const { success, error: showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => ({
    title: searchParams.get("title") || "",
    description: searchParams.get("description") || "",
    date: "",
    time: "",
    location: searchParams.get("location") || "",
    coverUrl: searchParams.get("coverUrl") || "",
    maxParticipants: searchParams.get("maxParticipants") || "",
  }));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setForm((prev) => ({ ...prev, coverUrl: url }));
      } else {
        showError("Не удалось загрузить обложку");
      }
    } catch (err) {
      console.error(err);
      showError("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !dbUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...form,
          maxParticipants: form.maxParticipants
            ? Number(form.maxParticipants)
            : 0,
        }),
      });
      if (res.ok) {
        const event = await res.json();
        success("Мероприятие создано");
        router.push(`/events/${event.id}`);
      } else {
        const data = await res.json().catch(() => null);
        showError(data?.error || "Не удалось создать мероприятие");
      }
    } catch (e) {
      console.error(e);
      showError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!isAdmin) {
    router.push("/events");
    return null;
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 lg:mx-auto lg:max-w-lg">
      <h1 className="animate-slide-up text-xl font-bold tracking-tight">
        Создать мероприятие
      </h1>

      <form
        onSubmit={handleSubmit}
        className="animate-slide-up stagger-1 flex flex-col gap-4"
      >
        <FormField
          label="Название *"
          name="title"
          id="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Название мероприятия"
          required
        />
        <FormTextarea
          label="Описание"
          name="description"
          id="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Полное описание мероприятия"
        />
        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Дата *"
            id="date"
            value={form.date}
            onChange={(val) => setForm((prev) => ({ ...prev, date: val }))}
          />
          <TimePicker
            label="Время"
            id="time"
            value={form.time}
            onChange={(val) => setForm((prev) => ({ ...prev, time: val }))}
          />
        </div>
        <FormField
          label="Место проведения"
          name="location"
          id="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Адрес или онлайн"
        />
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cover-upload-create" className="text-sm font-medium">
            Обложка
          </label>
          <input
            id="cover-upload-create"
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
          {form.coverUrl ? (
            <div className="relative h-40 w-full overflow-hidden rounded-xl">
              <Image
                src={form.coverUrl}
                alt="Обложка"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Заменить
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setForm((prev) => ({ ...prev, coverUrl: "" }))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
              className="flex h-40 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border transition-colors hover:bg-muted/50"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Загрузить обложку
                  </span>
                </>
              )}
            </button>
          )}
        </div>
        <FormField
          label="Макс. участников (0 = без ограничения)"
          name="maxParticipants"
          id="maxParticipants"
          type="number"
          value={form.maxParticipants}
          onChange={handleChange}
          placeholder="0"
        />
        <Button type="submit" disabled={saving}>
          {saving ? "Создание..." : "Создать мероприятие"}
        </Button>
      </form>
    </div>
  );
}
