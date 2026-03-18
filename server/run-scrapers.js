const db = require('./db');
const reddit = require('./scrapers/reddit');

async function runAllScrapers() {
  await db.setRunning(true);

  const zip = await db.getZip();
  console.log(`[Scraper] Using zip: ${zip}`);

  const scrapers = [
    { name: 'Reddit', fn: () => reddit.scrape(zip) },
  ];

  let totalNew = 0;
  let errorMsg = null;

  for (const { name, fn } of scrapers) {
    try {
      console.log(`[Scraper] Running ${name}...`);
      const listings = await fn();
      let newCount = 0;
      for (const listing of listings) {
        if (await db.insertListing(listing)) newCount++;
      }
      console.log(`[Scraper] ${name}: ${listings.length} found, ${newCount} new`);
      totalNew += newCount;
    } catch (err) {
      console.error(`[Scraper] ${name} failed:`, err.message);
      errorMsg = `${name}: ${err.message}`;
    }
  }

  await db.logRun(totalNew, errorMsg);
  await db.setRunning(false);
  console.log(`[Scraper] Done. ${totalNew} new leads.`);
  return { totalNew, errorMsg };
}

module.exports = { runAllScrapers };
