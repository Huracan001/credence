import { unstable_noStore as noStore } from "next/cache";
import { BeliefShiftFeed, BeliefShiftDisplay } from "@/components/BeliefShiftFeed";
import { MarketTable } from "@/components/MarketTable";
import { getMarketsSnapshot } from "@/lib/server/markets";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MIN_LIQUIDITY_FOR_SHIFTS = 50_000;
const FALLBACK_TOP_MOVERS = 3;

export default async function MarketsPage() {
  noStore(); // ensure this route is treated as dynamic and never statically generated
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
        .filter((m) => m.probabilityChange24h !== null && m.probabilityChange24h !== undefined)
        .sort(
          (a, b) =>
            Math.abs(b.probabilityChange24h ?? 0) - Math.abs(a.probabilityChange24h ?? 0),
        )
        .slice(0, FALLBACK_TOP_MOVERS)
        .map((m) => ({
          marketId: m.id,
          previousProbability: m.probability - (m.probabilityChange24h ?? 0),
          currentProbability: m.probability,
          delta: m.probabilityChange24h ?? 0,
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
    <div className="space-y-12">
      <header className="space-y-4 border-b border-[#e5e5e5] pb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">
          Markets
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0f0f0f] md:text-4xl">
          Event probabilities with market context
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#4a4a4a]">
          Each market shows probability, recent shifts, and liquidity depth. 
          Explanations are generated only after signal-quality validation.
        </p>
      </header>

      {hasMarkets ? (
        <MarketTable markets={snapshot.markets} shifts={snapshot.shifts} />
      ) : (
        <div className="glass-panel p-6 text-[#8e8e8e]">
          Markets temporarily unavailable. Data will reload automatically.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold tracking-tight text-[#0f0f0f] mb-3">Approach</h2>
          <p className="text-sm leading-relaxed text-[#4a4a4a]">
            Probabilities reflect prediction market data. We do not forecast outcomes or recommend actions. 
            Significant moves are flagged for review, not momentum.
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

