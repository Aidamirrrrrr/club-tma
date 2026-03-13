import { and, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin, requireAuth } from "@/lib/telegram";
import { escapeLikePattern, isRateLimited } from "@/lib/validation";

/** GET /api/users — список пользователей с поиском и фильтрацией. */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`users:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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

    const blocked = searchParams.get("blocked");
    if (blocked === "true") {
      const adminAuth = await requireAdmin(request);
      if (adminAuth.error) return adminAuth.error;
      conditions.push(eq(users.blocked, true));
    } else {
      conditions.push(eq(users.blocked, false));
    }

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
