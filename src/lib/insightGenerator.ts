import { BeliefShift, ExplanationContext, Market, StoredInsight } from "@/types";
import { getFromCache, setCache } from "@/lib/cache";
import { buildExplanationContext } from "@/lib/metrics";
import { getMarketHistory } from "@/lib/elizaAgent";

const SYSTEM_PROMPT = `
You act as the ElizaOS explanation agent. Your role is to translate existing market signals into cautious, neutral, analyst-grade narrative. Rules:
- Do NOT forecast or invent probabilities.
- Describe only observed changes and concrete signals.
- Always surface uncertainty and liquidity context.
- Refuse to speculate when signals are weak.
- Tone: analytical, calm, non-sensational.
`.trim();

const EXPLANATION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type GuardedInsightResult = {
  insight: StoredInsight | null;
  refusal?: string;
  context: ExplanationContext;
  cached: boolean;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([k, v]) => `"${k}":${stableStringify(v)}`).join(",")}}`;
}

function formatPercent(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

function renderDeterministicInsight(
  market: Market,
  context: ExplanationContext,
  shift?: BeliefShift | null,
): StoredInsight {
  const movement24h =
    context.probabilityChange24h !== null && context.probabilityChange24h !== undefined
      ? `${context.probabilityChange24h > 0 ? "+" : ""}${(context.probabilityChange24h * 100).toFixed(1)} pts`
      : "not available";
  const movement7d =
    context.probabilityChange7d !== null && context.probabilityChange7d !== undefined
      ? `${context.probabilityChange7d > 0 ? "+" : ""}${(context.probabilityChange7d * 100).toFixed(1)} pts`
      : "not available";
  const confidenceText = context.confidenceScore !== null && context.confidenceScore !== undefined
    ? `${context.confidenceLabel ?? "Unknown"} (${context.confidenceScore.toFixed(0)})`
    : "Unknown";
  const liquidityText =
    context.liquidityUsd !== null && context.liquidityUsd !== undefined
      ? `Liquidity: ~$${Math.round(context.liquidityUsd).toLocaleString()} (${context.liquidityLabel ?? "Thin"}).`
      : "Liquidity not available.";

  const shiftDetectedAt = shift?.detectedAt ?? market.updatedAt ?? new Date().toISOString();

  return {
    id: `${market.id}-${shiftDetectedAt}`,
    marketId: market.id,
    shiftDetectedAt,
    summary: `The market assigns ${formatPercent(
      context.currentProbability,
    )} to "${context.eventTitle}", treated as ${context.confidenceLabel ?? "Unknown"} confidence.`,
    whatChanged: [
      `24h change: ${movement24h}; 7d change: ${movement7d}.`,
      context.tradeActivitySummary ?? "Recent trading activity is being monitored.",
    ],
    whyMoved: [
      "Explanation references observed order book and trading activity only.",
      liquidityText,
    ],
    uncertainty: [
      "Drivers behind the shift are not inferred; this is a translation of current market signals.",
      "Future movement may differ if new information arrives or liquidity remains thin.",
    ],
    interpretation:
      "This is a market-implied view, not a forecast or recommendation. Treat it as directional context with stated confidence.",
    createdAt: new Date().toISOString(),
  };
}

export async function generateGuardedInsight(
  market: Market,
  shift?: BeliefShift | null,
): Promise<GuardedInsightResult> {
  let context: ExplanationContext =
    market.explanationContext ??
    buildExplanationContext({
      market,
      probabilityChange24h: market.probabilityChange24h ?? null,
      probabilityChange7d: market.probabilityChange7d ?? null,
      liquidityPercentile: market.liquidityPercentile ?? null,
      confidenceScore: market.confidenceScore ?? null,
      confidenceLabel: market.confidenceLabel ?? null,
      timeToExpiry: null,
      tradeActivitySummary: market.tradeActivitySummary,
    }) as ExplanationContext;

  if (!context.tradeActivitySummary) {
    const history = await getMarketHistory(market.id);
    const recentEvents = history.slice(0, 3).map((entry) => entry.detectedAt);
    context = {
      ...context,
      tradeActivitySummary: recentEvents.length
        ? `Recent activity timestamps: ${recentEvents.join(", ")}`
        : "No recent activity detected in history window.",
    } as ExplanationContext;
  }

  const cacheKey = `explanation:${market.id}:${stableStringify(context)}`;
  const cached = getFromCache<StoredInsight>(cacheKey);
  if (cached) {
    return { insight: cached, context, cached: true };
  }

  const insight = renderDeterministicInsight(market, context, shift ?? null);
  setCache(cacheKey, insight, EXPLANATION_TTL_MS);
  return { insight, context, cached: false };
}

export const insightSystemPrompt = SYSTEM_PROMPT;

