import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { config } from 'dotenv';
import admin from 'firebase-admin';

config();

// Initialize Firebase Admin
if (process.env['FIREBASE_SERVICE_ACCOUNT']) {
  try {
    const sa = JSON.parse(process.env['FIREBASE_SERVICE_ACCOUNT']);
    admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
  } catch (e) {
    admin.initializeApp();
  }
} else {
  admin.initializeApp();
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
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Local development only' });
  }
});

// Routes
app.get('/api/stats', async (req, res) => {
  try {
    const stationsSnap = await db.collection('stations').get();
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/stations', async (req, res) => {
  try {
    const snap = await db.collection('stations').orderBy('name', 'asc').get();
    const stations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

app.put('/api/stations/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await db.collection('stations').doc(id).update({
      ...data,
      userFixed: true,
      updatedAtStr: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/api/stations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('stations').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.post('/api/stations/:id/toggle-lock', async (req, res) => {
  const { id } = req.params;
  const { locked } = req.body;
  try {
    await db.collection('stations').doc(id).update({ userFixed: locked });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Toggle lock failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Admin Backend running on http://localhost:${PORT}`);
});
