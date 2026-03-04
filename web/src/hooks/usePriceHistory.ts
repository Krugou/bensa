import { useCallback, useEffect, useState } from 'react';

interface PriceHistoryPoint {
  date: string;
  price95: number;
  price98: number;
  diesel: number;
}

/**
 * Generates and manages price history data for the chart.
 * In production, this would fetch from an API. For now, generates mock trend data.
 */
export function usePriceHistory(days = 14): {
  history: PriceHistoryPoint[];
  loading: boolean;
  refresh: () => void;
} {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const generateHistory = useCallback(() => {
    setLoading(true);
    const data: PriceHistoryPoint[] = [];
    const now = new Date();

    // Base prices with realistic fluctuation
    let base95 = 1.78;
    let base98 = 1.88;
    let baseDiesel = 1.68;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Add slight daily variation
      base95 += (Math.random() - 0.48) * 0.02;
      base98 += (Math.random() - 0.48) * 0.02;
      baseDiesel += (Math.random() - 0.48) * 0.02;

      // Clamp to realistic range
      base95 = Math.max(1.65, Math.min(1.95, base95));
      base98 = Math.max(1.75, Math.min(2.05, base98));
      baseDiesel = Math.max(1.55, Math.min(1.85, baseDiesel));

      data.push({
        date: date.toISOString().split('T')[0],
        price95: Math.round(base95 * 1000) / 1000,
        price98: Math.round(base98 * 1000) / 1000,
        diesel: Math.round(baseDiesel * 1000) / 1000,
      });
    }

    setHistory(data);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    generateHistory();
  }, [generateHistory]);

  return { history, loading, refresh: generateHistory };
}
