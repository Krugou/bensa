import './index.css';
import './i18n';
import './firebase';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

console.warn(
  `%c BENSA %c Build: ${__BUILD_TIME__} `,
  'background: #00ff88; color: #000; font-weight: bold;',
  'background: #000; color: #fff;',
);

// Environment identification
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isGH = window.location.hostname.includes('github.io');
const isFirebase =
  window.location.hostname.includes('web.app') ||
  window.location.hostname.includes('firebaseapp.com');

if (isGH) {
  console.log(
    `%c 🚀 GITHUB PAGES VERSION `,
    'background: #24292e; color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  );
} else if (isFirebase) {
  console.log(
    `%c 🔥 FIREBASE HOSTING VERSION `,
    'background: #ffca28; color: #000; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  );
} else {
  console.log(
    `%c 💻 LOCAL DEVELOPMENT `,
    'background: #333; color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  );
}

console.log(`%c 🆔 PROJECT ID: ${projectId || 'MISSING'} `, 'color: #00ff88; font-weight: bold;');

// Env variable check
console.groupCollapsed('🔒 Environment Configuration Status');
const requiredEnvs = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

requiredEnvs.forEach((env) => {
  const value = (import.meta.env as Record<string, string | undefined>)[env];
  const isSet = !!value && value !== '';
  const statusStyle = isSet ? 'color: #00ff88;' : 'color: #ff4444; font-weight: bold;';
  console.log(`%c${env}: ${isSet ? '✅ OK' : '❌ MISSING'}`, statusStyle);
});
console.groupEnd();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
