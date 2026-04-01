import { useCallback, useEffect, useState } from "react";
import {
  createEvent,
  fetchEventById,
  updateEvent,
} from "@/features/events/api";
import type { EventFormData } from "@/features/events/types";

const emptyEventForm: EventFormData = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  coverUrl: "",
  maxParticipants: "",
  status: "open",
};

interface UseEventFormParams {
  mode: "create" | "edit";
  eventId?: string;
  sourceEventId?: string | null;
  enabled: boolean;
  authHeaders: () => HeadersInit;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
  onSuccess: (eventId: number | string) => void;
}

export function useEventForm({
  mode,
  eventId,
  sourceEventId,
  enabled,
  authHeaders,
  toast,
  onSuccess,
}: UseEventFormParams) {
  const [form, setForm] = useState<EventFormData>(emptyEventForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadSourceEvent = useCallback(async () => {
    if (!sourceEventId) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchEventById(sourceEventId, authHeaders);
      setForm((prev) => ({
        ...prev,
        title: data.title || "",
        description: data.description || "",
        date: "",
        time: "",
        location: data.location || "",
        coverUrl: data.coverUrl || "",
        maxParticipants: data.maxParticipants
          ? String(data.maxParticipants)
          : "",
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, sourceEventId]);

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchEventById(eventId, authHeaders);
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, eventId]);

  useEffect(() => {
    if (!enabled) return;

    if (mode === "edit") {
      loadEvent();
      return;
    }

    if (sourceEventId) {
      setLoading(true);
      loadSourceEvent();
      return;
    }

    setLoading(false);
  }, [enabled, loadEvent, loadSourceEvent, mode, sourceEventId]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        setForm((prev) => ({ ...prev, coverUrl: url }));
      } else {
        toast.error("Не удалось загрузить обложку");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  }

  function resetCover() {
    setForm((prev) => ({ ...prev, coverUrl: "" }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!form.title.trim()) {
      toast.error("Введите название мероприятия");
      return;
    }

    if (!form.date) {
      toast.error("Выберите дату");
      return;
    }

    setSaving(true);
    try {
      const response =
        mode === "edit" && eventId
          ? await updateEvent(eventId, form, authHeaders)
          : await createEvent(form, authHeaders);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(
          data?.error ||
            (mode === "edit"
              ? "Не удалось сохранить"
              : "Не удалось создать мероприятие"),
        );
        return;
      }

      const responseEvent = await response.json();
      toast.success(
        mode === "edit" ? "Мероприятие сохранено" : "Мероприятие создано",
      );
      onSuccess(
        mode === "edit" ? eventId || responseEvent.id : responseEvent.id,
      );
    } catch (error) {
      console.error(error);
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    setForm,
    loading,
    saving,
    uploading,
    handleChange,
    handleCoverUpload,
    handleSubmit,
    resetCover,
  };
}
