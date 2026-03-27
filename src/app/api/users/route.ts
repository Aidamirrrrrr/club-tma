import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { escapeLikePattern } from "@/lib/sanitize";
import { requireAdmin, requireAuth } from "@/server/auth/telegram";
import { listUsers } from "@/server/queries/users";
import { serializeUserListItem } from "@/server/serializers/users";

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
    const role = searchParams.get("role") === "admin" ? "admin" : "";

    const blocked = searchParams.get("blocked");
    if (blocked === "true") {
      const adminAuth = await requireAdmin(request);
      if (adminAuth.error) return adminAuth.error;
    }

    const result = await listUsers({
      search,
      role,
      includeBlocked: blocked === "true",
    });

    return NextResponse.json(result.map(serializeUserListItem));
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
