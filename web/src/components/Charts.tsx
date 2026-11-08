import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { HeatCell, SeriesPoint } from '../lib/types';
import { cn, prettyDate } from '../lib/utils';

const axis = { fontSize: 10, fill: '#6F6E64', fontFamily: 'Inter' };

const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-line bg-chalk px-3 py-2 shadow-lift">
    <div className="text-[11px] leading-relaxed text-ink">{children}</div>
  </div>
);

export const AdherenceChart = ({
  data,
  height = 190,
  showTarget = true
}: {
  data: SeriesPoint[];
  height?: number;
  showTarget?: boolean;
}) => {
  const clean = data.map((d) => ({ ...d, adherence: d.adherence ?? null }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={clean} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="adhFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15351F" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#15351F" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E2DDD0" strokeDasharray="3 5" />
          <XAxis
            dataKey="label"
            tick={axis}
            axisLine={false}
            tickLine={false}
            interval={Math.max(0, Math.floor(clean.length / 5) - 1)}
            dy={6}
          />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={axis} axisLine={false} tickLine={false} width={40} />
          {showTarget && <ReferenceLine y={70} stroke="#A56A0B" strokeDasharray="4 4" strokeOpacity={0.6} />}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as SeriesPoint;
              return (
                <TipBox>
                  <div className="font-medium">{prettyDate(p.date)}</div>
                  <div className="text-muted">
                    {p.adherence == null ? 'No doses scheduled' : `${p.done}/${p.expected} doses · ${p.adherence}%`}
                  </div>
                </TipBox>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="adherence"
            stroke="#15351F"
            strokeWidth={2}
            fill="url(#adhFill)"
            connectNulls
            dot={false}
            activeDot={{ r: 3.5, fill: '#C8F169', stroke: '#15351F', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TrendChart = ({
  data,
  dataKey,
  color = '#0B0C0E',
  unit = '',
  height = 170,
  label
}: {
  data: SeriesPoint[];
  dataKey: 'hairFall' | 'sleep' | 'stress';
  color?: string;
  unit?: string;
  height?: number;
  label?: string;
}) => (
  <div style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#E2DDD0" strokeDasharray="3 5" />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(data.length / 5) - 1)} dy={6} />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as SeriesPoint;
            return (
              <TipBox>
                <div className="font-medium">{prettyDate(p.date)}</div>
                <div className="text-muted">
                  {label || dataKey}: {p[dataKey] == null ? 'not logged' : `${p[dataKey]}${unit}`}
                </div>
              </TipBox>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          connectNulls
          dot={{ r: 2.4, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: '#C8F169', stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const Sparkline = ({ values, className }: { values: number[]; className?: string }) => {
  if (!values.length) return <div className={cn('h-8', className)} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * 100;
      const y = 30 - ((v - min) / Math.max(1, max - min)) * 26;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn('h-8 w-full', className)}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const heatTone = (level: number) => {
  if (level < 0) return 'bg-ink/[0.045]';
  if (level === 0) return 'bg-ink/[0.08]';
  if (level === 1) return 'bg-forest/20';
  if (level === 2) return 'bg-forest/40';
  if (level === 3) return 'bg-forest/65';
  return 'bg-forest';
};

/** 13-week adherence heatmap, aligned to the real weekday of each cell. */
export const Heatmap = ({ cells }: { cells: HeatCell[] }) => {
  const weeks: (HeatCell | null)[][] = [];
  let col: (HeatCell | null)[] = [];
  const firstDow = cells.length ? new Date(`${cells[0].date}T12:00:00`).getDay() : 1;
  const offset = (firstDow + 6) % 7; // Monday-first grid
  for (let i = 0; i < offset; i += 1) col.push(null);
  cells.forEach((c) => {
    col.push(c);
    if (col.length === 7) {
      weeks.push(col);
      col = [];
    }
  });
  if (col.length) {
    while (col.length < 7) col.push(null);
    weeks.push(col);
  }

  return (
    <div className="flex gap-[5px] overflow-x-auto pb-1 no-scrollbar">
      <div className="mr-1 flex flex-col justify-between py-[1px] text-[9px] uppercase tracking-wider text-muted">
        <span>M</span>
        <span>W</span>
        <span>F</span>
        <span>S</span>
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[5px]">
          {week.map((cell, di) => (
            <div
              key={di}
              title={cell ? `${cell.date} · ${cell.done}/${cell.expected} doses` : ''}
              className={cn(
                'h-[13px] w-[13px] rounded-[3.5px] transition hover:ring-1 hover:ring-ink/30',
                cell ? heatTone(cell.level) : 'bg-transparent',
                cell?.future && 'bg-transparent ring-1 ring-dashed ring-ink/10'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
