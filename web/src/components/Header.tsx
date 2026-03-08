import { useTranslation } from 'react-i18next';

export const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="text-center py-8 md:py-12 animate-fade-in">
      {/* Logo & Brand */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="text-4xl md:text-5xl animate-spin-slow">⛽</span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-fuel-green via-fuel-yellow to-fuel-red bg-clip-text text-transparent">
          {t('app.title', 'Bensa')}
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-text-muted font-mono text-sm md:text-base tracking-wider uppercase">
        {t('header.subtitle', 'Real-time fuel price tracker')}
      </p>

      {/* Animated price ticker line */}
      <div className="mt-6 relative overflow-hidden h-8 border-y border-border-card">
        <div className="animate-marquee whitespace-nowrap flex items-center h-full gap-8 text-xs font-mono text-text-dim">
          <span>📊 {t('header.ticker.live', 'LIVE PRICES')}</span>
          <span>•</span>
          <span>🇫🇮 {t('header.ticker.finland', 'FINLAND')}</span>
          <span>•</span>
          <span>⛽ {t('header.ticker.types', '95E10 · 98E5 · DIESEL')}</span>
          <span>•</span>
          <span>📍 {t('header.ticker.nearby', 'FIND CHEAPEST NEAR YOU')}</span>
          <span>•</span>
          <span>🔔 {t('header.ticker.alerts', 'PRICE DROP ALERTS')}</span>
        </div>
      </div>
    </header>
  );
};
