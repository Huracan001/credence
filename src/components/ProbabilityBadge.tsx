import { clampDisplayProbability } from "@/lib/metrics";

type Props = {
  probability: number;
  confidence: "low" | "medium" | "high";
  displayProbability?: number;
  probabilityLabel?: string;
};

function descriptor(probability: number) {
  if (probability >= 0.75) return "likely";
  if (probability >= 0.6) return "more likely than not";
  if (probability >= 0.4) return "uncertain";
  return "unlikely";
}

function formatPercent(prob: number) {
  const pct = prob * 100;
  if (pct >= 99) return "99%";
  if (pct <= 1) return "1%";
  if (pct < 10 || pct > 90) return pct.toFixed(1) + "%";
  return Math.round(pct) + "%";
}

export function ProbabilityBadge({
  probability,
  confidence,
  displayProbability,
  probabilityLabel,
}: Props) {
  const displayedProb = displayProbability ?? clampDisplayProbability(probability);
  const pct = formatPercent(displayedProb);
  const label = probabilityLabel ?? descriptor(displayedProb);
  const confCopy =
    confidence === "high"
      ? "high confidence"
      : confidence === "medium"
        ? "moderate confidence"
        : "low confidence";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
      <span className="text-base font-semibold">
        {pct} – {label}
      </span>
      <span className="text-slate-300/80">{confCopy}</span>
    </div>
  );
}

