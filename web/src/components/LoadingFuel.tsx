import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const LoadingFuel = () => {
  const { t } = useTranslation();

  const loadingQuotes = useMemo(
    () => [
      t('loading.funny_1', 'If this gets killed, my free plan is toast... 🍞'),
      t('loading.funny_2', 'Houston, we have a problem... the free tier is at 99%. 🚀'),
      t('loading.funny_3', 'One does not simply fetch prices without hitting the daily limit. 🏔️'),
      t('loading.funny_4', "Help me, Firebase Admin... you're my only hope (to stay free). 💫"),
      t(
        'loading.funny_5',
        "I'm going to make him an offer he can't refuse... 50,000 free reads. 🤌",
      ),
      t('loading.funny_6', 'I feel the need... the need for more free quota! 🏎️'),
      t(
        'loading.funny_7',
        'Mama always said Firebase was like a box of chocolates... you never know when you run out. 🍬',
      ),
      t('loading.funny_8', "You can't handle the truth! (And neither can our daily limit). ⚖️"),
      t(
        'loading.funny_9',
        "I've seen things you people wouldn't believe... like our usage bills. 🌌",
      ),
      t('loading.funny_10', 'Are you not entertained?! Is this not why we are out of quota?! ⚔️'),
      t('loading.funny_11', 'Great Scott! The user count is over 1.21 gigawatts! 🏎️💨'),
      t('loading.funny_12', "Frankly, my dear, I don't give a... wait, we hit the read limit?! 😱"),
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
          <p className="text-white/80 font-mono text-sm tracking-widest uppercase animate-pulse">
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
