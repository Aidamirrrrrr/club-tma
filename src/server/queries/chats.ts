import { db } from "@/db";
import type { Chat } from "@/db/schema";
import { Prisma } from "@/generated/prisma/client";

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
  try {
    return await db.chat.update({
      where: { id: chatId },
      data: updates,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}

export async function deleteChatById(chatId: number): Promise<Chat | null> {
  try {
    return await db.chat.delete({
      where: { id: chatId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
}
