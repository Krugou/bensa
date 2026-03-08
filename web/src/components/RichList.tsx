import React from 'react';
import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { formatPrice } from '../utils/priceUtils';

interface RichListProps {
  stations: GasStation[];
  fuelType: FuelType;
}

export const RichList: React.FC<RichListProps> = ({ stations, fuelType }) => {
  const { t } = useTranslation();

  const expensiveStations = [...stations]
    .sort((a, b) => {
      const pA = a.prices.find((p) => p.type === fuelType)?.price ?? 0;
      const pB = b.prices.find((p) => p.type === fuelType)?.price ?? 0;
      return pB - pA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-xs font-mono uppercase tracking-widest px-1">
        {t('rich_list.desc', 'The "Avoid at all costs" List (Top 5 Most Expensive)')}
      </p>
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
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white/80 truncate">{station.name}</h4>
                  <p className="text-[10px] text-white/30 truncate">{station.city}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-fuel-red/80">
                  {formatPrice(price)}
                </span>
                <span className="text-[10px] text-white/20 ml-1">€/L</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
