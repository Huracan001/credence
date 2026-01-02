import { BeliefShift, Market } from "@/types";
import { getMarkets, listBeliefShiftsSince } from "./persistence/store";

export type HeatmapCell = {
  category: string;
  bucketStart: string; // ISO
  intensity: number; // normalized 0-1
  rawIntensity: number;
  topMarketId?: string;
  topMarketQuestion?: string;
  topDelta?: number;
};

export type BeliefShiftHeatmap = {
  bucketSizeMs: number;
  buckets: string[]; // ISO bucket starts
  categories: string[];
  matrix: number[][]; // [categoryIndex][bucketIndex] normalized intensities
  cells: HeatmapCell[];
};

type BuildOptions = {
  bucketMs?: number;
  lookbackHours?: number;
  since?: string;
};

function classifyCategory(shift: BeliefShift, market?: Market): string {
  if (shift.category) return shift.category;
  if (market?.assetId) return `asset:${market.assetId}`;
  return "general";
}

function buildBucketRange(bucketMs: number, lookbackMs: number): string[] {
  const buckets: string[] = [];
  const now = Date.now();
  const start = now - lookbackMs;
  let cursor = Math.floor(start / bucketMs) * bucketMs;
  const end = Math.floor(now / bucketMs) * bucketMs;
  while (cursor <= end) {
    buckets.push(new Date(cursor).toISOString());
    cursor += bucketMs;
  }
  return buckets;
}

function bucketForTimestamp(timestamp: string, bucketMs: number): string {
  const ms = new Date(timestamp).getTime();
  const bucketStart = Math.floor(ms / bucketMs) * bucketMs;
  return new Date(bucketStart).toISOString();
}

function computeRawIntensity(shift: BeliefShift, market?: Market): number {
  const liquidity = shift.liquidity ?? market?.volume ?? 0;
  const volume24h = shift.volume24h ?? market?.volume24h ?? market?.volume ?? 0;
  const delta = Math.abs(shift.delta);
  return delta * Math.log10(1 + liquidity) * Math.log10(1 + volume24h);
}

export async function buildBeliefShiftHeatmap(options: BuildOptions = {}): Promise<BeliefShiftHeatmap> {
  const bucketMs = options.bucketMs ?? 60 * 60 * 1000; // default 1h
  const lookbackHours = options.lookbackHours ?? 24;
  const lookbackMs = lookbackHours * 60 * 60 * 1000;
  const sinceIso =
    options.since ??
    new Date(Date.now() - lookbackMs - bucketMs).toISOString(); // include one bucket before window

  const [shifts, markets] = await Promise.all([
    listBeliefShiftsSince(sinceIso, 2000),
    getMarkets(),
  ]);
  const marketMap = new Map<string, Market>();
  markets.forEach((m) => marketMap.set(m.id, m));

  const buckets = buildBucketRange(bucketMs, lookbackMs);
  const bucketIndex = new Map<string, number>();
  buckets.forEach((b, idx) => bucketIndex.set(b, idx));

  const categorySet = new Set<string>();
  type CellAgg = {
    rawIntensity: number;
    topMarketId?: string;
    topMarketQuestion?: string;
    topDelta?: number;
  topMarketIntensity?: number;
  };
  const agg: Record<string, CellAgg[]> = {};

  // Pre-initialize buckets to ensure graceful empty rendering.
  const ensureCategory = (category: string) => {
    if (!agg[category]) {
      agg[category] = buckets.map(() => ({
        rawIntensity: 0,
        topMarketId: undefined,
        topMarketQuestion: undefined,
        topDelta: undefined,
      }));
    }
  };

  for (const shift of shifts) {
    const market = marketMap.get(shift.marketId);
    const category = classifyCategory(shift, market);
    categorySet.add(category);
    ensureCategory(category);

    const bucket = bucketForTimestamp(shift.detectedAt, bucketMs);
    const idx = bucketIndex.get(bucket);
    if (idx === undefined) continue; // outside window

    const rawIntensity = computeRawIntensity(shift, market);
    const cell = agg[category][idx];
    cell.rawIntensity += rawIntensity;
    const currentTop = cell.topMarketIntensity ?? -1;
    if (!cell.topMarketId || rawIntensity > currentTop) {
      cell.topMarketId = shift.marketId;
      cell.topMarketQuestion = market?.question;
      cell.topDelta = shift.delta;
      cell.topMarketIntensity = rawIntensity;
    }
  }

  const categories = Array.from(categorySet).sort();
  const matrix: number[][] = [];
  const cells: HeatmapCell[] = [];

  for (const category of categories) {
    ensureCategory(category);
    const row = agg[category];
    const maxRaw = row.reduce((max, c) => Math.max(max, c.rawIntensity), 0);
    const normalizedRow = row.map((c, bucketIdx) => {
      const intensity = maxRaw > 0 ? c.rawIntensity / maxRaw : 0;
      cells.push({
        category,
        bucketStart: buckets[bucketIdx],
        intensity,
        rawIntensity: c.rawIntensity,
        topMarketId: c.topMarketId,
        topMarketQuestion: c.topMarketQuestion,
        topDelta: c.topDelta,
      });
      return intensity;
    });
    matrix.push(normalizedRow);
  }

  return {
    bucketSizeMs: bucketMs,
    buckets,
    categories,
    matrix,
    cells,
  };
}
