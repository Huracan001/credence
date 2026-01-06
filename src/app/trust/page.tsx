export default function TrustPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4 border-b border-[#e5e5e5] pb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">
          Method
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0f0f0f] md:text-4xl">
          How AKASHI handles probabilities, uncertainty, and evidence
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#4a4a4a]">
          We interpret signals, not predict outcomes. All data reflects market-implied probabilities 
          and is presented with explicit uncertainty language.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold tracking-tight text-[#0f0f0f] mb-4">What this is</h2>
          <ul className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
            <li className="border-l-2 border-[#e5e5e5] pl-4">
              An interpreter of event-focused prediction markets.
            </li>
            <li className="border-l-2 border-[#e5e5e5] pl-4">
              A probabilistic view that shifts as markets trade.
            </li>
            <li className="border-l-2 border-[#e5e5e5] pl-4">
              A record of changes, context, and remaining uncertainty.
            </li>
          </ul>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold tracking-tight text-[#0f0f0f] mb-4">
            What this is not
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
            <li className="border-l-2 border-[#e5e5e5] pl-4">
              Not financial advice, recommendations, or price targets.
            </li>
            <li className="border-l-2 border-[#e5e5e5] pl-4">
              Not certainty. Probabilities reflect current market sentiment and change.
            </li>
            <li className="border-l-2 border-[#e5e5e5] pl-4">
              Not a promise of outcomes or guarantee of accuracy.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold tracking-tight text-[#0f0f0f] mb-3">
            Prediction markets
          </h3>
          <p className="text-sm leading-relaxed text-[#4a4a4a]">
            Markets aggregate participant beliefs into probabilities. Higher prices indicate stronger belief, not certainty.
          </p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold tracking-tight text-[#0f0f0f] mb-3">Governance</h3>
          <p className="text-sm leading-relaxed text-[#4a4a4a]">
            Explanations are generated under strict constraints that prohibit advice or predictions and require explicit uncertainty statements.
          </p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold tracking-tight text-[#0f0f0f] mb-3">
            Uncertainty
          </h3>
          <p className="text-sm leading-relaxed text-[#4a4a4a]">
            We highlight thin liquidity, conflicting signals, and missing data. Confidence aligns with market depth, not headlines.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-bold tracking-tight text-[#0f0f0f] mb-4">
          Language and legal stance
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed text-[#4a4a4a]">
          <li className="border-l-2 border-[#e5e5e5] pl-4">
            Language uses "likely," "unlikely," and "moderately confident." We never say "will."
          </li>
          <li className="border-l-2 border-[#e5e5e5] pl-4">
            Every page includes: This is informational analysis, not financial advice or investment recommendations.
          </li>
          <li className="border-l-2 border-[#e5e5e5] pl-4">
            Users should verify details with primary sources and understand probabilities can shift quickly.
          </li>
        </ul>
      </div>
    </div>
  );
}

