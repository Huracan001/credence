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
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-300">
            Recent belief shifts
          </p>
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
          Monitor uncertainty
        </span>
      </div>
      {shifts.length ? (
        <ul className="divide-y divide-white/10">
          {shifts.map((shift) => (
            <li key={`${shift.marketId}-${shift.detectedAt}`} className="px-4 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Link
                    href={`/markets/${shift.marketId}`}
                    className="text-base font-semibold text-white hover:text-sky-200"
                  >
                    {shift.question}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <ChangeIndicator value={shift.delta} label="shift" />
                    <span className="rounded-full bg-slate-800/70 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">
                      {confidenceCopy[shift.confidence ?? "unknown"]}
                    </span>
                    <span className="text-slate-400">
                      Detected {formatTime(shift.detectedAt)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/markets/${shift.marketId}`}
                  className="text-sm text-sky-300 underline-offset-4 hover:underline"
                >
                  View explanation
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-4 text-sm text-slate-300">
          {emptyMessage ?? "No shifts detected yet—waiting for movement."}
        </div>
      )}
    </div>
  );
}

