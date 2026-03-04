import { writeFileSync } from 'fs';
import { resolve } from 'path';
import puppeteer from 'puppeteer';

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
 * Scrapes gas prices from polttoaine.net PK-Seutu page.
 */
async function scrapeGasPrices(): Promise<GasStation[]> {
  console.log('📡 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    // Add these args if running inside a constrained environment like GitHub Actions
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
          currentCity = boldTag.textContent?.trim() ?? currentCity;
        }
        return;
      }

      // 2. Process data rows (must have 5 columns, ignore "Keskihinnat" averages)
      if (
        cells.length === 5 &&
        !cells[0].classList.contains('Keskihinnat') &&
        cells[0].textContent?.trim() !== ''
      ) {
        // Clean up the station name by removing the map link <a> tag
        const stationCell = cells[0].cloneNode(true) as HTMLElement;
        const aTag = stationCell.querySelector('a');
        let mapId = '';
        if (aTag) {
          // Optionally extract map ID from href if you want to fetch coords later
          const href = aTag.getAttribute('href') || '';
          const match = href.match(/id=(\d+)/);
          if (match) mapId = match[1];
          stationCell.removeChild(aTag);
        }

        const rawName = stationCell.textContent?.trim() ?? 'Unknown Station';

        // Very basic heuristic for brand: first word before a comma or space
        const brand = rawName.split(/[\s,]+/)[0];

        // Parse prices safely
        const parsePrice = (cell: Element): number => {
          // Remove asterisks (used for E99+) and trim spaces
          const text = cell.textContent?.replace(/\*/g, '').trim() ?? '';
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
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('⛽ Bensa Scraper starting...');

  try {
    const stations = await scrapeGasPrices();
    console.log(`✅ Scraped ${stations.length} stations`);

    const output: PriceData = {
      lastUpdated: new Date().toISOString(),
      stations,
    };

    // Make sure your destination folder exists before writing!
    const outputPath = resolve(import.meta.dirname, '..', '..', 'web', 'public', 'api', 'prices.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`📁 Written to: ${outputPath}`);

    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

main();