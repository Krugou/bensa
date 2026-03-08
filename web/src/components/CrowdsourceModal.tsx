import React from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from './Modal';

interface CrowdsourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrowdsourceModal: React.FC<CrowdsourceModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('crowdsource.title', 'Report Prices')}>
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-fuel-green/10 border border-fuel-green/20 text-fuel-green text-sm flex items-start gap-3">
          <span className="text-xl">📢</span>
          <p className="font-medium">
            {t(
              'crowdsource.welcome',
              'Help the community by reporting real-time fuel prices from your local station!',
            )}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-white/60 text-sm italic">
            {t('crowdsource.placeholder', 'Crowdsourcing features are coming soon. Stay tuned!')}
          </p>

          <div className="flex flex-col gap-3 opacity-40 pointer-events-none">
            <div className="space-y-1.5">
              <label
                htmlFor="crowdsource-station"
                className="text-[10px] uppercase font-mono tracking-widest text-white/40 ml-1"
              >
                {t('crowdsource.station_name', 'Station Name')}
              </label>
              <div
                id="crowdsource-station"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white/20"
                role="textbox"
                aria-readonly="true"
              >
                {t('crowdsource.select_station', 'Select a station...')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="crowdsource-95"
                  className="text-[10px] uppercase font-mono tracking-widest text-white/40 ml-1"
                >
                  95E10
                </label>
                <div
                  id="crowdsource-95"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white/20"
                  role="textbox"
                  aria-readonly="true"
                >
                  0.000
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="crowdsource-diesel"
                  className="text-[10px] uppercase font-mono tracking-widest text-white/40 ml-1"
                >
                  Diesel
                </label>
                <div
                  id="crowdsource-diesel"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white/20"
                  role="textbox"
                  aria-readonly="true"
                >
                  0.000
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 font-bold transition-all duration-300 uppercase tracking-widest text-xs"
        >
          {t('common.close', 'Close')}
        </button>
      </div>
    </Modal>
  );
};
