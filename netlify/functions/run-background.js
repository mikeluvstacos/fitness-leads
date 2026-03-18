// Netlify Background Function — returns 202 immediately, runs up to 15 minutes
const db = require('../../server/db');
const { runAllScrapers } = require('../../server/run-scrapers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '' };
  }

  const alreadyRunning = await db.getRunning();
  if (alreadyRunning) {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'already_running' }),
    };
  }

  // Netlify returns 202 to the client here; the rest runs in background
  await runAllScrapers();

  return { statusCode: 200 };
};
