import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { StationCard } from './StationCard';

interface StationListProps {
  stations: GasStation[];
  fuelType: FuelType;
  min: number;
  max: number;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const StationList = ({
  stations,
  fuelType,
  min,
  max,
  favorites = [],
  onToggleFavorite,
}: StationListProps) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'distance'>('price');

  const processedStations = useMemo(() => {
    let list = [...stations];

    // Sort: Favorites first, then by selected criteria
    list = list.sort((a, b) => {
      const isFavA = favorites.includes(a.id);
      const isFavB = favorites.includes(b.id);

      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;

      if (sortBy === 'price') {
        const pA = a.prices.find((p) => p.type === fuelType)?.price ?? Infinity;
        const pB = b.prices.find((p) => p.type === fuelType)?.price ?? Infinity;
        if (pA === pB) return (a.distance ?? 0) - (b.distance ?? 0);
        return pA - pB;
      } else {
        return (a.distance ?? 0) - (b.distance ?? 0);
      }
    });

    return list;
  }, [stations, sortBy, fuelType, favorites]);

  const filteredStations = showAll
    ? processedStations
    : processedStations.filter((s) => (s.distance ?? 0) <= 50);
  const hiddenCount = stations.length - filteredStations.length;

  if (stations.length === 0) {
    return (
      <div className="text-center py-12 text-text-dim font-mono text-sm" id="station-list-empty">
        {t('stations.empty', 'No stations found')}
      </div>
    );
  }

  return (
    <div className="space-y-3" id="station-list">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
            {t('stations.count', '{{count}} stations', { count: filteredStations.length })}
          </span>
          {hiddenCount > 0 && !showAll && (
            <span className="text-[10px] font-mono text-fuel-yellow/50">
              {t('stations.hidden', '+{{count}} further away', { count: hiddenCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-card p-0.5 rounded-lg border border-border-card overflow-hidden">
            <button
              onClick={() => {
                setSortBy('price');
              }}
              className={`px-2 py-1 text-[9px] font-bold uppercase transition-all ${
                sortBy === 'price'
                  ? 'bg-card-hover text-text-main'
                  : 'text-text-dim hover:text-text-muted'
              }`}
            >
              {t('stations.sort_price', 'Price')}
            </button>
            <button
              onClick={() => {
                setSortBy('distance');
              }}
              className={`px-2 py-1 text-[9px] font-bold uppercase transition-all ${
                sortBy === 'distance'
                  ? 'bg-card-hover text-text-main'
                  : 'text-text-dim hover:text-text-muted'
              }`}
            >
              {t('stations.sort_distance', 'Nearest')}
            </button>
          </div>
          <button
            onClick={() => {
              setShowAll(!showAll);
            }}
            className="text-[10px] font-mono px-2 py-1 rounded border border-border-card hover:bg-card transition-colors text-text-muted hover:text-text-main"
          >
            {showAll ? t('stations.show_nearby') : t('stations.show_all')}
          </button>
        </div>
      </div>

      {filteredStations.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border-card border-dashed">
          <p className="text-text-muted font-mono text-sm mb-4">
            {t('stations.none_nearby', 'No stations found within 50km')}
          </p>
          <button
            onClick={() => {
              setShowAll(true);
            }}
            className="px-4 py-2 bg-card-hover hover:bg-card-hover rounded-xl text-xs font-bold transition-all"
          >
            {t('stations.show_all')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-4">
          {filteredStations.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              fuelType={fuelType}
              min={min}
              max={max}
              rank={index + 1}
              isFavorite={favorites.includes(station.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {showAll && hiddenCount > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              setShowAll(false);
            }}
            className="text-[10px] font-mono px-3 py-1.5 rounded-full bg-card border border-border-card hover:bg-card-hover transition-colors text-text-muted"
          >
            {t('stations.show_nearby')}
          </button>
        </div>
      )}
    </div>
  );
};
