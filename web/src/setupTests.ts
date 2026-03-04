import '@testing-library/jest-dom';

import { vi } from 'vitest';

// ─── Mock react-i18next ───────────────────────────────────────────────────────
vi.mock('react-i18next', async () => {
  const React = await import('react');
  return {
    useTranslation: () => ({
      t: (key: string, optsOrDefault?: string | Record<string, unknown>) => {
        if (typeof optsOrDefault === 'string') return optsOrDefault;
        if (typeof optsOrDefault === 'object' && optsOrDefault?.defaultValue != null)
          return optsOrDefault.defaultValue as string;
        // Handle interpolation like {{count}} or {{year}}
        if (typeof optsOrDefault === 'object' && optsOrDefault) {
          let result = key;
          for (const [k, v] of Object.entries(optsOrDefault)) {
            result = result.replace(`{{${k}}}`, String(v));
          }
          return result;
        }
        return key;
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn().mockResolvedValue(undefined),
      },
    }),
    Trans: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
  };
});

// ─── Mock Firebase ────────────────────────────────────────────────────────────
vi.mock('./firebase', () => ({
  app: {},
  analytics: null,
}));

// ─── Mock Firebase/analytics ──────────────────────────────────────────────────
vi.mock('firebase/analytics', () => ({
  logEvent: vi.fn(),
  getAnalytics: vi.fn(),
}));

// ─── Mock Analytics utility ───────────────────────────────────────────────────
vi.mock('./utils/analytics', () => ({
  Analytics: {
    trackButtonClick: vi.fn(),
    trackNavigation: vi.fn(),
    trackSectionToggle: vi.fn(),
    trackThemeChange: vi.fn(),
    trackLanguageChange: vi.fn(),
    trackFuelTypeChange: vi.fn(),
    trackStationView: vi.fn(),
    trackLocationRequest: vi.fn(),
    trackNotificationPermission: vi.fn(),
    trackExternalLink: vi.fn(),
    trackMapInteraction: vi.fn(),
  },
}));

// ─── Mock Leaflet (not available in jsdom) ────────────────────────────────────
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => children,
  TileLayer: () => null,
  CircleMarker: ({ children }: { children: React.ReactNode }) => children,
  Popup: ({ children }: { children: React.ReactNode }) => children,
  useMap: () => ({ setView: vi.fn(), getZoom: vi.fn(() => 7) }),
}));

vi.mock('leaflet', () => ({
  default: {
    icon: vi.fn(),
    marker: vi.fn(),
  },
}));

// ─── Mock localStorage ───────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Reset mocks between tests ───────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
