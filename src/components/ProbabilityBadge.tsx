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
    <div className="inline-flex items-center gap-3 border border-[#e5e5e5] bg-white px-4 py-2 text-xs font-medium">
      <span className="text-base font-bold text-[#0f0f0f]">
        {pct} – {label}
      </span>
      <span className="text-[#8e8e8e] text-xs">{confCopy}</span>
    </div>
  );
}

