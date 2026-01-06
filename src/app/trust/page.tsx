export default function TrustPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4 border-b border-[#1a1f2e] pb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent"></div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2 pt-4">
          <span className="w-2 h-2 bg-[#00d9ff] rounded-full animate-pulse"></span>
          METHOD
        </p>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f0f0f0] md:text-5xl uppercase">
          HOW AKASHI HANDLES<br />PROBABILITIES, UNCERTAINTY, AND EVIDENCE
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#6b7280]">
          We interpret signals, not predict outcomes. All data reflects market-implied probabilities 
          and is presented with explicit uncertainty language through ElizaOS.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-6 glow-border">
          <h2 className="text-lg font-black tracking-wider text-[#00d9ff] mb-4 uppercase flex items-center gap-2">
            <span className="w-1 h-5 bg-[#00d9ff]"></span>
            WHAT THIS IS
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-[#6b7280]">
            <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
              <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
              An interpreter of event-focused prediction markets.
            </li>
            <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
              <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
              A probabilistic view that shifts as markets trade.
            </li>
            <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
              <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
              A record of changes, context, and remaining uncertainty.
            </li>
          </ul>
        </div>

        <div className="glass-panel p-6 glow-border">
          <h2 className="text-lg font-black tracking-wider text-[#ff0040] mb-4 uppercase flex items-center gap-2">
            <span className="w-1 h-5 bg-[#ff0040]"></span>
            WHAT THIS IS NOT
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-[#6b7280]">
            <li className="border-l-2 border-[#ff0040]/30 pl-4 relative">
              <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#ff0040] rounded-full"></span>
              Not financial advice, recommendations, or price targets.
            </li>
            <li className="border-l-2 border-[#ff0040]/30 pl-4 relative">
              <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#ff0040] rounded-full"></span>
              Not certainty. Probabilities reflect current market sentiment and change.
            </li>
            <li className="border-l-2 border-[#ff0040]/30 pl-4 relative">
              <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#ff0040] rounded-full"></span>
              Not a promise of outcomes or guarantee of accuracy.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel p-6 glow-border">
          <h3 className="text-base font-black tracking-wider text-[#00d9ff] mb-3 uppercase">
            PREDICTION MARKETS
          </h3>
          <p className="text-sm leading-relaxed text-[#6b7280]">
            Markets aggregate participant beliefs into probabilities. Higher prices indicate stronger belief, not certainty.
          </p>
        </div>
        <div className="glass-panel p-6 glow-border">
          <h3 className="text-base font-black tracking-wider text-[#00d9ff] mb-3 uppercase">ELIZAOS GOVERNANCE</h3>
          <p className="text-sm leading-relaxed text-[#6b7280]">
            Explanations generated through ElizaOS under strict constraints that prohibit advice or predictions and require explicit uncertainty statements.
          </p>
        </div>
        <div className="glass-panel p-6 glow-border">
          <h3 className="text-base font-black tracking-wider text-[#00d9ff] mb-3 uppercase">
            UNCERTAINTY
          </h3>
          <p className="text-sm leading-relaxed text-[#6b7280]">
            We highlight thin liquidity, conflicting signals, and missing data. Confidence aligns with market depth, not headlines.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 glow-border">
        <h2 className="text-lg font-black tracking-wider text-[#00d9ff] mb-4 uppercase flex items-center gap-2">
          <span className="w-1 h-5 bg-[#00d9ff]"></span>
          LANGUAGE AND LEGAL STANCE
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed text-[#6b7280]">
          <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
            <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
            Language uses "likely," "unlikely," and "moderately confident." We never say "will."
          </li>
          <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
            <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
            Every page includes: This is informational analysis, not financial advice or investment recommendations.
          </li>
          <li className="border-l-2 border-[#00d9ff]/30 pl-4 relative">
            <span className="absolute left-[-6px] top-0 w-2 h-2 bg-[#00d9ff] rounded-full"></span>
            Users should verify details with primary sources and understand probabilities can shift quickly.
          </li>
        </ul>
      </div>
    </div>
  );
}

