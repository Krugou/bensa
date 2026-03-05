import { useState } from 'react';
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

import { PriceGranularity, usePriceHistory } from '../hooks/usePriceHistory';

export const PriceHistoryChart = () => {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState<PriceGranularity>('daily');
  const { history, loading } = usePriceHistory(7, granularity);

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center text-white/30 font-mono text-sm">
        {t('chart.loading', 'Loading history...')}
      </div>
    );
  }

  return (
    <div id="price-history-chart">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
            {granularity === 'daily'
              ? t('chart.title_daily', '7-Day Price Trend')
              : t('chart.title_hourly', 'Recent Hourly Trend')}
          </h3>
          <span className="text-[10px] font-mono text-white/25 mt-1">€/L</span>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-end sm:self-auto">
          <button
            onClick={() => {
              setGranularity('daily');
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
              granularity === 'daily'
                ? 'bg-fuel-green text-black'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t('chart.daily', 'Daily')}
          </button>
          <button
            onClick={() => {
              setGranularity('hourly');
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
              granularity === 'hourly'
                ? 'bg-fuel-green text-black'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t('chart.hourly', 'Hourly')}
          </button>
        </div>
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
            interval={granularity === 'hourly' ? 5 : 'preserveStartEnd'}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickFormatter={(value: string) =>
              granularity === 'hourly' ? value.split(' ')[1] : value.slice(5)
            }
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
