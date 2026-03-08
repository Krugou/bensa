import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from './Modal';

interface ConsumptionCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  cheapestPrice: number;
}

export const ConsumptionCalculator: React.FC<ConsumptionCalculatorProps> = ({
  isOpen,
  onClose,
  currentPrice,
  cheapestPrice,
}) => {
  const { t } = useTranslation();
  const [consumption, setConsumption] = useState<number>(7.5);
  const [tankSize, setTankSize] = useState<number>(50);
  const [distance, setDistance] = useState<number>(10);

  const priceDiff = currentPrice - cheapestPrice;
  const savingsPerTank = tankSize * priceDiff;
  const costToDrive = (distance / 100) * consumption * cheapestPrice;
  const netSavings = savingsPerTank - costToDrive * 2; // Round trip

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('calc.title', 'Savings Calculator')}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-text-muted ml-1">
              {t('calc.consumption', 'L/100km')}
            </label>
            <input
              type="number"
              value={consumption}
              onChange={(e) => {
                setConsumption(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-card border border-border-card rounded-lg p-3 text-text-main focus:border-fuel-green/50 outline-none transition-colors font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-text-muted ml-1">
              {t('calc.tank_size', 'Tank (L)')}
            </label>
            <input
              type="number"
              value={tankSize}
              onChange={(e) => {
                setTankSize(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-card border border-border-card rounded-lg p-3 text-text-main focus:border-fuel-green/50 outline-none transition-colors font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-text-muted ml-1">
              {t('calc.distance', 'Distance (km)')}
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => {
                setDistance(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-card border border-border-card rounded-lg p-3 text-text-main focus:border-fuel-green/50 outline-none transition-colors font-mono"
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border-card space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">
              {t('calc.price_diff', 'Price Difference')}
            </span>
            <span className="text-lg font-mono text-fuel-green font-bold">
              {priceDiff.toFixed(3)} €/L
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">
              {t('calc.tank_savings', 'Savings per Tank')}
            </span>
            <span className="text-lg font-mono text-text-main font-bold">
              {savingsPerTank.toFixed(2)} €
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-muted">
              {t('calc.driving_cost', 'Cost to Drive')}
            </span>
            <span className="text-lg font-mono text-fuel-red/70 font-bold">
              -{costToDrive.toFixed(2)} €
            </span>
          </div>

          <div className="pt-4 border-t border-border-card flex justify-between items-center">
            <span className="text-base font-bold text-text-main">
              {t('calc.net_savings', 'Net Savings')}
            </span>
            <div className="text-right">
              <span
                className={`text-2xl font-black font-mono ${netSavings > 0 ? 'text-fuel-green' : 'text-fuel-red'} drop-shadow-sm`}
              >
                {netSavings.toFixed(2)} €
              </span>
              <p className="text-[10px] text-text-dim uppercase tracking-tighter">
                {netSavings > 0
                  ? t('calc.worth_it', 'Worth the drive!')
                  : t('calc.not_worth_it', 'Stay local')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-card border border-border-card hover:bg-card-hover text-text-muted font-bold transition-all duration-300 uppercase tracking-widest text-xs cursor-pointer"
        >
          {t('common.close', 'Close')}
        </button>
      </div>
    </Modal>
  );
};
