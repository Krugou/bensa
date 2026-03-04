import { config } from 'dotenv';
import admin, { ServiceAccount } from 'firebase-admin';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import puppeteer from 'puppeteer';

// Load environment variables
config();

// Initialize Firebase Admin
const saVarName = process.env['FIREBASE_SERVICE_ACCOUNT_KRUGOU_BENSA'] ? 'FIREBASE_SERVICE_ACCOUNT_KRUGOU_BENSA' : 'FIREBASE_SERVICE_ACCOUNT';
const saVar = process.env['FIREBASE_SERVICE_ACCOUNT_KRUGOU_BENSA'] ?? process.env['FIREBASE_SERVICE_ACCOUNT'];
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
}

interface PriceData {
  lastUpdated: string;
  stations: GasStation[];
}

/**
 * Helper to pause execution
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Helper to fetch GPS coordinates using OpenStreetMap's Nominatim API.
 * Nominatim requires a user-agent and specifies a strict 1 request/second limit.
 */
async function geocodeAddress(
  address: string,
  city: string,
): Promise<{ lat: number; lon: number } | null> {
  // Clean address noise (parenthesis, highways, Kehä)
  let cleanStreet = address
    .replace(/\([^)]+\)/g, '')
    .replace(/110-tie/gi, '')
    .replace(/Kehä\s*(I|II|III|\d+)/gi, '');

  // Attempt to extract the street name and number specifically
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

    if (!response.ok) {
      console.warn(`[Geocode API Error] ${response.status} for ${address}, ${city}`);
      return null;
    }

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
 * Scrapes gas prices from polttoaine.net PK-Seutu page.
 */
async function scrapeGasPrices(): Promise<GasStation[]> {
  console.log('📡 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    // Add these args if running inside a constrained environment like GitHub Actions
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  console.log('🌐 Navigating to fuel comparison site...');
  await page.goto('https://polttoaine.net/index.php?t=PK-Seutu', {
    waitUntil: 'domcontentloaded',
  });

  // Wait for the table to appear
  await page.waitForSelector('#Hinnat table');

  console.log('📊 Extracting data...');
  const stations = await page.evaluate(() => {
    const rows = document.querySelectorAll('#Hinnat table tbody tr');
    const results: GasStation[] = [];
    let currentCity = 'Unknown';

    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');

      // 1. Check if this is a city header row (e.g., <b>Espoo</b>)
      if (cells.length === 1 && cells[0].colSpan === 5) {
        const boldTag = cells[0].querySelector('b');
        if (boldTag) {
          currentCity = boldTag.textContent ? boldTag.textContent.trim() : currentCity;
        }
        return;
      }

      // 2. Process data rows (must have 5 columns, ignore "Keskihinnat" averages)
      if (
        cells.length === 5 &&
        !cells[0].classList.contains('Keskihinnat') &&
        cells[0].textContent &&
        cells[0].textContent.trim() !== ''
      ) {
        // Clean up the station name by removing the map link <a> tag
        const stationCell = cells[0].cloneNode(true) as HTMLElement;
        const aTag = stationCell.querySelector('a');
        let mapId = '';
        if (aTag) {
          // Optionally extract map ID from href if you want to fetch coords later
          const href = aTag.getAttribute('href');
          if (href) {
            const idRegex = /id=(\d+)/;
            const match = idRegex.exec(href);
            if (match) mapId = match[1];
          }
          stationCell.removeChild(aTag);
        }

        const rawName = stationCell.textContent ? stationCell.textContent.trim() : 'Unknown Station';

        // Very basic heuristic for brand: first word before a comma or space
        const brand = rawName.split(/[\s,]+/)[0];

        // Parse prices safely
        const parsePrice = (cell: Element): number => {
          // Remove asterisks (used for E99+) and trim spaces
          const text = cell.textContent ? cell.textContent.replace(/\*/g, '').trim() : '';
          return text === '-' || text === '' ? 0 : parseFloat(text);
        };

        const price95 = parsePrice(cells[2]);
        const price98 = parsePrice(cells[3]);
        const diesel = parsePrice(cells[4]);

        const prices: FuelPrice[] = [];
        const now = new Date().toISOString();

        if (price95 > 0) prices.push({ type: '95', price: price95, updatedAt: now });
        if (price98 > 0) prices.push({ type: '98', price: price98, updatedAt: now });
        if (diesel > 0) prices.push({ type: 'diesel', price: diesel, updatedAt: now });

        if (prices.length > 0) {
          results.push({
            id: mapId ? `station-${mapId}` : `station-${index}`,
            name: rawName,
            brand: brand,
            address: rawName, // The site bundles address into the name string
            city: currentCity,
            lat: 0, // Requires additional scraping of the map pages
            lon: 0, // Requires additional scraping of the map pages
            prices: prices,
          });
        }
      }
    });

    return results;
  });

  await browser.close();
  return stations;
}

/**
 * Maps the scraped stations and adds real GPS coordinates.
 * Uses Firestore as a cache to avoid redundant geocoding.
 */
async function processStationsWithGeocoding(scrapedStations: GasStation[]): Promise<GasStation[]> {
  console.log('🔎 Loading existing stations from Firestore for coordinate cache...');
  const cache: Record<string, { lat: number; lon: number }> = {};

  try {
    const snapshot = await db.collection('stations').get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data['lat'] && data['lon']) {
        // Use name + city as a key for robust matching
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
    `🌍 Starting geocoding for ${scrapedStations.length} stations... this will take a moment (1 req/sec limit).`,
  );

  for (let i = 0; i < scrapedStations.length; i++) {
    const station = scrapedStations[i];
    const cacheKey = `${station.name.trim()}-${station.city.trim()}`.toLowerCase();

    if (cache[cacheKey]) {
      station.lat = cache[cacheKey].lat;
      station.lon = cache[cacheKey].lon;
      console.log(`[${i + 1}/${scrapedStations.length}] ♻️  Using cached coords for: ${station.name}`);
    } else {
      const rawAddress = station.address;
      console.log(`[${i + 1}/${scrapedStations.length}] 🛰️  Geocoding: ${rawAddress}, ${station.city}`);
      const coords = await geocodeAddress(rawAddress, station.city);

      if (coords) {
        station.lat = coords.lat;
        station.lon = coords.lon;
      } else {
        console.log(
          `   ⚠️ Could not find coordinates for ${station.address}, falling back to defaults.`,
        );
      }
      // Strict delay to respect Nominatim TOS when actually geocoding
      await delay(1200);
    }

    processed.push(station);
  }

  return processed;
}

/**
 * Saves station data to Firestore.
 * Updates current state in 'stations' and adds historical entries to 'price_history'.
 */
async function saveToFirestore(stations: GasStation[]): Promise<void> {
  console.log(`🔥 Saving ${stations.length} stations to Firestore (with history)...`);

  const batchSize = 400; // Reduced batch size to account for dual writes
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  for (let i = 0; i < stations.length; i += batchSize) {
    const batch = db.batch();
    const currentBatch = stations.slice(i, i + batchSize);

    currentBatch.forEach((station) => {
      // 1. Update latest station data
      const stationRef = db.collection('stations').doc(station.id);
      batch.set(
        stationRef,
        {
          ...station,
          lastUpdated: timestamp,
          updatedAtStr: new Date().toISOString(), // Keep string for easier debug
        },
        { merge: true },
      );

      // 2. Add to price history
      // We create a unique ID for each history entry: stationId_timestamp
      // Actually, it's better to let Firestore auto-generate IDs for history
      const historyRef = db.collection('price_history').doc();
      batch.set(historyRef, {
        stationId: station.id,
        stationName: station.name,
        city: station.city,
        brand: station.brand,
        prices: station.prices,
        timestamp: timestamp,
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
    console.log(`✅ Scraped ${scrapedStations.length} stations`);

    // Enhance with Geocoding
    const finalStations = await processStationsWithGeocoding(scrapedStations);

    // 1. Save to local JSON (backward compatibility / debug)
    const output: PriceData = {
      lastUpdated: new Date().toISOString(),
      stations: finalStations,
    };

    try {
      const outputPath = resolve(
        import.meta.dirname,
        '..',
        '..',
        'web',
        'public',
        'api',
        'prices.json',
      );
      // Ensure directory exists
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`📁 Written to local JSON: ${outputPath}`);
    } catch (err) {
      console.warn('⚠️ Could not write to local JSON:', err);
    }

    // 2. Save to Firestore
    await saveToFirestore(finalStations);

    // 3. Record the run timestamp
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
