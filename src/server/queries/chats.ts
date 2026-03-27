import { db } from "@/db";
import type { Chat } from "@/db/schema";

export interface UpdateChatInput {
  title?: string;
  url?: string;
  description?: string;
  sort?: number;
}

export async function listChats(): Promise<Chat[]> {
  return db.chat.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
  });
}

export async function createChat(values: {
  title: string;
  url: string;
  description?: string;
  sort?: number;
}): Promise<Chat> {
  return db.chat.create({ data: values });
}

export async function updateChatById(
  chatId: number,
  updates: UpdateChatInput,
): Promise<Chat | null> {
  return db.chat.update({
    where: { id: chatId },
    data: updates,
  });
}

export async function deleteChatById(chatId: number): Promise<Chat | null> {
  return db.chat.delete({
    where: { id: chatId },
  });
}
