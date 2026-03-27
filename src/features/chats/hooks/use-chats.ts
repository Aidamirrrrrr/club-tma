import { useEffect, useState } from "react";
import { fetchChats } from "@/features/chats/api";
import type { ChatItem } from "@/features/chats/types";

interface UseChatsParams {
  enabled: boolean;
  authHeaders: () => HeadersInit;
}

export function useChats({ enabled, authHeaders }: UseChatsParams) {
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    fetchChats(authHeaders)
      .then(setChatList)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [authHeaders, enabled]);

  function appendChat(chat: ChatItem) {
    setChatList((prev) => [...prev, chat]);
  }

  function removeChat(chatId: number) {
    setChatList((prev) => prev.filter((chat) => chat.id !== chatId));
  }

  return {
    chatList,
    loading,
    appendChat,
    removeChat,
  };
}
