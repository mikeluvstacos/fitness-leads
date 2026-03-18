/**
 * Reddit scraper – finds buyer posts for fitness equipment
 * Uses Reddit's public JSON API (no auth, works from any IP)
 */
const axios = require('axios');

const HEADERS = {
  'User-Agent': 'FitnessBuyerHunter/1.0 (fitness equipment lead finder)',
};

// Subreddits with active fitness equipment buyers
const SUBREDDIT_SEARCHES = [
  { sub: 'homegym',            q: 'WTB' },
  { sub: 'homegym',            q: 'want to buy' },
  { sub: 'homegym',            q: 'looking to buy' },
  { sub: 'garagegym',          q: 'WTB' },
  { sub: 'garagegym',          q: 'want to buy' },
  { sub: 'fitness',            q: 'WTB equipment' },
  { sub: 'weightlifting',      q: 'WTB' },
  { sub: 'powerlifting',       q: 'WTB equipment' },
  { sub: 'crossfit',           q: 'buying equipment' },
  { sub: 'bodyweightfitness',  q: 'buy equipment' },
  { sub: 'houston',            q: 'fitness equipment' },
  { sub: 'houston',            q: 'gym equipment' },
  { sub: 'houstontx',          q: 'fitness equipment' },
  { sub: 'houstontx',          q: 'treadmill dumbbells weights' },
  { sub: 'gyms',               q: 'buying equipment' },
  { sub: 'gym',                q: 'WTB' },
];

// Broad global searches
const GLOBAL_SEARCHES = [
  'WTB fitness equipment',
  'WTB gym equipment',
  'WTB treadmill',
  'WTB dumbbells',
  'WTB weight bench',
  'WTB elliptical',
  'want to buy fitness equipment houston',
  'want to buy gym equipment houston',
  'buying used fitness equipment houston texas',
  'fitness equipment wanted houston',
  'bulk gym equipment purchase',
  'buying commercial gym equipment',
];

async function fetchSubreddit(sub, q) {
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=25&t=year`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  return res.data?.data?.children || [];
}

async function fetchGlobal(q) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&limit=25&t=year`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  return res.data?.data?.children || [];
}

function mapPost(post) {
  const d = post.data;
  return {
    url:       `https://www.reddit.com${d.permalink}`,
    title:     d.title,
    platform:  'Reddit',
    snippet:   d.selftext ? d.selftext.slice(0, 200) : `r/${d.subreddit} • ${d.score} upvotes`,
    posted_at: new Date(d.created_utc * 1000).toISOString(),
  };
}

const BUY_KEYWORDS  = /\b(wtb|want\s+to\s+buy|looking\s+to\s+buy|looking\s+for|buying|need|wanted|purchase|acquire|iso\b|in\s+search\s+of)\b/i;
const SELL_KEYWORDS = /\b(wts|wtt|selling|for\s+sale|fs\b|sold|asking\s+\$|price\s+drop|reduced)\b/i;

function isBuyerPost(post) {
  const text = `${post.title} ${post.snippet}`;
  return BUY_KEYWORDS.test(text) && !SELL_KEYWORDS.test(text);
}

async function safeFetch(fn) {
  try { return await fn(); } catch { return []; }
}

async function scrape() {
  // Run all requests in parallel — no delays needed
  const [subredditResults, globalResults] = await Promise.all([
    Promise.all(SUBREDDIT_SEARCHES.map(({ sub, q }) =>
      safeFetch(() => fetchSubreddit(sub, q))
    )),
    Promise.all(GLOBAL_SEARCHES.map(q =>
      safeFetch(() => fetchGlobal(q))
    )),
  ]);

  const all = [
    ...subredditResults.flat(),
    ...globalResults.flat(),
  ].map(mapPost);

  // Dedupe by URL + filter to buyer posts only
  const seen = new Set();
  return all.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return isBuyerPost(l);
  });
}

module.exports = { scrape };
