import 'leaflet/dist/leaflet.css';

import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, fi, sv } from 'date-fns/locale';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import { DEFAULT_LOCATION } from '../services/locationService';
import { FuelType, GasStation } from '../types';
import { Analytics } from '../utils/analytics';
import { formatPrice, getPriceLevel, getPriceLevelColor } from '../utils/priceUtils';
import { DirectionsModal } from './DirectionsModal';

interface StationMapProps {
  stations: GasStation[];
  fuelType: FuelType;
  min: number;
  max: number;
  userLat?: number;
  userLon?: number;
  /** whether the lat/lon come from real GPS; if false we treat location as default */
  hasGps?: boolean;
  theme?: 'dark' | 'light';
}

const getBrandIcon = (brand: string) => {
  const b = brand.toLowerCase();
  if (b.includes('neste')) return '💧';
  if (b.includes('st1')) return '🐚';
  if (b.includes('shell')) return '🟡';
  if (b.includes('abc')) return '🟢';
  if (b.includes('seo')) return '🔵';
  if (b.includes('teboil')) return '🔴';
  if (b.includes('gulf')) return '🟠';
  return '⛽';
};

const getBrandColor = (brand: string) => {
  const b = brand.toLowerCase();
  if (b.includes('neste')) return '#004fe0';
  if (b.includes('st1')) return '#ff0000';
  if (b.includes('shell')) return '#ff0000';
  if (b.includes('abc')) return '#00a651';
  if (b.includes('seo')) return '#0054a6';
  return 'var(--border-card)';
};

/**
 * Component to set map view and handle auto-fitting when location or stations change
 */
interface MapUpdaterProps {
  lat: number;
  lon: number;
  stations: GasStation[];
  hasGps: boolean;
}

const MapUpdater = ({ lat, lon, stations, hasGps }: MapUpdaterProps) => {
  const map = useMap();

  useEffect(() => {
    if (hasGps) {
      if (stations.length > 0) {
        // Find the 5 nearest stations to the user to determine bounds
        const nearest = [...stations]
          .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
          .slice(0, 5);

        const bounds = L.latLngBounds(
          [lat, lon] as L.LatLngExpression,
          [lat, lon] as L.LatLngExpression,
        );
        nearest.forEach((s) => bounds.extend([s.lat, s.lon] as L.LatLngExpression));

        // Fit map to show user and the nearest cheap options
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13, // Don't zoom in TOO much
          animate: true,
        });
      } else {
        map.setView([lat, lon] as L.LatLngExpression, 11);
      }
    } else {
      // no GPS: just show all stations if any, else default center
      if (stations.length > 0) {
        const bounds = L.latLngBounds(stations.map((s) => [s.lat, s.lon] as L.LatLngExpression));
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
          animate: true,
        });
      } else {
        map.setView([lat, lon] as L.LatLngExpression, 11);
      }
    }
  }, [map, lat, lon, stations, hasGps]);

  return null;
};

export const StationMap = ({
  stations,
  fuelType,
  min,
  max,
  userLat = DEFAULT_LOCATION.lat,
  userLon = DEFAULT_LOCATION.lon,
  hasGps = false,
  theme = 'dark',
}: StationMapProps) => {
  const { t, i18n } = useTranslation();
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [recenterCounter, setRecenterCounter] = useState(0);

  const getRelativeTime = useCallback(
    (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        const localeMap: Record<string, Locale> = { fi, sv, en: enUS };
        const locale = localeMap[i18n.language] ?? enUS;
        return formatDistanceToNow(date, { addSuffix: true, locale });
      } catch {
        return dateStr;
      }
    },
    [i18n.language],
  );

  // Filter out stations with invalid coordinates or stale price data (>7 days)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const validStations = useMemo(
    () =>
      stations.filter((s) => {
        const hasCoords = (s.lat !== 0 || s.lon !== 0) && !!s.lat && !!s.lon;
        if (!hasCoords) return false;
        const fp = s.prices?.find((p) => p.type === fuelType);
        if (!fp?.updatedAt) return false;
        return Date.now() - new Date(fp.updatedAt).getTime() <= SEVEN_DAYS_MS;
      }),
    [stations, fuelType],
  );

  const getMarkerProps = useCallback(
    (station: GasStation) => {
      const fuelPrice = station.prices?.find((p) => p.type === fuelType);
      if (!fuelPrice) return { color: '#666', radius: 8, price: 0 };

      const level = getPriceLevel(fuelPrice.price, min, max);
      const color = getPriceLevelColor(level);
      const isCheap = level === 'cheap';

      return {
        color,
        radius: isCheap ? 12 : 8,
        price: fuelPrice.price,
        isCheap,
      };
    },
    [fuelType, min, max],
  );

  const handleDirectionsClick = (station: GasStation) => {
    setSelectedStation(station);
    Analytics.trackButtonClick('directions_open_map');
  };

  // Switch tile layer based on theme
  const tileUrl =
    theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const showUserMarker = hasGps;
  const showControls = hasGps;

  const nearestCheapStation = useMemo(() => {
    if (validStations.length === 0) return null;
    return [...validStations].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))[0];
  }, [validStations]);

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-border-card group"
      id="station-map"
    >
      <MapContainer
        center={[userLat, userLon] as L.LatLngExpression}
        zoom={11}
        className="w-full h-[400px] md:h-[500px] xl:h-[600px] 2xl:h-[700px]"
        zoomControl={showControls}
        attributionControl={showControls}
      >
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={tileUrl} />

        <MapUpdater
          lat={userLat}
          lon={userLon}
          stations={validStations}
          hasGps={hasGps}
          key={recenterCounter}
        />

        {/* User location marker and range circle */}
        {showUserMarker && (
          <>
            <Circle
              center={[userLat, userLon] as L.LatLngExpression}
              radius={20000} // 20km range
              pathOptions={{
                color: theme === 'light' ? '#3b82f6' : '#60a5fa',
                fillColor: '#3b82f6',
                fillOpacity: 0.05,
                weight: 1,
                dashArray: '5, 10',
                interactive: false,
              }}
            />
            <CircleMarker
              center={[userLat, userLon] as L.LatLngExpression}
              radius={6}
              pathOptions={{
                color: theme === 'light' ? '#2563eb' : '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <p className="text-sm font-bold mb-1 flex items-center gap-1">
                    <span>📍</span> {t('map.your_location', 'Your Location')}
                  </p>
                  {nearestCheapStation && (
                    <div className="mt-2 pt-2 border-t border-border-card/50">
                      <p className="text-[10px] uppercase text-text-dim font-bold tracking-wider mb-1">
                        Nearest Option
                      </p>
                      <p className="text-xs font-bold text-text-main truncate">
                        {nearestCheapStation.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-mono text-fuel-green font-bold">
                          {formatPrice(
                            nearestCheapStation.prices?.find((p) => p.type === fuelType)?.price ??
                              0,
                          )}
                          €
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {nearestCheapStation.distance} km
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Station glow markers */}
        {validStations.map((station) => {
          const { color, radius, price, isCheap } = getMarkerProps(station);
          return (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lon] as L.LatLngExpression}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: isCheap ? 0.8 : 0.5,
                weight: isCheap ? 3 : 1,
              }}
              className={isCheap ? 'animate-marker-pulse' : ''}
            >
              <Tooltip
                direction="top"
                offset={[0, -radius]}
                opacity={0.9}
                interactive={false}
                className={`${theme === 'light' ? 'bg-white/90 text-slate-900 border border-slate-200' : 'bg-black/80 text-white border-none'} font-mono font-bold text-xs xl:text-sm rounded-md shadow-lg pointer-events-none`}
              >
                {formatPrice(price)}
              </Tooltip>

              <Popup className="station-popup">
                <div className="text-sm xl:text-base min-w-[180px] xl:min-w-[240px] p-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] xl:text-xs px-1.5 py-0.5 rounded bg-card-hover text-text-muted font-mono font-bold uppercase"
                      style={{ borderLeft: `2px solid ${getBrandColor(station.brand)}` }}
                    >
                      {getBrandIcon(station.brand)} {station.brand}
                    </span>
                    {isCheap && (
                      <span className="text-[10px] xl:text-xs px-1.5 py-0.5 rounded bg-fuel-green/20 text-fuel-green font-bold uppercase tracking-tight animate-pulse">
                        {t('common.cheap', 'Cheap')}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-base xl:text-lg leading-tight text-text-main mb-0.5">
                    {station.name}
                  </p>
                  <p className="text-text-muted text-[11px] xl:text-sm font-mono">
                    {station.address}, {station.city}
                  </p>

                  <div className="mt-3 pt-2 border-t border-border-card flex items-end justify-between">
                    <div>
                      <p className="text-[10px] xl:text-xs uppercase text-text-dim font-bold tracking-widest mb-0.5">
                        Price
                      </p>
                      <p className="text-xl xl:text-2xl font-mono font-black" style={{ color }}>
                        {formatPrice(price)}
                        <span className="text-xs xl:text-sm ml-0.5 opacity-60">€/L</span>
                      </p>
                    </div>
                    {station.distance && (
                      <p className="text-[11px] xl:text-sm font-mono text-text-muted mb-1">
                        📍 {station.distance} km
                      </p>
                    )}
                  </div>
                  {(() => {
                    const fp = station.prices?.find((p) => p.type === fuelType);
                    return fp?.updatedAt ? (
                      <p className="mt-1.5 text-[9px] xl:text-[11px] font-mono text-text-dim">
                        {t('station.updated', 'Updated')}: {getRelativeTime(fp.updatedAt)}
                      </p>
                    ) : null;
                  })()}
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => {
                        handleDirectionsClick(station);
                      }}
                      className="text-[10px] xl:text-xs font-bold uppercase tracking-widest text-bensa-teal hover:text-white transition-colors cursor-pointer focus:outline-none"
                    >
                      {t('station.directions')} →
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Recenter Button */}
      {hasGps && (
        <button
          onClick={() => {
            setRecenterCounter((prev) => prev + 1);
            Analytics.trackButtonClick('map_recenter');
          }}
          className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-surface-container border border-border-card rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-lg cursor-pointer"
          title={t('map.recenter', 'Recenter Map')}
        >
          <span className="material-symbols-outlined text-xl">my_location</span>
        </button>
      )}

      {/* Directions Modal */}
      {selectedStation && (
        <DirectionsModal
          isOpen={!!selectedStation}
          onClose={() => {
            setSelectedStation(null);
          }}
          lat={selectedStation.lat}
          lon={selectedStation.lon}
          stationName={selectedStation.name}
        />
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 glass-card px-3 py-2 flex items-center gap-3 text-[10px] xl:text-xs font-mono text-text-muted z-[1000]">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full bg-fuel-green shadow-glow-green" />
          {t('map.cheap', 'Cheap')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full bg-fuel-yellow" />
          {t('map.mid', 'Mid')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 xl:w-3.5 xl:h-3.5 rounded-full bg-fuel-red" />
          {t('map.expensive', 'High')}
        </span>
      </div>
    </div>
  );
};
