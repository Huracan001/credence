type Props = {
  value: number;
  label?: string;
  emphasize?: boolean;
};

export function ChangeIndicator({ value, label, emphasize }: Props) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color =
    direction === "up"
      ? "text-[#c92a2a]"
      : direction === "down"
        ? "text-[#4c6ef5]"
        : "text-[#8e8e8e]";
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "—";
  const highlight =
    emphasize && Math.abs(value) >= 0.02
      ? "px-2 py-1 border border-[#e5e5e5] bg-[#f5f4ef]"
      : "";

  return (
    <div className={`flex items-center gap-1 text-sm ${highlight}`}>
      <span className={`font-semibold ${color}`}>
        {arrow} {value > 0 ? "+" : ""}
        {(value * 100).toFixed(1)} pts
      </span>
      {label ? <span className="text-[#8e8e8e]">({label})</span> : null}
    </div>
  );
}

