import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, registrations, users } from "@/db/schema";
import { requireAuth } from "@/lib/telegram";
import { isRateLimited } from "@/lib/validation";

/** GET /api/stats — общая статистика клуба. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`stats:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const [
      [totalUsers],
      [totalEvents],
      [completedEvents],
      [totalRegistrations],
    ] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(users),
      db.select({ count: sql<number>`COUNT(*)` }).from(events),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(events)
        .where(sql`${events.status} = 'completed'`),
      db.select({ count: sql<number>`COUNT(*)` }).from(registrations),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers.count,
      totalEvents: totalEvents.count,
      completedEvents: completedEvents.count,
      totalRegistrations: totalRegistrations.count,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
