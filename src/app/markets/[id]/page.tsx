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
      <div className="glass-panel p-6 text-slate-100">
        <h1 className="text-2xl font-semibold text-white">Market unavailable</h1>
        <p className="mt-2 text-sm text-slate-200">
          We could not load this market. It may have been delisted or is temporarily
          unavailable from the data provider. Please return to the dashboard and try a
          different market.
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
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-slate-300">
          Market insight
        </p>
        <h1 className="text-3xl font-semibold text-white">{market.question}</h1>
        <p className="text-slate-200">
          Market-implied probability with cautious interpretation. No forecasts or
          recommendations—only an explanation of current sentiment and its
          uncertainty.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ProbabilityBadge
              probability={market.probability}
              displayProbability={market.displayProbability}
              probabilityLabel={market.probabilityLabel}
              confidence={
                market.confidenceLabel ?? confidenceFromVolume(market.volume)
              }
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              {market.probabilityChange24h !== null &&
              market.probabilityChange24h !== undefined ? (
                <ChangeIndicator value={market.probabilityChange24h} label="24h" emphasize />
              ) : (
                <ChangeIndicator value={latestShift?.delta ?? 0} label="latest shift" />
              )}
              <span className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200">
                Liquidity: ~${Math.round(market.volume).toLocaleString()} ({market.liquidityLabel ?? "Thin"})
              </span>
              <span
                className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200"
                title={`Liquidity percentile: ${market.liquidityPercentile ?? 0}%`}
              >
                {market.liquidityBar ?? "██░░░"} depth signal
              </span>
              <span className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200">
                Updated {dateFormatter.format(new Date(market.updatedAt))}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Confidence descriptor
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {(market.confidenceLabel ?? confidenceFromVolume(market.volume)).toUpperCase()} (
              {market.confidenceScore ?? "n/a"})
            </p>
            <p className="mt-2 text-sm text-slate-200">{market.confidenceExplanation}</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              What this means
            </p>
            <p className="mt-2 text-sm text-slate-200">
              This is a market-implied probability, not a prediction. It can rise or
              fall as new information or liquidity arrives.
            </p>
          </div>
        </div>
      </div>

      {insight ? (
        <InsightSections insight={insight} />
      ) : (
        <div className="glass-panel p-4">
          <p className="text-sm font-semibold text-white">No shift detected yet</p>
          <p className="text-sm text-slate-200">
            We will generate an explanation once a meaningful probability move is
            observed.
          </p>
        </div>
      )}

      <div className="glass-panel p-4 space-y-2">
        <p className="text-sm font-medium text-white">Reminder</p>
        <p className="text-sm text-slate-200">
          This page interprets market-implied probabilities. It is not a promise,
          forecast, or recommendation. Use it to understand how sentiment shifts
          and where uncertainty remains.
        </p>
        <div className="rounded-md bg-white/5 p-3 text-sm text-slate-200">
          <p className="font-semibold text-white">What this does NOT mean</p>
          <ul className="list-disc pl-4">
            <li>No investment advice or buy/sell signals.</li>
            <li>No guarantees of future outcomes.</li>
            <li>Probabilities can change quickly with new data.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

