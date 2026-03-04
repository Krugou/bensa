import 'react-toastify/dist/ReactToastify.css';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import { AdminDashboard } from './components/AdminDashboard';
import { CollapsibleSection } from './components/CollapsibleSection';
import { FuelTypeSelector } from './components/FuelTypeSelector';
import { Header } from './components/Header';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LoadingFuel } from './components/LoadingFuel';
import { NotificationPermission } from './components/NotificationPermission';
import { PriceGauge } from './components/PriceGauge';
import { PriceHistoryChart } from './components/PriceHistoryChart';
import { StationList } from './components/StationList';
import { StationMap } from './components/StationMap';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeProvider';
import { usePriceAlert } from './hooks/usePriceAlert';
import { useTheme } from './hooks/useTheme';
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
  const { theme } = useTheme();

  const [stations, setStations] = useState<GasStation[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>('95');
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(DEFAULT_LOCATION.lat);
  const [userLon, setUserLon] = useState(DEFAULT_LOCATION.lon);

  // Sync i18n with URL slug
  useEffect(() => {
    if (lng && (lng === 'fi' || lng === 'en') && i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    } else if (!lng) {
      // Fallback redirect if somehow reached without slug
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

    // Try to get user location
    getCurrentPosition()
      .then((pos) => {
        setUserLat(pos.lat);
        setUserLon(pos.lon);
      })
      .catch(() => {
        // Use default Helsinki location
      });

    // Refresh prices every 5 minutes
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
  const sortedStations = sortByPrice(getNearbyStations(stations, userLat, userLon), fuelType);
  const stats = getPriceStats(stations, fuelType);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#020617]">
        <LoadingFuel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#020617] text-black dark:text-slate-200 font-sans flex flex-col items-center transition-colors duration-500">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-fuel-green/5 dark:bg-fuel-green/2 rounded-full blur-[150px] animate-glow-breathe" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-bensa-violet/5 dark:bg-bensa-violet/2 rounded-full blur-[150px] animate-glow-breathe"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-fuel-yellow/5 dark:bg-fuel-yellow/1.5 rounded-full blur-[120px] animate-glow-breathe"
          style={{ animationDelay: '3.5s' }}
        />
      </div>

      {/* Top Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />
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
        <footer className="text-center py-12 text-slate-600 dark:text-white/20 font-mono text-xs uppercase tracking-widest">
          <p title={`${t('common.build_time', 'Build')}: ${__BUILD_TIME__}`}>
            {t('footer.copyright', '© {{year}} Bensa', { year: new Date().getFullYear() })}
          </p>
        </footer>
      </div>

      <ToastContainer
        position="top-right"
        theme={theme}
        aria-label={t('common.notifications', 'Notifications')}
      />
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
  // Determine basename: use /bensa for GitHub Pages, / for root deployments
  const basename =
    import.meta.env.BASE_URL === './' || import.meta.env.BASE_URL === ''
      ? window.location.pathname.includes('/bensa')
        ? '/bensa'
        : '/'
      : import.meta.env.BASE_URL;

  const initialLng = getInitialLang();

  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          {/* Redirect root to locale slug */}
          <Route path="/" element={<Navigate to={`/${initialLng}`} replace />} />

          {/* App with language slug */}
          <Route path="/:lng" element={<AppContent />} />

          {/* Admin remains at /admin but could be localized too if needed */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback for everything else */}
          <Route path="*" element={<Navigate to={`/${initialLng}`} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
