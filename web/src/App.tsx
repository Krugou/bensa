import 'react-toastify/dist/ReactToastify.css';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';

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
import { useTitleFlasher } from './hooks/useTitleFlasher';
import { DEFAULT_LOCATION, getCurrentPosition } from './services/locationService';
import { fetchPrices, getPriceStats } from './services/priceService';
import { getNearbyStations, sortByPrice } from './services/stationService';
import { FuelType, GasStation } from './types';
import { getFuelTypeLabel } from './utils/priceUtils';

const AppContent = () => {
  const { t } = useTranslation();
  const [stations, setStations] = useState<GasStation[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>('95');
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(DEFAULT_LOCATION.lat);
  const [userLon, setUserLon] = useState(DEFAULT_LOCATION.lon);

  // Price alert logic
  const isPriceAlert = usePriceAlert(stations, fuelType);
  useTitleFlasher(isPriceAlert, [t('common.price_drop', '💰 Price Drop!')]);

  // Load prices
  const loadPrices = useCallback(async () => {
    const data = await fetchPrices();
    if (data.length > 0) {
      setStations(data);
    }
    setLoading(false);
  }, []);

  // Initial load + geolocation
  useEffect(() => {
    loadPrices();

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
    const interval = setInterval(loadPrices, 300000);
    return () => clearInterval(interval);
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
  const sortedStations = sortByPrice(
    getNearbyStations(stations, userLat, userLon),
    fuelType,
  );
  const stats = getPriceStats(stations, fuelType);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060610]">
        <LoadingFuel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060610] text-white/90 font-sans flex flex-col items-center transition-colors duration-500">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-fuel-green/[0.02] rounded-full blur-[150px] animate-glow-breathe" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-bensa-violet/[0.02] rounded-full blur-[150px] animate-glow-breathe"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-fuel-yellow/[0.015] rounded-full blur-[120px] animate-glow-breathe"
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
        <footer className="text-center py-12 text-white/20 font-mono text-xs uppercase tracking-widest">
          <p title={`${t('common.build_time', 'Build')}: ${__BUILD_TIME__}`}>
            {t('footer.copyright', '© {{year}} Bensa', { year: new Date().getFullYear() })}
          </p>
        </footer>
      </div>

      <ToastContainer position="top-right" theme="dark" aria-label={t('common.notifications', 'Notifications')} />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
