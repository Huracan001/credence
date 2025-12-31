import { BeliefShift, Market } from "@/types";

type ConfidenceInputs = {
  liquidity: number;
  spread?: number | null;
  volume24h?: number | null;
  volatility?: number | null;
  tradeFrequency24h?: number | null;
  updatedAt?: string;
};

export function clampDisplayProbability(raw: number): number {
  const clamped = Math.min(Math.max(raw, 0.01), 0.99);
  return clamped;
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
  return Math.min(100, (scaled / 6) * 100); // assumes ~$1M+ is high confidence territory
}

function scoreSpread(spread?: number | null): number {
  if (spread === null || spread === undefined) return 60; // neutral when unknown
  if (spread <= 0.005) return 100;
  if (spread <= 0.01) return 85;
  if (spread <= 0.02) return 70;
  if (spread <= 0.05) return 50;
  return 35;
}

function scoreVolatility(volatility?: number | null): number {
  if (volatility === null || volatility === undefined) return 60;
  if (volatility <= 0.01) return 100;
  if (volatility <= 0.03) return 80;
  if (volatility <= 0.05) return 60;
  if (volatility <= 0.1) return 45;
  return 30;
}

function scoreTradeFrequency(freq?: number | null): number {
  if (!freq || freq <= 0) return 40;
  if (freq >= 20) return 95;
  if (freq >= 10) return 85;
  if (freq >= 5) return 75;
  if (freq >= 2) return 65;
  return 50;
}

export function computeConfidence(inputs: ConfidenceInputs) {
  const liquidityScore = scoreLiquidity(inputs.liquidity);
  const spreadScore = scoreSpread(inputs.spread);
  const volumeScore = scoreLiquidity(inputs.volume24h ?? 0) * 0.6 + 20; // softer weight
  const volatilityScore = scoreVolatility(inputs.volatility);
  const tradeScore = scoreTradeFrequency(inputs.tradeFrequency24h);

  const weighted =
    liquidityScore * 0.35 +
    spreadScore * 0.15 +
    volumeScore * 0.15 +
    volatilityScore * 0.2 +
    tradeScore * 0.15;

  const score = Math.round(Math.max(0, Math.min(100, weighted)));
  const label = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const explanation = [
    `Liquidity signal: ${liquidityScore.toFixed(0)}`,
    `Spread signal: ${spreadScore.toFixed(0)}`,
    `Volatility penalty: ${volatilityScore.toFixed(0)}`,
  ].join(" • ");

  return { score, label, explanation };
}

export function computeLiquidityPercentiles(markets: Market[]): Map<string, number> {
  const volumes = markets.map((m) => m.volume).filter((v) => v !== undefined && v !== null);
  if (!volumes.length) return new Map();
  const sorted = [...volumes].sort((a, b) => a - b);

  const percentileFor = (v: number) => {
    const idx = sorted.findIndex((x) => x >= v);
    const position = idx === -1 ? sorted.length - 1 : idx;
    return Math.round((position / (sorted.length - 1 || 1)) * 100);
  };

  const map = new Map<string, number>();
  markets.forEach((m) => map.set(m.id, percentileFor(m.volume)));
  return map;
}

export function computeVolatility(shifts: BeliefShift[], current: number): number | null {
  const values = [...shifts.map((s) => s.currentProbability), current];
  if (values.length < 2) return null;
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeDeltas(
  currentProbability: number,
  prior24h: number | null,
  prior7d: number | null,
) {
  const delta24h =
    prior24h === null || prior24h === undefined
      ? null
      : Number((currentProbability - prior24h).toFixed(4));
  const delta7d =
    prior7d === null || prior7d === undefined
      ? null
      : Number((currentProbability - prior7d).toFixed(4));

  const meaningful =
    (delta24h !== null && Math.abs(delta24h) >= 0.02) ||
    (delta7d !== null && Math.abs(delta7d) >= 0.02);

  return { delta24h, delta7d, meaningful };
}

export function formatLiquidityBar(percentile: number): string {
  const filledBlocks = Math.max(1, Math.round((percentile / 100) * 5));
  const emptyBlocks = 5 - filledBlocks;
  return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
}

export function buildExplanationContext(params: {
  market: Market;
  probabilityChange24h: number | null;
  liquidityPercentile: number | null;
  confidenceScore: number | null;
  timeToExpiry?: number | null;
  tradeActivitySummary?: string;
}) {
  const displayProbability = clampDisplayProbability(params.market.probability);
  return {
    eventTitle: params.market.question,
    currentProbability: displayProbability,
    probabilityChange24h: params.probabilityChange24h,
    liquidity: params.market.volume,
    liquidityChange: null,
    confidenceScore: params.confidenceScore,
    timeToExpiry: params.timeToExpiry ?? null,
    tradeActivitySummary: params.tradeActivitySummary ?? "Recent trading activity summarized.",
    liquidityPercentile: params.liquidityPercentile,
  };
}
