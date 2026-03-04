/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Claims clients immediately
void self.skipWaiting();
clientsClaim();

// SPA navigation - use NetworkFirst for index.html
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages-cache',
    }),
  ),
);

// Price data URL (relative to base)
const PRICE_DATA_PATH = '/bensa/api/prices.json';

// Price threshold for alerts (EUR per liter)
const PRICE_ALERT_THRESHOLD = 1.75;

interface FuelPrice {
  type: string;
  price: number;
}

interface Station {
  name: string;
  prices: FuelPrice[];
}

interface PriceData {
  stations?: Station[];
}

/**
 * Check if any station has prices below the alert threshold
 */
async function checkPriceDrop(): Promise<{
  hasDrop: boolean;
  cheapestPrice: number;
  stationName: string;
}> {
  try {
    const response = await fetch(`${PRICE_DATA_PATH}?t=${Date.now()}`);
    if (!response.ok) return { hasDrop: false, cheapestPrice: 0, stationName: '' };

    const data = (await response.json()) as PriceData;
    const stations = data.stations ?? [];

    let cheapestPrice = Infinity;
    let stationName = '';

    for (const station of stations) {
      for (const fuel of station.prices) {
        if (fuel.type === '95' && fuel.price < cheapestPrice) {
          cheapestPrice = fuel.price;
          stationName = station.name;
        }
      }
    }

    return {
      hasDrop: cheapestPrice < PRICE_ALERT_THRESHOLD,
      cheapestPrice,
      stationName,
    };
  } catch (e) {
    console.error('[SW] Failed to check prices:', e);
    return { hasDrop: false, cheapestPrice: 0, stationName: '' };
  }
}

/**
 * Show notification for price drop
 */
async function showPriceNotification(stationName: string, price: number): Promise<void> {
  const title = `⛽ Price Drop: ${price.toFixed(3)} €/L`;

  await self.registration.showNotification(title, {
    body: `${stationName} has 95E10 below ${PRICE_ALERT_THRESHOLD.toFixed(2)} €/L. Fill up now!`,
    icon: '/bensa/pwa-192x192.png',
    badge: '/bensa/pwa-192x192.png',
    tag: 'price-alert',
    data: {
      url: '/bensa/',
    },
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = (event.notification.data as { url?: string } | null)?.url ?? '/bensa/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('bensa') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(urlToOpen);
    }),
  );
});

// Periodic background sync
interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}

self.addEventListener('periodicsync', ((event: PeriodicSyncEvent) => {
  if (event.tag === 'price-check') {
    event.waitUntil(
      (async () => {
        const result = await checkPriceDrop();
        if (result.hasDrop) {
          await showPriceNotification(result.stationName, result.cheapestPrice);
        }
      })(),
    );
  }
}) as EventListener);

// Handle messages from main app
interface PriceCheckMessage {
  type: string;
  threshold?: number;
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as PriceCheckMessage | undefined;
  if (data?.type === 'CHECK_PRICES') {
    event.waitUntil(
      (async () => {
        const result = await checkPriceDrop();
        if (result.hasDrop) {
          await showPriceNotification(result.stationName, result.cheapestPrice);
        }
        event.ports[0]?.postMessage(result);
      })(),
    );
  }
});

console.log('[SW] Bensa service worker loaded with price-drop notifications');
