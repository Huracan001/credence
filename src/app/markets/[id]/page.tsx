import { ChangeIndicator } from "@/components/ChangeIndicator";
import { InsightSections } from "@/components/InsightSections";
import { ProbabilityBadge } from "@/components/ProbabilityBadge";
import { ProbabilitySparkline } from "@/components/ProbabilitySparkline";
import { getMarketSnapshotById, refreshMarkets } from "@/lib/server/markets";
import { getLatestBeliefShift, getLatestInsight } from "@/lib/persistence/store";
import { generateGuardedInsight } from "@/lib/insightGenerator";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

function confidenceFromVolume(volume: number): "low" | "medium" | "high" {
  if (volume >= 5_000_000) return "high";
  if (volume >= 1_000_000) return "medium";
  return "low";
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export default async function MarketDetail({ params }: Props) {
  let market = await getMarketSnapshotById(params.id);

  if (!market) {
    // Fallback: force a refresh if cache missed a newly fetched market
    const fresh = await refreshMarkets();
    market = fresh.markets.find((m) => m.id === params.id) ?? null;
  }

  if (!market) {
    return (
      <div className="glass-panel p-6 text-[#4a4a4a]">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f0f0f]">Market unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#8e8e8e]">
          This market could not be loaded. It may have been delisted or is temporarily
          unavailable. Return to markets and try another.
        </p>
      </div>
    );
  }

  const latestShift = await getLatestBeliefShift(market.id);

  // If a shift exists, ensure an insight is available (deterministic fallback)
  let insight = latestShift ? await getLatestInsight(market.id) : null;
  if (!insight && latestShift) {
    const result = await generateGuardedInsight(market, latestShift);
    if (result.insight) {
      insight = result.insight;
    }
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4 border-b border-[#e5e5e5] pb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">
          Insight
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0f0f0f] md:text-4xl">{market.question}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#4a4a4a]">
          Market-implied probability with restrained interpretation. No forecasts or
          recommendations—only evidence of current sentiment and its uncertainty.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <ProbabilityBadge
              probability={market.probability}
              displayProbability={market.displayProbability}
              probabilityLabel={market.probabilityLabel}
              confidence={
                market.confidenceLabel ?? confidenceFromVolume(market.volume)
              }
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#8e8e8e]">
              {market.probabilityChange24h !== null &&
              market.probabilityChange24h !== undefined ? (
                <ChangeIndicator value={market.probabilityChange24h} label="24h" emphasize />
              ) : (
                <ChangeIndicator value={latestShift?.delta ?? 0} label="latest shift" />
              )}
              <span className="px-2 py-1 text-xs uppercase tracking-wide text-[#4a4a4a]">
                Liquidity: ~${Math.round(market.volume).toLocaleString()} ({market.liquidityLabel ?? "Thin"})
              </span>
              <span
                className="px-2 py-1 text-xs uppercase tracking-wide text-[#4a4a4a]"
                title={`Liquidity percentile: ${market.liquidityPercentile ?? 0}%`}
              >
                {market.liquidityBar ?? "██░░░"} depth
              </span>
              <span className="px-2 py-1 text-xs uppercase tracking-wide text-[#4a4a4a]">
                {dateFormatter.format(new Date(market.updatedAt))}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <ProbabilitySparkline
              data={[
                {
                  date: "previous",
                  probability: latestShift
                    ? latestShift.previousProbability
                    : market.probability - 0.02,
                },
                { date: "current", probability: market.probability },
              ]}
              height={160}
              showDots
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-3">
              Confidence
            </p>
            <p className="text-lg font-bold text-[#0f0f0f] mb-2">
              {(market.confidenceLabel ?? confidenceFromVolume(market.volume)).toUpperCase()} (
              {market.confidenceScore ?? "n/a"})
            </p>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">{market.confidenceExplanation}</p>
          </div>
          <div className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-3">
              Context
            </p>
            <p className="text-sm leading-relaxed text-[#4a4a4a]">
              Market-implied probability, not a prediction. Can shift with new information or liquidity changes.
            </p>
          </div>
        </div>
      </div>

      {insight ? (
        <InsightSections insight={insight} />
      ) : (
        <div className="glass-panel p-6">
          <p className="text-sm font-semibold text-[#0f0f0f] mb-2">No shift detected</p>
          <p className="text-sm text-[#8e8e8e]">
            An explanation will be generated once a meaningful probability move is observed.
          </p>
        </div>
      )}

      <div className="glass-panel p-6 space-y-4">
        <p className="text-sm font-bold text-[#0f0f0f]">Note</p>
        <p className="text-sm leading-relaxed text-[#4a4a4a]">
          This page interprets market-implied probabilities. Not a promise, forecast, or recommendation. 
          Use to understand sentiment shifts and remaining uncertainty.
        </p>
        <div className="border-l-2 border-[#e5e5e5] pl-4 pt-2">
          <p className="font-semibold text-[#0f0f0f] mb-2 text-sm">What this does not mean</p>
          <ul className="space-y-1 text-sm text-[#4a4a4a] list-none">
            <li>• No investment advice or buy/sell signals</li>
            <li>• No guarantees of future outcomes</li>
            <li>• Probabilities can change quickly with new data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

