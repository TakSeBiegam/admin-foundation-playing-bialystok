import React from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
};

export function Sparkline({
  data,
  width = 120,
  height = 28,
  color = "#FFD166",
  fillOpacity = 0.12,
}: SparklineProps) {
  if (!data || data.length === 0) return <div style={{ height }} />;

  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max === min ? 1 : max - min;

  const points = data.map((v, i) => {
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${points.length ? `M0,${height}` : ""} ${linePath} L${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Series = { name: string; color?: string; data: number[] };

type MultiSeriesAreaChartProps = {
  labels: string[];
  series: Series[];
  height?: number;
};

export function MultiSeriesAreaChart({
  labels,
  series,
  height = 200,
}: MultiSeriesAreaChartProps) {
  const n = labels.length;
  if (!n || series.length === 0) return null;

  // compute global min/max across all series
  const allValues = series.flatMap((s) => s.data);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max === min ? 1 : max - min;

  const width = Math.max(300, Math.min(900, n * 60));

  function toPath(data: number[]) {
    const points = data.map((v, i) => {
      const x = n === 1 ? width / 2 : (i / (n - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return { x, y };
    });

    const line = points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`,
      )
      .join(" ");
    const area = `${points.length ? `M0,${height}` : ""} ${line} L${width},${height} Z`;
    return { line, area, last: points[points.length - 1] };
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            {series.map((s, idx) => (
              <linearGradient
                id={`g-${idx}`}
                key={idx}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={s.color ?? "#FFD166"}
                  stopOpacity="0.18"
                />
                <stop
                  offset="100%"
                  stopColor={s.color ?? "#FFD166"}
                  stopOpacity="0"
                />
              </linearGradient>
            ))}
          </defs>

          {series.map((s, idx) => {
            const { line, area } = toPath(s.data);
            return (
              <g key={idx}>
                <path d={area} fill={`url(#g-${idx})`} />
                <path
                  d={line}
                  fill="none"
                  stroke={s.color ?? "#FFD166"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {series.map((s, idx) => (
          <div key={s.name} className="flex items-center gap-2 text-sm">
            <span
              style={{
                width: 12,
                height: 8,
                background: s.color ?? "#FFD166",
                display: "inline-block",
                borderRadius: 2,
              }}
            />
            <span className="text-white/80">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sparkline;
