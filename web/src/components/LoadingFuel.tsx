import { useTranslation } from 'react-i18next';

export const LoadingFuel = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in" id="loading">
      {/* Animated fuel pump icon */}
      <div className="relative">
        <div className="text-6xl animate-glow-breathe">⛽</div>
        <div
          className="absolute inset-0 w-full h-full rounded-full blur-[40px] opacity-30"
          style={{ background: 'radial-gradient(circle, #00ff88, transparent)' }}
        />
      </div>

      {/* Loading text */}
      <div className="space-y-2 text-center">
        <p className="text-white/60 font-mono text-sm animate-pulse">
          {t('loading.text', 'Fetching fuel prices...')}
        </p>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-fuel-green/60"
              style={{
                animation: `price-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
