# Bensa - Fuel Price Tracker

Real-time fuel price tracking PWA for Finland. Find the cheapest gas stations near you with aurora-style heatmap visualization and price drop alerts.

## 📂 Project Structure

- `web/`: React + Vite PWA application
- `bot/`: Gas price scraper (Node.js + Puppeteer)
- `.github/workflows/`: CI/CD pipelines

## 🌐 Web Application

### Prerequisites
- Node.js (v18+)
- npm

### Setup
```bash
npm install
```

### Development
```bash
npm run dev:web
```
Runs at `http://localhost:3005`.

### Testing
- **Unit Tests**: `cd web && npm test` (Vitest)

### Features
- **Price Gauge**: Large animated gauge showing current average fuel price
- **Heatmap**: Leaflet map with color-coded glow markers (green=cheap, red=expensive)
- **Station List**: Sortable by price or distance
- **Fuel Types**: Toggle between 95, 98, and Diesel
- **Dark Mode**: Sleek dark-first UI inspired by aurora apps
- **PWA**: Installable, offline-capable, push notifications for price drops
- **i18n**: English (EN) and Finnish (FI)

## 🤖 Scraper Bot

### Setup
```bash
cd bot
npm install
```

### Running
- **Development**: `npm run dev`
- **Production**: `npm run build && npm start`

## 🚀 CI/CD

GitHub Actions:
- Lint, test, and build the web app
- Schedule scraper runs every 4 hours
