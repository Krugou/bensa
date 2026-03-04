import { useTranslation } from 'react-i18next';

import { PriceLevel } from '../types';
import {
  formatPrice,
  getPriceLevel,
  getPriceLevelClass,
  getPriceLevelColor,
  getPriceLevelGlow,
} from '../utils/priceUtils';

interface PriceGaugeProps {
  average: number;
  min: number;
  max: number;
  fuelTypeLabel: string;
}

export const PriceGauge = ({ average, min, max, fuelTypeLabel }: PriceGaugeProps) => {
  const { t } = useTranslation();

  // Normalize to 0-1 range
  const range = max - min;
  const normalized = range > 0 ? (average - min) / range : 0.5;
  const level: PriceLevel = getPriceLevel(average, min, max);
  const levelColor = getPriceLevelColor(level);
  const levelClass = getPriceLevelClass(level);
  const glowClass = getPriceLevelGlow(level);

  // SVG arc calculation
  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference * (1 - normalized);

  return (
    <div
      className="flex flex-col items-center gap-4 animate-fade-in animate-float"
      id="price-gauge"
    >
      {/* Fuel type badge */}
      <div className="font-mono text-xs uppercase tracking-widest text-white/50 bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.08]">
        {fuelTypeLabel}
      </div>

      {/* SVG Gauge */}
      <div className="relative w-[200px] h-[120px] md:w-[260px] md:h-[150px]">
        <svg
          viewBox="0 0 200 120"
          className="w-full h-full"
          style={{ filter: `drop-shadow(0 0 20px ${levelColor}40)` }}
        >
          {/* Background arc */}
          <path
            d="M 20 100 A 70 70 0 0 1 180 100"
            fill="none"
            stroke="white"
            opacity="0.06"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 100 A 70 70 0 0 1 180 100"
            fill="none"
            stroke={levelColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            className="animate-gauge-sweep"
            style={{ transition: 'stroke 0.5s ease' }}
          />
          {/* Glow line behind */}
          <path
            d="M 20 100 A 70 70 0 0 1 180 100"
            fill="none"
            stroke={levelColor}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            opacity="0.15"
            className="animate-gauge-sweep"
          />
        </svg>

        {/* Price display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className={`text-3xl md:text-5xl font-extrabold font-mono ${levelClass} ${glowClass} transition-colors duration-500`}
          >
            {formatPrice(average)}
          </span>
          <span className="text-[10px] md:text-xs font-mono text-white/40 mt-0.5">
            €/{t('common.liter', 'L')}
          </span>
        </div>
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between w-48 md:w-64 text-[10px] md:text-xs font-mono text-white/30 -mt-2">
        <span className="text-fuel-green">{formatPrice(min)}</span>
        <span className="text-white/20">{t('gauge.average', 'AVG')}</span>
        <span className="text-fuel-red">{formatPrice(max)}</span>
      </div>

      {/* Level badge */}
      <div
        className={`text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full border ${
          level === 'cheap'
            ? 'text-fuel-green border-fuel-green/30 bg-fuel-green/[0.08] animate-wiggle'
            : level === 'mid'
              ? 'text-fuel-yellow border-fuel-yellow/30 bg-fuel-yellow/[0.08]'
              : 'text-fuel-red border-fuel-red/30 bg-fuel-red/[0.08]'
        }`}
      >
        {level === 'cheap'
          ? t('level.cheap', '🟢 Cheap')
          : level === 'mid'
            ? t('level.mid', '🟡 Average')
            : t('level.expensive', '🔴 Expensive')}
      </div>
    </div>
  );
};
