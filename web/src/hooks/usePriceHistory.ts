import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { db } from '../firebase';

interface PriceHistoryPoint {
  date: string;
  price95: number;
  price98: number;
  diesel: number;
}

/**
 * Generates and manages price history data for the chart.
 * Fetches from Firestore price_history collection.
 */
export function usePriceHistory(days = 14): {
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
      const historyCol = collection(db, 'price_history');
      const q = query(
        historyCol,
        orderBy('timestamp', 'desc'),
        limit(days * 10), // Fetch enough to cover many stations
      );

      const snapshot = await getDocs(q);

      // Group by date and calculate averages
      const dailyData: Record<
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

        const dateStr = ts.toDate().toISOString().split('T')[0];
        let dayStats = dailyData[dateStr];
        if (!dayStats) {
          dayStats = {
            sum95: 0,
            count95: 0,
            sum98: 0,
            count98: 0,
            sumDiesel: 0,
            countDiesel: 0,
          };
          dailyData[dateStr] = dayStats;
        }

        const prices = data['prices'] as { type: string; price: number }[] | undefined;
        if (!prices) return;

        prices.forEach((p) => {
          if (p.type === '95') {
            dayStats.sum95 += p.price;
            dayStats.count95++;
          } else if (p.type === '98') {
            dayStats.sum98 += p.price;
            dayStats.count98++;
          } else if (p.type === 'diesel') {
            dayStats.sumDiesel += p.price;
            dayStats.countDiesel++;
          }
        });
      });

      const points: PriceHistoryPoint[] = Object.entries(dailyData)
        .filter((entry): entry is [string, NonNullable<(typeof dailyData)[string]>] => !!entry[1])
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
  }, [days]);

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
