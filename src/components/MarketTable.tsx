import Link from "next/link";
import { ChangeIndicator } from "./ChangeIndicator";
import { ProbabilityBadge } from "./ProbabilityBadge";
import { BeliefShift, Market } from "@/types";

type Props = {
  markets: Market[];
  shifts?: BeliefShift[];
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

export function MarketTable({ markets, shifts = [] }: Props) {
  const shiftMap = new Map<string, BeliefShift>();
  shifts.forEach((s) => shiftMap.set(s.marketId, s));

  if (!markets.length) {
    return (
      <div className="glass-panel glow-border">
        <div className="flex items-center justify-between border-b border-[#1a1f2e] px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
              <span className="w-1 h-4 bg-[#00d9ff]"></span>
              MARKETS
            </p>
            <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">Event-focused markets with market-implied probabilities</p>
          </div>
          <span className="text-xs text-[#6b7280] uppercase tracking-wider">LOADING…</span>
        </div>
        <div className="divide-y divide-[#1a1f2e]">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="grid gap-4 px-6 py-6 sm:grid-cols-[1.5fr_1fr] sm:items-center animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-[#1a1f2e]" />
                <div className="h-3 w-1/2 rounded bg-[#1a1f2e]" />
              </div>
              <div className="space-y-2">
                <div className="h-8 w-2/3 rounded bg-[#1a1f2e]" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-4 w-20 rounded bg-[#1a1f2e]" />
                  <div className="h-4 w-24 rounded bg-[#1a1f2e]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel glow-border">
      <div className="flex items-center justify-between border-b border-[#1a1f2e] px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
            <span className="w-1 h-4 bg-[#00d9ff]"></span>
            MARKETS
          </p>
          <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
            Event-focused markets with market-implied probabilities
          </p>
        </div>
        <span className="text-xs text-[#6b7280] uppercase tracking-wider">LIVE DATA; CACHED ~1M</span>
      </div>
      <div className="divide-y divide-[#1a1f2e]">
        {markets.map((market) => (
          <div
            key={market.id}
            className="grid gap-4 px-6 py-6 sm:grid-cols-[1.5fr_1fr] sm:items-center transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#00d9ff]"
          >
            <div className="space-y-3">
              <Link
                href={`/markets/${market.id}`}
                className="group flex items-center gap-2 text-base font-bold leading-snug text-[#f0f0f0] hover:text-[#00d9ff] transition-colors"
              >
                {market.question}
                <span className="text-xs text-[#00d9ff] opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
              <div className="flex flex-wrap gap-2 text-xs text-[#6b7280] uppercase tracking-wider">
                <span className="px-2 py-1 border border-[#1a1f2e] bg-[#0f1419]">
                  UPDATED {dateFormatter.format(new Date(market.updatedAt)).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
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
                ) : null}
                {market.probabilityChange7d !== null &&
                market.probabilityChange7d !== undefined ? (
                  <ChangeIndicator value={market.probabilityChange7d} label="7d" emphasize />
                ) : null}
                {(market.probabilityChange24h === null || market.probabilityChange24h === undefined) &&
                (market.probabilityChange7d === null || market.probabilityChange7d === undefined) ? (
                  <ChangeIndicator
                    value={shiftMap.get(market.id)?.delta ?? 0}
                    label="latest shift"
                  />
                ) : null}
                <span
                  className="px-2 py-1 text-xs uppercase tracking-wider text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419]"
                  title={`Confidence score: ${market.confidenceScore ?? "n/a"} • ${market.confidenceExplanation ?? ""}`}
                >
                  {market.confidenceLabel ?? confidenceFromVolume(market.volume)} CONFIDENCE
                </span>
                <span
                  className="px-2 py-1 text-xs uppercase tracking-wider text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419]"
                  title={`Liquidity percentile: ${market.liquidityPercentile ?? 0}% (${market.liquidityLabel ?? "Thin"})`}
                >
                  {market.liquidityBar ?? "██░░░"} {market.liquidityLabel ?? "LIQUIDITY"} · $
                  {Math.round(market.volume).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

