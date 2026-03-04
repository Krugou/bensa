import { useTranslation } from 'react-i18next';

import { FuelType } from '../types';
import { getFuelTypeEmoji, getFuelTypeLabel } from '../utils/priceUtils';

interface FuelTypeSelectorProps {
  selected: FuelType;
  onChange: (type: FuelType) => void;
}

const FUEL_TYPES: FuelType[] = ['95', '98', 'diesel'];

export const FuelTypeSelector = ({ selected, onChange }: FuelTypeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3" id="fuel-type-selector">
      <span className="text-xs font-mono text-white/30 mr-2 hidden md:inline">
        {t('fuel.select', 'FUEL')}
      </span>
      {FUEL_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => { onChange(type); }}
          className={`
            px-4 py-2 md:px-6 md:py-2.5 rounded-lg font-mono text-sm font-semibold
            border transition-all duration-300 cursor-pointer
            ${
              selected === type
                ? 'fuel-toggle-active'
                : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white/70 hover:border-white/[0.15]'
            }
          `}
          title={getFuelTypeLabel(type)}
        >
          <span className="mr-1.5">{getFuelTypeEmoji(type)}</span>
          {getFuelTypeLabel(type)}
        </button>
      ))}
    </div>
  );
};
