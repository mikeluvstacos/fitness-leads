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

async function resolveLocation(input) {
  if (!input) return null;
  input = input.trim();

  // 5-digit zip → look up city via zippopotam
  if (/^\d{5}$/.test(input)) {
    try {
      const res = await axios.get(`https://api.zippopotam.us/us/${input}`, { timeout: 5000 });
      const place = res.data?.places?.[0];
      if (!place) return null;
      return {
        city: place['place name'],
        state: place['state abbreviation'],
        cityLower: place['place name'].toLowerCase(),
      };
    } catch { return null; }
  }

  // "City, ST" or "City ST" → parse directly
  const match = input.match(/^([^,]+),?\s+([A-Za-z]{2})$/);
  if (match) {
    const city = match[1].trim();
    const state = match[2].toUpperCase();
    return { city, state, cityLower: city.toLowerCase() };
  }

  // Plain city name
  return { city: input, state: '', cityLower: input.toLowerCase() };
}

// Subreddits focused on buying/selling or fitness gear
const BUY_SUBS = [
  'homegym', 'garagegym', 'gym', 'gyms',
  'fitness', 'weightlifting', 'powerlifting', 'crossfit',
  'bodyweightfitness', 'kettlebell', 'pelotoncycle',
  'xxfitness', 'loseit', 'running',
];

// Equipment terms to search for individually
const EQUIPMENT_TERMS = [
  'squat rack', 'power rack', 'barbell', 'bumper plates', 'weight plates',
  'dumbbells', 'adjustable dumbbells', 'kettlebell', 'weight bench',
  'treadmill', 'elliptical', 'stationary bike', 'rowing machine',
  'peloton', 'nordictrack', 'bowflex', 'matrix fitness', 'precor', 'life fitness',
  'stairmaster', 'freemotion', 'cable machine', 'functional trainer',
  'smith machine', 'leg press', 'lat pulldown', 'pull up bar',
  'gym equipment', 'fitness equipment', 'home gym',
];

// Buyer intent phrases to pair with equipment
const BUYER_PHRASES = ['WTB', 'ISO', 'want to buy', 'looking to buy', 'looking for used'];

// Build subreddit searches: every sub × every buyer phrase
const BASE_SUBREDDIT_SEARCHES = BUY_SUBS.flatMap(sub =>
  BUYER_PHRASES.map(q => ({ sub, q }))
);

// Base global searches (no location)
const BASE_GLOBAL_SEARCHES = [
  // WTB + specific equipment
  ...EQUIPMENT_TERMS.map(t => `WTB ${t}`),
  // ISO + specific equipment
  ...EQUIPMENT_TERMS.map(t => `ISO ${t}`),
  // broader intent phrases
  'want to buy gym equipment',
  'want to buy home gym',
  'looking for used fitness equipment',
  'buying used gym equipment',
  'anyone selling squat rack',
  'anyone selling treadmill',
  'anyone selling dumbbells',
  'gym closing equipment sale',
  'commercial gym equipment for sale',
  'bulk gym equipment',
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

const BUY_KEYWORDS = /\b(wtb|iso|want\s+to\s+buy|looking\s+to\s+buy|looking\s+for|buying|need|needed|wanted|purchase|acquire|in\s+search\s+of|anyone\s+selling|where\s+can\s+i\s+(find|get|buy)|seeking|interested\s+in\s+buying|help\s+me\s+find)\b/i;
const SELL_KEYWORDS = /\b(wts|wtt|selling\b|for\s+sale|fs\b|\[sold\]|asking\s+\$|price\s+drop|price\s+reduced|obo|firm\s+price)\b/i;

function isBuyerPost(post) {
  const text = `${post.title} ${post.snippet}`;
  // If it's clearly a seller post, drop it
  if (SELL_KEYWORDS.test(text)) return false;
  // Keep if it has any buyer signal
  return BUY_KEYWORDS.test(text);
}

async function safeFetch(fn) {
  try { return await fn(); } catch { return []; }
}

async function scrape(zip = null) {
  // Build location-specific searches from zip/city input
  let locationSubreddits = [];
  let locationGlobals = [];

  if (zip) {
    const loc = await resolveLocation(zip);
    if (loc) {
      const { city, state, cityLower } = loc;
      const citySubs = CITY_SUBREDDITS[cityLower] || [];
      locationSubreddits = citySubs.flatMap(sub =>
        BUYER_PHRASES.flatMap(q => [
          { sub, q: `${q} gym equipment` },
          { sub, q: `${q} fitness equipment` },
          { sub, q: `${q} treadmill` },
          { sub, q: `${q} squat rack` },
          { sub, q: `${q} dumbbells` },
        ])
      );
      const locSuffix = state ? `${city} ${state}` : city;
      locationGlobals = EQUIPMENT_TERMS.flatMap(t => [
        `WTB ${t} ${locSuffix}`,
        `ISO ${t} ${locSuffix}`,
      ]).concat([
        `want to buy gym equipment ${locSuffix}`,
        `buying used fitness equipment ${locSuffix}`,
        `gym equipment wanted ${locSuffix}`,
        `gym closing equipment ${locSuffix}`,
      ]);
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
