import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { BeliefShiftFeed, BeliefShiftDisplay } from "@/components/BeliefShiftFeed";
import { ProbabilityBadge } from "@/components/ProbabilityBadge";
import { ProbabilitySparkline } from "@/components/ProbabilitySparkline";
import { getMarketsSnapshot } from "@/lib/server/markets";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MIN_LIQUIDITY_FOR_SHIFTS = 50_000;
const FALLBACK_TOP_MOVERS = 3;

function confidenceFromVolume(volume: number): "low" | "medium" | "high" {
  if (volume >= 5_000_000) return "high";
  if (volume >= 1_000_000) return "medium";
  return "low";
}

export default async function Home() {
  noStore(); // enforce dynamic rendering; avoid static pre-rendering with live fetches
  const snapshot = await getMarketsSnapshot({ forceRefresh: true });
  const featuredMarkets = snapshot.markets.slice(0, 3);
  const hasMarkets = snapshot.markets.length > 0;
  const mappedShifts: BeliefShiftDisplay[] = snapshot.shifts
    .map((shift) => {
      const market = snapshot.markets.find((m) => m.id === shift.marketId);
      const confidence: BeliefShiftDisplay["confidence"] = market
        ? confidenceFromVolume(market.volume)
        : "medium";

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
  const shifts = hasRealShifts ? mappedShifts : fallbackShifts;
  const shiftSubtitle = hasRealShifts
    ? "Large moves flagged for review"
    : "Largest belief changes (low confidence)";

  return (
    <div className="space-y-16">
      <section className="border-b border-[#e5e5e5] pb-12">
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 self-start text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">
            Market evidence
          </div>
          <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#0f0f0f] md:text-5xl">
                Evidence, not speculation.
              </h1>
              <p className="text-lg leading-relaxed text-[#4a4a4a]">
                AKASHI translates prediction market probabilities into clear, evidence-based insights. 
                No forecasts, no recommendations—just what the market signals and how confident we can be.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/markets"
                  className="bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a4a4a]"
                >
                  View markets
                </Link>
                <Link
                  href="/trust"
                  className="border border-[#e5e5e5] bg-white px-6 py-3 text-sm font-semibold text-[#0f0f0f] transition-colors hover:border-[#c92a2a] hover:text-[#c92a2a]"
                >
                  Method
                </Link>
              </div>
              <p className="pt-2 text-xs text-[#8e8e8e]">
                Informational analysis based on prediction market data. Not financial advice or investment recommendations.
              </p>
            </div>
            <div className="glass-panel p-6">
              <h2 className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e] mb-6">
                Process
              </h2>
              <ul className="space-y-4 text-sm text-[#4a4a4a]">
                <li className="border-l-2 border-[#e5e5e5] pl-4">
                  Event-focused probabilities sourced from prediction markets.
                </li>
                <li className="border-l-2 border-[#e5e5e5] pl-4">
                  Market signals translated into clear context after liquidity and confidence validation.
                </li>
                <li className="border-l-2 border-[#e5e5e5] pl-4">
                  Changes, context, and uncertainty presented with restraint—no speculation when signals are insufficient.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
            <h2 className="text-xl font-bold tracking-tight text-[#0f0f0f]">Markets</h2>
            <Link
              href="/markets"
              className="text-sm text-[#8e8e8e] underline-offset-4 hover:text-[#0f0f0f] transition-colors"
            >
              View all
            </Link>
          </div>
          {hasMarkets ? (
            <div className="space-y-4">
              {featuredMarkets.map((market) => (
                <div key={market.id} className="glass-panel p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <Link
                        href={`/markets/${market.id}`}
                        className="text-base font-semibold leading-snug text-[#0f0f0f] hover:text-[#c92a2a] transition-colors block"
                      >
                        {market.question}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#8e8e8e]">
                        <ProbabilityBadge
                          probability={market.probability}
                          displayProbability={market.displayProbability}
                          probabilityLabel={market.probabilityLabel}
                          confidence={confidenceFromVolume(market.volume)}
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-1/2">
                      <ProbabilitySparkline
                        data={[
                          { date: "previous", probability: market.probability - 0.01 },
                          { date: "current", probability: market.probability },
                        ]}
                        height={100}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-6 text-[#8e8e8e]">
              Markets temporarily unavailable. Data will reload automatically.
            </div>
          )}
        </div>
        <BeliefShiftFeed
          shifts={shifts}
          subtitle={shiftSubtitle}
          emptyMessage="No shifts detected yet—showing latest movers instead."
        />
      </section>
    </div>
  );
}
