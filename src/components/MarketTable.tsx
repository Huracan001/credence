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
      <div className="glass-panel">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-300">Market dashboard</p>
            <p className="text-xs text-slate-400">Event-focused markets with market-implied probabilities</p>
          </div>
          <span className="text-xs text-slate-400">Loading live data…</span>
        </div>
        <div className="divide-y divide-white/10">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="grid gap-4 px-4 py-5 sm:grid-cols-[1.5fr_1fr] sm:items-center animate-pulse"
            >
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-slate-800/70" />
                <div className="h-3 w-1/2 rounded bg-slate-800/60" />
              </div>
              <div className="space-y-2">
                <div className="h-8 w-2/3 rounded-full bg-slate-800/70" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-4 w-20 rounded bg-slate-800/70" />
                  <div className="h-4 w-24 rounded bg-slate-800/70" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-300">
            Market dashboard
          </p>
          <p className="text-xs text-slate-400">
            Event-focused markets with market-implied probabilities
          </p>
        </div>
        <span className="text-xs text-slate-400">Live data; cached for ~1m</span>
      </div>
      <div className="divide-y divide-white/10">
        {markets.map((market) => (
          <div
            key={market.id}
            className="grid gap-4 px-4 py-5 sm:grid-cols-[1.5fr_1fr] sm:items-center"
          >
            <div className="space-y-3">
              <Link
                href={`/markets/${market.id}`}
                className="group flex items-center gap-2 text-base font-semibold text-white hover:text-sky-200"
              >
                {market.question}
                <span className="text-xs text-sky-300 opacity-0 transition group-hover:opacity-100">
                  Explain →
                </span>
              </Link>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full bg-slate-800/70 px-2 py-1 uppercase tracking-wide">
                  Updated {dateFormatter.format(new Date(market.updatedAt))}
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
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
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
                  className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200"
                  title={`Confidence score: ${market.confidenceScore ?? "n/a"} • ${market.confidenceExplanation ?? ""}`}
                >
                  {market.confidenceLabel ?? confidenceFromVolume(market.volume)} confidence
                </span>
                <span
                  className="rounded-full bg-slate-800/70 px-2 py-1 text-xs uppercase tracking-wide text-slate-200"
                  title={`Liquidity percentile: ${market.liquidityPercentile ?? 0}% (${market.liquidityLabel ?? "Thin"})`}
                >
                  {market.liquidityBar ?? "██░░░"} {market.liquidityLabel ?? "Liquidity"} · $
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

