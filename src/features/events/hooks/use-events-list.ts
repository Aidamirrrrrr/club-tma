import { useEffect, useState } from "react";
import { fetchEventsList } from "@/features/events/api";
import type { EventPreview } from "@/features/events/types";

interface UseEventsListParams {
  filter: "upcoming" | "past" | "mine";
  search: string;
  telegramUserId?: number;
  enabled: boolean;
  authHeaders: () => HeadersInit;
}

export function useEventsList({
  filter,
  search,
  telegramUserId,
  enabled,
  authHeaders,
}: UseEventsListParams) {
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({ filter, search });
    if (filter === "mine" && telegramUserId) {
      params.set("telegramId", String(telegramUserId));
    }

    fetchEventsList(params, authHeaders, controller.signal)
      .then(setEvents)
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [authHeaders, enabled, filter, search, telegramUserId]);

  return { events, loading };
}
