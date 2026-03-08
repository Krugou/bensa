import 'react-toastify/dist/ReactToastify.css';

import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import { AdminDashboard } from './components/AdminDashboard';
import { BrandSelector } from './components/BrandSelector';
import { CollapsibleSection } from './components/CollapsibleSection';
import { ConsumptionCalculator } from './components/ConsumptionCalculator';
import { CookieConsent } from './components/CookieConsent';
import { CrowdsourceModal } from './components/CrowdsourceModal';
import { DirectionsModal } from './components/DirectionsModal';
import { FuelTypeSelector } from './components/FuelTypeSelector';
import { Header } from './components/Header';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LoadingFuel } from './components/LoadingFuel';
import { NotificationPermission } from './components/NotificationPermission';
import { PriceGauge } from './components/PriceGauge';
import { PriceHistoryChart } from './components/PriceHistoryChart';
import { RichList } from './components/RichList';
import { StationList } from './components/StationList';
import { StationMap } from './components/StationMap';
import { db } from './firebase';
import { usePriceAlert } from './hooks/usePriceAlert';
import { useTitleFlasher } from './hooks/useTitleFlasher';
import { DEFAULT_LOCATION, getCurrentPosition } from './services/locationService';
import { fetchPrices, getPriceStats } from './services/priceService';
import { getNearbyStations, sortByPrice } from './services/stationService';
import { FuelType, GasStation } from './types';
import { getFuelTypeLabel } from './utils/priceUtils';

const AppContent = () => {
  const { t, i18n } = useTranslation();
  const { lng } = useParams<{ lng: string }>();
  const [searchParams] = useSearchParams();

  const isSimpleMode =
    searchParams.get('simplemode') === 'true' || searchParams.get('yksinkertainentila') === 'true';
  const isDevMode = searchParams.get('dev') === 'true';

  const [stations, setStations] = useState<GasStation[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>('95');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(DEFAULT_LOCATION.lat);
  const [userLon, setUserLon] = useState(DEFAULT_LOCATION.lon);
  const [hasGps, setHasGps] = useState(false);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [isCrowdsourceOpen, setIsCrowdsourceOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('bensa_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('bensa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('bensa_favorites');
    return saved ? (JSON.parse(saved) as string[]) : [];
  });

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('bensa_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]));
  };

  const enableCrowdsourcing = import.meta.env.VITE_ENABLE_CROWDSOURCING === 'true';

  // Sync i18n with URL slug
  useEffect(() => {
    void i18n.changeLanguage(lng);
  }, [lng, i18n]);

  // Price alert logic
  const isPriceAlert = usePriceAlert(stations, fuelType);
  useTitleFlasher(isPriceAlert, [t('common.price_drop', '💰 Price Drop!')]);

  // Load prices
  const loadPrices = useCallback(
    async (isInitial = false) => {
      const startTime = Date.now();
      try {
        const data = await fetchPrices();
        if (data.length > 0) {
          setStations(data);
        }
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === 'QUOTA_EXCEEDED') {
          toast.error(t('alert.quota_exceeded'), {
            autoClose: false,
            toastId: 'quota-error',
          });
        }
      }

      // Fetch last scraper run from Firestore
      try {
        const runsCol = collection(db, 'scraper_runs');
        const q = query(runsCol, orderBy('timestamp', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const runData = snapshot.docs[0].data();
          const ts = runData['timestamp'] as Timestamp | undefined;
          if (ts) {
            setLastScraped(ts.toDate().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' }));
          }
        }
      } catch (e: unknown) {
        console.warn('Failed to fetch last scraper run:', e);
        const err = e as { code?: string };
        if (err.code === 'resource-exhausted') {
          toast.error(t('alert.quota_exceeded'), {
            autoClose: false,
            toastId: 'quota-error-run',
          });
        }
      }

      if (isInitial && !import.meta.env.DEV) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 3000) {
          await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
        }
      }

      setLoading(false);
    },
    [t],
  );

  // Initial load + geolocation
  useEffect(() => {
    void loadPrices(true);

    getCurrentPosition()
      .then((pos) => {
        setUserLat(pos.lat);
        setUserLon(pos.lon);
        setHasGps(true);
      })
      .catch(() => {
        // GPS unavailable; keep default Espoo center and hasGps=false
      });

    const interval = setInterval(() => {
      void loadPrices();
    }, 300000);
    return () => {
      clearInterval(interval);
    };
  }, [loadPrices]);

  // Compute sorted stations and stats
  const stats = useMemo(() => getPriceStats(stations, fuelType), [stations, fuelType]);

  const stationsWithDistance = useMemo(() => {
    return getNearbyStations(stations, userLat, userLon);
  }, [stations, userLat, userLon]);

  const filteredAndSortedStations = useMemo(() => {
    let list = [...stationsWithDistance];
    if (selectedBrand) {
      list = list.filter((s) => s.brand === selectedBrand);
    }
    return sortByPrice(list, fuelType);
  }, [stationsWithDistance, fuelType, selectedBrand]);

  // Notify on price alerts
  useEffect(() => {
    if (isPriceAlert) {
      toast.success(t('alert.price_drop', '💰 Fuel prices have dropped!'), {
        autoClose: 8000,
      });
    }
  }, [isPriceAlert, t]);

  // Price Gap Alert
  useEffect(() => {
    if (stats.max - stats.min > 0.15) {
      toast.info(t('alert.high_gap', 'Large price difference in your area! Check the list.'), {
        autoClose: 10000,
        toastId: 'price-gap-alert',
      });
    }
  }, [stats.max, stats.min, t]);

  // Get available brands
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    stations.forEach((s) => {
      if (s.brand) brands.add(s.brand);
    });
    return Array.from(brands).sort();
  }, [stations]);

  // Find nearest cheap option
  const nearestCheapStation = useMemo(() => {
    if (filteredAndSortedStations.length === 0) return null;

    // Find the minimum price in the current filtered/nearby list
    const pricesInList = filteredAndSortedStations
      .map((s) => s.prices.find((fp) => fp.type === fuelType)?.price)
      .filter((p): p is number => p !== undefined && p > 0);

    if (pricesInList.length === 0) return null;
    const localMin = Math.min(...pricesInList);

    // Find all stations within 2 cents of the LOCAL minimum AND within 50km
    // If we're using GPS, 50km is a good limit. If no GPS, it's relative to DEFAULT_LOCATION.
    const cheapOptions = filteredAndSortedStations.filter((s) => {
      const p = s.prices.find((fp) => fp.type === fuelType)?.price;
      const isCheapEnough = p && p <= localMin + 0.02;
      const isCloseEnough = (s.distance ?? 0) <= 50;
      return isCheapEnough && isCloseEnough;
    });

    // If no stations within 50km are "cheap enough", just take the absolute cheapest in the list
    if (cheapOptions.length === 0) {
      return filteredAndSortedStations[0];
    }

    // Return the closest one among the practical cheap options
    return [...cheapOptions].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))[0] || null;
  }, [filteredAndSortedStations, fuelType]);

  const scrollToStation = (id: string) => {
    const element = document.getElementById(`station-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('animate-pulse-intense');
      setTimeout(() => {
        element.classList.remove('animate-pulse-intense');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main">
        <LoadingFuel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main text-text-main font-sans flex flex-col items-center">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-fuel-green rounded-full blur-[150px] animate-glow-breathe" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-bensa-violet rounded-full blur-[150px] animate-glow-breathe"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-fuel-yellow rounded-full blur-[120px] animate-glow-breathe"
          style={{ animationDelay: '3.5s' }}
        />
      </div>

      {/* Top Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-card border border-border-card hover:bg-card-hover text-text-muted hover:text-text-main transition-all duration-300 cursor-pointer"
          title={
            theme === 'dark'
              ? t('common.light_mode', 'Light Mode')
              : t('common.dark_mode', 'Dark Mode')
          }
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[1600px] px-4 md:px-8 xl:px-12 space-y-8 md:space-y-12 relative z-10">
        {!isSimpleMode && <Header />}

        {/* Price Gauge Section */}
        {!isSimpleMode && (
          <section className="flex flex-col items-center gap-6 lg:gap-10">
            <div className="w-full scale-100 xl:scale-110 origin-top transition-transform duration-500">
              <PriceGauge
                average={stats.average}
                min={stats.min}
                max={stats.max}
                fuelTypeLabel={getFuelTypeLabel(fuelType)}
              />
            </div>
            <div className="flex flex-col items-center gap-4 lg:gap-6">
              <FuelTypeSelector selected={fuelType} onChange={setFuelType} />
              <BrandSelector
                brands={availableBrands}
                selectedBrand={selectedBrand}
                onChange={setSelectedBrand}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <button
                onClick={() => {
                  if (nearestCheapStation) scrollToStation(nearestCheapStation.id);
                }}
                disabled={!nearestCheapStation}
                className="px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl bg-card border border-border-card hover:bg-card-hover hover:border-fuel-green/50 text-text-main text-sm md:text-base font-bold transition-all duration-300 flex items-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="group-hover:scale-120 transition-transform">🎯</span>
                {t('actions.show_nearest_cheap', 'Show Nearest Cheap')}
              </button>
              <button
                onClick={() => {
                  if (nearestCheapStation) setIsQuickNavOpen(true);
                }}
                disabled={!nearestCheapStation}
                className="px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl bg-fuel-green/10 border border-fuel-green/30 hover:bg-fuel-green/20 hover:border-fuel-green/60 text-fuel-green text-sm font-bold transition-all duration-300 flex items-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="group-hover:translate-x-1 transition-transform">🚀</span>
                {t('actions.nav_nearest_cheap', 'Navigate to Best Value')}
              </button>
              <button
                onClick={() => {
                  setIsCalculatorOpen(true);
                }}
                className="px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl bg-card border border-border-card hover:bg-card-hover hover:border-border-card text-text-muted hover:text-text-main text-sm font-bold transition-all duration-300 flex items-center gap-2 group cursor-pointer"
              >
                <span className="group-hover:rotate-12 transition-transform">🧮</span>
                {t('actions.calculator', 'Savings Calculator')}
              </button>
              {enableCrowdsourcing && (
                <button
                  onClick={() => {
                    setIsCrowdsourceOpen(true);
                  }}
                  className="px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl bg-card border border-border-card hover:bg-card-hover hover:border-border-card text-text-muted hover:text-text-main text-sm font-bold transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                >
                  <span className="group-hover:rotate-12 transition-transform">📢</span>
                  {t('actions.report_price', 'Report Price')}
                </button>
              )}
            </div>
          </section>
        )}

        {isSimpleMode && (
          <div className="flex flex-col items-center gap-4 pt-8 md:pt-16">
            <FuelTypeSelector selected={fuelType} onChange={setFuelType} />
            <BrandSelector
              brands={availableBrands}
              selectedBrand={selectedBrand}
              onChange={setSelectedBrand}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsCalculatorOpen(true);
                }}
                className="px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl bg-card border border-border-card hover:bg-card-hover text-text-muted hover:text-text-main text-sm font-bold transition-all duration-300 flex items-center gap-2 group cursor-pointer"
              >
                <span className="group-hover:rotate-12 transition-transform">🧮</span>
                {t('actions.calculator', 'Calculator')}
              </button>
              {enableCrowdsourcing && (
                <button
                  onClick={() => {
                    setIsCrowdsourceOpen(true);
                  }}
                  className="px-5 py-2.5 md:px-8 md:py-3.5 rounded-xl bg-card border border-border-card hover:bg-card-hover text-text-muted hover:text-text-main text-sm font-bold transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                >
                  <span className="group-hover:rotate-12 transition-transform">📢</span>
                  {t('actions.report_price', 'Report Price')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Map and Station List Grid for Extra Wide Screens */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Map Section - Wider on desktop */}
          <div className="xl:col-span-7 2xl:col-span-8 h-full">
            <CollapsibleSection
              title={t('map.title', '🗺️ Station Heatmap')}
              headerColorClass="bg-fuel-green"
              storageKey="bensa_map"
              isOpen={isSimpleMode || undefined}
              className="h-full"
            >
              <div className="h-[400px] md:h-[600px] xl:h-[700px] 2xl:h-[800px]">
                <StationMap
                  stations={filteredAndSortedStations}
                  fuelType={fuelType}
                  min={stats.min}
                  max={stats.max}
                  userLat={userLat}
                  userLon={userLon}
                  hasGps={hasGps}
                  theme={theme}
                />
              </div>
            </CollapsibleSection>
          </div>

          {/* Station List - Side panel on desktop */}
          <div className="xl:col-span-5 2xl:col-span-4 h-full">
            <CollapsibleSection
              title={t('stations.title', '⛽ Stations by Price')}
              headerColorClass="bg-bensa-teal"
              storageKey="bensa_stations"
              isOpen={isSimpleMode || undefined}
              className="h-full"
            >
              <div className="max-h-[600px] xl:max-h-[700px] 2xl:max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                <StationList
                  stations={filteredAndSortedStations}
                  fuelType={fuelType}
                  min={stats.min}
                  max={stats.max}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Price History and other bottom sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12">
          {!isSimpleMode && (
            <CollapsibleSection
              title={t('chart.section_title', '📈 Price History')}
              headerColorClass="bg-bensa-cyan"
              storageKey="bensa_chart"
            >
              <PriceHistoryChart />
            </CollapsibleSection>
          )}

          {!isSimpleMode && (
            <CollapsibleSection
              title={t('rich_list.title', '💸 Rich List')}
              headerColorClass="bg-fuel-red"
              storageKey="bensa_richlist"
            >
              <RichList stations={stationsWithDistance} fuelType={fuelType} />
            </CollapsibleSection>
          )}

          {!isSimpleMode && (
            <CollapsibleSection
              title={t('notifications.title', '🔔 Alerts')}
              headerColorClass="bg-bensa-violet"
              storageKey="bensa_notifications"
            >
              <NotificationPermission />
            </CollapsibleSection>
          )}
        </div>

        {/* Footer */}
        {!isSimpleMode && (
          <footer className="text-center py-12 text-text-dim font-mono text-xs uppercase tracking-widest">
            <p title={`${t('common.build_time', 'Build')}: ${__BUILD_TIME__}`}>
              {t('footer.copyright', '© {{year}} Bensa', { year: new Date().getFullYear() })}
            </p>
            {lastScraped && (
              <p className="mt-2 text-[10px] opacity-60">
                {t('footer.last_updated', 'Last updated')}: {lastScraped}
              </p>
            )}
            {isDevMode && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <a
                  href="https://github.com/Krugou/bensa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-card border border-border-card hover:bg-card-hover hover:text-text-main transition-all duration-300 flex items-center gap-2 text-[10px] font-bold"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.181-1.305.262-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Repository
                </a>
              </div>
            )}
          </footer>
        )}
      </div>

      <ToastContainer
        position="top-right"
        theme="dark"
        aria-label={t('common.notifications', 'Notifications')}
      />

      {nearestCheapStation && (
        <DirectionsModal
          isOpen={isQuickNavOpen}
          onClose={() => {
            setIsQuickNavOpen(false);
          }}
          lat={nearestCheapStation.lat}
          lon={nearestCheapStation.lon}
          stationName={nearestCheapStation.name}
        />
      )}

      <CrowdsourceModal
        isOpen={isCrowdsourceOpen}
        onClose={() => {
          setIsCrowdsourceOpen(false);
        }}
      />

      {filteredAndSortedStations.length > 0 && (
        <ConsumptionCalculator
          isOpen={isCalculatorOpen}
          onClose={() => {
            setIsCalculatorOpen(false);
          }}
          currentPrice={
            filteredAndSortedStations[0].prices.find((p) => p.type === fuelType)?.price ?? 0
          }
          cheapestPrice={stats.min}
        />
      )}

      <CookieConsent />
    </div>
  );
};

// Simple helper to detect best starting language
const getInitialLang = (): 'fi' | 'en' => {
  const saved = localStorage.getItem('i18nextLng');
  if (saved === 'fi' || saved === 'en') return saved;

  const browserLng = navigator.language.toLowerCase();
  if (browserLng.startsWith('fi')) return 'fi';
  return 'en';
};

const App = () => {
  const basename =
    import.meta.env.BASE_URL === './' || import.meta.env.BASE_URL === ''
      ? window.location.pathname.includes('/bensa')
        ? '/bensa'
        : '/'
      : import.meta.env.BASE_URL;

  const initialLng = getInitialLang();

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${initialLng}`} replace />} />
        <Route path="/:lng" element={<AppContent />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to={`/${initialLng}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
