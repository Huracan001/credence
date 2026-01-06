import Link from "next/link";
import { ChangeIndicator } from "./ChangeIndicator";
import { BeliefShift } from "@/types";

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
    <div className="glass-panel">
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[#8e8e8e]">
            Shifts
          </p>
          <p className="text-xs text-[#8e8e8e] mt-1">
            {subtitle}
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-medium text-[#4a4a4a] border border-[#e5e5e5]">
          Monitor
        </span>
      </div>
      {shifts.length ? (
        <ul className="divide-y divide-[#e5e5e5]">
          {shifts.map((shift) => (
            <li key={`${shift.marketId}-${shift.detectedAt}`} className="px-6 py-5 transition-colors hover:bg-[#f5f4ef]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Link
                    href={`/markets/${shift.marketId}`}
                    className="text-base font-semibold leading-snug text-[#0f0f0f] hover:text-[#c92a2a] transition-colors block"
                  >
                    {shift.question}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#8e8e8e]">
                    <ChangeIndicator value={shift.delta} label="shift" />
                    <span className="px-2 py-1 text-[11px] uppercase tracking-wide text-[#4a4a4a]">
                      {confidenceCopy[shift.confidence ?? "unknown"]}
                    </span>
                    <span className="text-[#8e8e8e]">
                      {formatTime(shift.detectedAt)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/markets/${shift.marketId}`}
                  className="text-sm text-[#c92a2a] underline-offset-4 hover:text-[#a61e1e] transition-colors self-start sm:self-center"
                >
                  View →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-6 text-sm text-[#8e8e8e]">
          {emptyMessage ?? "No shifts detected yet—waiting for movement."}
        </div>
      )}
    </div>
  );
}

