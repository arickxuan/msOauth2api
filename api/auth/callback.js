// pages/api/auth/callback.js
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({ error, error_description });
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // 1. 从 Cookie 获取 verifier
  const cookies = cookie.parse(req.headers.cookie || '');
  const codeVerifier = cookies.code_verifier;

  if (!codeVerifier) {
    return res.status(400).json({ error: 'Invalid session. Please login again.' });
  }

  const clientId = process.env.CLIENT_ID;
  const tenantId = process.env.TENANT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  // 2. 交换 Token
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
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
      console.error('Token Exchange Failed:', errText);
      return res.status(500).json({ error: 'Failed to exchange token' });
    }

    const tokens = await response.json();

    // 3. 清除临时 Cookie
    res.setHeader('Set-Cookie', [
      `code_verifier=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Lax`
    ]);

    // 4. 返回 Token (包含 Refresh Token)
    // ⚠️ 生产建议：不要直接返回 JSON，而是存入 HttpOnly Cookie
    return res.status(200).json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // 这里是你需要的 Refresh Token
      expires_in: tokens.expires_in,
      token_type: tokens.token_type
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
