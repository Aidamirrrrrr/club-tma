"use client";

import { Camera, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/components/ui/toast";
import type { EventStatus } from "@/constants/domain";
import { useEventForm } from "@/features/events";
import { useTelegram } from "@/integrations/telegram";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isLoading, authHeaders } = useTelegram();
  const { success, error: showError } = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);
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
    mode: "edit",
    eventId: id,
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
        Редактировать мероприятие
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
          placeholder="Полное описание"
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
          <label htmlFor="cover-upload-edit" className="text-sm font-medium">
            Обложка
          </label>
          <input
            id="cover-upload-edit"
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
          label="Макс. участников"
          name="maxParticipants"
          id="maxParticipants"
          type="number"
          value={form.maxParticipants}
          onChange={handleChange}
          placeholder="0"
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Статус</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, status: value as EventStatus }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Открыта регистрация</SelectItem>
              <SelectItem value="closed">Закрыта</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}
