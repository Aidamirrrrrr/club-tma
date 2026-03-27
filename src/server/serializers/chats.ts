import type { ChatItemResponse } from "@/contracts/chats";
import type { Chat } from "@/db/schema";

export function serializeChat(chat: Chat): ChatItemResponse {
  return {
    id: chat.id,
    title: chat.title,
    url: chat.url,
    description: chat.description || "",
    sort: chat.sort,
  };
}
