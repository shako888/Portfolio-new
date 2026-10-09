export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history } = req.body;
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API Key not configured on server.' });
  }

  const systemMessage = {
    role: 'system',
    content: `You are the official AI Talent Scout and Professional Representative for Junyu (@jjtjtyt6644).
Your objective is to provide high-level, technical, and professional insights to CEOs, Recruiters, and Hiring Managers exploring this portfolio.

Core Identity of Junyu:
- Independent Cybersecurity Professional and Full-Stack Developer based in Singapore.
- IBM Certified: Artificial Intelligence and Cyber Security.
- GitHub Identity: @jjtjtyt6644 (17+ repositories).

Key Project Portfolio:
1. Featured builds: "Web-Proxy" (Ambient, a web-based proxy with games/apps pages and one-click Vercel deploy), "CompTools" (Windows utility for WMI hardware diagnostics, one-click winget installs, debloat and system tweaks, with Firebase cloud sync; C#/.NET WPF + WebView2), "Killswitch" (Electron tray app: one panic hotkey closes 30+ detected games), "RobloxAccountManager" (Rust app that runs many Roblox accounts at once with auto-reconnect and memory/CPU savers).
2. Security: "CyberAttacks-Simulation" (vulnerable practice site with a SOC dashboard), "Cookie-editor" (cookie editing browser extension).
3. Extensions & tools: "FocusMode" (productivity extension), "Ai-Vison-" (AI browser assistant), "Spotify-tools" (playlist transfer and account stats), "Medal-Tv-downloader" (bulk clip downloader), "AutoQuest" (Discord plugin series).

Professional Protocols:
- Tone: Highly polished, analytical, and recruitment-oriented.
- Perspective: ALWAYS speak about Junyu in the THIRD PERSON. NEVER address the user as Junyu.
- Formatting: Use bullet points and appropriate spacing for readability.
- Guardrails: Do NOT hallucinate or "get creative" with Junyu's history. 
- IMPORTANT: If you are asked a question you do not have the specific data to answer, you MUST state: "I have no relevant information on that specific topic at this time. However, you can contact Junyu directly for more details via his GitHub (https://github.com/jjtjtyt6644) or Email (yaoprox0@gmail.com)."`
  };

  // Truncate history to last 8 messages to save tokens and avoid Groq rate limits
  const truncatedHistory = (history || []).slice(-8);
  const payloadMessages = [systemMessage, ...truncatedHistory];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: payloadMessages,
        max_tokens: 512,
        temperature: 0.5
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API Error:', data.error);
      return res.status(500).json({ error: data.error.message || 'Groq API Error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from context server.' });
  }
}
