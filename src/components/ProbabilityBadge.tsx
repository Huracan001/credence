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
    <div className="inline-flex items-center gap-3 border border-[#1a1f2e] bg-[#0f1419] px-4 py-2 text-xs font-semibold relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00d9ff]/5 to-transparent"></div>
      <span className="text-base font-black text-[#00d9ff] relative z-10 tracking-tight">
        {pct} – {label.toUpperCase()}
      </span>
      <span className="text-[#6b7280] text-xs uppercase tracking-wider relative z-10">{confCopy}</span>
      <div className="absolute right-0 top-0 bottom-0 w-px bg-[#00d9ff]/30"></div>
    </div>
  );
}

