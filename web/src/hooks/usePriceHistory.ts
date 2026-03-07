import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { db } from '../firebase';

export type PriceGranularity = 'daily' | 'hourly' | 'monthly';

interface PriceHistoryPoint {
  date: string;
  price95: number;
  price98: number;
  diesel: number;
}

/**
 * Generates and manages price history data for the chart.
 * Fetches from Firestore price_averages collection (aggregated) or price_history (raw).
 */
export function usePriceHistory(
  days = 14,
  granularity: PriceGranularity = 'daily',
): {
  history: PriceHistoryPoint[];
  loading: boolean;
  refresh: () => void;
} {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from aggregated price_averages first (much faster)
      const averagesCol = collection(db, 'price_averages');
      // For 365 days, we might have ~2190 records (6 runs/day)
      const qAvg = query(averagesCol, orderBy('timestamp', 'desc'), limit(days * 10));
      const avgSnapshot = await getDocs(qAvg);

      let points: PriceHistoryPoint[] = [];

      if (!avgSnapshot.empty) {
        const groupedData: Record<
          string,
          { sum95: number; sum98: number; sumDiesel: number; count: number }
        > = {};

        avgSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const ts = data['timestamp'] as Timestamp | undefined;
          if (!ts) return;

          const d = ts.toDate();
          let dateKey = d.toISOString().split('T')[0]; // Daily default

          if (granularity === 'monthly') {
            dateKey = dateKey.slice(0, 7); // YYYY-MM
          } else if (granularity === 'hourly') {
            dateKey = `${dateKey} ${String(d.getHours()).padStart(2, '0')}:00`;
          }

          if (!(dateKey in groupedData)) {
            groupedData[dateKey] = { sum95: 0, sum98: 0, sumDiesel: 0, count: 0 };
          }

          const stats = groupedData[dateKey];
          stats.sum95 += (data['avg95'] as number | undefined) ?? 0;
          stats.sum98 += (data['avg98'] as number | undefined) ?? 0;
          stats.sumDiesel += (data['avgDiesel'] as number | undefined) ?? 0;
          stats.count++;
        });

        points = Object.entries(groupedData).map(([date, stats]) => ({
          date,
          price95: Math.round((stats.sum95 / stats.count) * 1000) / 1000,
          price98: Math.round((stats.sum98 / stats.count) * 1000) / 1000,
          diesel: Math.round((stats.sumDiesel / stats.count) * 1000) / 1000,
        }));
      }

      // If price_averages is empty or has very few results (new collection), fall back to price_history
      if (points.length < Math.min(days, 5) && granularity !== 'monthly') {
        const historyCol = collection(db, 'price_history');
        const q = query(historyCol, orderBy('timestamp', 'desc'), limit(days * 300));
        const snapshot = await getDocs(q);

        const groupedData: Record<
          string,
          {
            sum95: number;
            count95: number;
            sum98: number;
            count98: number;
            sumDiesel: number;
            countDiesel: number;
          }
        > = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const ts = data['timestamp'] as Timestamp | undefined;
          if (!ts) return;

          const d = ts.toDate();
          const dateKey =
            granularity === 'hourly'
              ? `${d.toISOString().split('T')[0]} ${String(d.getHours()).padStart(2, '0')}:00`
              : d.toISOString().split('T')[0];

          if (!(dateKey in groupedData)) {
            groupedData[dateKey] = {
              sum95: 0,
              count95: 0,
              sum98: 0,
              count98: 0,
              sumDiesel: 0,
              countDiesel: 0,
            };
          }
          const stats = groupedData[dateKey];

          const prices = data['prices'] as { type: string; price: number }[] | undefined;
          if (!prices) return;

          prices.forEach((p) => {
            if (p.type === '95') {
              stats.sum95 += p.price;
              stats.count95++;
            } else if (p.type === '98') {
              stats.sum98 += p.price;
              stats.count98++;
            } else if (p.type === 'diesel') {
              stats.sumDiesel += p.price;
              stats.countDiesel++;
            }
          });
        });

        points = Object.entries(groupedData).map(([date, stats]) => ({
          date,
          price95: stats.count95 > 0 ? Math.round((stats.sum95 / stats.count95) * 1000) / 1000 : 0,
          price98: stats.count98 > 0 ? Math.round((stats.sum98 / stats.count98) * 1000) / 1000 : 0,
          diesel:
            stats.countDiesel > 0
              ? Math.round((stats.sumDiesel / stats.countDiesel) * 1000) / 1000
              : 0,
        }));
      }

      setHistory(points.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('[usePriceHistory] Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [days, granularity]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    refresh: () => {
      void fetchHistory();
    },
  };
}
