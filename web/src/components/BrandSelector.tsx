import { useTranslation } from 'react-i18next';

interface BrandSelectorProps {
  brands: string[];
  selectedBrand: string | null;
  onChange: (brand: string | null) => void;
}

export const BrandSelector = ({ brands, selectedBrand, onChange }: BrandSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3" id="brand-selector">
      <span className="text-xs font-mono text-text-dim mr-2 hidden md:inline">
        {t('brand.select', 'BRAND')}
      </span>
      <div className="relative group">
        <select
          value={selectedBrand ?? 'all'}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === 'all' ? null : val);
          }}
          className="
            appearance-none
            px-4 py-2 md:px-6 md:py-2.5 rounded-lg font-mono text-sm font-semibold
            bg-card border border-border-card text-text-muted 
            hover:bg-card-hover hover:text-text-main hover:border-border-card
            transition-all duration-300 cursor-pointer focus:outline-none focus:border-fuel-green/50
            pr-10
          "
          aria-label={t('brand.filter', 'Filter by brand')}
        >
          <option value="all" className="bg-main text-text-main">
            {t('brand.all', 'All Brands')}
          </option>
          {brands.map((brand) => (
            <option key={brand} value={brand} className="bg-main text-text-main">
              {brand}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
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
