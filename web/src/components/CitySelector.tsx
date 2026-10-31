import { useTranslation } from 'react-i18next';

interface CitySelectorProps {
  cities: string[];
  selectedCity: string | null;
  onChange: (city: string | null) => void;
}

export const CitySelector = ({ cities, selectedCity, onChange }: CitySelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3" id="city-selector">
      <span className="text-xs font-mono text-text-dim mr-2 hidden md:inline">
        {t('city.select', 'CITY')}
      </span>
      <div className="relative group">
        <select
          value={selectedCity ?? 'all'}
          onChange={(e) => {
            const value = e.target.value;
            onChange(value === 'all' ? null : value);
          }}
          className="
            appearance-none
            px-4 py-2 md:px-6 md:py-2.5 rounded-lg font-mono text-sm font-semibold
            bg-card border border-border-card text-text-muted
            hover:bg-card-hover hover:text-text-main hover:border-border-card
            transition-all duration-300 cursor-pointer focus:outline-none focus:border-fuel-green/50
            pr-10
          "
          aria-label={t('city.filter', 'Filter by city')}
        >
          <option value="all" className="bg-main text-text-main">
            {t('city.all', 'All Cities')}
          </option>
          {cities.map((city) => (
            <option key={city} value={city} className="bg-main text-text-main">
              {city}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim group-hover:text-text-muted transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};
