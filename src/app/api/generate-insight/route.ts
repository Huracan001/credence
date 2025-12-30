import { NextRequest, NextResponse } from "next/server";
import {
  getInsightForShift,
  getLatestBeliefShift,
  getMarketById,
  saveInsight,
} from "@/lib/persistence/store";
import { generateGuardedInsight } from "@/lib/insightGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const marketId = body?.marketId as string | undefined;
    if (!marketId) {
      return NextResponse.json({ error: "marketId is required" }, { status: 400 });
    }

    const market = await getMarketById(marketId);
    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    const shift = await getLatestBeliefShift(marketId);
    if (!shift) {
      return NextResponse.json(
        { error: "No belief shift detected yet for this market" },
        { status: 400 },
      );
    }

    const existing = await getInsightForShift(marketId, shift.detectedAt);
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const insight = await generateGuardedInsight(market, shift);
    await saveInsight(insight);
    return NextResponse.json(insight, { status: 200 });
  } catch (err) {
    console.error("[api/generate-insight] failed", err);
    return NextResponse.json(
      { error: "Unable to generate insight right now." },
      { status: 500 },
    );
  }
}


