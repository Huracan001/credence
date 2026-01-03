import { NextRequest, NextResponse } from "next/server";
import { getMarketSnapshotById } from "@/lib/server/markets";
import { getLatestBeliefShift } from "@/lib/persistence/store";
import { generateGuardedInsight } from "@/lib/insightGenerator";

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

    const latestShift = await getLatestBeliefShift(market.id);
    const result = await generateGuardedInsight(market, latestShift ?? null);

    if (!result.insight) {
      return NextResponse.json(
        {
          refusal:
            result.refusal ??
            market.explanationRefusal ??
            "This market has insufficient liquidity or activity to support a reliable explanation.",
          context: result.context,
          cached: result.cached,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        explanation: result.insight,
        context: result.context,
        cached: result.cached,
        meta: { generatedAt: new Date().toISOString() },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets/:id/explanation] failed", err);
    return NextResponse.json(
      { error: "Unable to load explanation right now." },
      { status: 503 },
    );
  }
}
