import { BeliefShift, Market, StoredInsight } from "@/types";

const SYSTEM_PROMPT = `
You translate prediction market probability moves into cautious, explainable insights.
- Never provide financial advice or recommendations.
- Use probabilistic language: likely, unlikely, uncertain, moderately confident.
- Always mention uncertainty and liquidity/volume context when available.
- Do not promise outcomes or use hype language.
- If information is insufficient, state that explicitly.
`.trim();

function formatPercent(probability: number) {
  return `${Math.round(probability * 100)}%`;
}

function descriptor(probability: number) {
  if (probability >= 0.75) return "likely";
  if (probability >= 0.6) return "more likely than not";
  if (probability >= 0.4) return "uncertain";
  return "unlikely";
}

function buildDeterministicInsight(
  market: Market,
  shift: BeliefShift,
  context?: { volume?: number },
): StoredInsight {
  const volumeCopy =
    context?.volume !== undefined
      ? `Observed volume: ~$${Math.round(context.volume).toLocaleString()}.`
      : "Volume context not available.";

  const direction = shift.delta > 0 ? "up" : shift.delta < 0 ? "down" : "flat";

  return {
    id: `${market.id}-${shift.detectedAt}`,
    marketId: market.id,
    shiftDetectedAt: shift.detectedAt,
    summary: `The market assigns ${formatPercent(
      market.probability,
    )} to "${market.question}", viewed as ${descriptor(market.probability)}.`,
    whatChanged: [
      `Probability moved ${direction} by ${(Math.abs(shift.delta) * 100).toFixed(1)} pts.`,
      `Previous probability: ${formatPercent(shift.previousProbability)}; current: ${formatPercent(
        shift.currentProbability,
      )}.`,
    ],
    whyMoved: [
      "No model-based rationale provided; this is a structural summary of observed trading.",
      volumeCopy,
    ],
    uncertainty: [
      "Drivers behind the shift are not fully identified in this response.",
      "Outcome can still move materially if new information arrives or liquidity is thin.",
    ],
    interpretation:
      "This is an interpretation of current sentiment, not advice or a forecast. Treat it as directional context only.",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Placeholder guarded generator. If OPENAI_API_KEY is present, the function is ready
 * to be extended to call a model. Without a key, it returns a deterministic,
 * cautious insight to keep behavior predictable and safe.
 */
export async function generateGuardedInsight(
  market: Market,
  shift: BeliefShift,
): Promise<StoredInsight> {
  // TODO: Wire to an LLM provider with SYSTEM_PROMPT once a key is provided.
  // Keep deterministic output for now to avoid unguarded responses.
  return buildDeterministicInsight(market, shift, { volume: market.volume });
}

export const insightSystemPrompt = SYSTEM_PROMPT;

