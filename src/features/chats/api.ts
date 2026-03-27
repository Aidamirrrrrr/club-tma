import type { ChatItem } from "@/features/chats/types";

export async function fetchChats(authHeaders: () => HeadersInit) {
  const response = await fetch("/api/chats", { headers: authHeaders() });

  if (!response.ok) {
    throw response;
  }

  return (await response.json()) as ChatItem[];
}

export async function createChat(
  payload: Pick<ChatItem, "title" | "url" | "description">,
  authHeaders: () => HeadersInit,
) {
  return fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function deleteChat(
  chatId: number,
  authHeaders: () => HeadersInit,
) {
  return fetch(`/api/chats/${chatId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
