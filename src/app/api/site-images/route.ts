import { NextResponse } from "next/server";
import { getSiteImages } from "@/lib/site-images";

export const dynamic = "force-dynamic";

/** GET /api/site-images — текущие фото слотов на главной (публично). */
export async function GET() {
  try {
    const images = await getSiteImages();
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Site images error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
