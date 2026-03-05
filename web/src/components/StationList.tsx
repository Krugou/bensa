import { useState } from 'react';
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
  const [showAll, setShowAll] = useState(false);

  const filteredStations = showAll ? stations : stations.filter((s) => (s.distance ?? 0) <= 50);
  const hiddenCount = stations.length - filteredStations.length;

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
        <div className="flex flex-col">
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
            {t('stations.count', '{{count}} stations', { count: filteredStations.length })}
          </span>
          {hiddenCount > 0 && !showAll && (
            <span className="text-[10px] font-mono text-fuel-yellow/50">
              {t('stations.hidden', '+{{count}} further away', { count: hiddenCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowAll(!showAll);
            }}
            className="text-[10px] font-mono px-2 py-1 rounded border border-white/10 hover:bg-white/5 transition-colors text-white/40 hover:text-white/60"
          >
            {showAll ? t('stations.show_nearby') : t('stations.show_all')}
          </button>
          <span className="text-[10px] font-mono text-white/25">
            {t('stations.sorted', 'Sorted by price')}
          </span>
        </div>
      </div>

      {filteredStations.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <p className="text-white/40 font-mono text-sm mb-4">
            {t('stations.none_nearby', 'No stations found within 50km')}
          </p>
          <button
            onClick={() => {
              setShowAll(true);
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
          >
            {t('stations.show_all')}
          </button>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStations.map((station, index) => (
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
      )}

      {showAll && hiddenCount > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              setShowAll(false);
            }}
            className="text-[10px] font-mono px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/40"
          >
            {t('stations.show_nearby')}
          </button>
        </div>
      )}
    </div>
  );
};
