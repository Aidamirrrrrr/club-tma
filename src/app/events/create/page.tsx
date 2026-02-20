"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/components/telegram-provider";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { PageLoader } from "@/components/ui/spinner";

export default function CreateEventPage() {
  const router = useRouter();
  const { dbUser, isAdmin, isLoading, authHeaders } = useTelegram();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    coverUrl: "",
    maxParticipants: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          createdBy: dbUser.id,
        }),
      });
      if (res.ok) {
        const event = await res.json();
        router.push(`/events/${event.id}`);
      }
    } catch (e) {
      console.error(e);
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
    <div className="flex flex-col gap-5 pb-6 lg:mx-auto lg:max-w-lg">
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
