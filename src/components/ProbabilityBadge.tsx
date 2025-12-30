type Props = {
  probability: number;
  confidence: "low" | "medium" | "high";
};

function descriptor(probability: number) {
  if (probability >= 0.75) return "likely";
  if (probability >= 0.6) return "more likely than not";
  if (probability >= 0.4) return "uncertain";
  return "unlikely";
}

export function ProbabilityBadge({ probability, confidence }: Props) {
  const pct = Math.round(probability * 100);
  const confCopy =
    confidence === "high"
      ? "high confidence"
      : confidence === "medium"
        ? "moderate confidence"
        : "low confidence";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
      <span className="text-base font-semibold">{pct}%</span>
      <span className="rounded-full bg-slate-800/80 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">
        {descriptor(probability)}
      </span>
      <span className="text-slate-300/80">{confCopy}</span>
    </div>
  );
}

