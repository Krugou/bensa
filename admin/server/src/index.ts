import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { config } from 'dotenv';
import admin from 'firebase-admin';

config();

console.log('🔍 Starting Admin Server...');
console.log('📁 Environment variables check:', {
  PORT: process.env.PORT,
  HAS_SERVICE_ACCOUNT: !!process.env['FIREBASE_SERVICE_ACCOUNT'],
});

// Initialize Firebase Admin
try {
  if (process.env['FIREBASE_SERVICE_ACCOUNT']) {
    console.log('🔑 Initializing Firebase with Service Account...');
    const sa = JSON.parse(process.env['FIREBASE_SERVICE_ACCOUNT']);
    
    // Fix private key newlines - common issue with env variables
    if (sa.private_key && typeof sa.private_key === 'string') {
      console.log(`[DEBUG] Private key length before: ${sa.private_key.length}`);
      sa.private_key = sa.private_key.replace(/\r/g, '').replace(/\\n/g, '\n');
      
      // Auto-fix truncated keys (common copy-paste error)
      if (!sa.private_key.includes('END PRIVATE KEY')) {
        console.log('[DEBUG] 🔧 Appending missing END PRIVATE KEY footer...');
        // ensure there is a newline before the footer if missing
        sa.private_key = sa.private_key.trim() + '\n-----END PRIVATE KEY-----\n';
      }

      console.log(`[DEBUG] Private key length after FIX: ${sa.private_key.length}`);
      
      if (!sa.private_key.includes('\n')) {
        console.warn('⚠️ WARNING: Private key does not contain any newlines after replacement!');
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
    console.log('✅ Firebase initialized with Service Account');
  } else {
    console.log('⚠️ No FIREBASE_SERVICE_ACCOUNT found, using default initialization (ADC)...');
    admin.initializeApp();
    console.log('✅ Firebase initialized (Default)');
  }
} catch (e: any) {
  console.error('❌ FIREBASE INITIALIZATION ERROR:', e);
  // Initialize with empty config to prevent "no-app" crashes later, 
  // though Firestore calls will still fail.
  try { admin.initializeApp(); } catch {}
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Localhost restriction middleware
app.use((req, res, next) => {
  const hostname = req.hostname;
  console.log(`[AUTH] Request from: ${hostname}`);
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    next();
  } else {
    console.warn(`[AUTH] Access denied for hostname: ${hostname}`);
    res.status(403).json({ error: 'Access denied: Local development only' });
  }
});

// Routes
app.get('/api/stats', async (req, res) => {
  console.log('[API] GET /api/stats');
  try {
    const stationsSnap = await db.collection('stations').get();
    console.log(`[API] Found ${stationsSnap.size} stations`);
    
    const lockedCount = stationsSnap.docs.filter(d => d.data().userFixed).length;
    
    const runsSnap = await db.collection('scraper_runs')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    const lastRun = runsSnap.empty ? null : runsSnap.docs[0].data().timestamp?.toDate();

    res.json({
      totalStations: stationsSnap.size,
      lockedStations: lockedCount,
      lastScraperRun: lastRun,
    });
  } catch (err: any) {
    console.error('[API] /api/stats ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

app.get('/api/stations', async (req, res) => {
  console.log('[API] GET /api/stations');
  try {
    const snap = await db.collection('stations').orderBy('name', 'asc').get();
    console.log(`[API] Found ${snap.size} stations`);
    const stations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(stations);
  } catch (err: any) {
    console.error('[API] /api/stations ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch stations', details: err.message });
  }
});

app.get('/api/geocode', async (req, res) => {
  const { address, city } = req.query;
  console.log(`[API] GET /api/geocode?address=${address}&city=${city}`);
  
  if (!address || !city || typeof address !== 'string' || typeof city !== 'string') {
    return res.status(400).json({ error: 'Missing address or city parameter' });
  }
  
  try {
    // Strip brand names and extra info
    let cleanStreet = address
      .replace(/^(ABC|Neste|St1|Shell|SEO|Teboil|Gulf|ST1|NESTE|SHELL|TEBOIL|GULF)\s*/i, '')
      .replace(/^(ABC Deli|ABC Automaatti|Neste K|Neste Express)\s*/i, '')
      .replace(/\([^)]+\)/g, '')
      .replace(/110-tie/gi, '')
      .replace(/Kehä\s*(I|II|III|\d+)/gi, '');

    const streetRegex =
      /[A-Za-zäöåÄÖÅ-]+(?:tie|katu|kuja|väylä|kaari|polku|rinne|ranta|raitti|aukio|kallio|mäki|puisto|piha|portti|ahde|lehto|niitty|metsä|kuusi|männistö|kylä|lahti|niemi|luoma|saari|notko|penger)\s+\d+[a-zA-Z]?/i;
    const streetMatch = streetRegex.exec(cleanStreet);

    if (streetMatch) {
      cleanStreet = streetMatch[0].trim();
    } else {
      const parts = cleanStreet.split(',');
      cleanStreet = (parts.find((p) => /\d/.test(p)) ?? parts[0]).trim();
    }

    const query = encodeURIComponent(`${cleanStreet}, ${city}, Finland`);
    console.log(`[API] Geocode requesting: ${query}`);

    let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`, {
      headers: { 'User-Agent': 'BensaAdminPanel/1.0 (krugou-bensa)' },
    });
    
    if (!response.ok) throw new Error(`Nominatim API responded with status ${response.status}`);
    let data = await response.json();
    
    // Fallback: If exact street with number wasn't found, try just the street name
    if (data.length === 0 && /\d/.test(cleanStreet)) {
      const streetOnly = cleanStreet.replace(/\s*\d+[a-zA-Z]?\s*/g, '').trim();
      if (streetOnly.length > 2) {
        const fbQuery = encodeURIComponent(`${streetOnly}, ${city}, Finland`);
        console.log(`[API] Geocode fallback requesting: ${fbQuery}`);
        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${fbQuery}`, {
          headers: { 'User-Agent': 'BensaAdminPanel/1.0 (krugou-bensa)' },
        });
        if (response.ok) {
          data = await response.json();
        }
      }
    }
    
    res.json(data);
  } catch (err: any) {
    console.error('[API] /api/geocode ERROR:', err);
    res.status(500).json({ error: 'Failed to geocode', details: err.message });
  }
});

app.put('/api/stations/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[API] PUT /api/stations/${id}`);
  const data = req.body;
  try {
    await db.collection('stations').doc(id).update({
      ...data,
      userFixed: true,
      updatedAtStr: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[API] PUT /api/stations/${id} ERROR:`, err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

app.delete('/api/stations/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[API] DELETE /api/stations/${id}`);
  try {
    await db.collection('stations').doc(id).delete();
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[API] DELETE /api/stations/${id} ERROR:`, err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

app.post('/api/stations/:id/toggle-lock', async (req, res) => {
  const { id } = req.params;
  const { locked } = req.body;
  console.log(`[API] POST /api/stations/${id}/toggle-lock, locked=${locked}`);
  try {
    await db.collection('stations').doc(id).update({ userFixed: locked });
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[API] POST /api/stations/${id}/toggle-lock ERROR:`, err);
    res.status(500).json({ error: 'Toggle lock failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
});
