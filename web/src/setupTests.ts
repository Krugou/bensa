import '@testing-library/jest-dom';

import { vi } from 'vitest';

// ─── Mock react-i18next ───────────────────────────────────────────────────────
const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
const mockI18n = {
  changeLanguage: mockChangeLanguage,
  language: 'en',
  on: vi.fn(),
  off: vi.fn(),
  t: vi.fn((key: string, defaultValueOrOptions?: string | Record<string, unknown>) => {
    let result = key;
    if (defaultValueOrOptions) {
      if (typeof defaultValueOrOptions === 'string') {
        result = defaultValueOrOptions;
      } else if (
        typeof defaultValueOrOptions === 'object' &&
        defaultValueOrOptions['defaultValue'] != null
      ) {
        result = defaultValueOrOptions['defaultValue'] as string;
      }

      // Handle interpolation like {{count}} or {{year}}
      const finalOptions =
        typeof defaultValueOrOptions === 'object' ? defaultValueOrOptions : undefined;
      if (finalOptions) {
        for (const [k, v] of Object.entries(finalOptions)) {
          result = result.replace(`{{${k}}}`, String(v));
        }
      }
    }
    return result;
  }),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockI18n.t,
    i18n: mockI18n,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// ─── Mock Firebase ────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn().mockImplementation(function (this: unknown) {
    return this;
  }),
  EmailAuthProvider: { PROVIDER_ID: 'password' },
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
}));

// ─── Mock Analytics Utility ──────────────────────────────────────────────────
vi.mock('./utils/analytics', () => ({
  Analytics: {
    trackButtonClick: vi.fn(),
    trackExternalLink: vi.fn(),
    trackLanguageChange: vi.fn(),
    trackThemeChange: vi.fn(),
    trackLocationRequest: vi.fn(),
    trackSectionToggle: vi.fn(),
  },
}));

// ─── Mock Browser APIs ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      const { [key]: _, ...rest } = store;
      store = rest;
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Mock Geolocation ───────────────────────────────────────────────────────
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

// ─── Reset mocks between tests ───────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.clear.mockClear();
  localStorageMock.removeItem.mockClear();
  mockGeolocation.getCurrentPosition.mockReset();
});
