import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { db } from '../firebase';

export type PriceGranularity = 'daily' | 'hourly';

interface PriceHistoryPoint {
  date: string;
  price95: number;
  price98: number;
  diesel: number;
}

/**
 * Generates and manages price history data for the chart.
 * Fetches from Firestore price_history collection.
 * Supports daily and hourly granularity.
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
      // Query the price_history collection
      // Each scraper run creates ~200+ records (one per station),
      // so we need a much higher limit to cover multiple days.
      const historyCol = collection(db, 'price_history');
      const q = query(historyCol, orderBy('timestamp', 'desc'), limit(days * 300));

      const snapshot = await getDocs(q);

      // Group by date key (daily: YYYY-MM-DD, hourly: YYYY-MM-DD HH:00)
      const groupedData: Record<
        string,
        | {
            sum95: number;
            count95: number;
            sum98: number;
            count98: number;
            sumDiesel: number;
            countDiesel: number;
          }
        | undefined
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

        let stats = groupedData[dateKey];
        if (!stats) {
          stats = {
            sum95: 0,
            count95: 0,
            sum98: 0,
            count98: 0,
            sumDiesel: 0,
            countDiesel: 0,
          };
          groupedData[dateKey] = stats;
        }

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

      const points: PriceHistoryPoint[] = Object.entries(groupedData)
        .filter((entry): entry is [string, NonNullable<(typeof groupedData)[string]>] => !!entry[1])
        .map(([date, stats]) => ({
          date,
          price95: stats.count95 > 0 ? Math.round((stats.sum95 / stats.count95) * 1000) / 1000 : 0,
          price98: stats.count98 > 0 ? Math.round((stats.sum98 / stats.count98) * 1000) / 1000 : 0,
          diesel:
            stats.countDiesel > 0
              ? Math.round((stats.sumDiesel / stats.countDiesel) * 1000) / 1000
              : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setHistory(points);
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
