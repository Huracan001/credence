import { NextRequest, NextResponse } from "next/server";
import { getMarketsSnapshot } from "@/lib/server/markets";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const limitParam = new URL(req.url).searchParams.get("limit");
    const limit = limitParam ? Math.min(50, Math.max(1, Number(limitParam))) : 10;
    const snapshot = await getMarketsSnapshot();

    const movers = snapshot.markets
      .map((market) => ({
        ...market,
        changeMagnitude: Math.abs(
          market.probabilityChange24h ??
            market.probabilityChange7d ??
            0,
        ),
      }))
      .filter((market) => market.changeMagnitude > 0)
      .sort((a, b) => b.changeMagnitude - a.changeMagnitude)
      .slice(0, limit);

    return NextResponse.json(
      {
        markets: movers,
        meta: {
          count: movers.length,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets/top-movers] failed", err);
    return NextResponse.json(
      { error: "Unable to load top movers right now." },
      { status: 503 },
    );
  }
}
