import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  type BroadcastUpdate,
  handleBroadcastUpdate,
} from "@/server/notifications/broadcast";
import {
  getTelegramMiniAppLaunchMarkup,
  sendTelegramMessage,
} from "@/server/notifications/telegram";

interface TelegramWebhookFrom {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramWebhookMessage {
  chat?: { id?: number | string };
  from?: TelegramWebhookFrom;
  text?: string;
}

interface TelegramWebhookUpdate {
  message?: TelegramWebhookMessage;
}

function isAuthorizedWebhookRequest(request: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;

  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

function isStartCommand(text: string | undefined): boolean {
  if (!text) return false;
  return /^\/start(?:\s|$)/.test(text.trim());
}

/** POST /api/telegram/webhook — обработка апдейтов Telegram Bot API. */
export async function POST(request: Request) {
  try {
    if (!isAuthorizedWebhookRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramWebhookUpdate &
      BroadcastUpdate;

    // Сначала пробуем обработать сценарий рассылки (/broadcast, шаги, кнопки).
    // Если он «поглотил» апдейт — дальше ничего не делаем.
    if (await handleBroadcastUpdate(update)) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message?.chat?.id;

    if (!message || !chatId || !isStartCommand(message.text)) {
      return NextResponse.json({ ok: true });
    }

    // Сохраняем пользователя, запустившего бота, чтобы он попадал в рассылки
    // (даже если ещё ни разу не открывал мини-приложение). Существующий профиль
    // не перезаписываем — пользователь мог отредактировать его в приложении.
    const from = message.from;
    if (from?.id) {
      await db.user
        .upsert({
          where: { telegramId: String(from.id) },
          update: {},
          create: {
            telegramId: String(from.id),
            firstName: from.first_name || "",
            lastName: from.last_name || "",
            username: from.username || "",
          },
        })
        .catch((error) => console.error("User upsert on /start failed:", error));
    }

    const replyMarkup = getTelegramMiniAppLaunchMarkup();
    const text = replyMarkup
      ? "Привет! Нажми на кнопку ниже, чтобы открыть мини-приложение клуба."
      : "Привет! Мини-приложение пока не настроено. Укажите APP_URL или DOMAIN на сервере.";

    await sendTelegramMessage(String(chatId), text, {
      replyMarkup: replyMarkup ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
