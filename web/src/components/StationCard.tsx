import { formatDistanceToNow } from 'date-fns';
import { enUS, fi } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { Analytics } from '../utils/analytics';
import {
  formatPrice,
  getPriceLevel,
  getPriceLevelClass,
  getPriceLevelColor,
} from '../utils/priceUtils';
import { DirectionsModal } from './DirectionsModal';

interface StationCardProps {
  station: GasStation;
  fuelType: FuelType;
  min: number;
  max: number;
  rank?: number;
}

export const StationCard = ({ station, fuelType, min, max, rank }: StationCardProps) => {
  const { t, i18n } = useTranslation();
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const fuelPrice = station.prices.find((p) => p.type === fuelType);
  const price = fuelPrice?.price ?? 0;
  const level = getPriceLevel(price, min, max);
  const levelColorClass = getPriceLevelClass(level);
  const levelColor = getPriceLevelColor(level);
  const isCheap = level === 'cheap';
  const isDirtCheap = price <= min + (max - min) * 0.05;

  const hasCoords = (station.lat !== 0 || station.lon !== 0) && !!station.lat && !!station.lon;

  const handleDirectionsClick = () => {
    if (!hasCoords) return;
    setIsDirectionsOpen(true);
    Analytics.trackButtonClick('directions_open_card');
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
      className={`glass-card p-4 relative overflow-hidden flex flex-col hover:animate-wiggle ${isDirtCheap ? 'animate-pulse-intense' : isCheap ? 'animate-price-pulse' : ''}`}
      id={`station-${station.id}`}
      style={{
        borderColor: isDirtCheap ? '#00ff88' : isCheap ? `${levelColor}40` : undefined,
        boxShadow: isDirtCheap ? '0 0 30px rgba(0, 255, 136, 0.4)' : undefined,
      }}
    >
      {/* Rank badge */}
      {rank !== undefined && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-mono text-white/40 font-bold">
          #{rank}
        </div>
      )}

      {/* Glow effect for cheap stations */}
      {isCheap && (
        <div
          className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] opacity-20 pointer-events-none"
          style={{ background: levelColor }}
        />
      )}

      {/* Brand & name */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-lg flex-shrink-0">
          ⛽
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-white/90 truncate">{station.name}</h3>
          <p className="text-[11px] text-white/40 font-mono truncate">
            {station.address}, {station.city}
          </p>
        </div>
      </div>

      {/* Price display */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl md:text-3xl font-extrabold font-mono ${levelColorClass} transition-colors duration-300`}
            >
              {formatPrice(price)}
            </span>
            {station.sourceUrl && (
              <a
                href={station.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/20 hover:text-white/60 transition-colors p-1"
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
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            )}
          </div>
          <span className="text-xs text-white/30 ml-1">€/L</span>
        </div>

        {/* Distance */}
        {station.distance !== undefined && hasCoords && (
          <div className="text-right">
            <span className="text-sm font-mono text-white/50">{station.distance}</span>
            <span className="text-[10px] text-white/30 ml-0.5">km</span>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* All fuel types row */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-[10px] font-mono text-white/35">
        {station.prices.map((fp) => (
          <span key={fp.type} className={fp.type === fuelType ? 'text-white/70 font-bold' : ''}>
            {fp.type === 'diesel' ? 'DSL' : fp.type}: {formatPrice(fp.price)}
          </span>
        ))}
      </div>

      {hasCoords && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDirectionsClick}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all duration-300 cursor-pointer focus:outline-none"
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
        <p className="mt-2 text-[9px] text-white/20 font-mono">
          {t('station.updated', 'Updated')}: {getRelativeTime(fuelPrice.updatedAt)}
        </p>
      )}
    </div>
  );
};
