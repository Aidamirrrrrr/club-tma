import { NextResponse } from "next/server";
import { getSiteImages } from "@/lib/site-images";
import { isPhotosAuthed } from "@/server/auth/photos";

export const dynamic = "force-dynamic";

/** GET /api/manage-photos/session — состояние сессии + текущие фото. */
export async function GET() {
  const authed = await isPhotosAuthed();
  if (!authed) {
    return NextResponse.json({ authed: false });
  }
  const images = await getSiteImages();
  return NextResponse.json({ authed: true, images });
}
