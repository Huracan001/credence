import { getMarketSnapshotById } from "@/lib/server/markets";
import {
  listBeliefShiftsForMarket,
  listBeliefShiftsSince,
  getMarketById,
} from "@/lib/persistence/store";
import { Market } from "@/types";

// ElizaOS helper utilities (deterministic, no model calls)

export async function getMarketHistory(marketId: string) {
  return listBeliefShiftsForMarket(marketId, undefined, 100);
}

export async function getDerivedMetrics(marketId: string): Promise<Market | null> {
  return getMarketSnapshotById(marketId);
}

export async function getLiquidityMetrics(marketId: string) {
  const market = await getMarketSnapshotById(marketId);
  if (!market) return null;
  return {
    liquidityUsd: market.volume,
    liquidityPercentile: market.liquidityPercentile ?? null,
    liquidityLabel: market.liquidityLabel ?? null,
  };
}

export async function getRelatedMarkets(marketId: string) {
  // Placeholder for future similarity lookup; deterministic empty list keeps behavior safe.
  const market = await getMarketById(marketId);
  if (!market) return [];
  const related = await listBeliefShiftsSince(undefined, 5);
  return related.filter((shift) => shift.marketId !== market.id).map((shift) => shift.marketId);
}

export async function getRelevantNews(_marketId: string) {
  // Optional hook for curated news; left empty to avoid speculation without a vetted source.
  return [];
}
