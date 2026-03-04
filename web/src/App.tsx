import 'react-toastify/dist/ReactToastify.css';

import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import { AdminDashboard } from './components/AdminDashboard';
import { CollapsibleSection } from './components/CollapsibleSection';
import { DirectionsModal } from './components/DirectionsModal';
import { FuelTypeSelector } from './components/FuelTypeSelector';
import { Header } from './components/Header';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LoadingFuel } from './components/LoadingFuel';
import { NotificationPermission } from './components/NotificationPermission';
import { PriceGauge } from './components/PriceGauge';
import { PriceHistoryChart } from './components/PriceHistoryChart';
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
  const navigate = useNavigate();

  const [stations, setStations] = useState<GasStation[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>('95');
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(DEFAULT_LOCATION.lat);
  const [userLon, setUserLon] = useState(DEFAULT_LOCATION.lon);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);

  // Sync i18n with URL slug
  useEffect(() => {
    if (lng && (lng === 'fi' || lng === 'en') && i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    } else if (!lng) {
      const detectedLng = i18n.language.startsWith('fi') ? 'fi' : 'en';
      void navigate(`/${detectedLng}`, { replace: true });
    }
  }, [lng, i18n, navigate]);

  // Price alert logic
  const isPriceAlert = usePriceAlert(stations, fuelType);
  useTitleFlasher(isPriceAlert, [t('common.price_drop', '💰 Price Drop!')]);

  // Load prices
  const loadPrices = useCallback(async (isInitial = false) => {
    const startTime = Date.now();
    const data = await fetchPrices();
    if (data.length > 0) {
      setStations(data);
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
    } catch (e) {
      console.warn('Failed to fetch last scraper run:', e);
    }

    if (isInitial && !import.meta.env.DEV) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
    }

    setLoading(false);
  }, []);

  // Initial load + geolocation
  useEffect(() => {
    void loadPrices(true);

    getCurrentPosition()
      .then((pos) => {
        setUserLat(pos.lat);
        setUserLon(pos.lon);
      })
      .catch(() => {
        // Use default Helsinki location
      });

    const interval = setInterval(() => {
      void loadPrices();
    }, 300000);
    return () => {
      clearInterval(interval);
    };
  }, [loadPrices]);

  // Notify on price alerts
  useEffect(() => {
    if (isPriceAlert) {
      toast.success(t('alert.price_drop', '💰 Fuel prices have dropped!'), {
        autoClose: 8000,
      });
    }
  }, [isPriceAlert, t]);

  // Compute sorted stations and stats
  const sortedStations = useMemo(
    () => sortByPrice(getNearbyStations(stations, userLat, userLon), fuelType),
    [stations, userLat, userLon, fuelType],
  );
  const stats = useMemo(() => getPriceStats(stations, fuelType), [stations, fuelType]);

  // Find nearest cheap option
  const nearestCheapStation = useMemo(() => {
    if (sortedStations.length === 0) return null;
    // Find all stations within 2 cents of the absolute minimum
    const cheapOptions = sortedStations.filter((s) => {
      const p = s.prices.find((fp) => fp.type === fuelType)?.price;
      return p && p <= stats.min + 0.02;
    });
    // Return the closest one among the cheap options
    return [...cheapOptions].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))[0] || null;
  }, [sortedStations, stats.min, fuelType]);

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
      <div className="min-h-screen bg-[#020617]">
        <LoadingFuel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col items-center">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-fuel-green/2 rounded-full blur-[150px] animate-glow-breathe" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-bensa-violet/2 rounded-full blur-[150px] animate-glow-breathe"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-fuel-yellow/1.5 rounded-full blur-[120px] animate-glow-breathe"
          style={{ animationDelay: '3.5s' }}
        />
      </div>

      {/* Top Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl px-4 md:px-8 space-y-8 md:space-y-12 relative z-10">
        <Header />

        {/* Price Gauge Section */}
        <section className="flex flex-col items-center gap-6">
          <PriceGauge
            average={stats.average}
            min={stats.min}
            max={stats.max}
            fuelTypeLabel={getFuelTypeLabel(fuelType)}
          />
          <FuelTypeSelector selected={fuelType} onChange={setFuelType} />

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <button
              onClick={() => {
                if (nearestCheapStation) scrollToStation(nearestCheapStation.id);
              }}
              disabled={!nearestCheapStation}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-fuel-green/50 text-sm font-bold transition-all duration-300 flex items-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="group-hover:scale-120 transition-transform">🎯</span>
              {t('actions.show_nearest_cheap', 'Show Nearest Cheap')}
            </button>
            <button
              onClick={() => {
                if (nearestCheapStation) setIsQuickNavOpen(true);
              }}
              disabled={!nearestCheapStation}
              className="px-5 py-2.5 rounded-xl bg-fuel-green/10 border border-fuel-green/30 hover:bg-fuel-green/20 hover:border-fuel-green/60 text-fuel-green text-sm font-bold transition-all duration-300 flex items-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="group-hover:translate-x-1 transition-transform">🚀</span>
              {t('actions.nav_nearest_cheap', 'Navigate to Best Value')}
            </button>
          </div>
        </section>

        {/* Map Section */}
        <CollapsibleSection
          title={t('map.title', '🗺️ Station Heatmap')}
          headerColorClass="bg-fuel-green"
          storageKey="bensa_map"
        >
          <StationMap
            stations={sortedStations}
            fuelType={fuelType}
            min={stats.min}
            max={stats.max}
            userLat={userLat}
            userLon={userLon}
          />
        </CollapsibleSection>

        {/* Station List */}
        <CollapsibleSection
          title={t('stations.title', '⛽ Stations by Price')}
          headerColorClass="bg-bensa-teal"
          storageKey="bensa_stations"
        >
          <StationList
            stations={sortedStations}
            fuelType={fuelType}
            min={stats.min}
            max={stats.max}
          />
        </CollapsibleSection>

        {/* Price History */}
        <CollapsibleSection
          title={t('chart.section_title', '📈 Price History')}
          headerColorClass="bg-bensa-cyan"
          storageKey="bensa_chart"
        >
          <PriceHistoryChart />
        </CollapsibleSection>

        {/* Notifications */}
        <CollapsibleSection
          title={t('notifications.title', '🔔 Alerts')}
          headerColorClass="bg-bensa-violet"
          storageKey="bensa_notifications"
        >
          <NotificationPermission />
        </CollapsibleSection>

        {/* Footer */}
        <footer className="text-center py-12 text-white/20 font-mono text-xs uppercase tracking-widest">
          <p title={`${t('common.build_time', 'Build')}: ${__BUILD_TIME__}`}>
            {t('footer.copyright', '© {{year}} Bensa', { year: new Date().getFullYear() })}
          </p>
          {lastScraped && (
            <p className="mt-2 text-[10px] opacity-60">
              {t('footer.last_updated', 'Last updated')}: {lastScraped}
            </p>
          )}
        </footer>
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
    </div>
  );
};

// Simple helper to detect best starting language
const getInitialLang = () => {
  const saved = localStorage.getItem('i18nextLng');
  if (saved && (saved === 'fi' || saved === 'en')) return saved;

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
