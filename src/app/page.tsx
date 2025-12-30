import Link from "next/link";
import { BeliefShiftFeed, BeliefShiftDisplay } from "@/components/BeliefShiftFeed";
import { ProbabilityBadge } from "@/components/ProbabilityBadge";
import { ProbabilitySparkline } from "@/components/ProbabilitySparkline";
import { getMarketsSnapshot } from "@/lib/server/markets";

function confidenceFromVolume(volume: number): "low" | "medium" | "high" {
  if (volume >= 5_000_000) return "high";
  if (volume >= 1_000_000) return "medium";
  return "low";
}

export default async function Home() {
  const snapshot = await getMarketsSnapshot();
  const featuredMarkets = snapshot.markets.slice(0, 3);
  const hasMarkets = snapshot.markets.length > 0;
  const shifts: BeliefShiftDisplay[] = snapshot.shifts.map((shift) => {
    const market = snapshot.markets.find((m) => m.id === shift.marketId);
    return {
      ...shift,
      question: market?.question ?? "Market",
      confidence: "medium",
    };
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 px-8 py-10 shadow-2xl shadow-sky-900/30">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
            Probabilistic crypto intelligence
          </div>
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                Crypto, explained by the market — not hype.
              </h1>
              <p className="text-lg text-slate-200">
                Credence turns prediction market probabilities into calm,
                explainable insights. No price targets, no recommendations—
                just what the market currently believes and how sure it is.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/markets"
                  className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  View market dashboard
                </Link>
                <Link
                  href="/trust"
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-300 hover:text-sky-200"
                >
                  How we handle uncertainty
                </Link>
              </div>
              <p className="text-xs text-slate-300">
                This platform provides informational analysis based on prediction
                market data. It does not provide financial advice or investment
                recommendations.
              </p>
            </div>
            <div className="glass-panel p-4">
              <h2 className="text-sm uppercase tracking-wide text-slate-300">
                How it works
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-100">
                <li className="rounded-lg bg-white/5 px-3 py-2">
                  We source event-focused probabilities from prediction markets.
                </li>
                <li className="rounded-lg bg-white/5 px-3 py-2">
                  An LLM translates market moves into plain-language context with
                  strict guardrails.
                </li>
                <li className="rounded-lg bg-white/5 px-3 py-2">
                  We highlight what changed, why it may have changed, and what is
                  still uncertain.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Featured markets</h2>
            <Link
              href="/markets"
              className="text-sm text-sky-300 underline-offset-4 hover:underline"
            >
              See all markets
            </Link>
          </div>
          {hasMarkets ? (
            <div className="space-y-4">
              {featuredMarkets.map((market) => (
                <div key={market.id} className="glass-panel p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <Link
                        href={`/markets/${market.id}`}
                        className="text-lg font-semibold text-white hover:text-sky-200"
                      >
                        {market.question}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                        <ProbabilityBadge
                          probability={market.probability}
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
            <div className="glass-panel p-5 text-slate-200">
              Live markets are temporarily unavailable. Data will reload automatically.
            </div>
          )}
        </div>
        <BeliefShiftFeed shifts={shifts} />
      </section>
    </div>
  );
}
