import { ChangeIndicator } from "./ChangeIndicator";
import { ProbabilityBadge } from "./ProbabilityBadge";
import { BeliefShift } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function formatDateTime(timestamp: string) {
  const date = new Date(timestamp);
  return dateFormatter.format(date);
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type HistoricalShiftsProps = {
  shifts: BeliefShift[];
  currentProbability: number;
};

export function HistoricalShifts({ shifts, currentProbability }: HistoricalShiftsProps) {
  if (shifts.length === 0) {
    return (
      <div className="glass-panel p-6 glow-border">
        <p className="text-sm font-black text-[#f0f0f0] mb-2 uppercase tracking-wider">No Historical Shifts</p>
        <p className="text-sm text-[#6b7280]">
          Shift history will appear here once probability movements are detected and recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel glow-border">
      <div className="border-b border-[#1a1f2e] px-6 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#00d9ff] font-semibold flex items-center gap-2">
          <span className="w-1 h-4 bg-[#00d9ff]"></span>
          SHIFT HISTORY
        </p>
        <p className="text-xs text-[#6b7280] mt-1 uppercase tracking-wider">
          Historical probability changes for comparison
        </p>
      </div>
      <div className="divide-y divide-[#1a1f2e]">
        {/* Current state */}
        <div className="px-6 py-5 bg-[#0a0a0f]/50 border-l-2 border-l-[#00d9ff]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-[#00d9ff] font-semibold">CURRENT</span>
                <ProbabilityBadge
                  probability={currentProbability}
                  displayProbability={currentProbability}
                  probabilityLabel={`${Math.round(currentProbability * 100)}%`}
                  confidence="medium"
                />
              </div>
              <p className="text-xs text-[#6b7280] uppercase tracking-wider">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                }).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Historical shifts */}
        {shifts.map((shift, index) => {
          const isRecent = index < 3;
          return (
            <div
              key={`${shift.marketId}-${shift.detectedAt}`}
              className={`px-6 py-5 transition-all hover:bg-[#1a1f2e]/30 hover:border-l-2 hover:border-l-[#00d9ff] ${
                isRecent ? "bg-[#0f1419]/30" : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <ProbabilityBadge
                      probability={shift.previousProbability}
                      displayProbability={shift.previousProbability}
                      probabilityLabel={`${Math.round(shift.previousProbability * 100)}%`}
                      confidence="medium"
                    />
                    <span className="text-[#6b7280] text-sm">→</span>
                    <ProbabilityBadge
                      probability={shift.currentProbability}
                      displayProbability={shift.currentProbability}
                      probabilityLabel={`${Math.round(shift.currentProbability * 100)}%`}
                      confidence="medium"
                    />
                    <ChangeIndicator value={shift.delta} label="change" emphasize={Math.abs(shift.delta) >= 0.05} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6b7280] uppercase tracking-wider">
                    <span>{formatDateTime(shift.detectedAt)}</span>
                    {shift.liquidity && (
                      <span className="px-2 py-1 border border-[#1a1f2e] bg-[#0f1419]">
                        LIQUIDITY: ${Math.round(shift.liquidity).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
