"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { PageLoader } from "@/components/ui/spinner";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/components/ui/toast";
import { useEventForm } from "@/features/events";
import { useTelegram } from "@/integrations/telegram";

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
  const { isAdmin, isLoading, authHeaders } = useTelegram();
  const { success, error: showError } = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fromId = searchParams.get("from");
  const {
    form,
    setForm,
    loading,
    saving,
    uploading,
    handleChange,
    handleCoverUpload,
    handleSubmit,
    resetCover,
  } = useEventForm({
    mode: "create",
    sourceEventId: fromId,
    enabled: !isLoading,
    authHeaders,
    toast: { success, error: showError },
    onSuccess: (eventId) => router.push(`/events/${eventId}`),
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push("/events");
  }, [isLoading, isAdmin, router]);

  if (isLoading || loading || !isAdmin) return <PageLoader />;

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
                  onClick={resetCover}
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
