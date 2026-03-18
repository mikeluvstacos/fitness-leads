/**
 * Reddit scraper – finds buyer posts for fitness equipment
 * Uses Reddit's public JSON API (no auth, works from any IP)
 */
const axios = require('axios');

const HEADERS = {
  'User-Agent': 'FitnessBuyerHunter/1.0 (fitness equipment lead finder)',
};

// City name → known Reddit community slugs
const CITY_SUBREDDITS = {
  'houston':       ['houston', 'houstontx'],
  'dallas':        ['dallas', 'dfw'],
  'austin':        ['austin'],
  'san antonio':   ['sanantonio'],
  'new york':      ['nyc', 'newyorkcity'],
  'los angeles':   ['losangeles', 'la'],
  'chicago':       ['chicago'],
  'phoenix':       ['phoenix', 'az'],
  'philadelphia':  ['philadelphia', 'philly'],
  'san diego':     ['sandiego'],
  'denver':        ['denver', 'denver_co'],
  'seattle':       ['seattle'],
  'portland':      ['portland'],
  'miami':         ['miami'],
  'atlanta':       ['atlanta'],
  'nashville':     ['nashville'],
  'charlotte':     ['charlotte'],
  'las vegas':     ['lasvegas'],
  'minneapolis':   ['minneapolis'],
  'boston':        ['boston'],
};

async function getCityFromZip(zip) {
  try {
    const res = await axios.get(`https://api.zippopotam.us/us/${zip}`, { timeout: 5000 });
    const place = res.data?.places?.[0];
    if (!place) return null;
    return {
      city: place['place name'],
      state: place['state abbreviation'],
      cityLower: place['place name'].toLowerCase(),
    };
  } catch {
    return null;
  }
}

// Base subreddit searches (equipment-focused, no location)
const BASE_SUBREDDIT_SEARCHES = [
  { sub: 'homegym',           q: 'WTB' },
  { sub: 'homegym',           q: 'want to buy' },
  { sub: 'homegym',           q: 'looking to buy' },
  { sub: 'garagegym',         q: 'WTB' },
  { sub: 'garagegym',         q: 'want to buy' },
  { sub: 'fitness',           q: 'WTB equipment' },
  { sub: 'weightlifting',     q: 'WTB' },
  { sub: 'powerlifting',      q: 'WTB equipment' },
  { sub: 'crossfit',          q: 'buying equipment' },
  { sub: 'bodyweightfitness', q: 'buy equipment' },
  { sub: 'gyms',              q: 'buying equipment' },
  { sub: 'gym',               q: 'WTB' },
];

// Base global searches (no location)
const BASE_GLOBAL_SEARCHES = [
  'WTB fitness equipment',
  'WTB gym equipment',
  'WTB treadmill',
  'WTB dumbbells',
  'WTB weight bench',
  'WTB elliptical',
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

async function scrape(zip = null) {
  // Build location-specific searches from zip code
  let locationSubreddits = [];
  let locationGlobals = [];

  if (zip) {
    const loc = await getCityFromZip(zip);
    if (loc) {
      const { city, state, cityLower } = loc;
      const citySubs = CITY_SUBREDDITS[cityLower] || [];
      locationSubreddits = citySubs.flatMap(sub => [
        { sub, q: 'fitness equipment' },
        { sub, q: 'gym equipment' },
        { sub, q: 'treadmill dumbbells weights' },
      ]);
      locationGlobals = [
        `want to buy fitness equipment ${city}`,
        `want to buy gym equipment ${city}`,
        `buying used fitness equipment ${city} ${state}`,
        `fitness equipment wanted ${city}`,
        `WTB gym equipment ${city}`,
      ];
    }
  }

  const subredditSearches = [...BASE_SUBREDDIT_SEARCHES, ...locationSubreddits];
  const globalSearches    = [...BASE_GLOBAL_SEARCHES,    ...locationGlobals];

  // Run all requests in parallel — no delays needed
  const [subredditResults, globalResults] = await Promise.all([
    Promise.all(subredditSearches.map(({ sub, q }) =>
      safeFetch(() => fetchSubreddit(sub, q))
    )),
    Promise.all(globalSearches.map(q =>
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
