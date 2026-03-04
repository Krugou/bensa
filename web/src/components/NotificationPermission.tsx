import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const NotificationPermission = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    setLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Register periodic background sync if available
        const registration = await navigator.serviceWorker?.ready;
        if (registration && 'periodicSync' in registration) {
          try {
            await (
              registration as unknown as {
                periodicSync: {
                  register: (tag: string, options: { minInterval: number }) => Promise<void>;
                };
              }
            ).periodicSync.register('price-check', {
              minInterval: 4 * 60 * 60 * 1000, // 4 hours
            });
          } catch {
            console.warn('[Notification] Periodic sync registration failed');
          }
        }
      }
    } catch (error) {
      console.error('[Notification] Permission request failed:', error);
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
          <p className="text-[11px] text-white/40 font-mono">
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
          <p className="text-sm font-semibold text-white/50">
            {t('notifications.denied', 'Notifications blocked')}
          </p>
          <p className="text-[11px] text-white/30 font-mono">
            {t('notifications.denied_desc', 'Enable in browser settings to receive price alerts')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5" id="notification-prompt">
      <div className="flex items-start gap-4">
        <span className="text-3xl">🔔</span>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-white/90">
            {t('notifications.prompt_title', 'Get price drop alerts')}
          </h3>
          <p className="text-[11px] text-white/40 font-mono mt-1">
            {t(
              'notifications.prompt_desc',
              'Receive notifications when fuel prices drop below your threshold',
            )}
          </p>
          <button
            onClick={requestPermission}
            disabled={loading}
            className="mt-3 px-5 py-2 bg-fuel-green/20 border border-fuel-green/40 rounded-lg text-fuel-green text-sm font-semibold hover:bg-fuel-green/30 transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            {loading
              ? t('notifications.loading', 'Requesting...')
              : t('notifications.enable', 'Enable Alerts')}
          </button>
        </div>
      </div>
    </div>
  );
};
