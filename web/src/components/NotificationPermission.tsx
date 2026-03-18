import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const NotificationPermission = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied',
  );
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register periodic background sync if available
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const registration = await navigator.serviceWorker?.ready;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (registration && 'periodicSync' in registration) {
          try {
            await (
              registration as unknown as {
                periodicSync: {
                  register: (tag: string, options: { minInterval: number }) => Promise<void>;
                };
              }
            ).periodicSync.register('price-check', {
              minInterval: 24 * 60 * 60 * 1000, // 24 hours
            });
          } catch (e) {
            console.warn('Periodic background sync could not be registered:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'granted') {
    return (
      <div className="glass-card p-4 flex items-center gap-3" id="notification-enabled">
        <span className="text-2xl">🔔</span>
        <div>
          <p className="text-sm font-semibold text-fuel-green">
            {t('notifications.enabled', 'Price drop alerts enabled')}
          </p>
          <p className="text-[11px] text-text-muted font-mono">
            {t('notifications.enabled_desc', "You'll be notified when prices drop significantly")}
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="glass-card p-4 flex items-center gap-3" id="notification-denied">
        <span className="text-2xl">🔕</span>
        <div>
          <p className="text-sm font-semibold text-text-muted">
            {t('notifications.denied', 'Notifications blocked')}
          </p>
          <p className="text-[11px] text-text-dim font-mono">
            {t('notifications.denied_desc', 'Enable in browser settings to receive price alerts')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-panel border border-outline-variant/15 rounded-xl p-8 text-center space-y-6 relative overflow-hidden glow-green"
      id="notification-prompt"
    >
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-[60px]"></div>
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <span
          className="material-symbols-outlined text-primary text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          notifications_active
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-headline font-bold">
          {t('notifications.prompt_title', 'Get price drop alerts')}
        </h3>
        <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
          {t(
            'notifications.prompt_desc',
            'Receive notifications when fuel prices drop below your threshold',
          )}
        </p>
      </div>
      <button
        onClick={() => {
          void requestPermission();
        }}
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
      >
        {loading
          ? t('notifications.loading', 'Loading...')
          : t('notifications.enable', 'Enable Alerts')}
      </button>
    </div>
  );
};
