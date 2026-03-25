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
  type: '95' | '98' | 'diesel' | 're85';
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
  userFixed?: boolean;
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
  // Strip brand names from the beginning of the address to improve geocoding accuracy
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

  // Construct a very specific query
  const query = encodeURIComponent(`${cleanStreet}, ${city}, Finland`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BensaTrackerBot/1.0 (BensaTracker PWA)',
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as any[];
    if (data.length > 0) {
      const result = data[0];
      
      // Basic city verification if possible
      const foundCity = result.address?.city || result.address?.town || result.address?.village || result.address?.municipality || '';
      if (foundCity && city.toLowerCase() !== foundCity.toLowerCase()) {
        console.warn(`[Geocode Warning] City mismatch for ${address} in ${city}: Found ${foundCity}`);
        // We still accept it if it's close enough or if the query was specific, 
        // but this log helps debug.
      }

      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
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

            // Parse a cleaner address from the raw name by stripping brand prefix and annotations
            let cleanAddress = rawName;
            // Remove brand prefix
            const knownBrands = ['ABC Deli', 'ABC Automaatti', 'ABC', 'Neste Express', 'Neste K', 'Neste Oil', 'Neste', 'St1', 'Shell', 'SEO', 'Seo', 'Teboil', 'Gulf'];
            for (const b of knownBrands) {
              if (cleanAddress.startsWith(b)) {
                cleanAddress = cleanAddress.slice(b.length);
                break;
              }
            }
            cleanAddress = cleanAddress.replace(/^[\s,;:]+/, '');
            // Remove technical annotations like (*E99+), (Re85 1.384)
            cleanAddress = cleanAddress.replace(/\(\*?[A-Za-z0-9+]+\)/g, '');
            cleanAddress = cleanAddress.replace(/\(Re85\s+[0-9.,]+\)/gi, '');
            cleanAddress = cleanAddress.replace(/\s{2,}/g, ' ').trim();
            cleanAddress = cleanAddress.replace(/[,;]+$/, '').trim();

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

            // Extra: Extract RE85 from name if present (e.g. "St1 ... (Re85 1.384)")
            const re85Match = /\(Re85\s+([0-9,.]+)\)/i.exec(rawName);
            if (re85Match) {
              const re85Price = parseFloat(re85Match[1].replace(',', '.'));
              if (re85Price > 0) {
                prices.push({ type: 're85', price: re85Price, updatedAt: now });
              }
            }

            if (prices.length > 0) {
              results.push({
                id: mapId ? `station-${mapId}` : `station-${index}-${currentCity}`,
                name: rawName,
                brand: brand,
                address: cleanAddress || rawName,
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
  console.log('🔎 Loading existing stations from Firestore for coordinate cache and userFixed check...');
  const cache: Partial<Record<string, { lat: number; lon: number; userFixed?: boolean }>> = {};

  try {
    const snapshot = await db.collection('stations').get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const key = `${String(data['name']).trim()}-${String(data['city']).trim()}`.toLowerCase();
      const cacheVal = { 
        lat: Number(data['lat']), 
        lon: Number(data['lon']),
        userFixed: data['userFixed'] === true
      };
      cache[key] = cacheVal;
      cache[doc.id] = cacheVal;
    });
    console.log(`✅ Cached data for ${Object.keys(cache).length} stations.`);
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
    const cachedEntry = cache[station.id] || cache[cacheKey];

    if (cachedEntry?.userFixed) {
      // Use fixed coordinates and mark as userFixed to protect from future overwrites
      station.lat = cachedEntry.lat;
      station.lon = cachedEntry.lon;
      station.userFixed = true;
      console.log(`[${i + 1}/${scrapedStations.length}] 📌 Keeping fixed GPS and details: ${cachedEntry.userFixed ? 'LOCKED ' : ''}${station.name}`);
    } else if (cachedEntry) {
      station.lat = cachedEntry.lat;
      station.lon = cachedEntry.lon;
    } else {
      const rawAddress = station.address;
      console.log(`[${i + 1}/${scrapedStations.length}] 🛰️  Geocoding: ${rawAddress}, ${station.city}`);
      const coords = await geocodeAddress(rawAddress, station.city);

      if (coords) {
        station.lat = coords.lat;
        station.lon = coords.lon;
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
      
      // Determine what to save based on userFixed status
      const updateData: any = {
        ...station,
        lastUpdated: timestamp,
        updatedAtStr: new Date().toISOString(),
      };
      
      if (station.userFixed) {
        // Omit overriding manually fixed metadata
        delete updateData.name;
        delete updateData.brand;
        delete updateData.address;
        delete updateData.city;
        delete updateData.lat;
        delete updateData.lon;
      }
      
      batch.set(
        stationRef,
        updateData,
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

  // Save aggregate averages for the entire run
  console.log('📊 Saving run aggregates to price_averages...');
  const stats = {
    sum95: 0, count95: 0,
    sum98: 0, count98: 0,
    sumDiesel: 0, countDiesel: 0,
    sumRE85: 0, countRE85: 0,
  };

  stations.forEach(s => {
    s.prices.forEach(p => {
      if (p.type === '95') { stats.sum95 += p.price; stats.count95++; }
      else if (p.type === '98') { stats.sum98 += p.price; stats.count98++; }
      else if (p.type === 'diesel') { stats.sumDiesel += p.price; stats.countDiesel++; }
      else if (p.type === 're85') { stats.sumRE85 += p.price; stats.countRE85++; }
    });
  });

  const avg95 = stats.count95 > 0 ? stats.sum95 / stats.count95 : 0;
  const avg98 = stats.count98 > 0 ? stats.sum98 / stats.count98 : 0;
  const avgDiesel = stats.countDiesel > 0 ? stats.sumDiesel / stats.countDiesel : 0;
  const avgRE85 = stats.countRE85 > 0 ? stats.sumRE85 / stats.countRE85 : 0;

  await db.collection('price_averages').add({
    timestamp,
    avg95: Math.round(avg95 * 1000) / 1000,
    avg98: Math.round(avg98 * 1000) / 1000,
    avgDiesel: Math.round(avgDiesel * 1000) / 1000,
    avgRE85: Math.round(avgRE85 * 1000) / 1000,
    stationCount: stations.length,
    date: new Date().toISOString().split('T')[0]
  });
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
