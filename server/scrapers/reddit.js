/**
 * Reddit scraper – finds WTB (want to buy) posts for fitness equipment
 * Uses Reddit's public JSON API (no auth needed for basic search)
 */
const axios = require('axios');

const HEADERS = {
  'User-Agent': 'FitnessLeadFinder/1.0 (lead generation tool)',
};

// Subreddits likely to have fitness equipment buyers
const SUBREDDIT_SEARCHES = [
  { sub: 'homegym',     q: 'WTB' },
  { sub: 'homegym',     q: 'want to buy' },
  { sub: 'fitness',     q: 'WTB gym equipment' },
  { sub: 'houston',     q: 'WTB fitness gym equipment' },
  { sub: 'houstontx',   q: 'fitness equipment' },
  { sub: 'gyms',        q: 'buy used equipment' },
];

// Global Reddit search terms
const GLOBAL_SEARCHES = [
  'WTB fitness equipment houston',
  'want to buy gym equipment bulk houston',
  'buying used fitness equipment houston',
  'fitness equipment wanted houston texas',
];

async function fetchSubreddit(sub, q) {
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=25&t=month`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  return res.data?.data?.children || [];
}

async function fetchGlobal(q) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&limit=25&t=month`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  return res.data?.data?.children || [];
}

function mapPost(post) {
  const d = post.data;
  return {
    url:        `https://www.reddit.com${d.permalink}`,
    title:      d.title,
    platform:   'Reddit',
    snippet:    d.selftext ? d.selftext.slice(0, 200) : `r/${d.subreddit} • ${d.score} upvotes`,
    posted_at:  new Date(d.created_utc * 1000).toISOString(),
  };
}

// Filter to posts that are clearly about BUYING (not selling)
const BUY_KEYWORDS = /\b(wtb|want\s+to\s+buy|looking\s+to\s+buy|looking\s+for|buying|need|wanted|bulk|purchase|acquire)\b/i;
const SELL_KEYWORDS = /\b(wts|selling|for\s+sale|fs\b|sold|asking|price\s+drop)\b/i;

function isBuyerPost(post) {
  const text = `${post.title} ${post.snippet}`.toLowerCase();
  return BUY_KEYWORDS.test(text) && !SELL_KEYWORDS.test(text);
}

async function scrape() {
  const all = [];

  for (const { sub, q } of SUBREDDIT_SEARCHES) {
    try {
      const posts = await fetchSubreddit(sub, q);
      all.push(...posts.map(mapPost));
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.warn(`[Reddit] Error r/${sub} "${q}":`, err.message);
    }
  }

  for (const q of GLOBAL_SEARCHES) {
    try {
      const posts = await fetchGlobal(q);
      all.push(...posts.map(mapPost));
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.warn(`[Reddit] Global search error "${q}":`, err.message);
    }
  }

  // Dedupe + filter to buyer posts only
  const seen = new Set();
  return all.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return isBuyerPost(l);
  });
}

module.exports = { scrape };
