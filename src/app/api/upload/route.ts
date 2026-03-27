import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, detectImageType } from "@/lib/file-validation";
import { isRateLimited } from "@/lib/rate-limit";
import { requireAuth } from "@/server/auth/telegram";

/** Маппинг MIME-типов на расширения файлов. */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** POST /api/upload — загрузка изображения (макс. 5 МБ). */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`upload:${auth.user.id}`, 30, 600_000)) {
      return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!(file.type in ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const detectedType = detectImageType(buffer);
    if (!detectedType || !(detectedType in ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json(
        { error: "File content does not match an allowed image type" },
        { status: 400 },
      );
    }

    const ext = MIME_TO_EXT[detectedType] || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
