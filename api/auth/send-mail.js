// pages/api/graph/send-mail.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accessToken = authHeader.split(' ')[1];
  const { subject, bodyContent, toRecipients } = req.body;

  if (!subject || !bodyContent || !toRecipients) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const graphUrl = 'https://graph.microsoft.com/v1.0/me/sendMail';

  const payload = {
    message: {
      subject: subject,
      body: {
        contentType: "Text",
        content: bodyContent
      },
      toRecipients: toRecipients.map(email => ({
        emailAddress: { address: email }
      }))
    },
    saveToSentItems: "true"
  };

  try {
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 202) {
      return res.status(200).json({ success: true });
    } else {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Send failed', details: errorData });
    }

  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
