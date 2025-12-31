type Props = {
  value: number;
  label?: string;
  emphasize?: boolean;
};

export function ChangeIndicator({ value, label, emphasize }: Props) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color =
    direction === "up"
      ? "text-emerald-300"
      : direction === "down"
        ? "text-rose-300"
        : "text-slate-300";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "■";
  const highlight =
    emphasize && Math.abs(value) >= 0.02
      ? "rounded-full bg-white/5 px-2 py-1 shadow-inner shadow-emerald-500/10"
      : "";

  return (
    <div className={`flex items-center gap-1 text-sm ${highlight}`}>
      <span className={`font-semibold ${color}`}>
        {arrow} {value > 0 ? "+" : ""}
        {(value * 100).toFixed(1)} pts
      </span>
      {label ? <span className="text-slate-300/80">({label})</span> : null}
    </div>
  );
}

