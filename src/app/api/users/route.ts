import { and, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/telegram";
import { escapeLikePattern } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const rawSearch = searchParams.get("search") || "";
    const search = escapeLikePattern(rawSearch).slice(0, 200);
    const role = searchParams.get("role") || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.username, `%${search}%`),
        ),
      );
    }

    if (role === "admin") {
      conditions.push(eq(users.role, "admin"));
    }

    // Always exclude blocked users from the list
    conditions.push(eq(users.blocked, false));

    const where =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    const result = await db.query.users.findMany({
      where,
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        bio: true,
        instagram: true,
        telegram: true,
        phone: true,
        role: true,
        profileGradient: true,
        createdAt: true,
      },
      orderBy: (users, { asc }) => [asc(users.firstName)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
