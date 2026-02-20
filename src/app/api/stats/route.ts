import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, users, registrations } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const totalUsers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);
    const totalEvents = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(events);
    const completedEvents = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(events)
      .where(sql`${events.status} = 'completed'`);
    const totalRegistrations = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(registrations);

    return NextResponse.json({
      totalUsers: totalUsers[0].count,
      totalEvents: totalEvents[0].count,
      completedEvents: completedEvents[0].count,
      totalRegistrations: totalRegistrations[0].count,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
