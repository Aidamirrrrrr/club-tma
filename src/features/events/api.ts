import type {
  EventDetail,
  EventFormData,
  EventPreview,
} from "@/features/events/types";

export async function fetchEventsList(
  params: URLSearchParams,
  authHeaders: () => HeadersInit,
  signal?: AbortSignal,
) {
  const response = await fetch(`/api/events?${params.toString()}`, {
    headers: authHeaders(),
    signal,
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as EventPreview[];
}

export async function fetchEventById(
  eventId: string,
  authHeaders: () => HeadersInit,
) {
  const response = await fetch(`/api/events/${eventId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as EventDetail;
}

export async function registerForEvent(
  eventId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/events/${eventId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

export async function unregisterFromEvent(
  eventId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/events/${eventId}/register`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function deleteEvent(
  eventId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function createEvent(
  form: EventFormData,
  authHeaders: () => HeadersInit,
) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      ...form,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : 0,
    }),
  });

  return response;
}

export async function updateEvent(
  eventId: string,
  form: EventFormData,
  authHeaders: () => HeadersInit,
) {
  const response = await fetch(`/api/events/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      ...form,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : 0,
    }),
  });

  return response;
}
