import { useTranslation } from 'react-i18next';

import { FuelType, GasStation } from '../types';
import { formatPrice, getPriceLevel, getPriceLevelClass, getPriceLevelColor } from '../utils/priceUtils';

interface StationCardProps {
  station: GasStation;
  fuelType: FuelType;
  min: number;
  max: number;
  rank?: number;
}

export const StationCard = ({ station, fuelType, min, max, rank }: StationCardProps) => {
  const { t } = useTranslation();
  const fuelPrice = station.prices.find((p) => p.type === fuelType);
  const price = fuelPrice?.price ?? 0;
  const level = getPriceLevel(price, min, max);
  const levelColorClass = getPriceLevelClass(level);
  const levelColor = getPriceLevelColor(level);
  const isCheap = level === 'cheap';

  return (
    <div
      className={`glass-card p-4 relative overflow-hidden ${isCheap ? 'animate-price-pulse' : ''}`}
      id={`station-${station.id}`}
      style={{
        borderColor: isCheap ? `${levelColor}40` : undefined,
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
          <span
            className={`text-2xl md:text-3xl font-extrabold font-mono ${levelColorClass} transition-colors duration-300`}
          >
            {formatPrice(price)}
          </span>
          <span className="text-xs text-white/30 ml-1">€/L</span>
        </div>

        {/* Distance */}
        {station.distance !== undefined && (
          <div className="text-right">
            <span className="text-sm font-mono text-white/50">{station.distance}</span>
            <span className="text-[10px] text-white/30 ml-0.5">km</span>
          </div>
        )}
      </div>

      {/* All fuel types row */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between text-[10px] font-mono text-white/35">
        {station.prices.map((fp) => (
          <span key={fp.type} className={fp.type === fuelType ? 'text-white/70 font-bold' : ''}>
            {fp.type === 'diesel' ? 'DSL' : fp.type}: {formatPrice(fp.price)}
          </span>
        ))}
      </div>

      {/* Last updated */}
      {fuelPrice?.updatedAt && (
        <p className="mt-2 text-[9px] text-white/20 font-mono">
          {t('station.updated', 'Updated')}: {new Date(fuelPrice.updatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};
