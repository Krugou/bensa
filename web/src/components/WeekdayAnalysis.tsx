import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePriceHistory } from '../hooks/usePriceHistory';

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdayNamesFi = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

export const WeekdayAnalysis: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { history, loading } = usePriceHistory(90); // 90 days for better stats

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const days: Record<number, { sum: number; count: number }> = {};
    for (let i = 0; i < 7; i++) days[i] = { sum: 0, count: 0 };

    history.forEach((point) => {
      const d = new Date(point.date);
      const day = d.getDay();
      if (point.price95 > 0) {
        days[day].sum += point.price95;
        days[day].count++;
      }
    });

    const averages = Object.entries(days)
      .map(([day, data]) => ({
        day: parseInt(day),
        avg: data.count > 0 ? data.sum / data.count : Infinity,
      }))
      .filter((d) => d.avg !== Infinity);

    if (averages.length === 0) return null;

    const cheapest = [...averages].sort((a, b) => a.avg - b.avg)[0];
    return {
      averages,
      cheapestDay: cheapest.day,
    };
  }, [history]);

  if (loading)
    return <div className="text-text-dim text-xs animate-pulse">Analyzing trends...</div>;
  if (!stats) return null;

  const names = i18n.language === 'fi' ? weekdayNamesFi : weekdayNames;

  return (
    <div className="mt-6 p-4 rounded-xl bg-card border border-border-card">
      <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
        <span>📅</span> {t('analysis.weekday_title', 'Best Day to Fill Up')}
      </h4>

      <div className="flex justify-between items-end h-24 gap-1">
        {stats.averages.map((d) => {
          const isCheapest = d.day === stats.cheapestDay;
          const maxAvg = Math.max(...stats.averages.map((a) => a.avg));
          const minAvg = Math.min(...stats.averages.map((a) => a.avg));
          const range = maxAvg - minAvg || 1;
          const height = 20 + ((d.avg - minAvg) / range) * 60;

          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ${isCheapest ? 'bg-fuel-green shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'bg-card-hover'}`}
                style={{ height: `${height}%` }}
              />
              <span
                className={`text-[10px] font-bold ${isCheapest ? 'text-fuel-green' : 'text-text-dim'}`}
              >
                {names[d.day]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-text-muted text-center italic">
        {t('analysis.recommendation', {
          day: names[stats.cheapestDay],
          defaultValue: `Historically, ${names[stats.cheapestDay]}s are the cheapest.`,
        })}
      </p>
    </div>
  );
};
