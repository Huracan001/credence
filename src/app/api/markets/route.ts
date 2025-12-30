import { NextResponse } from "next/server";
import { getMarketsSnapshot, refreshMarkets } from "@/lib/server/markets";

export const revalidate = 0; // always fresh

export async function GET() {
  try {
    const data = await getMarketsSnapshot();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[api/markets] failed", err);
    // Attempt a direct refresh fallback
    try {
      const data = await refreshMarkets();
      return NextResponse.json(data, { status: 200 });
    } catch (innerErr) {
      console.error("[api/markets] hard failure", innerErr);
      return NextResponse.json(
        { error: "Unable to load markets right now." },
        { status: 503 },
      );
    }
  }
}

