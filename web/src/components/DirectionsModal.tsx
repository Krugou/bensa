import React from 'react';
import { useTranslation } from 'react-i18next';

import { Analytics } from '../utils/analytics';
import { Modal } from './Modal';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lon: number;
  stationName: string;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  lat,
  lon,
  stationName,
}) => {
  const { t } = useTranslation();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const navigationApps = [
    {
      id: 'google',
      name: t('station.google_maps'),
      icon: '🌐',
      color: '#4285F4',
      url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    },
    {
      id: 'waze',
      name: t('station.waze'),
      icon: '🚙',
      color: '#33CCFF',
      url: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
    },
    ...(isIOS
      ? [
          {
            id: 'apple',
            name: t('station.apple_maps'),
            icon: '🗺️',
            color: '#007AFF',
            url: `maps://maps.apple.com/?daddr=${lat},${lon}&q=${encodeURIComponent(stationName)}`,
          },
        ]
      : []),
  ];

  const handleAppClick = (appId: string, url: string) => {
    Analytics.trackExternalLink(url);
    Analytics.trackButtonClick(`directions_${appId}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('station.directions')}>
      <div className="space-y-3">
        <p className="text-[11px] text-white/40 font-mono uppercase tracking-widest mb-4">
          {t('station.directions_desc')}
        </p>

        {navigationApps.map((app) => (
          <a
            key={app.id}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              handleAppClick(app.id, app.url);
            }}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-white/90 group-hover:text-white transition-colors">
                {app.name}
              </p>
            </div>
            <span className="text-white/20 group-hover:text-white/60 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          </a>
        ))}
      </div>
    </Modal>
  );
};
