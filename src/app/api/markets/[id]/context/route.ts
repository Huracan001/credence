import { NextRequest, NextResponse } from "next/server";
import { getMarketSnapshotById } from "@/lib/server/markets";
import { getLatestBeliefShift } from "@/lib/persistence/store";
import { aggregateContext } from "@/lib/contextAggregator";

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const market = await getMarketSnapshotById(id);
    
    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    const shift = await getLatestBeliefShift(id);
    const enrichedContext = await aggregateContext(market, shift ?? null);

    return NextResponse.json(
      {
        context: enrichedContext,
        meta: {
          marketId: id,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets/:id/context] failed", err);
    return NextResponse.json(
      { error: "Unable to load enriched context right now." },
      { status: 503 },
    );
  }
}
