const db = require('../../server/db');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const zip = await db.getZip();
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip }),
    };
  }

  if (event.httpMethod === 'POST') {
    const { zip } = JSON.parse(event.body || '{}');
    if (!zip || !/^\d{5}$/.test(zip)) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Invalid zip code' }),
      };
    }
    await db.setZip(zip);
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip }),
    };
  }

  return { statusCode: 405, headers: CORS, body: '' };
};
