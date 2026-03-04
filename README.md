# ⛽ Bensa - Real-Time Fuel Tracker

A modern, high-contrast fuel price tracker for Finland (PK-Seutu). Built with React 19, Vite, and Firebase, featuring a neobrutalist aesthetic, wacky animations, and a background scraper bot.

![Bensa Build Status](https://github.com/Krugou/bensa/actions/workflows/pipeline.yml/badge.svg)

## 🌟 Features

- **Real-Time Prices**: Live scraping of fuel prices from the Helsinki Metropolitan area.
- **Station Heatmap**: Visual interactive map using Leaflet to find the cheapest fuel nearby.
- **Price Gauge**: Quick visual overview of current price levels (Cheapest vs. Average).
- **Price History**: Historical trends visualized with Recharts.
- **PWA Ready**: Install as a mobile app with offline support.
- **Price Drop Alerts**: Background notifications when fuel prices drop significantly.
- **Bilingual**: Fully localized in Finnish 🇫🇮 and English 🇬🇧.
- **Neobrutalist UI**: High-contrast, bold borders, and wacky animations.

## 🏗️ Project Structure

The project is managed as an NPM Workspace:

- `web/`: The Frontend React application (Vite + TailwindCSS + Firebase).
- `bot/`: The Scraping Bot (Puppeteer + Firebase Admin + Geocoding).
- `devtools/`: Helper scripts for maintenance.

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- Firebase Account
- Google Maps / Nominatim API access (Geocoding)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Krugou/bensa.git
   cd bensa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

The project requires the following environment variables. Create a `.env` file in the root or set them in your CI environment.

#### Web Application (`web/`)

Prefix variables with `VITE_` for client-side access:

- `VITE_FIREBASE_API_KEY`: Your Firebase API Key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID.
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID.
- `VITE_FIREBASE_APP_ID`: Firebase App ID.
- `VITE_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID.

#### Bot / Scraper (`bot/`)

- `FIREBASE_ADMIN_SDK`: (Secret) The full JSON string of your Firebase Service Account key.
- `FIREBASE_PROJECT_ID`: (Optional if in SA) Your Firebase Project ID.

## 🤖 Scraping Bot

The bot runs on a schedule (GitHub Actions) or manually:

```bash
npm run start:bot
```

**Workflow:**

1. **Scrape**: Uses Puppeteer to fetch prices from fuel comparison sites.
2. **Geocode**: Uses OpenStreetMap Nominatim to find GPS coordinates for new stations.
3. **Store**: Updates Firestore `stations` and adds a record to `price_history`.
4. **Sync**: Generates a local `prices.json` for fallback offline access.

## 💻 Development

### Running the Web App

```bash
npm run dev:web
```

### Running the Bot

```bash
npm run dev:bot
```

### Build

```bash
npm run build
```

## 🎨 Design Principles

- **Contrast**: Pure black text (`#000000`) on slate backgrounds for maximum readability.
- **Neobrutalism**: Bold borders, shadows, and distinct "glass-card" elements.
- **Animation**: Wacky, slightly chaotic animations (wiggle, glow-breathe, price-pulse) to give the app personality.

## 📜 License

ISC License. See [LICENSE](LICENSE) for details.
