import { BeliefShift, ExplanationContext, Market } from "@/types";

type ConfidenceInputs = {
  liquidity: number;
  spread?: number | null;
  volume24h?: number | null;
  volatility?: number | null;
  tradeFrequency24h?: number | null;
  updatedAt?: string | null;
  lastTradeAt?: string | null;
};

type ConfidenceBreakdown = {
  liquidityScore: number;
  tradeActivityScore: number;
  priceStabilityScore: number;
  spreadScore: number;
  recencyScore: number;
};

const MIN_DISPLAY_PROB = 0.01;
const MAX_DISPLAY_PROB = 0.99;
const MEANINGFUL_MOVE_THRESHOLD = 0.02; // 2 percentage points

export function clampDisplayProbability(raw: number): number {
  const clamped = Math.min(Math.max(raw, MIN_DISPLAY_PROB), MAX_DISPLAY_PROB);
  return clamped;
}

export function normalizeProbability(rawPrice: number) {
  // Keep internal precision but bound to [0,1] to avoid invalid values.
  const rawProbability = Math.max(0, Math.min(1, rawPrice));
  const displayProbability = clampDisplayProbability(rawProbability);
  return { rawProbability, displayProbability, probabilityLabel: probabilityLabel(displayProbability) };
}

export function probabilityLabel(prob: number): string {
  if (prob >= 0.9) return "Very likely";
  if (prob >= 0.7) return "Likely";
  if (prob >= 0.55) return "More likely than not";
  if (prob >= 0.45) return "Balanced";
  if (prob >= 0.3) return "Unlikely";
  return "Very unlikely";
}

function scoreLiquidity(liquidity: number): number {
  if (!liquidity || liquidity <= 0) return 0;
  const scaled = Math.log10(liquidity + 1); // diminishing returns
  // Normalize to 0-1 assuming ~$10M+ is "deep"
  return Math.min(1, scaled / 7);
}

function scoreSpread(spread?: number | null): number {
  if (spread === null || spread === undefined) return 0.6; // neutral when unknown
  if (spread <= 0.005) return 1;
  if (spread <= 0.01) return 0.85;
  if (spread <= 0.02) return 0.7;
  if (spread <= 0.05) return 0.5;
  return 0.35;
}

function scoreVolatility(volatility?: number | null): number {
  if (volatility === null || volatility === undefined) return 0.6;
  if (volatility <= 0.01) return 1;
  if (volatility <= 0.03) return 0.8;
  if (volatility <= 0.05) return 0.6;
  if (volatility <= 0.1) return 0.45;
  return 0.3;
}

function scoreTradeFrequency(freq?: number | null): number {
  if (!freq || freq <= 0) return 0.35;
  if (freq >= 20) return 0.95;
  if (freq >= 10) return 0.85;
  if (freq >= 5) return 0.75;
  if (freq >= 2) return 0.65;
  return 0.5;
}

function scoreRecency(updatedAt?: string | null, lastTradeAt?: string | null): number {
  const recentTimestamp = lastTradeAt ?? updatedAt;
  if (!recentTimestamp) return 0.4;
  const ageMs = Date.now() - new Date(recentTimestamp).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (ageMs <= oneDayMs) return 1;
  if (ageMs <= 3 * oneDayMs) return 0.8;
  if (ageMs <= 7 * oneDayMs) return 0.65;
  return 0.4;
}

export function computeConfidence(
  inputs: ConfidenceInputs,
): { score: number; label: "low" | "medium" | "high"; explanation: string; breakdown: ConfidenceBreakdown } {
  const liquidityScore = scoreLiquidity(inputs.liquidity);
  const spreadScore = scoreSpread(inputs.spread);
  const activityScore = Math.max(
    0,
    Math.min(1, scoreLiquidity(inputs.volume24h ?? 0) * 0.75 + scoreTradeFrequency(inputs.tradeFrequency24h) * 0.25),
  );
  const stabilityScore = scoreVolatility(inputs.volatility);
  const recencyScore = scoreRecency(inputs.updatedAt, inputs.lastTradeAt);

  const weighted =
    liquidityScore * 0.35 +
    activityScore * 0.2 +
    stabilityScore * 0.2 +
    spreadScore * 0.15 +
    recencyScore * 0.1;

  const score = Math.round(Math.max(0, Math.min(100, weighted * 100)));
  const label = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const breakdown: ConfidenceBreakdown = {
    liquidityScore: Math.round(liquidityScore * 100),
    tradeActivityScore: Math.round(activityScore * 100),
    priceStabilityScore: Math.round(stabilityScore * 100),
    spreadScore: Math.round(spreadScore * 100),
    recencyScore: Math.round(recencyScore * 100),
  };
  const explanation = [
    `Liquidity ${breakdown.liquidityScore}`,
    `Activity ${breakdown.tradeActivityScore}`,
    `Stability ${breakdown.priceStabilityScore}`,
    `Spread/noise ${breakdown.spreadScore}`,
    `Recency ${breakdown.recencyScore}`,
  ].join(" • ");

  return { score, label, explanation, breakdown };
}

export function computeLiquidityPercentiles(markets: Market[]): Map<string, number> {
  const volumes = markets.map((m) => m.volume).filter((v) => v !== undefined && v !== null);
  if (!volumes.length) return new Map();
  const sorted = [...volumes].sort((a, b) => a - b);

  const percentileFor = (v: number) => {
    if (sorted.length === 1) return 100;
    const idx = sorted.findIndex((x) => x >= v);
    const position = idx === -1 ? sorted.length - 1 : idx;
    return Math.round((position / (sorted.length - 1 || 1)) * 100);
  };

  const map = new Map<string, number>();
  markets.forEach((m) => map.set(m.id, percentileFor(m.volume)));
  return map;
}

export function liquidityLabelForPercentile(percentile: number): "Thin" | "Moderate" | "Deep" {
  if (percentile >= 70) return "Deep";
  if (percentile >= 35) return "Moderate";
  return "Thin";
}

export function computeVolatility(shifts: BeliefShift[], current: number): number | null {
  const values = [...shifts.map((s) => s.currentProbability), current];
  if (values.length < 2) return null;
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeProbabilityChanges(
  currentProbability: number,
  prior24h: number | null,
  prior7d: number | null,
) {
  const probabilityChange24h =
    prior24h === null || prior24h === undefined ? null : Number((currentProbability - prior24h).toFixed(4));
  const probabilityChange7d =
    prior7d === null || prior7d === undefined ? null : Number((currentProbability - prior7d).toFixed(4));

  const meaningfulMove =
    (probabilityChange24h !== null && Math.abs(probabilityChange24h) >= MEANINGFUL_MOVE_THRESHOLD) ||
    (probabilityChange7d !== null && Math.abs(probabilityChange7d) >= MEANINGFUL_MOVE_THRESHOLD);

  return { probabilityChange24h, probabilityChange7d, meaningfulMove };
}

export function formatLiquidityBar(percentile: number): string {
  const filledBlocks = Math.max(1, Math.round((percentile / 100) * 5));
  const emptyBlocks = 5 - filledBlocks;
  return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
}

export function buildExplanationContext(params: {
  market: Market;
  probabilityChange24h: number | null;
  probabilityChange7d: number | null;
  liquidityPercentile: number | null;
  confidenceScore: number | null;
  confidenceLabel: "low" | "medium" | "high" | null;
  timeToExpiry?: number | null;
  tradeActivitySummary?: string;
  relatedMarketsSummary?: string | null;
}): ExplanationContext {
  const displayProbability = clampDisplayProbability(params.market.probability);
  const liquidityLabel = params.liquidityPercentile !== null && params.liquidityPercentile !== undefined
    ? liquidityLabelForPercentile(params.liquidityPercentile)
    : "Thin";
  
  const confidenceLabel: "High" | "Medium" | "Low" | null = params.confidenceLabel
    ? (params.confidenceLabel === "high"
        ? "High"
        : params.confidenceLabel === "medium"
          ? "Medium"
          : "Low")
    : null;
  
  return {
    eventTitle: params.market.question,
    currentProbability: displayProbability,
    probabilityChange24h: params.probabilityChange24h,
    probabilityChange7d: params.probabilityChange7d,
    confidenceScore: params.confidenceScore,
    confidenceLabel,
    liquidityUsd: params.market.volume,
    liquidityLabel,
    liquidityPercentile: params.liquidityPercentile,
    timeToExpiry: params.timeToExpiry ?? null,
    tradeActivitySummary: params.tradeActivitySummary ?? "Recent trading activity summarized.",
    relatedMarketsSummary: params.relatedMarketsSummary ?? null,
  };
}

export function evaluateExplanationEligibility(params: {
  confidenceScore?: number | null;
  liquidity?: number | null;
  recentActivity?: boolean;
  stale?: boolean;
}): { eligible: boolean } {
  if (params.stale) {
    return {
      eligible: false,
    };
  }

  if (params.confidenceScore !== undefined && params.confidenceScore !== null && params.confidenceScore < 40) {
    return {
      eligible: false,
    };
  }

  if (params.liquidity !== undefined && params.liquidity !== null && params.liquidity < 1000) {
    return {
      eligible: false,
    };
  }

  if (params.recentActivity === false) {
    return {
      eligible: false,
    };
  }

  return { eligible: true };
}
