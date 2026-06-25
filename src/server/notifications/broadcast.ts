import { db } from "@/db";
import {
  answerTelegramCallback,
  broadcastToUsers,
  sendBroadcastUnit,
  sendTelegramMessage,
} from "@/server/notifications/telegram";

// Разговорный сценарий рассылки внутри бота (только для админов):
// /broadcast → текст → (фото или «Без фото») → превью с кнопками
// «Сделать рассылку» / «Отменить».
//
// Состояние держим в памяти процесса (Map по telegram id админа). Это сознательно:
// контейнер один, флоу разовый и админский, отдельная таблица в БД избыточна.
// Минус — при перезапуске контейнера незавершённый черновик теряется; админ
// просто заново вызывает /broadcast.

type Step = "text" | "photo" | "confirm";

interface Draft {
  step: Step;
  text: string;
  photoFileId?: string;
}

const drafts = new Map<number, Draft>();

const skipPhotoKeyboard = {
  inline_keyboard: [[{ text: "Без фото", callback_data: "bc_skip_photo" }]],
};

const confirmKeyboard = {
  inline_keyboard: [
    [{ text: "✅ Сделать рассылку", callback_data: "bc_send" }],
    [{ text: "✖️ Отменить", callback_data: "bc_cancel" }],
  ],
};

interface TgFrom {
  id?: number;
}
interface TgPhotoSize {
  file_id: string;
}
interface TgChat {
  id?: number | string;
}
interface TgMessage {
  chat?: TgChat;
  from?: TgFrom;
  text?: string;
  photo?: TgPhotoSize[];
}
interface TgCallbackQuery {
  id: string;
  data?: string;
  from?: TgFrom;
  message?: { chat?: TgChat };
}
export interface BroadcastUpdate {
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

async function isAdminTelegram(telegramId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { telegramId },
    select: { role: true },
  });
  return user?.role === "admin";
}

/** Шлёт превью рассылки (как увидят пользователи) с кнопками подтверждения. */
async function sendPreview(chatId: string, draft: Draft): Promise<void> {
  await sendTelegramMessage(
    chatId,
    "👇 Так будет выглядеть рассылка. Проверьте и подтвердите:",
  );
  await sendBroadcastUnit(chatId, {
    text: draft.text,
    photoFileId: draft.photoFileId,
    parseMode: null,
    replyMarkup: confirmKeyboard,
  });
}

async function handleCallback(cq: TgCallbackQuery): Promise<boolean> {
  const data = cq.data;
  if (!data || !data.startsWith("bc_")) return false;

  const adminId = cq.from?.id;
  if (!adminId) {
    await answerTelegramCallback(cq.id);
    return true;
  }
  const chatId = String(cq.message?.chat?.id ?? adminId);
  const draft = drafts.get(adminId);

  if (!draft) {
    await answerTelegramCallback(cq.id, "Сессия истекла. Начните заново: /broadcast");
    return true;
  }

  if (data === "bc_skip_photo") {
    if (draft.step !== "photo") {
      await answerTelegramCallback(cq.id);
      return true;
    }
    draft.step = "confirm";
    await answerTelegramCallback(cq.id, "Без фото");
    await sendPreview(chatId, draft);
    return true;
  }

  if (data === "bc_cancel") {
    drafts.delete(adminId);
    await answerTelegramCallback(cq.id, "Отменено");
    await sendTelegramMessage(
      chatId,
      "Рассылка отменена. Вы вышли из режима рассылки.",
    );
    return true;
  }

  if (data === "bc_send") {
    if (draft.step !== "confirm") {
      await answerTelegramCallback(cq.id);
      return true;
    }
    // Сбрасываем состояние сразу, чтобы повторное нажатие не запустило вторую рассылку.
    drafts.delete(adminId);
    await answerTelegramCallback(cq.id, "Отправляю…");
    await sendTelegramMessage(chatId, "⏳ Отправляю рассылку…");
    const { sent, failed } = await broadcastToUsers(draft.text, {
      photoFileId: draft.photoFileId,
      parseMode: null,
    });
    await sendTelegramMessage(
      chatId,
      `✅ Рассылка завершена.\nОтправлено: ${sent}\nНе доставлено: ${failed}`,
    );
    return true;
  }

  await answerTelegramCallback(cq.id);
  return true;
}

/**
 * Обрабатывает апдейт, если он относится к сценарию рассылки.
 * Возвращает true, если апдейт «поглощён» (тогда вебхук дальше ничего не делает),
 * иначе false (апдейт уходит в обычную обработку — например, /start).
 */
export async function handleBroadcastUpdate(
  update: BroadcastUpdate,
): Promise<boolean> {
  if (update.callback_query) {
    return handleCallback(update.callback_query);
  }

  const msg = update.message;
  const adminId = msg?.from?.id;
  if (!msg || !adminId) return false;

  const chatId = String(msg.chat?.id ?? adminId);
  const text = msg.text?.trim();
  const photo = msg.photo;

  // Старт сценария: /broadcast (поддерживаем и /broadcast@botname)
  if (text && /^\/broadcast(@\w+)?(\s|$)/.test(text)) {
    if (!(await isAdminTelegram(String(adminId)))) {
      // Не админ — молча игнорируем (команда не для него).
      return true;
    }
    drafts.set(adminId, { step: "text", text: "" });
    await sendTelegramMessage(
      chatId,
      "📢 Режим рассылки.\n\nПришлите текст рассылки одним сообщением.\n\n/cancel — выйти.",
    );
    return true;
  }

  const draft = drafts.get(adminId);
  if (!draft) return false; // не в сценарии → обычная обработка

  if (text === "/cancel") {
    drafts.delete(adminId);
    await sendTelegramMessage(chatId, "Рассылка отменена.");
    return true;
  }

  if (draft.step === "text") {
    if (!text) {
      await sendTelegramMessage(chatId, "Пришлите текст рассылки сообщением.");
      return true;
    }
    draft.text = text;
    draft.step = "photo";
    await sendTelegramMessage(
      chatId,
      "Хотите прикрепить фото? Пришлите изображение или нажмите «Без фото».",
      { replyMarkup: skipPhotoKeyboard },
    );
    return true;
  }

  if (draft.step === "photo") {
    if (photo && photo.length > 0) {
      // Берём самый крупный размер.
      draft.photoFileId = photo[photo.length - 1].file_id;
      draft.step = "confirm";
      await sendPreview(chatId, draft);
      return true;
    }
    await sendTelegramMessage(
      chatId,
      "Пришлите фото или нажмите «Без фото».",
      { replyMarkup: skipPhotoKeyboard },
    );
    return true;
  }

  // draft.step === "confirm"
  await sendTelegramMessage(
    chatId,
    "Используйте кнопки под превью: «Сделать рассылку» или «Отменить».",
  );
  return true;
}
