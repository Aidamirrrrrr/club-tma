import { NextResponse } from "next/server";
import { LOYALTY_STATUSES } from "@/constants/domain";
import { isRateLimited } from "@/lib/rate-limit";
import {
  sanitizeRequiredText,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/sanitize";
import { isOneOf } from "@/lib/validation-rules";
import { requireAdmin, requireAuth } from "@/server/auth/telegram";
import {
  createLoyaltyOfferRecord,
  listLoyaltyOffers,
} from "@/server/queries/loyalty";
import { serializeLoyaltyOffer } from "@/server/serializers/loyalty";

/** GET /api/loyalty — список карточек лояльности (скрытые видит только админ). */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`loyalty:list:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const offers = await listLoyaltyOffers({
      includeHidden: auth.user.role === "admin",
    });

    return NextResponse.json(offers.map(serializeLoyaltyOffer));
  } catch (error) {
    console.error("Loyalty fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/loyalty — создание карточки (только админ). */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`loyalty-create:${auth.user.id}`, 20, 3600_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();

    const title = sanitizeRequiredText(body.title, 200);
    if (!title) {
      return NextResponse.json(
        { error: "Title is required (max 200 chars)" },
        { status: 400 },
      );
    }

    const status =
      body.status && isOneOf(body.status, LOYALTY_STATUSES)
        ? body.status
        : "active";

    const offer = await createLoyaltyOfferRecord({
      title,
      discountLabel: sanitizeText(body.discountLabel, 50) || "",
      coverUrl: sanitizeUrl(body.coverUrl) || undefined,
      logoUrl: sanitizeUrl(body.logoUrl) || undefined,
      qrUrl: sanitizeUrl(body.qrUrl) || undefined,
      status,
      createdBy: auth.user.id,
    });

    return NextResponse.json(serializeLoyaltyOffer(offer), { status: 201 });
  } catch (error) {
    console.error("Loyalty create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
