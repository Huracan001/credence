import { BeliefShiftFeed, BeliefShiftDisplay } from "@/components/BeliefShiftFeed";
import { MarketTable } from "@/components/MarketTable";
import { getMarketsSnapshot } from "@/lib/server/markets";

const MIN_LIQUIDITY_FOR_SHIFTS = 50_000;
const FALLBACK_TOP_MOVERS = 3;

export default async function MarketsPage() {
  const snapshot = await getMarketsSnapshot({ forceRefresh: true });
  const hasMarkets = snapshot.markets.length > 0;
  const confidenceFromVolume = (volume: number): BeliefShiftDisplay["confidence"] => {
    if (volume >= 5_000_000) return "high";
    if (volume >= 1_000_000) return "medium";
    return "low";
  };
  const mappedShifts: BeliefShiftDisplay[] = snapshot.shifts
    .map((shift) => {
      const market = snapshot.markets.find((m) => m.id === shift.marketId);
      const confidence = market ? confidenceFromVolume(market.volume) : "medium";
      return {
        ...shift,
        question: market?.question ?? "Market",
        confidence,
        volume: market?.volume ?? 0,
      };
    })
    .filter((shift) => shift.volume !== undefined && shift.volume >= MIN_LIQUIDITY_FOR_SHIFTS);

  const hasRealShifts = mappedShifts.length > 0;
  const fallbackShifts: BeliefShiftDisplay[] = hasRealShifts
    ? []
    : snapshot.markets
        .filter((m) => m.delta24h !== null && m.delta24h !== undefined)
        .sort((a, b) => Math.abs(b.delta24h ?? 0) - Math.abs(a.delta24h ?? 0))
        .slice(0, FALLBACK_TOP_MOVERS)
        .map((m) => ({
          marketId: m.id,
          previousProbability: m.probability - (m.delta24h ?? 0),
          currentProbability: m.probability,
          delta: m.delta24h ?? 0,
          detectedAt: m.updatedAt,
          question: m.question,
          confidence: confidenceFromVolume(m.volume),
          volume: m.volume,
        }));
  const shiftDisplays = hasRealShifts ? mappedShifts : fallbackShifts;
  const shiftSubtitle = hasRealShifts
    ? "Large moves flagged for review"
    : "Largest belief changes (low confidence)";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-slate-300">
          Market dashboard
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Event-focused crypto markets with probabilistic context
        </h1>
        <p className="text-slate-200">
          Each row shows market-implied probability, how it shifted, and how much
          liquidity informs the signal. Click through for an LLM-generated
          explanation of what changed and what remains uncertain.
        </p>
      </header>

      {hasMarkets ? (
        <MarketTable markets={snapshot.markets} shifts={snapshot.shifts} />
      ) : (
        <div className="glass-panel p-5 text-slate-200">
          Live markets are temporarily unavailable. Data will reload automatically.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white">Platform stance</h2>
          <p className="mt-2 text-sm text-slate-200">
            Probabilities are taken at face value from prediction markets. We do
            not promise outcomes or recommend actions. Large moves are flagged so
            you can review the narrative rather than chase momentum.
          </p>
        </div>
        <BeliefShiftFeed
          shifts={shiftDisplays}
          subtitle={shiftSubtitle}
          emptyMessage="No shifts detected yet—showing latest movers instead."
        />
      </div>

    </div>
  );
}

