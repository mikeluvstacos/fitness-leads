/**
 * Google Custom Search scraper
 * Searches for fitness equipment buyers across Craigslist, Reddit, forums — all through Google's index
 * Free tier: 100 queries/day. We use ~20 per run (4 runs/day = 80/day, stays under limit)
 */
const axios = require('axios');

const API_KEY = process.env.GOOGLE_API_KEY;
const CX      = process.env.GOOGLE_CX;
const BASE    = 'https://www.googleapis.com/customsearch/v1';

// Equipment keywords to search for
const EQUIPMENT = [
  'gym equipment',
  'squat rack',
  'treadmill',
  'elliptical',
  'weight bench',
  'dumbbells',
  'barbell',
  'cable machine',
  'stairmaster',
  'peloton',
  'precor',
  'life fitness',
  'matrix fitness',
  'freemotion',
];

// Intent phrases that signal a buyer
const INTENTS = [
  'WTB',
  'ISO',
  'want to buy',
  'looking to buy',
  'looking for',
];

// Platforms known to have buyer posts
const PLATFORMS = [
  'site:reddit.com',
  'site:craigslist.org',
];

function buildQueries(city) {
  const queries = [];
  const location = city ? ` "${city}"` : '';

  // 2 intents × 4 equipment × 2 platforms = 16 queries
  for (const intent of INTENTS.slice(0, 2)) {
    for (const equip of EQUIPMENT.slice(0, 4)) {
      for (const platform of PLATFORMS) {
        queries.push(`${intent} "${equip}"${location} ${platform}`);
      }
    }
  }

  // 3 general queries
  queries.push(`"want to buy" gym equipment${location}`);
  queries.push(`"looking to buy" fitness equipment${location}`);
  queries.push(`"ISO" gym equipment${location}`);

  // Cap at 19 to stay well under 100/day free limit (4 runs/day × 19 = 76)
  return queries.slice(0, 19);
}

async function safeFetch(query) {
  try {
    const res = await axios.get(BASE, {
      params: { key: API_KEY, cx: CX, q: query, num: 10 },
      timeout: 10000,
    });
    return res.data?.items || [];
  } catch (e) {
    console.warn('[Google] query failed:', query, e.response?.status || e.message);
    return [];
  }
}

function mapItem(item) {
  // Detect platform from URL
  let platform = 'Web';
  if (item.link.includes('reddit.com'))     platform = 'Reddit';
  if (item.link.includes('craigslist.org')) platform = 'Craigslist';

  // Parse posted date from snippet if available
  const dateMatch = item.snippet?.match(/(\w+ \d+, \d{4})/);
  const posted_at = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

  return {
    url:      item.link,
    title:    item.title,
    platform,
    snippet:  item.snippet || '',
    posted_at,
  };
}

const SELL_KEYWORDS = /\b(for\s+sale|selling\b|\bfs\b|price\s+drop|obo\b|asking\s+\$|\[sold\])\b/i;
const BUY_KEYWORDS  = /\b(wtb|iso\b|want\s+to\s+buy|looking\s+to\s+buy|looking\s+for|buying|wanted|in\s+search\s+of|seeking)\b/i;

function isBuyerResult(item) {
  const text = `${item.title} ${item.snippet}`;
  if (SELL_KEYWORDS.test(text)) return false;
  return BUY_KEYWORDS.test(text);
}

async function scrape(city) {
  if (!API_KEY || !CX) {
    console.warn('[Google] GOOGLE_API_KEY or GOOGLE_CX not set, skipping');
    return [];
  }

  const queries = buildQueries(city);
  console.log(`[Google] Running ${queries.length} queries for city: ${city || 'any'}`);

  // Run queries with a small delay to avoid hitting rate limits
  const results = [];
  for (const query of queries) {
    const items = await safeFetch(query);
    results.push(...items);
    // Small delay between requests to be polite
    await new Promise(r => setTimeout(r, 300));
  }

  // Dedupe by URL and filter buyer intent
  const seen = new Set();
  return results
    .map(mapItem)
    .filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return isBuyerResult(item);
    });
}

module.exports = { scrape };
