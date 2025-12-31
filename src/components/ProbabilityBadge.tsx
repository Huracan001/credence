type Props = {
  probability: number;
  confidence: "low" | "medium" | "high";
};

function formatPercent(prob: number) {
  const pct = prob * 100;
  if (pct >= 99.95) return "99.9%";
  if (pct <= 0.05) return "0.1%";
  if (pct < 10 || pct > 90) return pct.toFixed(1) + "%";
  return Math.round(pct) + "%";
}

function descriptor(probability: number) {
  if (probability >= 0.75) return "likely";
  if (probability >= 0.6) return "more likely than not";
  if (probability >= 0.4) return "uncertain";
  return "unlikely";
}

export function ProbabilityBadge({ probability, confidence }: Props) {
  const yesProb = probability;
  const noProb = 1 - probability;
  const showingYes = yesProb >= noProb;
  const displayedProb = showingYes ? yesProb : noProb;
  const displayedSide = showingYes ? "Yes" : "No";
  const pct = formatPercent(displayedProb);
  const confCopy =
    confidence === "high"
      ? "high confidence"
      : confidence === "medium"
        ? "moderate confidence"
        : "low confidence";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
      <span className="rounded-full bg-slate-800/80 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">
        {displayedSide}
      </span>
      <span className="text-base font-semibold">{pct}</span>
      <span className="rounded-full bg-slate-800/80 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">
        {descriptor(displayedProb)}
      </span>
      <span className="text-slate-300/80">{confCopy}</span>
    </div>
  );
}

