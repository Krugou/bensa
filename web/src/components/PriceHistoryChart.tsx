import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { PriceGranularity, PriceHistoryRange } from '../hooks/usePriceHistory';
import { WeekdayAnalysis } from './WeekdayAnalysis';

type RangePresetId =
  | '7d'
  | '30d'
  | '90d'
  | '6m'
  | '9m'
  | '1y'
  | '18m'
  | '2y'
  | '3y'
  | '5y'
  | 'all'
  | 'custom';

interface RangePreset {
  id: Exclude<RangePresetId, 'custom'>;
  label: string;
  days?: number;
  months?: number;
  titleKey: string;
  defaultTitle: string;
}

const RANGE_PRESETS: RangePreset[] = [
  { id: '7d', label: '7d', days: 7, titleKey: 'chart.title_7d', defaultTitle: '7-Day Price Trend' },
  {
    id: '30d',
    label: '30d',
    days: 30,
    titleKey: 'chart.title_30d',
    defaultTitle: '30-Day Price Trend',
  },
  {
    id: '90d',
    label: '90d',
    days: 90,
    titleKey: 'chart.title_90d',
    defaultTitle: '90-Day Price Trend',
  },
  {
    id: '6m',
    label: '6m',
    months: 6,
    titleKey: 'chart.title_6m',
    defaultTitle: '6-Month Price Trend',
  },
  {
    id: '9m',
    label: '9m',
    months: 9,
    titleKey: 'chart.title_9m',
    defaultTitle: '9-Month Price Trend',
  },
  {
    id: '1y',
    label: '1y',
    months: 12,
    titleKey: 'chart.title_1y',
    defaultTitle: 'Yearly Price Trend',
  },
  {
    id: '18m',
    label: '18m',
    months: 18,
    titleKey: 'chart.title_18m',
    defaultTitle: '18-Month Price Trend',
  },
  {
    id: '2y',
    label: '2y',
    months: 24,
    titleKey: 'chart.title_2y',
    defaultTitle: '2-Year Price Trend',
  },
  {
    id: '3y',
    label: '3y',
    months: 36,
    titleKey: 'chart.title_3y',
    defaultTitle: '3-Year Price Trend',
  },
  {
    id: '5y',
    label: '5y',
    months: 60,
    titleKey: 'chart.title_5y',
    defaultTitle: '5-Year Price Trend',
  },
  {
    id: 'all',
    label: 'All',
    titleKey: 'chart.title_all',
    defaultTitle: 'All-Time Price Trend',
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDateInput = (value: string, endOfDay = false) => {
  const [year, month, day] = value.split('-').map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day);
};

const getPresetRange = (presetId: Exclude<RangePresetId, 'custom'>): PriceHistoryRange => {
  const endDate = new Date();
  const preset = RANGE_PRESETS.find(({ id }) => id === presetId);
  const startDate = presetId === 'all' ? new Date(0) : new Date(endDate);

  if (preset?.months) {
    const dayOfMonth = startDate.getDate();
    startDate.setDate(1);
    startDate.setMonth(startDate.getMonth() - preset.months);
    startDate.setDate(
      Math.min(
        dayOfMonth,
        new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate(),
      ),
    );
  } else if (preset?.days) {
    startDate.setDate(startDate.getDate() - preset.days);
  }

  return { startDate, endDate };
};

export const PriceHistoryChart = () => {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState<PriceGranularity>('daily');
  const [rangePreset, setRangePreset] = useState<RangePresetId>('7d');
  const [customStartDate, setCustomStartDate] = useState(() =>
    formatDateInput(new Date(Date.now() - 30 * DAY_MS)),
  );
  const [customEndDate, setCustomEndDate] = useState(() => formatDateInput(new Date()));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const dateRange = useMemo(
    () =>
      rangePreset === 'custom'
        ? {
            startDate: parseDateInput(customStartDate),
            endDate: parseDateInput(customEndDate, true),
          }
        : getPresetRange(rangePreset),
    [customEndDate, customStartDate, rangePreset],
  );
  const days = Math.max(
    1,
    Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / DAY_MS),
  );
  const { history, loading, error, refresh } = usePriceHistory(days, granularity, dateRange);
  const monthlyAvailable = days >= 90;
  const hourlyAvailable = days <= 30;

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === chartRef.current);
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
    };
  }, []);

  useEffect(() => {
    if (
      (!monthlyAvailable && granularity === 'monthly') ||
      (!hourlyAvailable && granularity === 'hourly')
    ) {
      setGranularity('daily');
    }
  }, [granularity, hourlyAvailable, monthlyAvailable]);

  const getRangeLabel = () => {
    if (granularity === 'hourly') return t('chart.title_hourly', 'Recent Hourly Trend');
    if (rangePreset === 'custom') return t('chart.title_custom', 'Custom price trend');
    const preset = RANGE_PRESETS.find(({ id }) => id === rangePreset);
    return preset ? t(preset.titleKey, preset.defaultTitle) : t('chart.title_daily', 'Price Trend');
  };

  const chartContent = (
    <div
      id="price-history-chart"
      ref={chartRef}
      aria-busy={loading}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] overflow-y-auto bg-[#090c10] p-4 text-white md:p-8'
          : ''
      }
    >
      <div className={isFullscreen ? 'mx-auto min-h-full max-w-[1600px]' : ''}>
        <div className="flex flex-col mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">
                {getRangeLabel()}
              </h3>
              <span className="text-[10px] font-mono text-white/25 mt-1">€/L</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    setGranularity('daily');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    granularity === 'daily'
                      ? 'bg-fuel-green text-black'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  aria-pressed={granularity === 'daily'}
                  type="button"
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
                    aria-pressed={granularity === 'monthly'}
                    type="button"
                  >
                    {t('chart.monthly', 'Monthly')}
                  </button>
                )}
                {hourlyAvailable && (
                  <button
                    onClick={() => {
                      setGranularity('hourly');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      granularity === 'hourly'
                        ? 'bg-fuel-green text-black'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                    aria-pressed={granularity === 'hourly'}
                    type="button"
                  >
                    {t('chart.hourly', 'Hourly')}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const chartElement = chartRef.current;
                  if (!chartElement) {
                    console.error('[PriceHistoryChart] Chart element is unavailable.');
                    return;
                  }

                  const fullscreenAction =
                    document.fullscreenElement === chartElement
                      ? document.exitFullscreen()
                      : chartElement.requestFullscreen();
                  void fullscreenAction.catch((error: unknown) => {
                    console.error('[PriceHistoryChart] Fullscreen action failed:', error);
                  });
                }}
                aria-label={
                  isFullscreen
                    ? t('chart.exit_fullscreen', 'Exit full screen')
                    : t('chart.fullscreen', 'View chart full screen')
                }
                title={
                  isFullscreen
                    ? t('chart.exit_fullscreen', 'Exit full screen')
                    : t('chart.fullscreen', 'View chart full screen')
                }
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isFullscreen ? (
                    <path d="M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5" />
                  ) : (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {loading && (
            <p className="mb-3 text-center text-xs text-white/50" role="status">
              {t('chart.loading', 'Loading history...')}
            </p>
          )}
          {error && (
            <div
              className="mb-3 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200"
              role="alert"
            >
              <span>{t('chart.load_error', 'Price history could not be loaded.')}</span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-200/10"
              >
                {t('chart.retry', 'Try again')}
              </button>
            </div>
          )}
          {!loading && !error && history.length === 0 && (
            <p className="mb-3 text-center text-sm text-white/50" role="status">
              {t('chart.no_data', 'No price history is available for this date range.')}
            </p>
          )}

          <div
            className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start"
            role="group"
            aria-label={t('chart.date_range', 'Date range')}
          >
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setRangePreset(preset.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  rangePreset === preset.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
                aria-pressed={rangePreset === preset.id}
                type="button"
              >
                {preset.id === 'all' ? t('chart.range_all', 'All') : preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setRangePreset('custom');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                rangePreset === 'custom'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              aria-pressed={rangePreset === 'custom'}
            >
              {t('chart.range_custom', 'Custom')}
            </button>
          </div>

          {rangePreset === 'custom' && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {t('chart.start_date', 'Start date')}
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate}
                  aria-label={t('chart.start_date', 'Start date')}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (!value) return;
                    setCustomStartDate(value);
                    if (value > customEndDate) setCustomEndDate(value);
                    setRangePreset('custom');
                  }}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {t('chart.end_date', 'End date')}
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  max={formatDateInput(new Date())}
                  aria-label={t('chart.end_date', 'End date')}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (!value) return;
                    setCustomEndDate(value);
                    if (value < customStartDate) setCustomStartDate(value);
                    setRangePreset('custom');
                  }}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
          )}
        </div>

        <div
          className={
            isFullscreen
              ? 'h-[62vh] min-h-[320px] max-h-[720px]'
              : 'h-[360px] md:h-[440px] xl:h-[500px]'
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
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
                    if (granularity === 'monthly') {
                      // value is YYYY-MM — parse manually to avoid cross-browser issues
                      const [year, month] = value.split('-').map(Number);
                      const date = new Date(year, month - 1, 1);
                      return date.toLocaleDateString(undefined, {
                        month: 'short',
                        year: '2-digit',
                      });
                    }
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return value;
                    if (granularity === 'hourly') {
                      return date.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                    // Daily: YYYY-MM-DD
                    return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
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
                labelFormatter={(value: any) => {
                  try {
                    if (granularity === 'monthly') {
                      const [year, month] = String(value).split('-').map(Number);
                      const date = new Date(year, month - 1, 1);
                      return date.toLocaleDateString(undefined, {
                        month: 'long',
                        year: 'numeric',
                      });
                    }
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return String(value);
                    if (granularity === 'hourly') {
                      return date.toLocaleString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                    return date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    });
                  } catch {
                    return String(value);
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
        </div>

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
    </div>
  );
  return chartContent;
};
