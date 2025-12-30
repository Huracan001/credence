type Props = {
  value: number;
  label?: string;
};

export function ChangeIndicator({ value, label }: Props) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color =
    direction === "up"
      ? "text-emerald-300"
      : direction === "down"
        ? "text-rose-300"
        : "text-slate-300";

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className={`font-semibold ${color}`}>
        {value > 0 ? "+" : ""}
        {(value * 100).toFixed(1)} pts
      </span>
      {label ? <span className="text-slate-300/80">({label})</span> : null}
    </div>
  );
}

