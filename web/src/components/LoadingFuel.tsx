import { useTranslation } from 'react-i18next';

export const LoadingFuel = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in" id="loading">
      {/* Animated fuel pump icon */}
      <div className="relative">
        <div className="text-6xl animate-glow-breathe">⛽</div>
        <div
          className="absolute inset-0 w-full h-full rounded-full blur-2xl opacity-30"
          style={{ background: 'radial-gradient(circle, #00ff88, transparent)' }}
        />
      </div>

      {/* Loading text */}
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <p className="text-white/80 font-mono text-sm tracking-widest uppercase animate-pulse">
            {t('loading.text', 'Fetching fuel prices...')}
          </p>
          <p className="text-fuel-yellow max-w-xs mx-auto font-mono text-xs italic bg-bensa-violet/20 px-3 py-2 rounded-lg border border-bensa-violet/30 shadow-[0_0_15px_rgba(180,100,255,0.2)]">
            {t('loading.funny', 'this might work if not then no more free plan then')} 😅
          </p>
        </div>
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
