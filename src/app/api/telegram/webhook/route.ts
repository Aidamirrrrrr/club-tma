import { NextResponse } from "next/server";
import {
  getTelegramMiniAppLaunchMarkup,
  sendTelegramMessage,
} from "@/server/notifications/telegram";

interface TelegramWebhookMessage {
  chat?: { id?: number | string };
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

    const update = (await request.json()) as TelegramWebhookUpdate;
    const message = update.message;
    const chatId = message?.chat?.id;

    if (!message || !chatId || !isStartCommand(message.text)) {
      return NextResponse.json({ ok: true });
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
