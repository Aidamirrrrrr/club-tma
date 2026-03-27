import { NextResponse } from "next/server";
import { db } from "@/db";
import { isRateLimited } from "@/lib/rate-limit";
import { requireAuth } from "@/server/auth/telegram";

/** GET /api/stats — общая статистика клуба. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`stats:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const [totalUsers, totalEvents, completedEvents, totalRegistrations] =
      await Promise.all([
        db.user.count(),
        db.event.count(),
        db.event.count({ where: { status: "completed" } }),
        db.registration.count(),
      ]);

    return NextResponse.json({
      totalUsers,
      totalEvents,
      completedEvents,
      totalRegistrations,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
