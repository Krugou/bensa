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
if (window.location.hostname.includes('github.io')) {
  console.log(
    '%c 🚀 GITHUB PAGES VERSION ',
    'background: #24292e; color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  );
} else if (
  window.location.hostname.includes('web.app') ||
  window.location.hostname.includes('firebaseapp.com')
) {
  console.log(
    '%c 🔥 FIREBASE HOSTING VERSION ',
    'background: #ffca28; color: #000; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  );
} else {
  console.log(
    '%c 💻 LOCAL DEVELOPMENT ',
    'background: #333; color: #fff; font-weight: bold; padding: 2px 4px; border-radius: 2px;',
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
