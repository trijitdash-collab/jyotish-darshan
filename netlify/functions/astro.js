const CLIENT_ID     = '2aee1acd-9b3e-4a9b-8931-23ac45e3d19b';
const CLIENT_SECRET = 'PhPopGL5An8QGDH1VsNn24qjZTLdLXIpvC0e162L';
const BASE          = 'https://api.prokerala.com';

let cachedToken = null;
let tokenExpiry  = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token failed: ' + JSON.stringify(data));
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const endpoint = params.endpoint;
    if (!endpoint) return { statusCode: 400, headers, body: JSON.stringify({ error: 'endpoint required' }) };

    delete params.endpoint;

    const token = await getToken();
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE}/v2/astrology/${endpoint}${qs ? '?' + qs : ''}`;

    const apiRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const text = await apiRes.text();
    return { statusCode: apiRes.status, headers, body: text };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
