import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { Query, QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';

import { db } from '../firebase';

export type PriceGranularity = 'daily' | 'hourly' | 'monthly';

export interface PriceHistoryRange {
  startDate: Date;
  endDate: Date;
}

interface PriceHistoryPoint {
  date: string;
  price95: number;
  price98: number;
  diesel: number;
  re85: number;
}

const MAX_QUERY_PAGE_SIZE = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;

async function forEachQueryDocument(
  baseQuery: Query,
  onDocument: (doc: QueryDocumentSnapshot) => void,
): Promise<void> {
  let cursor: QueryDocumentSnapshot | undefined;

  while (true) {
    const pageQuery = cursor
      ? query(baseQuery, startAfter(cursor), limit(MAX_QUERY_PAGE_SIZE))
      : query(baseQuery, limit(MAX_QUERY_PAGE_SIZE));
    const snapshot = await getDocs(pageQuery);

    snapshot.docs.forEach(onDocument);

    if (snapshot.size < MAX_QUERY_PAGE_SIZE) return;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
}

/**
 * Generates and manages price history data for the chart.
 * Fetches from Firestore price_averages collection (aggregated) or price_history (raw).
 */
export function usePriceHistory(
  days = 14,
  granularity: PriceGranularity = 'daily',
  dateRange?: PriceHistoryRange,
): {
  history: PriceHistoryPoint[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
} {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const fetchHistory = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    const endDate = dateRange?.endDate ?? new Date();
    const startDate = dateRange?.startDate ?? new Date(endDate.getTime() - days * DAY_MS);
    const rangeDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS));
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    setLoading(true);
    setError(false);
    try {
      // Try to fetch from aggregated price_averages first (much faster)
      const averagesCol = collection(db, 'price_averages');
      const qAvg = query(
        averagesCol,
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp', 'desc'),
      );

      const averages: Record<
        string,
        { sum95: number; sum98: number; sumDiesel: number; sumRE85: number; count: number }
      > = {};

      await forEachQueryDocument(qAvg, (doc) => {
        const data = doc.data();
        const ts = data['timestamp'] as Timestamp | undefined;
        if (!ts) return;

        const d = ts.toDate();
        let dateKey = d.toISOString().split('T')[0];

        if (granularity === 'monthly') {
          dateKey = dateKey.slice(0, 7);
        } else if (granularity === 'hourly') {
          dateKey = `${dateKey}T${String(d.getHours()).padStart(2, '0')}:00:00`;
        }

        if (!(dateKey in averages)) {
          averages[dateKey] = { sum95: 0, sum98: 0, sumDiesel: 0, sumRE85: 0, count: 0 };
        }

        const stats = averages[dateKey];
        stats.sum95 += (data['avg95'] as number | undefined) ?? 0;
        stats.sum98 += (data['avg98'] as number | undefined) ?? 0;
        stats.sumDiesel += (data['avgDiesel'] as number | undefined) ?? 0;
        stats.sumRE85 += (data['avgRE85'] as number | undefined) ?? 0;
        stats.count++;
      });

      let points = Object.entries(averages).map(([date, stats]) => ({
        date,
        price95: Math.round((stats.sum95 / stats.count) * 1000) / 1000,
        price98: Math.round((stats.sum98 / stats.count) * 1000) / 1000,
        diesel: Math.round((stats.sumDiesel / stats.count) * 1000) / 1000,
        re85: Math.round((stats.sumRE85 / stats.count) * 1000) / 1000,
      }));

      // If price_averages is empty or has very few results (new collection), fall back to price_history
      if (points.length < Math.min(rangeDays, 5) && granularity !== 'monthly' && rangeDays <= 30) {
        const historyCol = collection(db, 'price_history');
        const q = query(
          historyCol,
          where('timestamp', '>=', startTimestamp),
          where('timestamp', '<=', endTimestamp),
          orderBy('timestamp', 'desc'),
        );

        const rawHistory: Record<
          string,
          {
            sum95: number;
            count95: number;
            sum98: number;
            count98: number;
            sumDiesel: number;
            countDiesel: number;
            sumRE85: number;
            countRE85: number;
          }
        > = {};

        await forEachQueryDocument(q, (doc) => {
          const data = doc.data();
          const ts = data['timestamp'] as Timestamp | undefined;
          if (!ts) return;

          const d = ts.toDate();
          const dateKey =
            granularity === 'hourly'
              ? `${d.toISOString().split('T')[0]}T${String(d.getHours()).padStart(2, '0')}:00:00`
              : d.toISOString().split('T')[0];

          if (!(dateKey in rawHistory)) {
            rawHistory[dateKey] = {
              sum95: 0,
              count95: 0,
              sum98: 0,
              count98: 0,
              sumDiesel: 0,
              countDiesel: 0,
              sumRE85: 0,
              countRE85: 0,
            };
          }
          const stats = rawHistory[dateKey];

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
            } else if (p.type === 're85') {
              stats.sumRE85 += p.price;
              stats.countRE85++;
            }
          });
        });

        points = Object.entries(rawHistory).map(([date, stats]) => ({
          date,
          price95: stats.count95 > 0 ? Math.round((stats.sum95 / stats.count95) * 1000) / 1000 : 0,
          price98: stats.count98 > 0 ? Math.round((stats.sum98 / stats.count98) * 1000) / 1000 : 0,
          diesel:
            stats.countDiesel > 0
              ? Math.round((stats.sumDiesel / stats.countDiesel) * 1000) / 1000
              : 0,
          re85:
            stats.countRE85 > 0 ? Math.round((stats.sumRE85 / stats.countRE85) * 1000) / 1000 : 0,
        }));
      }

      if (currentRequestId === requestId.current) {
        setHistory(points.sort((a, b) => a.date.localeCompare(b.date)));
      }
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      console.error('[usePriceHistory] Failed to fetch history:', error);
      setHistory([]);
      setError(true);
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
      }
    }
  }, [dateRange, days, granularity]);

  useEffect(() => {
    void fetchHistory();
    return () => {
      requestId.current++;
    };
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refresh: () => {
      void fetchHistory();
    },
  };
}
