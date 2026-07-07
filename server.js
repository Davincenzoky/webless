import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      temperature: 0.8,
      max_tokens: 180,
      top_p: 0.9,
      messages
    });

    const reply = completion.choices[0].message.content;

    const cleanReply = reply
      .replace(/\n\n+/g, ' ')
      .replace(/\n/g, ' ')
      .trim();

    res.json({
      choices: [{
        message: {
          content: cleanReply
        }
      }]
    });
  } catch (err) {
    console.error('Groq proxy error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to reach Groq API' });
  }
});

export default app;

app.listen(PORT, () => {
  console.log(`WebLess server running at http://localhost:${PORT}`);
});
