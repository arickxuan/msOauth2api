// pages/api/auth/refresh.js
//export default async function handler(req, res) {
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' });
  }

  const clientId = process.env.CLIENT_ID;
  const tenantId = process.env.TENANT_ID;

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    scope: 'openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access',
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Refresh failed', details: errText });
    }

    const tokens = await response.json();

    return res.status(200).json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // Microsoft 可能会返回新的 refresh token
      expires_in: tokens.expires_in
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
