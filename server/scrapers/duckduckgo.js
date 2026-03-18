/**
 * DuckDuckGo HTML search scraper
 * Finds buyer listings across the broader web (forums, local groups, etc.)
 */
const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const QUERIES = [
  'want to buy used fitness equipment bulk houston texas',
  'buying gym equipment wholesale houston tx',
  'WTB exercise equipment houston',
  'fitness equipment wanted bulk purchase houston',
  '"looking to buy" "gym equipment" houston',
  '"want to buy" "fitness equipment" houston texas',
];

// Skip results from sites we handle separately
const SKIP_DOMAINS = ['reddit.com', 'craigslist.org'];

async function searchDDG(q) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const res = await axios.post(url, null, {
    headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  return res.data;
}

function parseResults(html, query) {
  const $ = cheerio.load(html);
  const results = [];

  $('.result').each((_, el) => {
    const $el = $(el);
    const $titleLink = $el.find('.result__title a, .result__a').first();
    const title = $titleLink.text().trim();
    let href = $titleLink.attr('href') || '';

    // DDG uses redirect URLs – extract the real URL
    if (href.includes('uddg=')) {
      try {
        const match = href.match(/uddg=([^&]+)/);
        if (match) href = decodeURIComponent(match[1]);
      } catch {}
    }

    const snippet = $el.find('.result__snippet').text().trim();
    const displayUrl = $el.find('.result__url').text().trim().toLowerCase();

    if (!title || !href || !href.startsWith('http')) return;
    if (SKIP_DOMAINS.some(d => displayUrl.includes(d))) return;

    results.push({
      url: href,
      title,
      platform: 'Web',
      snippet: snippet || `Found via: ${query}`,
      posted_at: null,
    });
  });

  return results;
}

// Only keep results that look like buyer intent
const BUY_INTENT = /\b(buy|want|looking|wtb|wanted|bulk|purchase|acquire|need)\b/i;

async function scrape() {
  const all = [];

  for (const q of QUERIES) {
    try {
      const html = await searchDDG(q);
      const results = parseResults(html, q);
      all.push(...results.filter(r => BUY_INTENT.test(`${r.title} ${r.snippet}`)));
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.warn(`[DuckDuckGo] Error "${q}":`, err.message);
    }
  }

  const seen = new Set();
  return all.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

module.exports = { scrape };
