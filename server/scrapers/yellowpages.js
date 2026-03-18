/**
 * Yellow Pages scraper – finds gyms & fitness centers as commercial buyer leads
 * Searches by city/zip for businesses that may need fitness equipment
 */
const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const SEARCH_TERMS = [
  'gym',
  'fitness center',
  'health club',
  'crossfit',
  'personal training studio',
];

async function fetchYP(searchTerm, location) {
  const url = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(searchTerm)}&geo_location_terms=${encodeURIComponent(location)}`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  return parseResults(res.data, searchTerm);
}

function parseResults(html, searchTerm) {
  const $ = cheerio.load(html);
  const results = [];

  $('.result.organic, .result.sponsored').each((_, el) => {
    const nameEl   = $(el).find('a.business-name');
    const name     = nameEl.text().trim();
    const href     = nameEl.attr('href') || '';
    const phone    = $(el).find('.phones.phone.primary, .phone').first().text().trim();
    const street   = $(el).find('.street-address').text().trim();
    const locality = $(el).find('.locality').text().trim();
    const address  = [street, locality].filter(Boolean).join(', ');

    if (!name) return;

    const url = href.startsWith('http')
      ? href
      : `https://www.yellowpages.com${href}`;

    results.push({
      url,
      title:     `${name} — ${searchTerm}`,
      platform:  'Yellow Pages',
      snippet:   [address, phone].filter(Boolean).join(' • ') || `Fitness business — potential equipment buyer`,
      posted_at: new Date().toISOString(),
    });
  });

  return results;
}

async function safeFetch(fn) {
  try { return await fn(); } catch { return []; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function scrape(location = null) {
  if (!location) return [];

  const results = [];
  for (const term of SEARCH_TERMS) {
    const batch = await safeFetch(() => fetchYP(term, location));
    results.push(...batch);
    await sleep(1000);
  }

  // Dedupe by URL
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

module.exports = { scrape };
