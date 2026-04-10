const axios = require('axios');
const cookie = require('cookie');

module.exports = async function handler(req, res) {
//export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const cookies = cookie.parse(req.headers.cookie || '');
    const accessToken = cookies.access_token;

    if (!accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        res.status(200).json(response.data);
    } catch (err) {
        if (err.response?.status === 401) {
            return res.status(401).json({ error: 'Access token expired' });
        }
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}
