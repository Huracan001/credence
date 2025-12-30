import { BeliefShift, Market } from "@/types";
import {
  getLatestBeliefShift,
  getMarketById,
  recordBeliefShift,
  upsertMarkets,
} from "./persistence/store";

const DEFAULT_THRESHOLD = 0.08; // 8 percentage points in probability space

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
    // Prefer last stored market probability; fall back to last shift or current value.
    const storedMarket = await getMarketById(market.id);
    const latestShift = await getLatestBeliefShift(market.id);
    const previousProbability =
      storedMarket?.probability ?? latestShift?.currentProbability ?? market.probability;

    const previousVolume24h = storedMarket?.volume ?? 0; // treat stored volume as last 24h snapshot
    const delta = market.probability - previousProbability;
    const absDelta = Math.abs(delta);
    const volumeSpike =
      previousVolume24h > 0 ? market.volume > previousVolume24h * 2 : false;

    const shouldTrigger = absDelta >= threshold || volumeSpike;

    if (shouldTrigger) {
      const shift: BeliefShift = {
        marketId: market.id,
        previousProbability,
        currentProbability: market.probability,
        delta,
        detectedAt: new Date().toISOString(),
      };
      await recordBeliefShift(shift);
      shifts.push(shift);
    }
  }

  await upsertMarkets(markets);

  return shifts;
}

