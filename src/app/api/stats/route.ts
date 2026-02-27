import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, registrations, users } from "@/db/schema";
import { requireAuth } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

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
