import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { like, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const result = await db.query.users.findMany({
      where: search
        ? or(
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`),
            like(users.username, `%${search}%`),
          )
        : undefined,
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
