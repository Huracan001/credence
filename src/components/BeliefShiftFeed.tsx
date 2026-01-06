import Link from "next/link";
import { ChangeIndicator } from "./ChangeIndicator";
import { CategoryBadge, getCategoryFromMarket } from "./CategoryBadge";
import { BeliefShift, Market } from "@/types";

export type BeliefShiftDisplay = BeliefShift & {
  question: string;
  confidence?: "low" | "medium" | "high";
  volume?: number;
};

const confidenceCopy: Record<NonNullable<BeliefShiftDisplay["confidence"]> | "unknown", string> = {
  low: "thin liquidity",
  medium: "moderate liquidity",
  high: "strong liquidity",
  unknown: "liquidity unknown",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return dateFormatter.format(date);
}

export function BeliefShiftFeed({
  shifts,
  subtitle = "Large moves flagged for review",
  emptyMessage,
}: {
  shifts: BeliefShiftDisplay[];
  subtitle?: string;
  emptyMessage?: string;
}) {
  return (
    <div className="glass-panel glow-border">
      <div className="flex items-center justify-between border-b border-[#1a1f2e] px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
            <span className="w-1 h-4 bg-[#00d9ff]"></span>
            SHIFTS
          </p>
          <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
            {subtitle}
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419] uppercase tracking-wider">
          MONITOR
        </span>
      </div>
      {shifts.length ? (
        <ul className="divide-y divide-[#1a1f2e]">
          {shifts.map((shift) => (
            <li key={`${shift.marketId}-${shift.detectedAt}`} className="px-6 py-5 transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#ff0040]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <Link
                      href={`/markets/${shift.marketId}`}
                      className="text-base font-bold leading-snug text-[#f0f0f0] hover:text-[#00d9ff] transition-colors flex-1 min-w-0"
                    >
                      {shift.question}
                    </Link>
                    <CategoryBadge category={getCategoryFromMarket(shift.question)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
                    <ChangeIndicator value={shift.delta} label="shift" />
                    <span className="px-2 py-1 text-[11px] uppercase tracking-wider text-[#6b7280] border border-[#1a1f2e] bg-[#0f1419]">
                      {confidenceCopy[shift.confidence ?? "unknown"].toUpperCase()}
                    </span>
                    <span className="text-[#6b7280] uppercase tracking-wider">
                      {formatTime(shift.detectedAt).toUpperCase()}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/markets/${shift.marketId}`}
                  className="text-sm text-[#00d9ff] hover:text-[#00b8d9] transition-colors self-start sm:self-center uppercase tracking-wider font-semibold"
                >
                  VIEW →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-6 text-sm text-[#6b7280] uppercase tracking-wider">
          {emptyMessage ?? "No shifts detected yet—waiting for movement."}
        </div>
      )}
    </div>
  );
}

