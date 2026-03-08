import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { formatPrice } from '../utils/priceUtils';

interface RichListProps {
  stations: GasStation[];
  fuelType: FuelType;
}

export const RichList: React.FC<RichListProps> = ({ stations, fuelType }) => {
  const { t } = useTranslation();
  const [showAllFinland, setShowAllFinland] = useState(false);

  const expensiveStations = useMemo(() => {
    let list = [...stations];

    // Default to 50km radius if not showing all Finland
    if (!showAllFinland) {
      list = list.filter((s) => (s.distance ?? 0) <= 50);
    }

    return list
      .sort((a, b) => {
        const pA = a.prices.find((p) => p.type === fuelType)?.price ?? 0;
        const pB = b.prices.find((p) => p.type === fuelType)?.price ?? 0;
        return pB - pA;
      })
      .slice(0, 5);
  }, [stations, fuelType, showAllFinland]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-text-muted text-[10px] font-mono uppercase tracking-widest">
          {showAllFinland
            ? t('rich_list.desc_all', 'Top 5 Most Expensive (All Finland)')
            : t('rich_list.desc_nearby', 'Top 5 Most Expensive (Within 50km)')}
        </p>
        <button
          onClick={() => {
            setShowAllFinland(!showAllFinland);
          }}
          className="text-[10px] font-bold text-fuel-red/60 hover:text-fuel-red transition-colors uppercase tracking-tighter cursor-pointer"
        >
          {showAllFinland
            ? t('rich_list.show_nearby', 'Show Nearby')
            : t('rich_list.show_all', 'Show All Finland')}
        </button>
      </div>

      {expensiveStations.length > 0 ? (
        <div className="space-y-2">
          {expensiveStations.map((station, index) => {
            const price = station.prices.find((p) => p.type === fuelType)?.price ?? 0;
            return (
              <div
                key={station.id}
                className="flex items-center justify-between p-3 rounded-xl bg-fuel-red/5 border border-fuel-red/10 hover:bg-fuel-red/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-fuel-red/40 italic">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-text-main break-all leading-tight">
                      {station.name}
                    </h4>
                    <p className="text-[10px] text-text-muted break-all mt-0.5">
                      {station.city} {station.distance !== undefined && `(${station.distance}km)`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-fuel-red/80">
                    {formatPrice(price)}
                  </span>
                  <span className="text-[10px] text-text-dim ml-1">€/L</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center bg-card border border-border-card border-dashed rounded-xl">
          <p className="text-text-dim text-xs font-mono">
            {t('rich_list.none_nearby', 'No expensive stations found nearby.')}
          </p>
        </div>
      )}
    </div>
  );
};
