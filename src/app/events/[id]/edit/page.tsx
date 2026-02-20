"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTelegram } from "@/components/telegram-provider";
import { Button } from "@/components/ui/button";
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

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin, isLoading, authHeaders } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    coverUrl: "",
    maxParticipants: "",
    status: "open",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (res.ok) {
          const data = await res.json();
          setForm({
            title: data.title || "",
            description: data.description || "",
            date: data.date || "",
            time: data.time || "",
            location: data.location || "",
            coverUrl: data.coverUrl || "",
            maxParticipants: data.maxParticipants
              ? String(data.maxParticipants)
              : "",
            status: data.status || "open",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...form,
          maxParticipants: form.maxParticipants
            ? Number(form.maxParticipants)
            : 0,
        }),
      });
      if (res.ok) router.push(`/events/${id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) return <PageLoader />;
  if (!isAdmin) {
    router.push("/events");
    return null;
  }

  return (
    <div className="flex flex-col gap-5 pb-6 lg:mx-auto lg:max-w-lg">
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
          <FormField
            label="Дата *"
            name="date"
            id="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
          <FormField
            label="Время"
            name="time"
            id="time"
            type="time"
            value={form.time}
            onChange={handleChange}
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
        <FormField
          label="URL обложки"
          name="coverUrl"
          id="coverUrl"
          value={form.coverUrl}
          onChange={handleChange}
          placeholder="https://..."
        />
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
              setForm((prev) => ({ ...prev, status: value }))
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
