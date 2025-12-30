import { notFound } from "next/navigation";
import { ChangeIndicator } from "@/components/ChangeIndicator";
import { InsightSections } from "@/components/InsightSections";
import { ProbabilityBadge } from "@/components/ProbabilityBadge";
import { ProbabilitySparkline } from "@/components/ProbabilitySparkline";
import { getMarketSnapshotById, getMarketsSnapshot } from "@/lib/server/markets";
import { getLatestBeliefShift, getLatestInsight } from "@/lib/persistence/store";
import { generateGuardedInsight } from "@/lib/insightGenerator";

type Props = {
  params: { id: string };
};

function confidenceFromVolume(volume: number): "low" | "medium" | "high" {
  if (volume >= 5_000_000) return "high";
  if (volume >= 1_000_000) return "medium";
  return "low";
}

export async function generateStaticParams() {
  const snapshot = await getMarketsSnapshot();
  return snapshot.markets.map((market) => ({ id: market.id }));
}

export default async function MarketDetail({ params }: Props) {
  const market = await getMarketSnapshotById(params.id);

  if (!market) {
    return notFound();
  }

  const latestShift = await getLatestBeliefShift(market.id);

  // If a shift exists, ensure an insight is available (deterministic fallback)
  let insight = latestShift ? await getLatestInsight(market.id) : null;
  if (!insight && latestShift) {
    insight = await generateGuardedInsight(market, latestShift);
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
              confidence={confidenceFromVolume(market.volume)}
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <ChangeIndicator value={latestShift?.delta ?? 0} label="latest shift" />
              <span className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200">
                Liquidity: ~${Math.round(market.volume).toLocaleString()}
              </span>
              <span className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200">
                Updated {new Date(market.updatedAt).toLocaleDateString()}
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
            <p className="mt-2 text-lg font-semibold text-white">Moderate confidence</p>
            <p className="mt-2 text-sm text-slate-200">
              Based on observed liquidity and stability of recent moves.
            </p>
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

