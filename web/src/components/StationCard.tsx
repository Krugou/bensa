import { formatDistanceToNow } from 'date-fns';
import { enUS, fi } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { Analytics } from '../utils/analytics';
import {
  formatPrice,
  formatPricePerGallon,
  getPriceLevel,
  getPriceLevelClass,
  getPriceLevelColor,
} from '../utils/priceUtils';
import { cleanStationAddress, cleanStationName } from '../utils/stationUtils';
import { DirectionsModal } from './DirectionsModal';

interface StationCardProps {
  station: GasStation;
  fuelType: FuelType;
  min: number;
  max: number;
  rank?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const getBrandIcon = (brand: string) => {
  const b = brand.toLowerCase();
  if (b.includes('neste')) return '💧';
  if (b.includes('st1')) return '🐚';
  if (b.includes('shell')) return '🟡';
  if (b.includes('abc')) return '🍀';
  if (b.includes('seo')) return '🔵';
  if (b.includes('teboil')) return '🔴';
  if (b.includes('gulf')) return '🟠';
  return '⛽';
};

const getBrandColor = (brand: string) => {
  const b = brand.toLowerCase();
  if (b.includes('neste')) return '#004fe0';
  if (b.includes('st1')) return '#ff0000';
  if (b.includes('shell')) return '#ff0000';
  if (b.includes('abc')) return '#00a651';
  if (b.includes('seo')) return '#0054a6';
  return 'var(--border-card)';
};

export const StationCard = ({
  station,
  fuelType,
  min,
  max,
  rank,
  isFavorite,
  onToggleFavorite,
}: StationCardProps) => {
  const { t, i18n } = useTranslation();
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const fuelPrice = station.prices.find((p) => p.type === fuelType);
  const price = fuelPrice?.price ?? 0;

  // Check if price data is stale (older than 7 days)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isStale = fuelPrice?.updatedAt
    ? Date.now() - new Date(fuelPrice.updatedAt).getTime() > SEVEN_DAYS_MS
    : false;

  const level = getPriceLevel(price, min, max);
  const levelColorClass = isStale ? 'text-text-dim' : getPriceLevelClass(level);
  const levelColor = isStale ? 'var(--text-dim)' : getPriceLevelColor(level);
  // Suppress cheap styling for stale data
  const isCheap = !isStale && level === 'cheap';
  const isDirtCheap = !isStale && price <= min + (max - min) * 0.05;

  const hasCoords = (station.lat !== 0 || station.lon !== 0) && !!station.lat && !!station.lon;

  const handleDirectionsClick = () => {
    if (!hasCoords) return;
    setIsDirectionsOpen(true);
    Analytics.trackButtonClick('directions_open_card');
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(station.id);
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const locale = i18n.language === 'fi' ? fi : enUS;
      return formatDistanceToNow(date, { addSuffix: true, locale });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  };

  return (
    <div
      className={`glass-card p-4 xl:p-6 relative overflow-hidden flex flex-col hover:animate-wiggle ${isStale ? 'opacity-70' : ''} ${isDirtCheap ? 'animate-pulse-intense' : isCheap ? 'animate-price-pulse' : ''}`}
      id={`station-${station.id}`}
      style={{
        borderColor: isDirtCheap ? '#00ff88' : isCheap ? `${levelColor}40` : undefined,
        boxShadow: isDirtCheap ? '0 0 30px rgba(0, 255, 136, 0.4)' : undefined,
      }}
    >
      {/* Rank badge and Favorite Button */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
        <button
          onClick={handleFavoriteClick}
          className={`w-7 h-7 xl:w-9 xl:h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
            isFavorite
              ? 'bg-fuel-yellow/20 border border-fuel-yellow/40 text-fuel-yellow scale-110 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
              : 'bg-card border border-border-card text-text-dim hover:text-text-muted hover:bg-card-hover'
          }`}
          title={
            isFavorite
              ? t('station.remove_favorite', 'Remove from favorites')
              : t('station.add_favorite', 'Add to favorites')
          }
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="xl:w-5 xl:h-5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>

        {rank !== undefined && (
          <div className="w-7 h-7 xl:w-9 xl:h-9 rounded-full bg-card border border-border-card flex items-center justify-center text-[10px] xl:text-xs font-mono text-text-muted font-bold">
            #{rank}
          </div>
        )}
      </div>

      {/* Glow effect for cheap stations */}
      {isCheap && (
        <div
          className="absolute -top-10 -right-10 w-28 h-28 xl:w-40 xl:h-40 rounded-full blur-[50px] opacity-20 pointer-events-none"
          style={{ background: levelColor }}
        />
      )}

      {/* Brand & name */}
      <div className="flex items-start gap-3 xl:gap-4">
        <div
          className="w-10 h-10 xl:w-14 xl:h-14 rounded-lg xl:rounded-xl bg-card border border-border-card flex items-center justify-center text-lg xl:text-2xl flex-shrink-0"
          style={{ borderBottom: `2px solid ${getBrandColor(station.brand)}` }}
        >
          {getBrandIcon(station.brand)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] xl:text-[11px] font-black uppercase tracking-tighter text-text-dim font-mono">
              {station.brand}
            </span>
          </div>
          <h3 className="font-bold text-sm xl:text-lg text-text-main break-all leading-tight transition-colors group-hover:text-white dark:group-hover:text-white">
            {cleanStationName(station.name, station.brand)}
          </h3>
          <p className="text-[11px] xl:text-sm text-text-muted font-mono break-all mt-0.5">
            {cleanStationAddress(station.address, station.name, station.city)}, {station.city}
          </p>
        </div>
      </div>

      {/* Price display */}
      <div className="mt-4 xl:mt-6 flex items-end justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl md:text-3xl xl:text-4xl font-extrabold font-mono ${levelColorClass} transition-colors duration-300`}
            >
              {formatPrice(price)}
            </span>
            {station.sourceUrl && (
              <a
                href={station.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-dim hover:text-text-muted transition-colors p-1"
                title={t('station.source_link', 'View data source')}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="xl:w-5 xl:h-5"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 -mt-1 xl:mt-0">
            <span className="text-[10px] xl:text-xs text-text-muted font-mono">
              €/{t('common.liter', 'L')}
            </span>
            <span className="text-[9px] xl:text-[10px] text-text-dim font-mono italic">
              (${formatPricePerGallon(price)}/gal)
            </span>
          </div>
        </div>

        {/* Distance */}
        {station.distance !== undefined && hasCoords && (
          <div className="text-right">
            <span className="text-sm xl:text-lg font-mono text-text-muted">{station.distance}</span>
            <span className="text-[10px] xl:text-xs text-text-dim ml-0.5">km</span>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* All fuel types row */}
      <div className="mt-3 xl:mt-5 pt-3 xl:pt-5 border-t border-border-card flex justify-between text-[10px] xl:text-xs font-mono text-text-muted">
        {station.prices.map((fp) => (
          <div key={fp.type} className="flex flex-col items-center">
            <span className={fp.type === fuelType ? 'text-text-main font-bold' : ''}>
              {fp.type === 'diesel' ? 'DSL' : fp.type}: {formatPrice(fp.price)}
            </span>
            <span className="text-[8px] opacity-40 italic">
              (${formatPricePerGallon(fp.price)})
            </span>
          </div>
        ))}
      </div>

      {hasCoords && (
        <div className="mt-3 xl:mt-5 flex gap-2">
          <button
            onClick={handleDirectionsClick}
            className="flex-1 bg-card hover:bg-card-hover border border-border-card rounded-lg xl:rounded-xl py-2 xl:py-3 text-center text-[10px] xl:text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-all duration-300 cursor-pointer focus:outline-none"
          >
            📍 {t('station.directions')}
          </button>
        </div>
      )}

      {/* Directions Modal */}
      {hasCoords && (
        <DirectionsModal
          isOpen={isDirectionsOpen}
          onClose={() => {
            setIsDirectionsOpen(false);
          }}
          lat={station.lat}
          lon={station.lon}
          stationName={station.name}
        />
      )}

      {/* Last updated */}
      {fuelPrice?.updatedAt && (
        <p
          className={`mt-2 text-[9px] xl:text-[11px] font-mono ${isStale ? 'text-fuel-yellow/60' : 'text-text-dim'}`}
        >
          {isStale && '⚠️ '}
          {t('station.updated', 'Updated')}: {getRelativeTime(fuelPrice.updatedAt)}
        </p>
      )}
    </div>
  );
};
