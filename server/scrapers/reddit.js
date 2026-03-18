/**
 * Reddit scraper – finds buyer posts for fitness equipment
 * Uses flair-based searches + targeted keywords for maximum results with minimal requests
 */
const axios = require('axios');

const HEADERS = { 'User-Agent': 'FitnessBuyerHunter/1.0 (fitness equipment lead finder)' };

// Flair searches — returns posts tagged "Want To Buy" in the top fitness subs
// These are 100% buyer posts by definition, no filtering needed
const FLAIR_SEARCHES = [
  { sub: 'homegym',           q: 'flair:"Want To Buy"' },
  { sub: 'homegym',           q: 'flair:WTB' },
  { sub: 'garagegym',         q: 'flair:"Want To Buy"' },
  { sub: 'garagegym',         q: 'flair:WTB' },
  { sub: 'homegym',           q: 'flair:"ISO"' },
];

// Subreddit keyword searches — top buyer-intent terms in best subs
const SUB_SEARCHES = [
  { sub: 'homegym',           q: 'WTB' },
  { sub: 'homegym',           q: 'ISO' },
  { sub: 'garagegym',         q: 'WTB' },
  { sub: 'garagegym',         q: 'ISO' },
  { sub: 'powerlifting',      q: 'WTB' },
  { sub: 'weightlifting',     q: 'WTB' },
  { sub: 'crossfit',          q: 'WTB equipment' },
  { sub: 'fitness',           q: 'WTB gym equipment' },
];

// Global Reddit searches for specific equipment buyers
const GLOBAL_SEARCHES = [
  'WTB squat rack',
  'WTB power rack',
  'WTB treadmill',
  'WTB elliptical',
  'WTB peloton',
  'WTB dumbbells',
  'WTB barbell',
  'WTB weight bench',
  'WTB bumper plates',
  'WTB cable machine',
  'WTB stairmaster',
  'WTB life fitness',
  'WTB precor',
  'WTB matrix fitness',
  'WTB freemotion',
  'ISO squat rack',
  'ISO treadmill',
  'ISO peloton',
  'ISO gym equipment',
  'ISO home gym',
  'want to buy gym equipment',
  'looking to buy treadmill',
  'looking to buy squat rack',
  'looking to buy gym equipment',
  'buying used gym equipment',
  'gym closing equipment sale',
  'commercial gym equipment for sale',
];

async function safeFetch(url) {
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 12000 });
    return res.data?.data?.children || [];
  } catch {
    return [];
  }
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

// Light filter — only drop obvious seller posts
const SELL_KEYWORDS = /\b(wts|wtt|\bfs\b|\[fs\]|\[sold\]|for\s+sale|selling\b|price\s+drop|asking\s+\$|obo\b|firm\s+price)\b/i;
const BUY_KEYWORDS  = /\b(wtb|iso\b|want\s+to\s+buy|looking\s+to\s+buy|looking\s+for|buying|need|wanted|in\s+search\s+of|seeking|where\s+can\s+i\s+(find|get|buy))\b/i;

function isBuyerPost(post) {
  const text = `${post.title} ${post.snippet}`;
  if (SELL_KEYWORDS.test(text)) return false;
  return BUY_KEYWORDS.test(text);
}

async function scrape() {
  // Build all request URLs
  const urls = [
    // Flair-based (best results — these are tagged WTB by the poster)
    ...FLAIR_SEARCHES.map(({ sub, q }) =>
      `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=100&t=all`
    ),
    // Subreddit keyword searches
    ...SUB_SEARCHES.map(({ sub, q }) =>
      `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=50&t=month`
    ),
    // Global searches
    ...GLOBAL_SEARCHES.map(q =>
      `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&limit=25&t=month`
    ),
  ];

  // Fire all requests in parallel — ~40 requests, well under Reddit's rate limit
  const batches = await Promise.all(urls.map(url => safeFetch(url)));
  const all = batches.flat().map(mapPost);

  // Dedupe by URL + filter out seller posts
  const seen = new Set();
  return all.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return isBuyerPost(l);
  });
}

module.exports = { scrape };
