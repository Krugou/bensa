/**
 * Utilities for cleaning station display data.
 *
 * The scraper stores the raw station name from polttoaine.net as both
 * `name` and `address`, producing messy and redundant displays.
 * These helpers clean the data for the UI without touching the underlying data.
 */

/** Known Finnish fuel station brands for stripping from names */
const BRANDS = [
  'ABC Deli',
  'ABC Automaatti',
  'ABC',
  'Neste Express',
  'Neste K',
  'Neste Oil',
  'Neste',
  'St1',
  'ST1',
  'Shell',
  'SHELL',
  'SEO',
  'Seo',
  'Teboil',
  'TEBOIL',
  'Gulf',
  'GULF',
];

/**
 * Remove brand prefix, technical annotations, and clean up punctuation from a
 * station name.
 *
 * Examples:
 *   "Shell, Leppävaara Vanha maantie 2 (*E99+)" → "Leppävaara Vanha maantie 2"
 *   "Neste, Laajasalo Kuvernöörintie 6"         → "Laajasalo Kuvernöörintie 6"
 *   "St1, Helsinki-Vantaa lentoasema Ilmailukuja 1 (Re85 1.368)" → "Helsinki-Vantaa lentoasema Ilmailukuja 1"
 */
export function cleanStationName(name: string, brand: string): string {
  let cleaned = name;

  // 1. Remove brand prefix (longest match first since BRANDS is ordered that way)
  for (const b of BRANDS) {
    if (cleaned.startsWith(b)) {
      cleaned = cleaned.slice(b.length);
      break;
    }
  }
  // Also try the provided brand as fallback
  if (cleaned === name && brand) {
    const upper = brand.toUpperCase();
    const nameUpper = cleaned.toUpperCase();
    if (nameUpper.startsWith(upper)) {
      cleaned = cleaned.slice(brand.length);
    }
  }

  // 2. Remove leading punctuation & whitespace  (e.g. ", " after brand)
  cleaned = cleaned.replace(/^[\s,;:]+/, '');

  // 3. Remove technical annotations:
  //    (*E99+), (Re85 1.384), (Diesel 1.xxx), etc.
  cleaned = cleaned.replace(/\(\*?[A-Za-z0-9+]+\)/g, '');
  cleaned = cleaned.replace(/\(Re85\s+[0-9.,]+\)/gi, '');
  cleaned = cleaned.replace(/\(Diesel\s+[0-9.,]+\)/gi, '');

  // 4. Final cleanup: trim multiple spaces and trailing punctuation
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  cleaned = cleaned.replace(/[,;]+$/, '').trim();

  return cleaned || name; // fallback to original if we stripped everything
}

/**
 * Get a display address that doesn't duplicate the station name.
 *
 * If the address is identical to the name (common scraper bug), we extract
 * just the street portion. Otherwise, we return the address as-is.
 */
export function cleanStationAddress(address: string, name: string, _city: string): string {
  // If address is the same as the raw name, try to extract just the street
  if (address === name || address.trim() === name.trim()) {
    return extractStreet(address);
  }
  return address;
}

/**
 * Extract the street name + number from a raw station string.
 * E.g. "Neste, Laajasalo Kuvernöörintie 6" → "Kuvernöörintie 6"
 */
function extractStreet(raw: string): string {
  // Try to find a Finnish street name pattern (word ending with common suffixes + number)
  const streetRegex =
    /([A-Za-zäöåÄÖÅ-]+(?:tie|katu|kuja|väylä|kaari|polku|rinne|ranta|raitti|aukio|piha|portti|tori|bulevardi|esplanadi|linja)\s+\d+[a-zA-Z]?)/i;
  const match = streetRegex.exec(raw);
  if (match) {
    return match[1].trim();
  }

  // Fallback: strip known brand prefixes and technical notes, then return what's left
  let cleaned = raw;
  for (const b of BRANDS) {
    if (cleaned.startsWith(b)) {
      cleaned = cleaned.slice(b.length);
      break;
    }
  }
  cleaned = cleaned.replace(/^[\s,;:]+/, '');
  cleaned = cleaned.replace(/\(\*?[A-Za-z0-9+]+\)/g, '');
  cleaned = cleaned.replace(/\(Re85\s+[0-9.,]+\)/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  cleaned = cleaned.replace(/[,;]+$/, '').trim();

  return cleaned || raw;
}
