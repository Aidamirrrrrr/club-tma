import { NextResponse } from "next/server";
import { LOYALTY_STATUSES } from "@/constants/domain";
import { isRateLimited } from "@/lib/rate-limit";
import {
  sanitizeRequiredText,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/sanitize";
import { isOneOf, parseId } from "@/lib/validation-rules";
import { requireAdmin } from "@/server/auth/telegram";
import {
  deleteLoyaltyOfferById,
  getLoyaltyOfferById,
  type UpdateLoyaltyOfferInput,
  updateLoyaltyOfferById,
} from "@/server/queries/loyalty";
import { serializeLoyaltyOffer } from "@/server/serializers/loyalty";

/** GET /api/loyalty/:id — карточка для префилла формы редактирования (только админ). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`loyalty:get:${auth.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const offerId = parseId(id);
    if (Number.isNaN(offerId)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 });
    }

    const offer = await getLoyaltyOfferById(offerId);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json(serializeLoyaltyOffer(offer));
  } catch (error) {
    console.error("Loyalty fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** PATCH /api/loyalty/:id — обновление карточки (только админ). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`loyalty:update:${auth.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const offerId = parseId(id);
    if (Number.isNaN(offerId)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 });
    }

    const body = await request.json();

    const updates: UpdateLoyaltyOfferInput = {};

    if ("title" in body) {
      const title = sanitizeRequiredText(body.title, 200);
      if (!title) {
        return NextResponse.json(
          { error: "Title cannot be empty (max 200 chars)" },
          { status: 400 },
        );
      }
      updates.title = title;
    }
    if ("discountLabel" in body) {
      updates.discountLabel = sanitizeText(body.discountLabel, 50) || "";
    }
    if ("coverUrl" in body) {
      updates.coverUrl = sanitizeUrl(body.coverUrl);
    }
    if ("logoUrl" in body) {
      updates.logoUrl = sanitizeUrl(body.logoUrl);
    }
    if ("qrUrl" in body) {
      updates.qrUrl = sanitizeUrl(body.qrUrl);
    }
    if ("status" in body) {
      if (!isOneOf(body.status, LOYALTY_STATUSES)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updated = await updateLoyaltyOfferById(offerId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json(serializeLoyaltyOffer(updated));
  } catch (error) {
    console.error("Loyalty update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/loyalty/:id — удаление карточки (только админ). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    if (isRateLimited(`loyalty:delete:${auth.user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const offerId = parseId(id);
    if (Number.isNaN(offerId)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 });
    }

    const deleted = await deleteLoyaltyOfferById(offerId);
    if (!deleted) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Loyalty delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
