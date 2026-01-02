import { BeliefShiftHeatmap as HeatmapData } from "@/lib/heatmap";

type Props = {
  heatmap: HeatmapData;
};

function formatBucketLabel(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function colorForIntensity(intensity: number) {
  // Sky-400 base with variable alpha for simplicity.
  const alpha = Math.min(0.85, 0.15 + intensity * 0.7);
  return `rgba(56, 189, 248, ${alpha})`;
}

export function BeliefShiftHeatmap({ heatmap }: Props) {
  const { categories, buckets, matrix, cells } = heatmap;
  const cellMap = new Map<string, (typeof cells)[number]>();
  cells.forEach((c) => cellMap.set(`${c.category}|${c.bucketStart}`, c));

  if (!categories.length || !buckets.length) {
    return (
      <div className="glass-panel p-5 text-slate-300">
        Belief shift heatmap will appear once new shifts are detected.
      </div>
    );
  }

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-300">Belief shift heatmap</p>
          <p className="text-xs text-slate-400">Intensity by category and hour</p>
        </div>
        <span className="rounded-full bg-slate-800/70 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200">
          1h buckets
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-900/80 px-3 py-2 text-left text-xs text-slate-400 backdrop-blur">
                Category
              </th>
              {buckets.map((b) => (
                <th key={b} className="px-2 py-2 text-center text-[11px] text-slate-500">
                  {formatBucketLabel(b)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, rowIdx) => (
              <tr key={category}>
                <td className="sticky left-0 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur">
                  {category}
                </td>
                {buckets.map((bucket, colIdx) => {
                  const intensity = matrix[rowIdx]?.[colIdx] ?? 0;
                  const cell = cellMap.get(`${category}|${bucket}`);
                  const tooltip = cell?.topMarketQuestion
                    ? `${cell.topMarketQuestion} (Δ ${(cell.topDelta ?? 0).toFixed(3)})`
                    : "No shifts";
                  return (
                    <td key={bucket} className="px-2 py-1">
                      <div
                        className="h-8 w-8 rounded border border-white/10"
                        style={{
                          backgroundColor: intensity > 0 ? colorForIntensity(intensity) : "transparent",
                        }}
                        title={tooltip}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
