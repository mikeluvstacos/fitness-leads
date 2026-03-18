const { schedule } = require('@netlify/functions');
const { runAllScrapers } = require('../../server/run-scrapers');

exports.handler = schedule('0 */6 * * *', async () => {
  console.log('[Cron] Scheduled scrape triggered at', new Date().toISOString());
  try {
    const result = await runAllScrapers();
    console.log('[Cron] Done:', result);
  } catch (err) {
    console.error('[Cron] Failed:', err.message);
  }
  return { statusCode: 200 };
});
