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
      <span className="text-xs font-mono text-white/30 mr-2 hidden md:inline">
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
            bg-slate-900 border border-white/[0.08] text-white/70 
            hover:bg-slate-800 hover:text-white/90 hover:border-white/[0.15]
            transition-all duration-300 cursor-pointer focus:outline-none focus:border-fuel-green/50
            pr-10
          "
          aria-label={t('brand.filter', 'Filter by brand')}
        >
          <option value="all" className="bg-slate-900 text-white">
            {t('brand.all', 'All Brands')}
          </option>
          {brands.map((brand) => (
            <option key={brand} value={brand} className="bg-slate-900 text-white">
              {brand}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 group-hover:text-white/50 transition-colors">
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
