const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const craigslist = require('./scrapers/craigslist');
const reddit = require('./scrapers/reddit');
const duckduckgo = require('./scrapers/duckduckgo');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// ─── Run all scrapers ────────────────────────────────────────────────────────

let isRunning = false;

async function runAllScrapers() {
  if (isRunning) {
    console.log('[Scraper] Already running, skipping.');
    return { skipped: true };
  }
  isRunning = true;
  console.log(`[Scraper] Starting run at ${new Date().toLocaleString()}`);

  const scrapers = [
    { name: 'Craigslist', fn: craigslist.scrape },
    { name: 'Reddit',     fn: reddit.scrape },
    { name: 'DuckDuckGo', fn: duckduckgo.scrape },
  ];

  let totalNew = 0;
  let errorMsg = null;

  for (const { name, fn } of scrapers) {
    try {
      console.log(`[Scraper] Running ${name}...`);
      const listings = await fn();
      let newCount = 0;
      for (const listing of listings) {
        if (db.insertListing(listing)) newCount++;
      }
      console.log(`[Scraper] ${name}: ${listings.length} found, ${newCount} new`);
      totalNew += newCount;
    } catch (err) {
      console.error(`[Scraper] ${name} failed:`, err.message);
      errorMsg = `${name}: ${err.message}`;
    }
  }

  db.logRun(totalNew, errorMsg);
  isRunning = false;
  console.log(`[Scraper] Done. ${totalNew} new leads found.`);
  return { totalNew, errorMsg };
}

// ─── Schedule: every 6 hours ─────────────────────────────────────────────────
// 0 */6 * * *  → runs at 00:00, 06:00, 12:00, 18:00
cron.schedule('0 */6 * * *', () => {
  console.log('[Cron] Scheduled run triggered');
  runAllScrapers();
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/listings?platform=Reddit&search=bulk&limit=200
app.get('/api/listings', (req, res) => {
  const { platform, search, limit } = req.query;
  const listings = db.getListings({ platform, search, limit: parseInt(limit) || 200 });
  res.json(listings);
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// POST /api/run – manual trigger
app.post('/api/run', async (req, res) => {
  if (isRunning) {
    return res.json({ status: 'already_running' });
  }
  res.json({ status: 'started' });
  runAllScrapers(); // run in background
});

// GET /api/status – is a run in progress?
app.get('/api/status', (req, res) => {
  res.json({ running: isRunning });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Fitness Lead Finder backend running on http://localhost:${PORT}`);
  console.log('   Scraper scheduled every 6 hours.');
  console.log('   Running initial scrape in 3 seconds...\n');
  setTimeout(runAllScrapers, 3000);
});
