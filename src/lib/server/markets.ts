import { detectBeliefShifts } from "@/lib/beliefShiftEngine";
import { getFromCache, setCache } from "@/lib/cache";
import { fetchPolymarketMarkets } from "@/lib/providers/polymarket";
import { fetchCoinPrices } from "@/lib/providers/coingecko";
import {
  listBeliefShifts,
  getMarkets,
  getHistoricalProbability,
  listBeliefShiftsForMarket,
} from "@/lib/persistence/store";
import { MarketsResponse, Market, BeliefShift } from "@/types";
import {
  buildExplanationContext,
  clampDisplayProbability,
  computeConfidence,
  computeDeltas,
  computeLiquidityPercentiles,
  computeVolatility,
  formatLiquidityBar,
  probabilityLabel,
} from "@/lib/metrics";

const CACHE_KEY = "markets-latest";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function detectAssetId(question: string): string | null {
  const q = question.toLowerCase();
  if (q.includes("bitcoin") || q.includes("btc")) return "bitcoin";
  if (q.includes("ethereum") || q.includes("eth")) return "ethereum";
  if (q.includes("solana") || q.includes("sol")) return "solana";
  if (q.includes("tether") || q.includes("usdt")) return "tether";
  if (q.includes("usd") && q.includes("coin")) return "usd-coin";
  if (q.includes("cardano") || q.includes("ada")) return "cardano";
  if (q.includes("xrp")) return "ripple";
  if (q.includes("doge")) return "dogecoin";
  if (q.includes("bnb")) return "binancecoin";
  return null;
}

function maybeInjectDemoShift(response: MarketsResponse): MarketsResponse {
  if (process.env.DEMO_SHIFTS !== "true") return response;
  if (!response.markets.length) return response;

  const market = response.markets[0];
  const delta = market.probability >= 0.12 ? -0.12 : 0.12;
  const shift: BeliefShift = {
    marketId: market.id,
    previousProbability: Math.max(0, market.probability - delta),
    currentProbability: market.probability,
    delta,
    detectedAt: new Date().toISOString(),
  };

  return {
    ...response,
    shifts: [shift, ...(response.shifts ?? [])],
  };
}

export async function enrichMarkets(markets: Market[]): Promise<Market[]> {
  const assetIds = new Set<string>();
  markets.forEach((m) => {
    const id = detectAssetId(m.question);
    if (id) assetIds.add(id);
  });
  const coinPrices = await fetchCoinPrices(Array.from(assetIds));

  const liquidityPercentiles = computeLiquidityPercentiles(markets);

  const enriched = await Promise.all(
    markets.map(async (market) => {
      const assetId = detectAssetId(market.question);
      const priceInfo = assetId ? coinPrices[assetId] : undefined;

      const now = new Date();
      const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const cutoff7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [prior24h, prior7d, shifts7d] = await Promise.all([
        getHistoricalProbability(market.id, cutoff24h),
        getHistoricalProbability(market.id, cutoff7d),
        listBeliefShiftsForMarket(market.id, cutoff7d, 200),
      ]);

      const { delta24h, delta7d, meaningful } = computeDeltas(
        market.probability,
        prior24h,
        prior7d,
      );
      const volatility = computeVolatility(shifts7d, market.probability);
      const tradeFrequency24h = shifts7d.filter((s) => s.detectedAt >= cutoff24h).length;

      const spread =
        market.bestBid !== undefined &&
        market.bestBid !== null &&
        market.bestAsk !== undefined &&
        market.bestAsk !== null
          ? market.bestAsk - market.bestBid
          : null;

      const { score: confidenceScore, label: confidenceLabel, explanation } = computeConfidence({
        liquidity: market.volume,
        spread,
        volume24h: market.volume24h ?? null,
        volatility,
        tradeFrequency24h,
        updatedAt: market.updatedAt,
      });

      const displayProbability = clampDisplayProbability(market.probability);
      const marketLabel = probabilityLabel(displayProbability);
      const liquidityPercentile = liquidityPercentiles.get(market.id) ?? 0;
      const liquidityBar = formatLiquidityBar(liquidityPercentile);

      return {
        ...market,
        assetId,
        priceUsd: priceInfo?.priceUsd ?? null,
        priceChange24h: priceInfo?.change24h ?? null,
        displayProbability,
        probabilityLabel: marketLabel,
        confidenceScore,
        confidenceLabel,
        confidenceExplanation: explanation,
        liquidityPercentile,
        liquidityBar,
        delta24h,
        delta7d,
        meaningfulMove: meaningful,
        explanationContext: buildExplanationContext({
          market,
          probabilityChange24h: delta24h,
          liquidityPercentile,
          confidenceScore,
          timeToExpiry: null,
          tradeActivitySummary: `Recent trades: ${tradeFrequency24h} shifts in 24h; volatility ${
            volatility !== null ? (volatility * 100).toFixed(1) : "n/a"
          } pts`,
        }),
      };
    }),
  );

  return enriched;
}

export async function refreshMarkets(): Promise<MarketsResponse> {
  const data = await fetchPolymarketMarkets();
  const shifts = await detectBeliefShifts(data);
  const enriched = await enrichMarkets(data);

  const response: MarketsResponse = { markets: enriched, shifts };
  const withDemo = maybeInjectDemoShift(response);
  setCache(CACHE_KEY, withDemo, CACHE_TTL_MS);
  return withDemo;
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
    const enriched = await enrichMarkets(markets);
    const fallback: MarketsResponse = { markets: enriched, shifts };
    const withDemo = maybeInjectDemoShift(fallback);
    setCache(CACHE_KEY, withDemo, CACHE_TTL_MS);
    return withDemo;
  }
}

export async function getMarketSnapshotById(id: string): Promise<Market | null> {
  const snapshot = await getMarketsSnapshot();
  const found = snapshot.markets.find((m) => m.id === id);
  if (found) return found;

  // Fallback: force refresh once if not present (handles new markets / cache misses)
  try {
    const fresh = await refreshMarkets();
    const refreshed = fresh.markets.find((m) => m.id === id);
    if (refreshed) return refreshed;
  } catch (err) {
    console.error("[getMarketSnapshotById] refresh failed", err);
  }

  // Last resort: check persisted markets
  try {
    const persisted = await getMarkets();
    const fromDb = persisted.find((m) => m.id === id);
    if (fromDb) return fromDb;
  } catch (err) {
    console.error("[getMarketSnapshotById] persistence fallback failed", err);
  }

  // Direct fetch as a final attempt (uncached)
  try {
    const direct = await fetchPolymarketMarkets();
    const enriched = await enrichMarkets(direct);
    return enriched.find((m) => m.id === id) ?? null;
  } catch (err) {
    console.error("[getMarketSnapshotById] direct fetch failed", err);
    return null;
  }
}

