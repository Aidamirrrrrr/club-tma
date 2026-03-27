import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  deleteEvent,
  fetchEventById,
  registerForEvent,
  unregisterFromEvent,
} from "@/features/events/api";
import type { EventDetail } from "@/features/events/types";
import { formatDate } from "@/lib/utils";

interface UseEventDetailParams {
  eventId?: string;
  userId?: number;
  enabled: boolean;
  authHeaders: () => HeadersInit;
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

export function useEventDetail({
  eventId,
  userId,
  enabled,
  authHeaders,
  toast,
}: UseEventDetailParams) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      setEvent(await fetchEventById(eventId, authHeaders));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, eventId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    loadEvent();
  }, [enabled, loadEvent]);

  const isRegistered = event?.participants?.some(
    (participant) => participant.id === userId,
  );

  async function handleRegister() {
    if (!event) return;

    setActionLoading(true);
    try {
      const response = await registerForEvent(event.id, authHeaders);
      if (response.ok) {
        toast("Вы зарегистрированы!", "success");
        await loadEvent();
      } else {
        const data = await response.json();
        toast(data.error || "Ошибка регистрации", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Ошибка сети", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnregister() {
    if (!event) return;

    setActionLoading(true);
    try {
      const response = await unregisterFromEvent(event.id, authHeaders);
      if (response.ok) {
        toast("Регистрация отменена", "info");
        await loadEvent();
      } else {
        const data = await response.json();
        toast(data.error || "Ошибка", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Ошибка сети", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!event || actionLoading) return;

    setActionLoading(true);
    try {
      const response = await deleteEvent(event.id, authHeaders);
      if (response.ok) {
        toast("Мероприятие удалено", "success");
        router.push("/events");
      } else {
        toast("Ошибка удаления", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Ошибка сети", "error");
    } finally {
      setShowDeleteConfirm(false);
      setActionLoading(false);
    }
  }

  function handleShare() {
    if (!event) return;

    const text = `${event.title}\n${formatDate(event.date)}${event.time ? `, ${event.time}` : ""}\n${event.location || ""}`;
    if (navigator.share) {
      navigator.share({ title: event.title, text }).catch(() => {});
    }
  }

  return {
    event,
    loading,
    actionLoading,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isRegistered,
    handleRegister,
    handleUnregister,
    handleDelete,
    handleShare,
  };
}
