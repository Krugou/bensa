import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { usePriceHistory } from '../hooks/usePriceHistory';

export const PriceHistoryChart = () => {
  const { t } = useTranslation();
  const { history, loading } = usePriceHistory(14);

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center text-white/30 font-mono text-sm">
        {t('chart.loading', 'Loading history...')}
      </div>
    );
  }

  return (
    <div id="price-history-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
          {t('chart.title', '14-Day Price Trend')}
        </h3>
        <span className="text-[10px] font-mono text-white/25">€/L</span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="grad95" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad98" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd700" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ffd700" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDiesel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickFormatter={(value: string) => value.slice(5)} // MM-DD
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickFormatter={(value: number) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 10, 20, 0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <Area
            type="monotone"
            dataKey="price95"
            stroke="#00ff88"
            strokeWidth={2}
            fill="url(#grad95)"
            name="95E10"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="price98"
            stroke="#ffd700"
            strokeWidth={2}
            fill="url(#grad98)"
            name="98E5"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="diesel"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#gradDiesel)"
            name="Diesel"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-3 text-[10px] font-mono text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-fuel-green rounded" />
          95E10
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-fuel-yellow rounded" />
          98E5
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-bensa-cyan rounded" />
          Diesel
        </span>
      </div>
    </div>
  );
};
