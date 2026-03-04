import { getAnalytics, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { EmailAuthProvider, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let analytics: ReturnType<typeof getAnalytics> | null = null;

/**
 * Initialize analytics only if user has consented
 */
export const initAnalytics = (hasConsented: boolean) => {
  try {
    analytics ??= getAnalytics(app);
    setAnalyticsCollectionEnabled(analytics, hasConsented);
    console.log(`📊 Analytics collection ${hasConsented ? 'enabled' : 'disabled'}`);
  } catch (e) {
    console.warn('Firebase Analytics initialization failed:', e);
  }
};

// Check for existing consent on load
const savedConsent = localStorage.getItem('cookie_consent');
if (savedConsent === 'true') {
  initAnalytics(true);
}

export { analytics, app, auth, db, EmailAuthProvider, googleProvider };
