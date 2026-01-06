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
      <section className="border-b border-[#1a1f2e] pb-12 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent"></div>
        <div className="flex flex-col gap-8 pt-4">
          <div className="inline-flex items-center gap-2 self-start text-xs uppercase tracking-[0.2em] text-[#6b7280] font-semibold">
            <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
            MARKET EVIDENCE
          </div>
          <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-[#f0f0f0] md:text-6xl">
                EVIDENCE,<br />NOT SPECULATION.
              </h1>
              <p className="text-lg leading-relaxed text-[#6b7280] max-w-xl">
                AKASHI decodes prediction market probabilities through ElizaOS. 
                Real-time signals. Zero hype. Mission control for crypto intelligence.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/markets"
                  className="bg-[#00d9ff] px-6 py-3 text-sm font-black tracking-wider text-[#0a0a0f] uppercase transition-all hover:bg-[#00b8d9] hover:shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                >
                  ACCESS MARKETS →
                </Link>
                <Link
                  href="/trust"
                  className="border border-[#1a1f2e] bg-[#0f1419] px-6 py-3 text-sm font-semibold tracking-wider text-[#00d9ff] uppercase transition-all hover:border-[#00d9ff] hover:bg-[#1a1f2e] hover:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
                >
                  METHOD
                </Link>
              </div>
              <p className="pt-2 text-xs text-[#6b7280] uppercase tracking-wider">
                Informational analysis. Not financial advice.
              </p>
            </div>
            <div className="glass-panel p-6 glow-border">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] mb-6 font-semibold flex items-center gap-2">
                <span className="w-1 h-4 bg-[#00d9ff]"></span>
                PROCESS
              </h2>
              <ul className="space-y-4 text-sm text-[#e0e0e0] leading-relaxed">
                <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
                  <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
                  Event-focused probabilities sourced from prediction markets.
                </li>
                <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
                  <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
                  A guardrailed ElizaOS agent translates market moves into plain-language context after liquidity and confidence checks.
                </li>
                <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
                  <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
                  Changes, context, and uncertainty presented with restraint—no speculation when signals are insufficient.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#1a1f2e] pb-3">
            <h2 className="text-xl font-black tracking-wider text-[#f0f0f0] uppercase flex items-center gap-2">
              <span className="w-1 h-5 bg-[#00d9ff]"></span>
              MARKETS
            </h2>
            <Link
              href="/markets"
              className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold hover:text-[#00d9ff] transition-colors"
            >
              VIEW ALL →
            </Link>
          </div>
          {hasMarkets ? (
            <div className="space-y-4">
              {featuredMarkets.map((market) => (
                <div key={market.id} className="glass-panel p-6 glow-border hover:border-[#00d9ff]/50 transition-all">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <Link
                        href={`/markets/${market.id}`}
                        className="text-base font-bold leading-snug text-[#f0f0f0] hover:text-[#00d9ff] transition-colors block"
                      >
                        {market.question}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
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
            <div className="glass-panel p-6 text-[#6b7280] border-[#1a1f2e]">
              <span className="inline-block w-2 h-2 bg-[#ff0040] rounded-full mr-2 animate-pulse"></span>
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
