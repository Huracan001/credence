import { BeliefShift, ExplanationContext, Market, StoredInsight } from "@/types";
import { getFromCache, setCache } from "@/lib/cache";
import { buildExplanationContext } from "@/lib/metrics";
import { aggregateContext, EnrichedContext } from "@/lib/contextAggregator";

type ConfidenceLabel = "High" | "Medium" | "Low" | null;

function toConfidenceLabel(score: number | null): ConfidenceLabel {
  if (score == null) return null;
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

const SYSTEM_PROMPT = `
You act as the ElizaOS explanation agent. Your role is to translate existing market signals into cautious, neutral, analyst-grade narrative. Rules:
- Do NOT forecast or invent probabilities.
- Describe only observed changes and concrete signals.
- Tone: analytical, calm, non-sensational.
`.trim();

const EXPLANATION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type GuardedInsightResult = {
  insight: StoredInsight | null;
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
  enrichedContext?: EnrichedContext | null,
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

  // Build whyMoved with enriched context
  const whyMoved: string[] = [];
  
  if (enrichedContext) {
    // Add news context
    if (enrichedContext.news.length > 0) {
      const recentNews = enrichedContext.news.filter(
        (n) => new Date(n.publishedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      if (recentNews.length > 0) {
        whyMoved.push(
          `Recent news coverage (${recentNews.length} article${recentNews.length > 1 ? "s" : ""}) may be influencing market sentiment.`
        );
      }
    }

    // Add Twitter/X context
    if (enrichedContext.tweets.length > 0) {
      const recentTweets = enrichedContext.tweets.filter(
        (t) => new Date(t.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      if (recentTweets.length > 0) {
        whyMoved.push(
          `Social media discussion is active (${recentTweets.length} recent post${recentTweets.length > 1 ? "s" : ""}), potentially reflecting broader sentiment shifts.`
        );
      }
    }

    // Add key drivers
    if (enrichedContext.keyDrivers.length > 0) {
      whyMoved.push(...enrichedContext.keyDrivers.slice(0, 2));
    }
  }

  // Fallback to basic explanation if no enriched context
  if (whyMoved.length === 0) {
    if (enrichedContext?.fallbackExplanation) {
      // Use web search context if available
      whyMoved.push(enrichedContext.fallbackExplanation);
    } else {
      // Basic fallback with market title
      whyMoved.push(
        `Market question: "${market.question}". Explanation references observed order book and trading activity only.`,
        liquidityText,
      );
    }
  } else {
    whyMoved.push(liquidityText);
  }

  // Build whatChanged with enriched context
  const whatChanged: string[] = [
    `24h change: ${movement24h}; 7d change: ${movement7d}.`,
  ];

  if (enrichedContext?.relatedMarkets && enrichedContext.relatedMarkets.length > 0) {
    whatChanged.push(
      `${enrichedContext.relatedMarkets.length} related market${enrichedContext.relatedMarkets.length > 1 ? "s" : ""} showing similar patterns.`
    );
  }

  whatChanged.push(context.tradeActivitySummary ?? "Recent trading activity is being monitored.");

  // Enhanced summary with enriched context - always use market title
  let summary = `Market question: "${market.question}". The market assigns ${formatPercent(
    context.currentProbability,
  )} probability, treated as ${context.confidenceLabel ?? "Unknown"} confidence.`;
  
  if (enrichedContext) {
    // Use enriched summary if available, otherwise use fallback explanation
    if (enrichedContext.summary && enrichedContext.keyDrivers.length > 0) {
      summary = enrichedContext.summary;
    } else if (enrichedContext.fallbackExplanation) {
      summary = enrichedContext.fallbackExplanation;
    }
  }

  return {
    id: `${market.id}-${shiftDetectedAt}`,
    marketId: market.id,
    shiftDetectedAt,
    summary,
    whatChanged,
    whyMoved,
    uncertainty: [
      "Drivers behind the shift are inferred from news, social media, and market data. This is a translation of current signals, not a forecast.",
    ],
    interpretation:
      "This is a market-implied view, not a forecast or recommendation. Treat it as directional context with stated confidence.",
    createdAt: new Date().toISOString(),
  };
}

export async function generateGuardedInsight(
  market: Market,
  shift?: BeliefShift | null,
  includeEnrichedContext = true,
): Promise<GuardedInsightResult> {
  // Build context with strict typing - always rebuild to ensure strict types
  const builtContext = buildExplanationContext({
    market,
    probabilityChange24h: market.probabilityChange24h ?? null,
    probabilityChange7d: market.probabilityChange7d ?? null,
    liquidityPercentile: market.liquidityPercentile ?? null,
    confidenceScore: market.confidenceScore ?? null,
    confidenceLabel: market.confidenceLabel ?? null,
    timeToExpiry: null,
    tradeActivitySummary: market.tradeActivitySummary,
  });

  // Ensure strict type by rebuilding with explicit ConfidenceLabel conversion
  const context: ExplanationContext = {
    eventTitle: builtContext.eventTitle,
    currentProbability: builtContext.currentProbability,
    probabilityChange24h: builtContext.probabilityChange24h,
    probabilityChange7d: builtContext.probabilityChange7d,
    confidenceScore: builtContext.confidenceScore,
    confidenceLabel: toConfidenceLabel(builtContext.confidenceScore),
    liquidityUsd: builtContext.liquidityUsd,
    liquidityLabel: builtContext.liquidityLabel,
    liquidityPercentile: builtContext.liquidityPercentile ?? null,
    timeToExpiry: builtContext.timeToExpiry,
    tradeActivitySummary: builtContext.tradeActivitySummary,
    relatedMarketsSummary: builtContext.relatedMarketsSummary ?? null,
  };

  const cacheKey = `explanation:${market.id}:${stableStringify(context)}`;
  const cached = getFromCache<StoredInsight>(cacheKey);
  if (cached) {
    return { insight: cached, context, cached: true };
  }

  // Aggregate enriched context from news, Twitter, and Polymarket
  let enrichedContext: EnrichedContext | null = null;
  if (includeEnrichedContext) {
    try {
      enrichedContext = await aggregateContext(market, shift ?? null);
    } catch (err) {
      console.error("[insightGenerator] Failed to aggregate enriched context", err);
      // Continue with basic insight if enrichment fails
    }
  }

  const insight = renderDeterministicInsight(market, context, shift ?? null, enrichedContext);
  setCache(cacheKey, insight, EXPLANATION_TTL_MS);
  return { insight, context, cached: false };
}

export const insightSystemPrompt = SYSTEM_PROMPT;
