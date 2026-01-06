type Props = {
  value: number;
  label?: string;
  emphasize?: boolean;
};

export function ChangeIndicator({ value, label, emphasize }: Props) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color =
    direction === "up"
      ? "text-[#ff0040]"
      : direction === "down"
        ? "text-[#00d9ff]"
        : "text-[#6b7280]";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "—";
  const highlight =
    emphasize && Math.abs(value) >= 0.02
      ? "px-3 py-1.5 border border-[#00d9ff]/30 bg-[#0f1419] glow-border"
      : "";

  return (
    <div className={`flex items-center gap-2 text-sm ${highlight}`}>
      <span className={`font-black tracking-tight ${color} ${direction !== "flat" ? "glow-text" : ""}`}>
        {arrow} {value > 0 ? "+" : ""}
        {(value * 100).toFixed(1)} pts
      </span>
      {label ? <span className="text-[#6b7280] text-xs uppercase tracking-wider">({label})</span> : null}
    </div>
  );
}

