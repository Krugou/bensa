import { config } from 'dotenv';
import admin, { ServiceAccount } from 'firebase-admin';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import puppeteer from 'puppeteer';

// Load environment variables
config();

// Initialize Firebase Admin
const saVarName = process.env['FIREBASE_ADMIN_SDK'] ? 'FIREBASE_ADMIN_SDK' : 'FIREBASE_SERVICE_ACCOUNT';
const saVar = process.env['FIREBASE_ADMIN_SDK'] ?? process.env['FIREBASE_SERVICE_ACCOUNT'] ?? process.env['FIREBASE_SERVICE_ACCOUNT_KRUGOU_BENSA'];
const projectVar = process.env['VITE_FIREBASE_PROJECT_ID'] ?? process.env['FIREBASE_PROJECT_ID'];

if (saVar) {
  try {
    const saJson = JSON.parse(saVar) as ServiceAccount & {
      project_id?: string;
    };
    const projectId = saJson.projectId ?? saJson.project_id ?? projectVar;

    admin.initializeApp({
      credential: admin.credential.cert(saJson),
      projectId: projectId,
    });
    console.log(`🔥 Firebase Admin initialized using ${saVarName} for project: ${projectId ?? 'unknown'}`);
  } catch (err) {
    console.error(`❌ Failed to parse ${saVarName}:`, err);
    admin.initializeApp();
  }
} else {
  console.log(`⚠️ No service account variable found. Using default credentials and project: ${projectVar ?? 'detected'}`);
  admin.initializeApp({
    projectId: projectVar,
  });
}

const db = admin.firestore();

interface FuelPrice {
  type: '95' | '98' | 'diesel';
  price: number;
  updatedAt: string;
}

interface GasStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
  prices: FuelPrice[];
  sourceUrl?: string;
}

interface PriceData {
  lastUpdated: string;
  stations: GasStation[];
}

const TARGET_URLS = [
  'https://polttoaine.net/index.php?t=PK-Seutu',
  'https://polttoaine.net/index.php?cmd=20kalleinta',
  'https://polttoaine.net/index.php?cmd=20halvinta',
  'https://polttoaine.net/index.php?t=Seina_joen_seutu',
  'https://polttoaine.net/index.php?t=Porin_seutu',
  'https://polttoaine.net/index.php?t=Jyva_skyla_n_seutu',
  'https://polttoaine.net/index.php?t=Oulun_seutu',
  'https://polttoaine.net/index.php?t=Tampereen_seutu',
  'https://polttoaine.net/index.php?t=Turun_seutu',
];

/**
 * Helper to pause execution
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Helper to fetch GPS coordinates using OpenStreetMap's Nominatim API.
 */
async function geocodeAddress(
  address: string,
  city: string,
): Promise<{ lat: number; lon: number } | null> {
  let cleanStreet = address
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
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BensaTrackerBot/1.0 (BensaTracker PWA)',
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { lat: string; lon: string }[];
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.error(`[Geocode Error] for ${address}, ${city}:`, err);
  }

  return null;
}

/**
 * Scrapes gas prices from polttoaine.net multiple pages.
 */
async function scrapeGasPrices(): Promise<GasStation[]> {
  console.log('📡 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allStationsMap = new Map<string, GasStation>();

  for (const url of TARGET_URLS) {
    console.log(`🌐 Navigating to ${url}...`);
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('#Hinnat table', { timeout: 10000 }).catch(() => null);

      const stations = await page.evaluate((sourceUrl) => {
        const rows = document.querySelectorAll('#Hinnat table tbody tr');
        const results: GasStation[] = [];
        let currentCity = 'Unknown';

        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');

          if (cells.length === 1 && cells[0].colSpan === 5) {
            const boldTag = cells[0].querySelector('b');
            if (boldTag) {
              currentCity = boldTag.textContent ? boldTag.textContent.trim() : currentCity;
            }
            return;
          }

          if (
            cells.length === 5 &&
            !cells[0].classList.contains('Keskihinnat') &&
            cells[0].textContent &&
            cells[0].textContent.trim() !== ''
          ) {
            const stationCell = cells[0].cloneNode(true) as HTMLElement;
            const aTag = stationCell.querySelector('a');
            let mapId = '';
            if (aTag) {
              const href = aTag.getAttribute('href');
              if (href) {
                const match = /id=(\d+)/.exec(href);
                if (match) mapId = match[1];
              }
              stationCell.removeChild(aTag);
            }

            const rawName = stationCell.textContent ? stationCell.textContent.trim() : 'Unknown Station';
            const brand = rawName.split(/[\s,]+/)[0];

            const parsePrice = (cell: Element): number => {
              const text = cell.textContent ? cell.textContent.replace(/\*/g, '').trim() : '';
              return text === '-' || text === '' ? 0 : parseFloat(text.replace(',', '.'));
            };

            const prices: FuelPrice[] = [];
            const now = new Date().toISOString();
            const price95 = parsePrice(cells[2]);
            const price98 = parsePrice(cells[3]);
            const diesel = parsePrice(cells[4]);

            if (price95 > 0) prices.push({ type: '95', price: price95, updatedAt: now });
            if (price98 > 0) prices.push({ type: '98', price: price98, updatedAt: now });
            if (diesel > 0) prices.push({ type: 'diesel', price: diesel, updatedAt: now });

            if (prices.length > 0) {
              results.push({
                id: mapId ? `station-${mapId}` : `station-${index}-${currentCity}`,
                name: rawName,
                brand: brand,
                address: rawName,
                city: currentCity,
                lat: 0,
                lon: 0,
                prices: prices,
                sourceUrl: sourceUrl,
              });
            }
          }
        });
        return results;
      }, url);

      stations.forEach((s) => {
        const existing = allStationsMap.get(s.id);
        if (!existing) {
          allStationsMap.set(s.id, s);
        } else {
          // Merge prices if we found the same station on multiple pages
          s.prices.forEach(newPrice => {
            const pIdx = existing.prices.findIndex(p => p.type === newPrice.type);
            if (pIdx === -1) {
              existing.prices.push(newPrice);
            } else if (new Date(newPrice.updatedAt) > new Date(existing.prices[pIdx].updatedAt)) {
              existing.prices[pIdx] = newPrice;
            }
          });
        }
      });
    } catch (err) {
      console.error(`❌ Failed to scrape ${url}:`, err);
    } finally {
      await page.close();
    }
    // Small delay between pages
    await delay(1000);
  }

  await browser.close();
  return Array.from(allStationsMap.values());
}

/**
 * Maps the scraped stations and adds real GPS coordinates.
 * Uses Firestore as a cache to avoid redundant geocoding.
 */
async function processStationsWithGeocoding(scrapedStations: GasStation[]): Promise<GasStation[]> {
  console.log('🔎 Loading existing stations from Firestore for coordinate cache...');
  const cache: Partial<Record<string, { lat: number; lon: number }>> = {};

  try {
    const snapshot = await db.collection('stations').get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data['lat'] && data['lon']) {
        const key = `${String(data['name']).trim()}-${String(data['city']).trim()}`.toLowerCase();
        cache[key] = { lat: Number(data['lat']), lon: Number(data['lon']) };
      }
    });
    console.log(`✅ Cached coordinates for ${Object.keys(cache).length} stations.`);
  } catch (err) {
    console.warn('⚠️ Could not load cache from Firestore, will geocode everything:', err);
  }

  const processed: GasStation[] = [];
  console.log(
    `🌍 Processing ${scrapedStations.length} stations...`,
  );

  for (let i = 0; i < scrapedStations.length; i++) {
    const station = scrapedStations[i];
    const cacheKey = `${station.name.trim()}-${station.city.trim()}`.toLowerCase();

    if (cache[cacheKey]) {
      station.lat = cache[cacheKey].lat;
      station.lon = cache[cacheKey].lon;
    } else {
      const rawAddress = station.address;
      console.log(`[${i + 1}/${scrapedStations.length}] 🛰️  Geocoding: ${rawAddress}, ${station.city}`);
      const coords = await geocodeAddress(rawAddress, station.city);

      if (coords) {
        station.lat = coords.lat;
        station.lon = coords.lon;
        // Update cache so we don't geocode same station if it appears multiple times in this run
        cache[cacheKey] = coords;
      }
      await delay(1200);
    }

    processed.push(station);
  }

  return processed;
}

/**
 * Saves station data to Firestore.
 */
async function saveToFirestore(stations: GasStation[]): Promise<void> {
  console.log(`🔥 Saving ${stations.length} stations to Firestore (with history)...`);

  const batchSize = 400;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  for (let i = 0; i < stations.length; i += batchSize) {
    const batch = db.batch();
    const currentBatch = stations.slice(i, i + batchSize);

    currentBatch.forEach((station) => {
      const stationRef = db.collection('stations').doc(station.id);
      batch.set(
        stationRef,
        {
          ...station,
          lastUpdated: timestamp,
          updatedAtStr: new Date().toISOString(),
        },
        { merge: true },
      );

      const historyRef = db.collection('price_history').doc();
      batch.set(historyRef, {
        stationId: station.id,
        stationName: station.name,
        city: station.city,
        brand: station.brand,
        prices: station.prices,
        timestamp: timestamp,
        sourceUrl: station.sourceUrl,
      });
    });

    await batch.commit();
    console.log(`   ✅ Committed batch ${Math.floor(i / batchSize) + 1}`);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('⛽ Bensa Scraper starting...');

  try {
    const scrapedStations = await scrapeGasPrices();
    console.log(`✅ Scraped total ${scrapedStations.length} unique stations`);

    const finalStations = await processStationsWithGeocoding(scrapedStations);

    const output: PriceData = {
      lastUpdated: new Date().toISOString(),
      stations: finalStations,
    };

    try {
      const outputPath = resolve(import.meta.dirname, '..', '..', 'web', 'public', 'api', 'prices.json');
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`📁 Written to local JSON: ${outputPath}`);
    } catch (err) {
      console.warn('⚠️ Could not write to local JSON:', err);
    }

    await saveToFirestore(finalStations);

    await db.collection('scraper_runs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stationCount: finalStations.length,
      status: 'success',
    });

    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

void main();
