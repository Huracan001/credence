import { BeliefShift, Market } from "@/types";
import {
  getLatestBeliefShift,
  getMarketById,
  recordBeliefShift,
  upsertMarkets,
} from "./persistence/store";

const DEFAULT_THRESHOLD = 0.01; // 1 percentage point in probability space
const MIN_VOLUME_DELTA = 500; // trigger on modest absolute volume upticks

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
        detectedAt: new Date().toISOString(),
      };
      await recordBeliefShift(shift);
      shifts.push(shift);
    }
  }

  await upsertMarkets(markets);

  return shifts;
}

