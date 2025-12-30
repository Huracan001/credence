export default function TrustPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-slate-300">
          Trust & method
        </p>
        <h1 className="text-3xl font-semibold text-white">
          How Credence treats probabilities, uncertainty, and user protection
        </h1>
        <p className="text-slate-200">
          We focus on interpretation, not prediction. Everything you see is
          conditioned on market-implied probabilities and is presented with
          explicit uncertainty language.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white">What this is</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li className="rounded-md bg-white/5 px-3 py-2">
              An interpreter of event-focused prediction markets.
            </li>
            <li className="rounded-md bg-white/5 px-3 py-2">
              A probabilistic view that can move up or down as markets trade.
            </li>
            <li className="rounded-md bg-white/5 px-3 py-2">
              A record of what changed, why it might have changed, and what is
              still unknown.
            </li>
          </ul>
        </div>

        <div className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white">
            What this is not
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li className="rounded-md bg-white/5 px-3 py-2">
              Not financial advice, recommendations, or price targets.
            </li>
            <li className="rounded-md bg-white/5 px-3 py-2">
              Not a certainty. All probabilities reflect current market sentiment
              and can change.
            </li>
            <li className="rounded-md bg-white/5 px-3 py-2">
              Not a promise of outcomes or a guarantee of accuracy.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel p-4">
          <h3 className="text-base font-semibold text-white">
            Prediction markets 101
          </h3>
          <p className="mt-2 text-sm text-slate-200">
            Prediction markets aggregate participant beliefs into probabilities.
            Higher prices reflect stronger belief in an event but not certainty.
          </p>
        </div>
        <div className="glass-panel p-4">
          <h3 className="text-base font-semibold text-white">LLM governance</h3>
          <p className="mt-2 text-sm text-slate-200">
            Explanations are generated under a strict prompt that forbids advice
            or price predictions and forces explicit uncertainty statements.
          </p>
        </div>
        <div className="glass-panel p-4">
          <h3 className="text-base font-semibold text-white">
            Uncertainty handling
          </h3>
          <p className="mt-2 text-sm text-slate-200">
            We highlight thin liquidity, conflicting signals, and missing data.
            Confidence descriptors stay aligned with market depth, not headlines.
          </p>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h2 className="text-lg font-semibold text-white">
          Legal and language stance
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          <li className="rounded-md bg-white/5 px-3 py-2">
            Language uses “likely,” “unlikely,” and “moderately confident.” We
            never say “will.”
          </li>
          <li className="rounded-md bg-white/5 px-3 py-2">
            Every page carries the disclaimer: This is informational analysis, not
            financial advice or investment recommendations.
          </li>
          <li className="rounded-md bg-white/5 px-3 py-2">
            Users should verify details with primary sources and understand that
            probabilities can shift quickly.
          </li>
        </ul>
      </div>
    </div>
  );
}

