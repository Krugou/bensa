/// <reference types="node" />
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, limit, query } from 'firebase/firestore';

/**
 * Integration test to verify client-side Firebase configuration.
 * Uses VITE_ environment variables to simulate the production client environment.
 */
async function testClientFirebase() {
  console.log('🔍 Testing Client-Side Firebase Connectivity...');

  const firebaseConfig = {
    apiKey: process.env['VITE_FIREBASE_API_KEY'],
    authDomain: process.env['VITE_FIREBASE_AUTH_DOMAIN'],
    projectId: process.env['VITE_FIREBASE_PROJECT_ID'],
    storageBucket: process.env['VITE_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: process.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    appId: process.env['VITE_FIREBASE_APP_ID'],
    measurementId: process.env['VITE_FIREBASE_MEASUREMENT_ID'],
  };

  // Check if any values are missing
  const missing = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Error: Missing client environment variables:', missing.join(', '));
    process.exit(1);
  }

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log(`📡 Client connected to project: ${firebaseConfig.projectId}`);

    // Attempt a real fetch from the stations collection
    const stationsCol = collection(db, 'stations');
    const q = query(stationsCol, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('⚠️ Client fetch successful, but no stations found.');
    } else {
      const data = snapshot.docs[0].data();
      console.log(`✅ Client Success! Successfully fetched station: ${String(data['name'])}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Client-Side Firebase Connection Failed:');
    console.error(err);
    process.exit(1);
  }
}

void testClientFirebase();
