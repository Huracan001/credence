import { NextRequest, NextResponse } from "next/server";
import { getMarketSnapshotById } from "@/lib/server/markets";

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

    const payload = {
      id: market.id,
      probability: market.probability,
      rawProbability: market.rawProbability,
      displayProbability: market.displayProbability,
      probabilityLabel: market.probabilityLabel,
      probabilityChange24h: market.probabilityChange24h ?? null,
      probabilityChange7d: market.probabilityChange7d ?? null,
      meaningfulMove: market.meaningfulMove ?? false,
      confidenceScore: market.confidenceScore ?? null,
      confidenceLabel: market.confidenceLabel ?? null,
      confidenceExplanation: market.confidenceExplanation ?? null,
      liquidityUsd: market.volume,
      liquidityPercentile: market.liquidityPercentile ?? null,
      liquidityLabel: market.liquidityLabel ?? null,
      updatedAt: market.updatedAt,
    };

    return NextResponse.json(
      {
        metrics: payload,
        meta: { generatedAt: new Date().toISOString() },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets/:id/metrics] failed", err);
    return NextResponse.json(
      { error: "Unable to load metrics right now." },
      { status: 503 },
    );
  }
}
