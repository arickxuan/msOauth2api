const { CLIENT_ID, REDIRECT_URI } = process.env;

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const scope = 'openid Mail.ReadWrite Mail.Send profile offline_access User.Read';
    const state = Math.random().toString(36).substring(7);
    
    // 在生产环境中，应该将 state 存入加密的 HttpOnly Cookie 以便在 callback 中验证
    // 这里为了简化，我们直接生成 URL
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `response_mode=query`;

    res.redirect(authUrl);
}
