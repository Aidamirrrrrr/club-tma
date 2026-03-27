import type { EventStatus } from "@/constants/domain";
import { db } from "@/db";
import type { Event, User } from "@/db/schema";

const BOT_TOKEN = process.env.BOT_TOKEN;

interface TelegramSendMessageOptions {
  replyMarkup?: Record<string, unknown>;
}

function getMiniAppUrl(): string | null {
  const rawUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.DOMAIN;

  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  return `https://${rawUrl}`;
}

export function getTelegramMiniAppLaunchMarkup(): Record<
  string,
  unknown
> | null {
  const miniAppUrl = getMiniAppUrl();
  if (!miniAppUrl) return null;

  return {
    inline_keyboard: [
      [
        {
          text: "Запустить приложение",
          web_app: { url: miniAppUrl },
        },
      ],
    ],
  };
}

/** Отправляет сообщение через Telegram Bot API. */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: TelegramSendMessageOptions = {},
) {
  if (!BOT_TOKEN) {
    console.log("[notify skip] No BOT_TOKEN");
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
          reply_markup: options.replyMarkup,
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

/** Уведомляет администраторов о создании нового мероприятия. */
export async function notifyNewEvent(event: Event) {
  const admins = await db.user.findMany({
    where: { role: "admin" },
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
      .filter((admin) => admin.telegramId)
      .map((admin) => sendTelegramMessage(admin.telegramId, msg)),
  );
}

/** Уведомляет пользователя об успешной регистрации на мероприятие. */
export async function notifyRegistration(user: User, event: Event) {
  const msg =
    `✅ <b>Вы зарегистрированы!</b>\n\n` +
    `<b>${event.title}</b>\n` +
    `📅 ${event.date}${event.time ? ` в ${event.time}` : ""}\n` +
    `📍 ${event.location || "Не указано"}`;

  await sendTelegramMessage(user.telegramId, msg);
}

/** Уведомляет зарегистрированных пользователей об изменении статуса мероприятия. */
export async function notifyEventStatusChange(
  event: Event,
  newStatus: EventStatus,
) {
  const regs = await db.registration.findMany({
    where: { eventId: event.id },
    include: { user: true },
  });

  const labels: Record<string, string> = {
    open: "открыто",
    closed: "закрыто",
    cancelled: "отменено",
    completed: "завершено",
  };

  const statusLabel = labels[newStatus] || newStatus;

  const msg =
    `📢 <b>Статус мероприятия изменён</b>\n\n` +
    `<b>${event.title}</b>\n` +
    `Новый статус: <b>${statusLabel}</b>`;

  await Promise.allSettled(
    regs
      .filter((registration) => registration.user?.telegramId)
      .map((registration) =>
        sendTelegramMessage(registration.user.telegramId, msg),
      ),
  );
}
