type Point = {
  date: string;
  probability: number;
};

type Props = {
  data: Point[];
  height?: number;
  showDots?: boolean;
};

export function ProbabilitySparkline({
  data,
  height = 120,
  showDots = false,
}: Props) {
  if (!data.length) return null;

  const width = 420;
  const values = data.map((d) => d.probability);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.05);

  const points = data
    .map((point, idx) => {
      const x =
        data.length === 1 ? width / 2 : (idx / (data.length - 1)) * width;
      const y = height - ((point.probability - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Probability trend"
      className="w-full text-[#00d9ff]"
    >
      <defs>
        <linearGradient id="sparkline" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00d9ff" stopOpacity="0.05" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polyline
        fill="none"
        stroke="#00d9ff"
        strokeWidth="2.5"
        strokeLinejoin="round"
        points={points}
        filter="url(#glow)"
      />
      <polyline
        fill="url(#sparkline)"
        stroke="none"
        points={`0,${height} ${points} ${width},${height}`}
      />
      {showDots
        ? data.map((point, idx) => {
            const x =
              data.length === 1 ? width / 2 : (idx / (data.length - 1)) * width;
            const y = height - ((point.probability - min) / range) * height;
            return (
              <circle
                key={point.date}
                cx={x}
                cy={y}
                r={4}
                fill="#0a0a0f"
                stroke="#00d9ff"
                strokeWidth="2"
                filter="url(#glow)"
              />
            );
          })
        : null}
    </svg>
  );
}

