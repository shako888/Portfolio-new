export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API Key not configured on server.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: "You are a professional, knowledgeable AI guide for Junyu's cybersecurity portfolio. Read the exact context of the section the user is looking at and provide a concise, professional 1-2 sentence elaboration. Be direct and analytical. Limit yourself to a maximum of one emoji per response. Do not use quotes, filler intros, overly hyped language, or ask questions."
          },
          {
            role: 'user',
            content: `The user is looking at this section on my portfolio right now:\n${context}`
          }
        ],
        max_tokens: 80,
        temperature: 0.4
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Groq' });
  }
}
