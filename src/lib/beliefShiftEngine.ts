import { BeliefShift, Market } from "@/types";
import {
  getLatestBeliefShift,
  getMarketById,
  recordBeliefShift,
  upsertMarkets,
} from "./persistence/store";

const DEFAULT_THRESHOLD = 0.01; // 1 percentage point in probability space
const MIN_VOLUME_DELTA = 500; // trigger on modest absolute volume upticks

const CRYPTO_KEYWORDS = [
  "crypto",
  "cryptocurrency",
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "blockchain",
  "token",
  "stablecoin",
  "defi",
  "nft",
  "solana",
  "sol",
  "cardano",
  "ada",
  "xrp",
  "ripple",
  "doge",
  "dogecoin",
  "bnb",
  "binance",
  "tether",
  "usdt",
  "usdc",
  "usd coin",
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
  "monetary policy",
  "fiscal",
  "stimulus",
  "quantitative easing",
  "qe",
  "stock market",
  "s&p",
  "dow",
  "nasdaq",
];

const POLITICS_KEYWORDS = [
  "election",
  "president",
  "presidential",
  "congress",
  "senate",
  "house",
  "senator",
  "representative",
  "governor",
  "mayor",
  "vote",
  "voting",
  "ballot",
  "campaign",
  "candidate",
  "democrat",
  "republican",
  "party",
  "political",
  "politics",
  "policy",
  "legislation",
  "bill",
  "law",
  "supreme court",
  "scotus",
  "impeachment",
  "approval rating",
  "poll",
  "polling",
];

function classifyCategory(market: Market): string {
  const q = market.question.toLowerCase();
  
  // Check for crypto first (includes assetId detection)
  if (market.assetId) return "crypto";
  if (CRYPTO_KEYWORDS.some((keyword) => q.includes(keyword))) return "crypto";
  
  // Check for economy
  if (ECONOMY_KEYWORDS.some((keyword) => q.includes(keyword))) return "economy";
  
  // Check for politics
  if (POLITICS_KEYWORDS.some((keyword) => q.includes(keyword))) return "politics";
  
  return "general";
}

type DetectOptions = {
  threshold?: number;
};

/**
 * Stores markets, compares with last known values, and records belief shifts when thresholds are crossed.
 * Returns shifts detected in this run.
 */
export async function detectBeliefShifts(
  markets: Market[],
  options: DetectOptions = {},
): Promise<BeliefShift[]> {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const shifts: BeliefShift[] = [];

  for (const market of markets) {
    // Prefer last stored market probability; fall back to last shift.
    const storedMarket = await getMarketById(market.id);
    const latestShift = await getLatestBeliefShift(market.id);
    const previousProbability = storedMarket?.probability ?? latestShift?.currentProbability ?? null;

    // First observation: persist baseline, skip detection once.
    if (previousProbability === null) {
      await upsertMarkets([market]);
      continue;
    }

    const previousVolume = storedMarket?.volume ?? 0; // treat stored volume as last 24h snapshot
    const delta = market.probability - previousProbability;
    const absDelta = Math.abs(delta);
    const volumeSpike =
      previousVolume > 0 && market.volume - previousVolume >= MIN_VOLUME_DELTA;

    const shouldTrigger = absDelta >= threshold || volumeSpike;

    if (shouldTrigger) {
      const shift: BeliefShift = {
        marketId: market.id,
        previousProbability,
        currentProbability: market.probability,
        delta,
        category: classifyCategory(market),
        volume24h: market.volume24h ?? market.volume ?? null,
        liquidity: market.volume ?? null,
        detectedAt: new Date().toISOString(),
      };
      await recordBeliefShift(shift);
      shifts.push(shift);
    }
  }

  await upsertMarkets(markets);

  return shifts;
}

