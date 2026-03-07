import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';

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
}

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
}: StationMapProps) => {
  const { t } = useTranslation();
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);

  // Filter out stations with invalid or zero coordinates
  const validStations = useMemo(
    () => stations.filter((s) => (s.lat !== 0 || s.lon !== 0) && !!s.lat && !!s.lon),
    [stations],
  );

  const getMarkerProps = useCallback(
    (station: GasStation) => {
      const fuelPrice = station.prices.find((p) => p.type === fuelType);
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

  // Always use dark tile layer
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const showUserMarker = hasGps;
  const showControls = hasGps;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/[0.06]"
      id="station-map"
    >
      <MapContainer
        center={[userLat, userLon] as L.LatLngExpression}
        zoom={11}
        className="w-full h-[400px] md:h-[500px]"
        zoomControl={showControls}
        attributionControl={showControls}
      >
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={tileUrl} />

        <MapUpdater lat={userLat} lon={userLon} stations={validStations} hasGps={hasGps} />

        {/* User location marker */}
        {showUserMarker && (
          <CircleMarker
            center={[userLat, userLon] as L.LatLngExpression}
            radius={6}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <span className="text-sm font-semibold">
                {t('map.your_location', '📍 Your Location')}
              </span>
            </Popup>
          </CircleMarker>
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
                className="bg-black/80 border-none text-white font-mono font-bold text-xs rounded-md shadow-lg"
              >
                {formatPrice(price)}
              </Tooltip>

              <Popup className="station-popup">
                <div className="text-sm min-w-[180px] p-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                      {station.brand}
                    </span>
                    {isCheap && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuel-green/20 text-fuel-green font-bold uppercase tracking-tight animate-pulse">
                        {t('common.cheap', 'Cheap')}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-base leading-tight text-white mb-0.5">
                    {station.name}
                  </p>
                  <p className="text-white/40 text-[11px] font-mono">
                    {station.address}, {station.city}
                  </p>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-0.5">
                        Price
                      </p>
                      <p className="text-xl font-mono font-black" style={{ color }}>
                        {formatPrice(price)}
                        <span className="text-xs ml-0.5 opacity-60">€/L</span>
                      </p>
                    </div>
                    {station.distance && (
                      <p className="text-[11px] font-mono text-white/40 mb-1">
                        📍 {station.distance} km
                      </p>
                    )}
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => {
                        handleDirectionsClick(station);
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-bensa-teal hover:text-white transition-colors cursor-pointer focus:outline-none"
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

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 glass-card px-3 py-2 flex items-center gap-3 text-[10px] font-mono text-white/60 z-[1000]">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-fuel-green shadow-glow-green" />
          {t('map.cheap', 'Cheap')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-fuel-yellow" />
          {t('map.mid', 'Mid')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-fuel-red" />
          {t('map.expensive', 'High')}
        </span>
      </div>
    </div>
  );
};
