import { NextRequest, NextResponse } from "next/server";
import { getMarketsSnapshot, refreshMarkets } from "@/lib/server/markets";
import { Market } from "@/types/market";

export const revalidate = 0; // always fresh

type Filters = ReturnType<typeof parseFilters>;

function parseFilters(req: NextRequest) {
  const url = new URL(req.url);
  const confidence = url.searchParams.get("confidence");
  const minLiquidity = url.searchParams.get("minLiquidity");
  const probMin = url.searchParams.get("probMin");
  const probMax = url.searchParams.get("probMax");

  return {
    confidence:
      confidence === "high" || confidence === "medium" || confidence === "low"
        ? confidence
        : undefined,
    minLiquidity: minLiquidity ? Number(minLiquidity) : undefined,
    probMin: probMin ? Number(probMin) : undefined,
    probMax: probMax ? Number(probMax) : undefined,
  };
}

function passesFilters(m: Market, filters: Filters) {
  if (filters.confidence && m.confidenceLabel && m.confidenceLabel !== filters.confidence) {
    return false;
  }

  if (
    filters.minLiquidity !== undefined &&
    "volume" in m &&
    typeof m.volume === "number" &&
    m.volume < filters.minLiquidity
  ) {
    return false;
  }

  const prob = m.displayProbability ?? m.probability ?? 0;
  if (filters.probMin !== undefined && prob < filters.probMin) return false;
  if (filters.probMax !== undefined && prob > filters.probMax) return false;

  return true;
}

export async function GET(req: NextRequest) {
  try {
    const filters = parseFilters(req);
    const force = new URL(req.url).searchParams.get("force") === "true";
    const data = await getMarketsSnapshot({ forceRefresh: force });
    const filtered = data.markets.filter((m: any) => passesFilters(m, filters));

    return NextResponse.json(
      {
        markets: filtered,
        shifts: data.shifts,
        meta: {
          count: filtered.length,
          generatedAt: new Date().toISOString(),
          appliedFilters: filters,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/markets] failed", err);
    // Attempt a direct refresh fallback
    try {
      const filters = parseFilters(req);
      const data = await refreshMarkets();
      const filtered = data.markets.filter((m: any) => passesFilters(m, filters));
      return NextResponse.json(
        {
          markets: filtered,
          shifts: data.shifts,
          meta: {
            count: filtered.length,
            generatedAt: new Date().toISOString(),
            appliedFilters: filters,
          },
        },
        { status: 200 },
      );
    } catch (innerErr) {
      console.error("[api/markets] hard failure", innerErr);
      return NextResponse.json(
        { error: "Unable to load markets right now." },
        { status: 503 },
      );
    }
  }
}

