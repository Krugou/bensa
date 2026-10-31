import { useTranslation } from 'react-i18next';

interface StationSearchProps {
  query: string;
  onChange: (query: string) => void;
}

export const StationSearch = ({ query, onChange }: StationSearchProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="station-search" className="sr-only">
        {t('stations.search_label', 'Search stations')}
      </label>
      <input
        id="station-search"
        type="search"
        value={query}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={t('stations.search_placeholder', 'Search by station, brand, address, or city')}
        className="w-full rounded-lg border border-border-card bg-card px-4 py-2.5 pr-11 font-mono text-sm text-text-main placeholder:text-text-dim focus:border-fuel-green/50 focus:outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            onChange('');
          }}
          aria-label={t('stations.clear_search', 'Clear search')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted transition-colors hover:bg-card-hover hover:text-text-main"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
