import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizeRequiredText } from "@/lib/sanitize";
import { requireAdmin, requireAuth } from "@/server/auth/telegram";
import {
  createCommunityRequest,
  listCommunityRequests,
} from "@/server/queries/community-requests";
import {
  serializeCommunityRequest,
  serializeCommunityRequestMutation,
} from "@/server/serializers/community-requests";

/** GET /api/community-requests — список запросов (только для админов). */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`community-requests:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const rows = await listCommunityRequests();

    return NextResponse.json(rows.map(serializeCommunityRequest));
  } catch (e) {
    console.error("GET /api/community-requests error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/community-requests — отправить запрос в сообщество. */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`community-requests:create:${auth.user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const message = sanitizeRequiredText(body.message, 2000);
    if (!message) {
      return NextResponse.json(
        { error: "Сообщение обязательно" },
        { status: 400 },
      );
    }

    const row = await createCommunityRequest(auth.user.id, message);

    return NextResponse.json(serializeCommunityRequestMutation(row), {
      status: 201,
    });
  } catch (e) {
    console.error("POST /api/community-requests error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
