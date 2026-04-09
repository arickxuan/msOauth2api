const axios = require('axios');
const cookie = require('cookie');

const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI } = process.env;
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 从请求头中解析 Cookie
    const cookies = cookie.parse(req.headers.cookie || '');
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token found' });
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('scope', 'openid profile offline_access User.Read');
        params.append('refresh_token', refreshToken);
        params.append('grant_type', 'refresh_token');
        params.append('client_secret', CLIENT_SECRET);

        const response = await axios.post(TOKEN_ENDPOINT, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

        const cookiesToSet = [
            cookie.serialize('access_token', access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: expires_in,
                path: '/',
                sameSite: 'lax'
            })
        ];

        // Microsoft 可能会返回新的 refresh token (轮换)
        if (newRefreshToken) {
            cookiesToSet.push(cookie.serialize('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
                sameSite: 'lax'
            }));
        }

        res.setHeader('Set-Cookie', cookiesToSet);
        res.status(200).json({ message: 'Token refreshed' });

    } catch (err) {
        console.error('Refresh error:', err.response?.data || err.message);
        // 如果 refresh token 失效，清除 cookie
        res.setHeader('Set-Cookie', [
            cookie.serialize('access_token', '', { maxAge: -1, path: '/' }),
            cookie.serialize('refresh_token', '', { maxAge: -1, path: '/' })
        ]);
        res.status(401).json({ error: 'Failed to refresh token' });
    }
}
