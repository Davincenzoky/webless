import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    messages
  });

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const httpsReq = https.request(options, (groqRes) => {
        let raw = '';
        groqRes.on('data', chunk => raw += chunk);
        groqRes.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (groqRes.statusCode >= 200 && groqRes.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error?.message || `Groq API error (${groqRes.statusCode})`));
            }
          } catch (e) {
            reject(new Error('Failed to parse Groq response'));
          }
        });
      });

      httpsReq.on('error', reject);
      httpsReq.write(body);
      httpsReq.end();
    });

    res.json(data);
  } catch (err) {
    console.error('Groq proxy error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to reach Groq API' });
  }
}
