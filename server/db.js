const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function insertListing(listing) {
  const { error } = await supabase
    .from('listings')
    .upsert(
      { ...listing, is_new: true, found_at: new Date().toISOString() },
      { onConflict: 'url', ignoreDuplicates: true }
    );
  if (error && error.code !== '23505') throw error;
  return !error;
}

async function getListings({ platform, search, limit = 200 } = {}) {
  let query = supabase
    .from('listings')
    .select('*')
    .order('found_at', { ascending: false })
    .limit(limit);

  if (platform && platform !== 'all') {
    query = query.eq('platform', platform);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,snippet.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: total },
    { count: newToday },
    { data: allListings },
    { data: lastRun },
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).gte('found_at', today.toISOString()),
    supabase.from('listings').select('platform'),
    supabase.from('run_log').select('*').order('ran_at', { ascending: false }).limit(1),
  ]);

  const platformMap = {};
  for (const l of allListings || []) {
    platformMap[l.platform] = (platformMap[l.platform] || 0) + 1;
  }
  const byPlatform = Object.entries(platformMap)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: total || 0,
    newToday: newToday || 0,
    byPlatform,
    lastRun: lastRun?.[0] || null,
  };
}

async function logRun(foundCount, errorMsg = null) {
  await supabase.from('run_log').insert({
    ran_at: new Date().toISOString(),
    found_count: foundCount,
    error_msg: errorMsg,
  });
}

async function setRunning(running) {
  await supabase
    .from('scraper_status')
    .upsert({ id: 1, running, updated_at: new Date().toISOString() });
}

async function getRunning() {
  const { data } = await supabase
    .from('scraper_status')
    .select('running')
    .eq('id', 1)
    .single();
  return data?.running || false;
}

async function getZip() {
  const { data } = await supabase
    .from('scraper_status')
    .select('zip_code')
    .eq('id', 1)
    .single();
  return data?.zip_code || '77001';
}

async function setZip(zip) {
  await supabase
    .from('scraper_status')
    .upsert({ id: 1, zip_code: zip, updated_at: new Date().toISOString() });
}

module.exports = { insertListing, getListings, getStats, logRun, setRunning, getRunning, getZip, setZip };
