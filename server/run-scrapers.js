const db = require('./db');
const reddit = require('./scrapers/reddit');

async function runAllScrapers() {
  await db.setRunning(true);

  const zip = await db.getZip();
  console.log(`[Scraper] Using location: ${zip}`);

  let totalNew = 0;
  let errorMsg = null;

  try {
    console.log('[Scraper] Running Reddit...');
    const listings = await reddit.scrape();
    let newCount = 0;
    for (const listing of listings) {
      if (await db.insertListing(listing)) newCount++;
    }
    console.log(`[Scraper] Reddit: ${listings.length} found, ${newCount} new`);
    totalNew += newCount;
  } catch (err) {
    console.error('[Scraper] Reddit failed:', err.message);
    errorMsg = err.message;
  }

  await db.logRun(totalNew, errorMsg);
  await db.setRunning(false);
  console.log(`[Scraper] Done. ${totalNew} new leads.`);
  return { totalNew, errorMsg };
}

module.exports = { runAllScrapers };
