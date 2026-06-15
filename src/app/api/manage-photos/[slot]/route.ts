import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, detectImageType } from "@/lib/file-validation";
import { db } from "@/db";
import { isRateLimited } from "@/lib/rate-limit";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images";
import { isPhotosAuthed } from "@/server/auth/photos";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function parseSlot(raw: string): number | null {
  const slot = Number(raw);
  return SITE_IMAGE_SLOTS.includes(slot as 1 | 2 | 3) ? slot : null;
}

/** POST /api/manage-photos/[slot] — заменить фото слота (multipart, ≤5 МБ). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slot: string }> },
) {
  try {
    if (!(await isPhotosAuthed())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isRateLimited("photos-upload", 30, 600_000)) {
      return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
    }

    const slot = parseSlot((await params).slot);
    if (slot === null) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!(file.type in ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = detectImageType(buffer);
    if (!detectedType || !(detectedType in ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json(
        { error: "File content does not match an allowed image type" },
        { status: 400 },
      );
    }

    const ext = MIME_TO_EXT[detectedType] || ".jpg";
    const filename = `slot-${slot}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    await db.siteImage.upsert({
      where: { slot },
      create: { slot, url },
      update: { url },
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("Replace photo error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/** DELETE /api/manage-photos/[slot] — убрать фото слота (url = null). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slot: string }> },
) {
  try {
    if (!(await isPhotosAuthed())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slot = parseSlot((await params).slot);
    if (slot === null) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    await db.siteImage.upsert({
      where: { slot },
      create: { slot, url: null },
      update: { url: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
