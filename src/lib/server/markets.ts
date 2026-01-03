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
  computeConfidence,
  computeLiquidityPercentiles,
  computeVolatility,
  computeProbabilityChanges,
  evaluateExplanationEligibility,
  formatLiquidityBar,
  liquidityLabelForPercentile,
  normalizeProbability,
} from "@/lib/metrics";

const CACHE_KEY = "markets-latest";
const CACHE_TTL_MS = 60 * 1000; // 1 minute

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

const CRYPTO_KEYWORDS = [
  "crypto",
  "blockchain",
  "token",
  "stablecoin",
  "defi",
  "etf",
];

const ECONOMY_KEYWORDS = [
  "inflation",
  "cpi",
  "gdp",
  "economy",
  "economic",
  "recession",
  "interest rate",
  "rates",
  "federal reserve",
  "fed",
  "jobs report",
  "employment",
  "unemployment",
  "treasury",
  "yield",
];

function isCryptoOrEconomyTopic(question: string, assetId?: string | null): boolean {
  const q = question.toLowerCase();
  const hasAssetId = Boolean(assetId ?? detectAssetId(question));
  const hasCryptoKeyword = CRYPTO_KEYWORDS.some((keyword) => q.includes(keyword));
  const hasEconomyKeyword = ECONOMY_KEYWORDS.some((keyword) => q.includes(keyword));
  return hasAssetId || hasCryptoKeyword || hasEconomyKeyword;
}

function prioritizeMarkets(markets: Market[]): Market[] {
  return [...markets].sort((a, b) => {
    const aPriority = isCryptoOrEconomyTopic(a.question, a.assetId);
    const bPriority = isCryptoOrEconomyTopic(b.question, b.assetId);
    if (aPriority === bPriority) return 0;
    return aPriority ? -1 : 1;
  });
}

function prioritizeShifts(shifts: BeliefShift[], markets: Market[]): BeliefShift[] {
  const priorityByMarketId = new Map<string, boolean>();
  markets.forEach((market) =>
    priorityByMarketId.set(market.id, isCryptoOrEconomyTopic(market.question, market.assetId)),
  );

  return [...shifts].sort((a, b) => {
    const aPriority = priorityByMarketId.get(a.marketId) ?? false;
    const bPriority = priorityByMarketId.get(b.marketId) ?? false;
    if (aPriority === bPriority) return 0;
    return aPriority ? -1 : 1;
  });
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
      const normalizedProb = normalizeProbability(market.rawProbability ?? market.probability);
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

      const { probabilityChange24h, probabilityChange7d, meaningfulMove } = computeProbabilityChanges(
        normalizedProb.rawProbability,
        prior24h,
        prior7d,
      );
      const volatility = computeVolatility(shifts7d, market.probability);
      const tradeFrequency24h = shifts7d.filter((s) => s.detectedAt >= cutoff24h).length;
      const lastShiftAt = shifts7d[0]?.detectedAt ?? market.updatedAt;

      const spread =
        market.bestBid !== undefined &&
        market.bestBid !== null &&
        market.bestAsk !== undefined &&
        market.bestAsk !== null
          ? market.bestAsk - market.bestBid
          : null;

      const {
        score: confidenceScore,
        label: confidenceLabel,
        explanation,
        breakdown: confidenceBreakdown,
      } = computeConfidence({
        liquidity: market.volume,
        spread,
        volume24h: market.volume24h ?? null,
        volatility,
        tradeFrequency24h,
        updatedAt: market.updatedAt,
        lastTradeAt: lastShiftAt,
      });

      const displayProbability = normalizedProb.displayProbability;
      const marketLabel = normalizedProb.probabilityLabel;
      const liquidityPercentile = liquidityPercentiles.get(market.id) ?? 0;
      const liquidityLabel = liquidityLabelForPercentile(liquidityPercentile);
      const liquidityBar = formatLiquidityBar(liquidityPercentile);
      const tradeActivitySummary = `Trades flagged in 24h: ${tradeFrequency24h}; volatility ${
        volatility !== null ? (volatility * 100).toFixed(1) : "n/a"
      } pts`;
      const stale =
        Number.isFinite(new Date(market.updatedAt).getTime()) &&
        new Date(market.updatedAt).getTime() < now.getTime() - 3 * 24 * 60 * 60 * 1000;
      const eligibility = evaluateExplanationEligibility({
        confidenceScore,
        liquidity: market.volume,
        recentActivity: tradeFrequency24h > 0 || meaningfulMove,
        stale,
      });

      const enrichedMarket: Market = {
        ...market,
        rawProbability: normalizedProb.rawProbability,
        probability: normalizedProb.rawProbability,
        assetId,
        priceUsd: priceInfo?.priceUsd ?? null,
        priceChange24h: priceInfo?.change24h ?? null,
        displayProbability,
        probabilityLabel: marketLabel,
        confidenceScore,
        confidenceLabel,
        confidenceExplanation: explanation,
        confidenceBreakdown,
        liquidityLabel,
        liquidityPercentile,
        liquidityBar,
        probabilityChange24h,
        probabilityChange7d,
        meaningfulMove,
        tradeActivitySummary,
        explanationEligible: eligibility.eligible,
        explanationRefusal: eligibility.reason,
      };

      const withContext: Market = {
        ...enrichedMarket,
        explanationContext: buildExplanationContext({
          market: enrichedMarket,
          probabilityChange24h,
          probabilityChange7d,
          liquidityPercentile,
          confidenceScore,
          confidenceLabel,
          timeToExpiry: null,
          tradeActivitySummary,
        }),
      };

      return withContext;
    }),
  );

  return enriched;
}

export async function refreshMarkets(): Promise<MarketsResponse> {
  let data: Market[] = [];
  try {
    data = await fetchPolymarketMarkets();
  } catch (err) {
    console.error("[refreshMarkets] polymarket fetch failed", err);
    throw err;
  }
  const shifts = await detectBeliefShifts(data);
  const enriched = await enrichMarkets(data);
  const prioritizedMarkets = prioritizeMarkets(enriched);
  const prioritizedShifts = prioritizeShifts(shifts, prioritizedMarkets);

  const response: MarketsResponse = { markets: prioritizedMarkets, shifts: prioritizedShifts };
  const withDemo = maybeInjectDemoShift(response);
  setCache(CACHE_KEY, withDemo, CACHE_TTL_MS);
  return withDemo;
}

export async function getMarketsSnapshot(options?: { forceRefresh?: boolean }): Promise<MarketsResponse> {
  if (!options?.forceRefresh) {
    const cached = getFromCache<MarketsResponse>(CACHE_KEY);
    if (cached) return cached;
  }

  try {
    return await refreshMarkets();
  } catch (err) {
    console.error("[markets] refresh failed, using persisted data", err);
    const markets = await getMarkets();
    const shifts = await listBeliefShifts(10);
    const enriched = await enrichMarkets(markets);
    const prioritizedMarkets = prioritizeMarkets(enriched);
    const prioritizedShifts = prioritizeShifts(shifts, prioritizedMarkets);
    const fallback: MarketsResponse = { markets: prioritizedMarkets, shifts: prioritizedShifts };
    const withDemo = maybeInjectDemoShift(fallback);
    setCache(CACHE_KEY, withDemo, CACHE_TTL_MS);
    return withDemo;
  }
}

export async function getMarketSnapshotById(id: string): Promise<Market | null> {
  // Try cached snapshot first
  const snapshot = await getMarketsSnapshot();
  const found = snapshot.markets.find((m) => m.id === id);
  if (found) return found;

  // Force a refresh (bypass cache) to handle cache misses
  try {
    const fresh = await refreshMarkets();
    const refreshed = fresh.markets.find((m) => m.id === id);
    if (refreshed) return refreshed;
  } catch (err) {
    console.error("[getMarketSnapshotById] refresh failed", err);
  }

  // Last resort: direct provider fetch + enrich (no cache) to avoid stale state
  try {
    const direct = await fetchPolymarketMarkets();
    const enriched = await enrichMarkets(direct);
    const live = enriched.find((m) => m.id === id);
    if (live) return live;
  } catch (err) {
    console.error("[getMarketSnapshotById] direct fetch failed", err);
  }

  // Persisted fallback if provider is unreachable
  try {
    const persisted = await getMarkets();
    return persisted.find((m) => m.id === id) ?? null;
  } catch (err) {
    console.error("[getMarketSnapshotById] persistence fallback failed", err);
    return null;
  }
}

