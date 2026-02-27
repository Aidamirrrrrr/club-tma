import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { Event, User } from "@/db/schema";
import { registrations, users } from "@/db/schema";

const BOT_TOKEN = process.env.BOT_TOKEN;

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.log(`[notify skip] No BOT_TOKEN. chatId=${chatId} text=${text}`);
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`[notify error] ${err}`);
    }
  } catch (error) {
    console.error("[notify error]", error);
  }
}

/** Notify admins about a new event */
export async function notifyNewEvent(event: Event) {
  const admins = await db.query.users.findMany({
    where: eq(users.role, "admin"),
  });

  const msg =
    `🎉 <b>Новое мероприятие</b>\n\n` +
    `<b>${event.title}</b>\n` +
    `📅 ${event.date}${event.time ? ` в ${event.time}` : ""}\n` +
    `📍 ${event.location || "Не указано"}\n` +
    (event.maxParticipants
      ? `👥 Макс. участников: ${event.maxParticipants}\n`
      : "");

  await Promise.allSettled(
    admins
      .filter((a) => a.telegramId)
      .map((a) => sendTelegramMessage(a.telegramId, msg)),
  );
}

/** Notify user about successful registration */
export async function notifyRegistration(user: User, event: Event) {
  const msg =
    `✅ <b>Вы зарегистрированы!</b>\n\n` +
    `<b>${event.title}</b>\n` +
    `📅 ${event.date}${event.time ? ` в ${event.time}` : ""}\n` +
    `📍 ${event.location || "Не указано"}`;

  await sendTelegramMessage(user.telegramId, msg);
}

/** Notify all registered users about event status change */
export async function notifyEventStatusChange(event: Event, newStatus: string) {
  const regs = await db.query.registrations.findMany({
    where: eq(registrations.eventId, event.id),
    with: { user: true },
  });

  const statusLabels: Record<string, string> = {
    open: "открыто",
    closed: "закрыто",
    cancelled: "отменено",
    completed: "завершено",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  const msg =
    `📢 <b>Статус мероприятия изменён</b>\n\n` +
    `<b>${event.title}</b>\n` +
    `Новый статус: <b>${statusLabel}</b>`;

  await Promise.allSettled(
    regs
      .filter((r) => r.user?.telegramId)
      .map((r) => sendTelegramMessage(r.user?.telegramId, msg)),
  );
}
