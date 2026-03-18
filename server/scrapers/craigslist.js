/**
 * Craigslist Houston – Wanted section scraper
 * Searches for people posting "I want to buy fitness/gym equipment"
 */
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://houston.craigslist.org';

const QUERIES = [
  'fitness equipment',
  'gym equipment',
  'exercise equipment',
  'weights',
  'treadmill',
  'elliptical',
  'dumbbells',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchPage(query) {
  const url = `${BASE}/search/waa?query=${encodeURIComponent(query)}&sort=date`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  return res.data;
}

function parseListings(html, query) {
  const $ = cheerio.load(html);
  const results = [];

  // Craigslist 2024 markup
  $('li.cl-search-result, li.result-row').each((_, el) => {
    const $el = $(el);

    // Try new markup first, fall back to old
    const $titleLink = $el.find('a.posting-title, a.hdrlnk').first();
    const title = $titleLink.find('.label, span').first().text().trim() || $titleLink.text().trim();
    let href = $titleLink.attr('href') || '';
    if (href && !href.startsWith('http')) href = BASE + href;

    const dateEl = $el.find('time').attr('datetime') || $el.find('.result-date').attr('title') || '';
    const snippet = $el.find('.result-hood, .cl-search-result-summary').text().trim() || `Craigslist wanted: ${query}`;

    if (title && href) {
      results.push({
        url: href,
        title,
        platform: 'Craigslist',
        snippet: snippet || `Houston Craigslist wanted: ${query}`,
        posted_at: dateEl || null,
      });
    }
  });

  return results;
}

async function scrape() {
  const all = [];
  for (const query of QUERIES) {
    try {
      const html = await fetchPage(query);
      const listings = parseListings(html, query);
      all.push(...listings);
      // Polite delay between requests
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.warn(`[Craigslist] Error fetching "${query}":`, err.message);
    }
  }
  // Deduplicate by URL
  const seen = new Set();
  return all.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

module.exports = { scrape };
