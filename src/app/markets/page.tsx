import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { BeliefShiftFeed, BeliefShiftDisplay } from "@/components/BeliefShiftFeed";
import { MarketTable } from "@/components/MarketTable";
import { AutoRefresh } from "@/components/AutoRefresh";
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
      <header className="space-y-4 border-b border-[#1a1f2e] pb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent"></div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2 pt-4">
          <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
          MARKETS
        </p>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f0f0f0] md:text-5xl uppercase">
          EVENT PROBABILITIES<br />WITH MARKET CONTEXT
        </h1>
        <div className="space-y-3">
          <p className="max-w-2xl text-base leading-relaxed text-[#6b7280]">
            Each market shows probability, recent shifts, and liquidity depth. 
            Explanations generated through ElizaOS only after signal-quality validation.
          </p>
          <AutoRefresh />
        </div>
      </header>

      {hasMarkets ? (
        <MarketTable markets={snapshot.markets} shifts={snapshot.shifts} />
      ) : (
        <div className="glass-panel p-8 text-[#6b7280] glow-border text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 bg-[#ff0040] rounded-full animate-pulse"></span>
              <h2 className="text-xl font-black text-[#f0f0f0] uppercase tracking-wider">Markets Temporarily Unavailable</h2>
            </div>
            <p className="text-sm leading-relaxed text-[#6b7280] max-w-md mx-auto">
              Unable to fetch market data at this time. This may be due to:
            </p>
            <ul className="text-sm text-[#6b7280] space-y-2 max-w-md mx-auto text-left list-none">
              <li className="flex items-start gap-2">
                <span className="text-[#00d9ff] mt-1">•</span>
                <span>API connection issues</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00d9ff] mt-1">•</span>
                <span>Data provider temporarily unavailable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00d9ff] mt-1">•</span>
                <span>Network connectivity problems</span>
              </li>
            </ul>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-block border border-[#00d9ff] bg-[#0f1419] px-6 py-3 text-sm font-semibold tracking-wider text-[#00d9ff] uppercase transition-all hover:bg-[#1a1f2e] hover:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
              >
                Return to Home
              </Link>
            </div>
            <p className="text-xs text-[#6b7280] pt-2">
              Data will reload automatically when available. Please try refreshing the page.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="glass-panel p-6 glow-border">
          <h2 className="text-lg font-black tracking-wider text-[#00d9ff] mb-3 uppercase flex items-center gap-2">
            <span className="w-1 h-5 bg-[#00d9ff]"></span>
            APPROACH
          </h2>
          <p className="text-sm leading-relaxed text-[#6b7280]">
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

