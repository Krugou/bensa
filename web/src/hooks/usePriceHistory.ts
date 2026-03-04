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
      // Note: This fetches global average or just latest entries.
      // For a true "average price over time" chart, we might need a more complex query
      // or a separate collection for daily averages.
      // For now, we'll fetch the last N entries to show some data.
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
        const ts = data.timestamp as Timestamp;
        if (!ts) return;

        const dateStr = ts.toDate().toISOString().split('T')[0];
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = {
            sum95: 0,
            count95: 0,
            sum98: 0,
            count98: 0,
            sumDiesel: 0,
            countDiesel: 0,
          };
        }

        const prices = data.prices as { type: string; price: number }[];
        prices.forEach((p) => {
          if (p.type === '95') {
            dailyData[dateStr].sum95 += p.price;
            dailyData[dateStr].count95++;
          } else if (p.type === '98') {
            dailyData[dateStr].sum98 += p.price;
            dailyData[dateStr].count98++;
          } else if (p.type === 'diesel') {
            dailyData[dateStr].sumDiesel += p.price;
            dailyData[dateStr].countDiesel++;
          }
        });
      });

      const points: PriceHistoryPoint[] = Object.entries(dailyData)
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

  return { history, loading, refresh: fetchHistory };
}
