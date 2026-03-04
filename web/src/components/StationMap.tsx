import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';

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
}

/**
 * Component to set map view when user location changes
 */
const MapUpdater = ({ lat, lon }: { lat: number; lon: number }) => {
  const map = useMap();
  useMemo(() => {
    map.setView([lat, lon], map.getZoom());
  }, [map, lat, lon]);
  return null;
};

export const StationMap = ({
  stations,
  fuelType,
  min,
  max,
  userLat = 60.1699,
  userLon = 24.9384,
}: StationMapProps) => {
  const { t } = useTranslation();
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);

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

  // Dark tile layer for the aurora aesthetic
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/[0.06]"
      id="station-map"
    >
      <MapContainer
        center={[userLat, userLon] as L.LatLngExpression}
        zoom={7}
        className="w-full h-[400px] md:h-[500px]"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={tileUrl} />

        <MapUpdater lat={userLat} lon={userLon} />

        {/* User location marker */}
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

        {/* Station glow markers */}
        {stations.map((station) => {
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
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60 font-mono">
                      {station.brand}
                    </span>
                    {isCheap && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuel-green/20 text-fuel-green font-bold uppercase tracking-tight animate-pulse">
                        {t('common.cheap', 'Cheap')}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-base leading-tight text-black dark:text-white mb-0.5">
                    {station.name}
                  </p>
                  <p className="text-slate-600 dark:text-white/40 text-[11px] font-mono">
                    {station.address}, {station.city}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/10 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 dark:text-white/30 font-bold tracking-widest mb-0.5">
                        Price
                      </p>
                      <p className="text-xl font-mono font-black" style={{ color }}>
                        {formatPrice(price)}
                        <span className="text-xs ml-0.5 opacity-60">€/L</span>
                      </p>
                    </div>
                    {station.distance && (
                      <p className="text-[11px] font-mono text-slate-700 dark:text-white/40 mb-1">
                        📍 {station.distance} km
                      </p>
                    )}
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => {
                        handleDirectionsClick(station);
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-bensa-blue dark:text-bensa-teal hover:text-black dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
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
      <div className="absolute bottom-4 left-4 glass-card px-3 py-2 flex items-center gap-3 text-[10px] font-mono text-slate-600 dark:text-white/60 z-[1000]">
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
