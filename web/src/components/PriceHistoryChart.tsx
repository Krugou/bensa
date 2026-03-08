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
import { WeekdayAnalysis } from './WeekdayAnalysis';

export const PriceHistoryChart = () => {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState<PriceGranularity>('daily');
  const [days, setDays] = useState(7);
  const { history, loading } = usePriceHistory(days, granularity);

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center text-white/30 font-mono text-sm">
        {t('chart.loading', 'Loading history...')}
      </div>
    );
  }

  const getRangeLabel = () => {
    if (granularity === 'hourly') return t('chart.title_hourly', 'Recent Hourly Trend');
    if (days === 7) return t('chart.title_7d', '7-Day Price Trend');
    if (days === 30) return t('chart.title_30d', '30-Day Price Trend');
    if (days === 90) return t('chart.title_90d', '90-Day Price Trend');
    if (days === 365) return t('chart.title_1y', 'Yearly Price Trend');
    if (days === 1095) return t('chart.title_3y', '3-Year Price Trend');
    if (days === 3650) return t('chart.title_all', 'All-Time Price Trend');
    return t('chart.title_daily', 'Price Trend');
  };

  return (
    <div id="price-history-chart">
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
              {getRangeLabel()}
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
            {days >= 90 && (
              <button
                onClick={() => {
                  setGranularity('monthly');
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  granularity === 'monthly'
                    ? 'bg-fuel-green text-black'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t('chart.monthly', 'Monthly')}
              </button>
            )}
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

        {granularity !== 'hourly' && (
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start">
            {[7, 30, 90, 365, 1095, 3650].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDays(d);
                  if (d < 90 && granularity === 'monthly') {
                    setGranularity('daily');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  days === d ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {d === 365 ? '1y' : d === 1095 ? '3y' : d === 3650 ? 'All' : `${d}d`}
              </button>
            ))}
          </div>
        )}
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
            <linearGradient id="gradRE85" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffa500" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ffa500" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            tickLine={false}
            interval={granularity === 'hourly' ? 5 : 'preserveStartEnd'}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickFormatter={(value: string) => {
              try {
                const date = new Date(value);
                if (granularity === 'hourly') {
                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                if (granularity === 'monthly') {
                  // value is YYYY-MM
                  return new Date(`${value}-01`).toLocaleDateString([], {
                    month: 'short',
                    year: '2-digit',
                  });
                }
                // Daily: YYYY-MM-DD
                return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
              } catch {
                return value;
              }
            }}
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
            labelFormatter={(value: string) => {
              try {
                const date = new Date(value);
                if (granularity === 'hourly') {
                  return date.toLocaleString([], {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
                if (granularity === 'monthly') {
                  return new Date(`${value}-01`).toLocaleDateString([], {
                    month: 'long',
                    year: 'numeric',
                  });
                }
                return date.toLocaleDateString([], {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                });
              } catch {
                return value;
              }
            }}
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
          <Area
            type="monotone"
            dataKey="re85"
            stroke="#ffa500"
            strokeWidth={2}
            fill="url(#gradRE85)"
            name="RE85"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-3 text-[10px] font-mono text-white/40">
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
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#ffa500] rounded" />
          RE85
        </span>
      </div>

      <WeekdayAnalysis />
    </div>
  );
};
