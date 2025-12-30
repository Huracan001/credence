import { detectBeliefShifts } from "@/lib/beliefShiftEngine";
import { getFromCache, setCache } from "@/lib/cache";
import { fetchPolymarketMarkets } from "@/lib/providers/polymarket";
import { listBeliefShifts, getMarkets } from "@/lib/persistence/store";
import { MarketsResponse, Market } from "@/types";

const CACHE_KEY = "markets-latest";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function refreshMarkets(): Promise<MarketsResponse> {
  const data = await fetchPolymarketMarkets();
  const shifts = await detectBeliefShifts(data);

  const response: MarketsResponse = { markets: data, shifts };
  setCache(CACHE_KEY, response, CACHE_TTL_MS);
  return response;
}

export async function getMarketsSnapshot(): Promise<MarketsResponse> {
  const cached = getFromCache<MarketsResponse>(CACHE_KEY);
  if (cached) return cached;

  try {
    return await refreshMarkets();
  } catch (err) {
    console.error("[markets] refresh failed, using persisted data", err);
    const markets = await getMarkets();
    const shifts = await listBeliefShifts(10);
    const fallback: MarketsResponse = { markets, shifts };
    setCache(CACHE_KEY, fallback, CACHE_TTL_MS);
    return fallback;
  }
}

export async function getMarketSnapshotById(id: string): Promise<Market | null> {
  const snapshot = await getMarketsSnapshot();
  const found = snapshot.markets.find((m) => m.id === id);
  if (found) return found;

  // Fallback: force refresh once if not present (handles new markets / cache misses)
  try {
    const fresh = await refreshMarkets();
    return fresh.markets.find((m) => m.id === id) ?? null;
  } catch {
    return null;
  }
}

