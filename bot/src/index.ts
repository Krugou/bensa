/**
 * Bensa Gas Price Scraper
 *
 * This is a scaffold for scraping gas prices from fuel comparison websites.
 * Replace the scrapeGasPrices() function with real Puppeteer/Playwright logic
 * targeting your preferred fuel price source.
 *
 * Usage:
 *   npm run scrape              # Run once
 *   npm run dev                 # Watch mode for development
 *
 * Scheduling (GitHub Actions cron):
 *   Add a workflow with: schedule: - cron: '0 */4 * * *'
 *   This runs every 4 hours.
 *
 * To add Puppeteer:
 *   1. npm install puppeteer
 *   2. Uncomment the Puppeteer import and scraping logic below
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

// import puppeteer from 'puppeteer'; // Uncomment when ready

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
 * Scrape gas prices from a fuel comparison website.
 *
 * TODO: Replace this mock with real Puppeteer scraping logic:
 *
 * async function scrapeGasPrices(): Promise<GasStation[]> {
 *   const browser = await puppeteer.launch({ headless: true });
 *   const page = await browser.newPage();
 *
 *   // Navigate to fuel comparison site
 *   await page.goto('https://example.com/fuel-prices/helsinki');
 *   await page.waitForSelector('.station-row');
 *
 *   const stations = await page.evaluate(() => {
 *     const rows = document.querySelectorAll('.station-row');
 *     return Array.from(rows).map(row => ({
 *       name: row.querySelector('.name')?.textContent?.trim() ?? '',
 *       address: row.querySelector('.address')?.textContent?.trim() ?? '',
 *       price95: parseFloat(row.querySelector('.price-95')?.textContent ?? '0'),
 *       price98: parseFloat(row.querySelector('.price-98')?.textContent ?? '0'),
 *       diesel: parseFloat(row.querySelector('.price-diesel')?.textContent ?? '0'),
 *     }));
 *   });
 *
 *   await browser.close();
 *   return stations;
 * }
 */
async function scrapeGasPrices(): Promise<GasStation[]> {
  console.log('📡 Scraping gas prices (using mock data)...');

  // Mock data — replace with actual scraping
  const mockStations: GasStation[] = [
    {
      id: 'neste-001',
      name: 'Neste Mannerheimintie',
      brand: 'Neste',
      address: 'Mannerheimintie 12',
      city: 'Helsinki',
      lat: 60.1699,
      lon: 24.9384,
      prices: [
        { type: '95', price: 1.829, updatedAt: new Date().toISOString() },
        { type: '98', price: 1.939, updatedAt: new Date().toISOString() },
        { type: 'diesel', price: 1.719, updatedAt: new Date().toISOString() },
      ],
    },
    {
      id: 'shell-002',
      name: 'Shell Sörnäinen',
      brand: 'Shell',
      address: 'Hämeentie 42',
      city: 'Helsinki',
      lat: 60.1857,
      lon: 24.9613,
      prices: [
        { type: '95', price: 1.799, updatedAt: new Date().toISOString() },
        { type: '98', price: 1.919, updatedAt: new Date().toISOString() },
        { type: 'diesel', price: 1.689, updatedAt: new Date().toISOString() },
      ],
    },
  ];

  return mockStations;
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

    // Write to web/public/api/prices.json
    const outputPath = resolve(import.meta.dirname, '..', 'web', 'public', 'api', 'prices.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`📁 Written to: ${outputPath}`);

    // Optionally push to Firebase/Supabase here
    // await pushToFirebase(output);

    console.log('🎉 Done!');
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

main();
