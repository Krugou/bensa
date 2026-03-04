import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { StationCard } from './StationCard';

interface StationListProps {
  stations: GasStation[];
  fuelType: FuelType;
  min: number;
  max: number;
}

export const StationList = ({ stations, fuelType, min, max }: StationListProps) => {
  const { t } = useTranslation();

  if (stations.length === 0) {
    return (
      <div className="text-center py-12 text-white/30 font-mono text-sm" id="station-list-empty">
        {t('stations.empty', 'No stations found')}
      </div>
    );
  }

  return (
    <div className="space-y-3" id="station-list">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
          {t('stations.count', '{{count}} stations', { count: stations.length })}
        </span>
        <span className="text-[10px] font-mono text-white/25">
          {t('stations.sorted', 'Sorted by price')}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stations.map((station, index) => (
          <StationCard
            key={station.id}
            station={station}
            fuelType={fuelType}
            min={min}
            max={max}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
};
