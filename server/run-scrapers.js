const db     = require('./db');
const reddit = require('./scrapers/reddit');
const google = require('./scrapers/google');

// Resolve zip/city string to a city name for location-targeted searches
const axios = require('axios');
async function resolveCity(location) {
  if (!location) return null;
  location = location.trim();
  // Already a city/state string
  if (!/^\d{5}$/.test(location)) {
    const match = location.match(/^([^,]+)/);
    return match ? match[1].trim() : null;
  }
  // ZIP code — look up city
  try {
    const res = await axios.get(`https://api.zippopotam.us/us/${location}`, { timeout: 5000 });
    return res.data?.places?.[0]?.['place name'] || null;
  } catch {
    return null;
  }
}

async function runScraper(name, fn) {
  try {
    console.log(`[Scraper] Running ${name}...`);
    const listings = await fn();
    let newCount = 0;
    for (const listing of listings) {
      if (await db.insertListing(listing)) newCount++;
    }
    console.log(`[Scraper] ${name}: ${listings.length} found, ${newCount} new`);
    return newCount;
  } catch (err) {
    console.error(`[Scraper] ${name} failed:`, err.message);
    return 0;
  }
}

async function runAllScrapers() {
  await db.setRunning(true);

  const location = await db.getZip();
  const city     = await resolveCity(location);
  console.log(`[Scraper] Location: ${location} → city: ${city}`);

  let totalNew  = 0;
  let errorMsg  = null;

  try {
    totalNew += await runScraper('Reddit', () => reddit.scrape(city));
    totalNew += await runScraper('Google', () => google.scrape(city));
  } catch (err) {
    errorMsg = err.message;
  }

  await db.logRun(totalNew, errorMsg);
  await db.setRunning(false);
  console.log(`[Scraper] Done. ${totalNew} new leads.`);
  return { totalNew, errorMsg };
}

module.exports = { runAllScrapers };
