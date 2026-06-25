import type { EventStatus } from "@/constants/domain";
import { db } from "@/db";
import type { Event, User } from "@/db/schema";

const BOT_TOKEN = process.env.BOT_TOKEN;
// Базовый URL Telegram API. На проде в РФ указываем Cloudflare Worker-прокси
// (api.telegram.org доступен не из всех сетей), по умолчанию — прямой адрес.
const TELEGRAM_API_BASE =
  process.env.TELEGRAM_API_BASE || "https://api.telegram.org";

interface TelegramSendMessageOptions {
  replyMarkup?: Record<string, unknown>;
  // По умолчанию (undefined) — "HTML". Передайте null, чтобы отправить как
  // обычный текст (нужно для произвольного текста админа, где символы <, &
  // ломают HTML-разбор Telegram).
  parseMode?: "HTML" | "MarkdownV2" | null;
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

/** Отправляет сообщение через Telegram Bot API. Возвращает true при успехе. */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: TelegramSendMessageOptions = {},
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.log("[notify skip] No BOT_TOKEN");
    return false;
  }

  const parseMode =
    options.parseMode === undefined ? "HTML" : options.parseMode;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode ?? undefined,
        reply_markup: options.replyMarkup,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[notify error] ${err}`);
    }
    return res.ok;
  } catch (error) {
    console.error("[notify error]", error);
    return false;
  }
}

/** Отправляет фото (по file_id) с подписью через Telegram Bot API. */
export async function sendTelegramPhoto(
  chatId: string,
  photoFileId: string,
  caption = "",
  options: TelegramSendMessageOptions = {},
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.log("[notify skip] No BOT_TOKEN");
    return false;
  }

  const parseMode =
    options.parseMode === undefined ? "HTML" : options.parseMode;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoFileId,
        caption: caption || undefined,
        parse_mode: parseMode ?? undefined,
        reply_markup: options.replyMarkup,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[notify error] ${err}`);
    }
    return res.ok;
  } catch (error) {
    console.error("[notify error]", error);
    return false;
  }
}

/** Отвечает на callback_query (убирает «часики» на нажатой кнопке). */
export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(
      `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
      },
    );
  } catch (error) {
    console.error("[notify error]", error);
  }
}

interface BroadcastContent {
  text: string;
  photoFileId?: string;
  replyMarkup?: Record<string, unknown>;
  parseMode?: "HTML" | "MarkdownV2" | null;
}

/**
 * Отправляет одну «единицу» рассылки одному чату — фото с подписью или текст.
 * Если есть фото и текст длиннее лимита подписи (1024), шлёт фото отдельно,
 * затем текст. Используется и для превью, и для самой рассылки — поэтому
 * превью выглядит ровно так же, как получат пользователи.
 */
export async function sendBroadcastUnit(
  chatId: string,
  content: BroadcastContent,
): Promise<boolean> {
  const { text, photoFileId, replyMarkup, parseMode } = content;

  if (photoFileId) {
    if (text.length <= 1024) {
      return sendTelegramPhoto(chatId, photoFileId, text, {
        replyMarkup,
        parseMode,
      });
    }
    const okPhoto = await sendTelegramPhoto(chatId, photoFileId, "", {
      parseMode,
    });
    const okText = await sendTelegramMessage(chatId, text, {
      replyMarkup,
      parseMode,
    });
    return okPhoto && okText;
  }

  return sendTelegramMessage(chatId, text, { replyMarkup, parseMode });
}

/**
 * Рассылает сообщение (текст и/или фото) всем не заблокированным пользователям.
 * Возвращает счётчики доставки. Недоставка одному адресату (403 «бот заблокирован»,
 * 429 и т.п.) не рвёт всю рассылку. При текущем объёме (~десятки) троттлинг не нужен.
 */
export async function broadcastToUsers(
  text: string,
  options: TelegramSendMessageOptions & { photoFileId?: string } = {},
): Promise<{ sent: number; failed: number }> {
  const users = await db.user.findMany({
    where: { blocked: false },
    select: { telegramId: true },
  });

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    if (!user.telegramId) continue;
    const ok = await sendBroadcastUnit(user.telegramId, {
      text,
      photoFileId: options.photoFileId,
      replyMarkup: options.replyMarkup,
      parseMode: options.parseMode,
    });
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed };
}

/** Уведомляет всех пользователей бота о создании нового мероприятия. */
export async function notifyNewEvent(event: Event) {
  const msg =
    `🎉 <b>Новое мероприятие!</b>\n\n` +
    `<b>${event.title}</b>\n` +
    `📅 ${event.date}${event.time ? ` в ${event.time}` : ""}\n` +
    `📍 ${event.location || "Уточняется"}\n\n` +
    `Открой приложение, чтобы записаться 👇`;

  await broadcastToUsers(msg, {
    replyMarkup: getTelegramMiniAppLaunchMarkup() ?? undefined,
  });
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
