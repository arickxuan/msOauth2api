const axios = require('axios');
const cookie = require('cookie');

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

module.exports = async function handler(req, res) {
//export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, error } = req.query;

    if (error) {
        return res.status(400).send(`Login failed: ${error}`);
    }

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('scope', 'openid profile offline_access User.Read');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('grant_type', 'authorization_code');
        params.append('client_secret', CLIENT_SECRET);

        const response = await axios.post(TOKEN_ENDPOINT, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        if (!refresh_token) {
            console.error('No refresh token received. Ensure "offline_access" scope is included and app is configured correctly.');
        }

        // 设置 Cookie
        // HttpOnly: JS 无法访问，防止 XSS
        // Secure: 仅 HTTPS 传输 (Vercel 生产环境是 HTTPS)
        // SameSite: Lax 或 Strict
        const cookies = [
            cookie.serialize('access_token', access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: expires_in, // Access Token 过期时间
                path: '/',
                sameSite: 'lax'
            }),
            cookie.serialize('refresh_token', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30, // 30 天
                path: '/',
                sameSite: 'lax'
            })
        ];

        res.setHeader('Set-Cookie', cookies);
        
        // 重定向回首页
        res.writeHead(302, { Location: '/ms.html' });
        res.end();

    } catch (err) {
        console.error('Token exchange error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
}
