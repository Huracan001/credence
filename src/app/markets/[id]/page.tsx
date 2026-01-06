import Link from "next/link";
import { ChangeIndicator } from "@/components/ChangeIndicator";
import { InsightSections } from "@/components/InsightSections";
import { ProbabilityBadge } from "@/components/ProbabilityBadge";
import { ProbabilitySparkline } from "@/components/ProbabilitySparkline";
import { CategoryBadge, getCategoryFromMarket } from "@/components/CategoryBadge";
import { getMarketSnapshotById, refreshMarkets } from "@/lib/server/markets";
import { getLatestBeliefShift, getLatestInsight, listBeliefShiftsForMarket } from "@/lib/persistence/store";
import { generateGuardedInsight } from "@/lib/insightGenerator";
import { HistoricalShifts } from "@/components/HistoricalShifts";
import { EnrichedContextClient } from "@/components/EnrichedContextClient";

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
      <div className="space-y-12">
        <div className="glass-panel p-8 text-[#6b7280] glow-border text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 bg-[#ff0040] rounded-full animate-pulse"></span>
              <h1 className="text-2xl font-black tracking-tight text-[#f0f0f0] uppercase">Market Unavailable</h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#6b7280] max-w-md mx-auto">
              This market could not be loaded. It may have been delisted or is temporarily unavailable.
            </p>
            <div className="pt-4 flex gap-3 justify-center">
              <Link
                href="/markets"
                className="border border-[#00d9ff] bg-[#0f1419] px-6 py-3 text-sm font-semibold tracking-wider text-[#00d9ff] uppercase transition-all hover:bg-[#1a1f2e] hover:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
              >
                View All Markets →
              </Link>
              <Link
                href="/"
                className="border border-[#1a1f2e] bg-[#0f1419] px-6 py-3 text-sm font-semibold tracking-wider text-[#6b7280] uppercase transition-all hover:border-[#00d9ff] hover:text-[#00d9ff]"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const latestShift = await getLatestBeliefShift(market.id);
  const historicalShifts = await listBeliefShiftsForMarket(market.id, undefined, 20);

  // If a shift exists, ensure an insight is available (deterministic fallback)
  // Use enriched context (news, Twitter, Polymarket) for better explanations
  let insight = latestShift ? await getLatestInsight(market.id) : null;
  if (!insight && latestShift) {
    const result = await generateGuardedInsight(market, latestShift, true); // Include enriched context
    if (result.insight) {
      insight = result.insight;
    }
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4 border-b border-[#1a1f2e] pb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent"></div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2 pt-4">
          <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
          INSIGHT
        </p>
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f0f0f0] md:text-5xl uppercase flex-1 min-w-0">{market.question}</h1>
          <CategoryBadge category={getCategoryFromMarket(market.question, market.assetId)} className="mt-2" />
        </div>
        <p className="max-w-2xl text-base leading-relaxed text-[#6b7280]">
          Market-implied probability decoded through ElizaOS. No forecasts or
          recommendations—only evidence of current sentiment and its uncertainty.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel p-6 glow-border">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <ProbabilityBadge
              probability={market.probability}
              displayProbability={market.displayProbability}
              probabilityLabel={market.probabilityLabel}
              confidence={
                market.confidenceLabel ?? confidenceFromVolume(market.volume)
              }
            />
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
              {market.probabilityChange24h !== null &&
              market.probabilityChange24h !== undefined ? (
                <ChangeIndicator value={market.probabilityChange24h} label="24h" emphasize />
              ) : (
                <ChangeIndicator value={latestShift?.delta ?? 0} label="latest shift" />
              )}
              <span className="px-2 py-1 text-xs uppercase tracking-wider text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419]">
                LIQUIDITY: ~${Math.round(market.volume).toLocaleString()} ({market.liquidityLabel ?? "THIN"})
              </span>
              <span
                className="px-2 py-1 text-xs uppercase tracking-wider text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419]"
                title={`Liquidity percentile: ${market.liquidityPercentile ?? 0}%`}
              >
                {market.liquidityBar ?? "██░░░"} DEPTH
              </span>
              <span className="px-2 py-1 text-xs uppercase tracking-wider text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419]">
                {dateFormatter.format(new Date(market.updatedAt)).toUpperCase()}
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
          <div className="glass-panel p-5 glow-border">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] mb-3 font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              CONFIDENCE
            </p>
            <p className="text-lg font-black text-[#00d9ff] mb-2 glow-text">
              {(market.confidenceLabel ?? confidenceFromVolume(market.volume)).toUpperCase()} (
              {market.confidenceScore ?? "N/A"})
            </p>
            <p className="text-sm leading-relaxed text-[#6b7280]">{market.confidenceExplanation}</p>
          </div>
          <div className="glass-panel p-5 glow-border">
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] mb-3 font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              CONTEXT
            </p>
            <p className="text-sm leading-relaxed text-[#6b7280]">
              Market-implied probability, not a prediction. Can shift with new information or liquidity changes.
            </p>
          </div>
        </div>
      </div>

      {insight ? (
        <InsightSections insight={insight} />
      ) : (
        <div className="glass-panel p-6 glow-border">
          <p className="text-sm font-black text-[#f0f0f0] mb-2 uppercase tracking-wider">No shift detected</p>
          <p className="text-sm text-[#6b7280]">
            An explanation will be generated through ElizaOS once a meaningful probability move is observed.
          </p>
        </div>
      )}

      <EnrichedContextClient marketId={market.id} />

      <HistoricalShifts shifts={historicalShifts} currentProbability={market.probability} />

      <div className="glass-panel p-6 space-y-4 glow-border">
        <p className="text-sm font-black text-[#00d9ff] uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-[#00d9ff]"></span>
          NOTE
        </p>
        <p className="text-sm leading-relaxed text-[#6b7280]">
          This page interprets market-implied probabilities. Not a promise, forecast, or recommendation. 
          Use to understand sentiment shifts and remaining uncertainty.
        </p>
        <div className="border-l-2 border-[#ff0040]/30 pl-4 pt-2 relative">
          <span className="absolute left-[-6px] top-2 w-2 h-2 bg-[#ff0040] rounded-full"></span>
          <p className="font-black text-[#ff0040] mb-2 text-sm uppercase tracking-wider">What this does not mean</p>
          <ul className="space-y-1 text-sm text-[#6b7280] list-none">
            <li>• No investment advice or buy/sell signals</li>
            <li>• No guarantees of future outcomes</li>
            <li>• Probabilities can change quickly with new data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

