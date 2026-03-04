import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

import { FuelType, GasStation } from '../types';
import { formatPrice, getPriceLevel, getPriceLevelColor } from '../utils/priceUtils';

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

  // Dark tile layer for the aurora aesthetic
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/[0.06]" id="station-map">
      <MapContainer
        center={[userLat, userLon] as L.LatLngExpression}
        zoom={7}
        className="w-full h-[400px] md:h-[500px]"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />

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
            <span className="text-sm font-semibold">{t('map.your_location', '📍 Your Location')}</span>
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
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-bold text-base">{station.name}</p>
                  <p className="text-gray-500 text-xs">{station.address}, {station.city}</p>
                  <p className="mt-2 text-lg font-mono font-bold" style={{ color }}>
                    {formatPrice(price)} €/L
                  </p>
                  {station.distance && (
                    <p className="text-xs text-gray-400 mt-1">
                      📍 {station.distance} km
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

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
