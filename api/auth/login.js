// pages/api/auth/login.js
//import { generateCodeVerifier, generateCodeChallenge } from '../utils.js';

const { generateCodeVerifier, generateCodeChallenge } = require('../utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.CLIENT_ID;
  const tenantId = process.env.TENANT_ID;
  const redirectUri = process.env.REDIRECT_URI;
  console.log(redirectUri);

  if (!clientId || !tenantId || !redirectUri) {
    console.error('Missing env vars:', { clientId: !!clientId, tenantId: !!tenantId, redirectUri: !!redirectUri });
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 1. 生成 PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // 2. 设置 HttpOnly Cookie
  res.setHeader('Set-Cookie', [
    `code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; Max-Age=300; SameSite=Lax`
  ]);

  // 3. 构建授权 URL
  const scope = encodeURIComponent('openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access');
  
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scope}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256&` +
    `response_mode=query`;

  res.redirect(authUrl);
};
