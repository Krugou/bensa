import admin, { ServiceAccount } from 'firebase-admin';
import { config } from 'dotenv';

config();

async function testConnection() {
  console.log('🔍 Testing Firebase Connection...');

  const saVar = process.env['FIREBASE_ADMIN_SDK'] ?? process.env['FIREBASE_SERVICE_ACCOUNT'] ?? process.env['FIREBASE_SERVICE_ACCOUNT_KRUGOU_BENSA'];
  const projectVar = process.env['VITE_FIREBASE_PROJECT_ID'] ?? process.env['FIREBASE_PROJECT_ID'];

  if (!saVar) {
    console.error('❌ Error: No Service Account secret found (checked FIREBASE_ADMIN_SDK).');
    process.exit(1);
  }

  try {
    const saJson = JSON.parse(saVar) as ServiceAccount & { project_id?: string };
    const projectId = saJson.projectId ?? saJson.project_id ?? projectVar;

    admin.initializeApp({
      credential: admin.credential.cert(saJson),
      projectId: projectId,
    });

    const db = admin.firestore();
    console.log(`📡 Connecting to project: ${projectId}...`);

    // Attempt to fetch the last run
    const snapshot = await db.collection('scraper_runs')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log('⚠️ Connection successful, but no scraper runs found in collection.');
    } else {
      const lastRun = snapshot.docs[0].data();
      const time = lastRun['timestamp']?.toDate?.()?.toLocaleString() ?? 'unknown';
      console.log(`✅ Success! Last scraper run found from: ${time}`);
      console.log(`📊 Stats: ${lastRun['stationCount']} stations processed.`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Firebase Connection Failed:');
    console.error(err);
    process.exit(1);
  }
}

void testConnection();
