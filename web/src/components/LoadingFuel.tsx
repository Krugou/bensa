import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const LoadingFuel = () => {
  const { t } = useTranslation();

  const loadingQuotes = useMemo(
    () => [
      t('loading.funny_1', 'If this gets killed, my free plan is toast... 🍞'),
      t('loading.funny_2', "I'll be back... with cheaper prices. 🤖"),
      t('loading.funny_3', "Frankly, my dear, I don't give a... wait, gas is how much?! 😱"),
      t('loading.funny_4', 'May the fuel be with you. ✨'),
      t('loading.funny_5', "I'm going to make him an offer he can't refuse... 1.50€/L. 🤌"),
      t('loading.funny_6', "Toto, I've a feeling we're not in the cheap zone anymore. 🌪️"),
      t('loading.funny_7', 'Fasten your seatbelts. It’s going to be a bumpy price ride. 🎢'),
      t('loading.funny_8', 'Show me the money! (Or just the cheap diesel). 💸'),
      t('loading.funny_9', 'You’re gonna need a bigger tank. 🦈'),
      t('loading.funny_10', 'Keep your friends close, but your gas stations closer. ⛽'),
      t('loading.funny_11', 'Great Scott! This price is heavy, Marty! 🏎️💨'),
    ],
    [t],
  );

  const randomQuote = useMemo(
    () => loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)],
    [loadingQuotes],
  );

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in"
      id="loading"
    >
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
          <p className="text-slate-700 dark:text-white/80 font-mono text-sm tracking-widest uppercase animate-pulse">
            {t('loading.text', 'Fetching fuel prices...')}
          </p>
          <p className="text-fuel-yellow max-w-xs mx-auto font-mono text-xs italic bg-bensa-violet/20 px-3 py-2 rounded-lg border border-bensa-violet/30 shadow-[0_0_15px_rgba(180,100,255,0.2)]">
            {randomQuote}
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
