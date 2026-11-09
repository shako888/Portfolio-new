import { SECTIONS, rateLimited, callGroq } from './_knowledge.js'

/*
   MASCOT NARRATION — the speech bubble that comments on the section on screen.
   The browser only sends a section id; the facts for each section live on the server,
   so the mascot can't be fed (or invent) anything else.
*/

const NARRATOR = `You are the cheerful mascot guide on Junyu's portfolio website. You comment on the part of the site the visitor is looking at, in a speech bubble.
- Write ONE or TWO short sentences, at most 30 words in total.
- Use only the facts in the section description. Never add numbers, dates, claims or projects that are not in it.
- Talk about Junyu in the third person. Friendly, plain and natural. No emoji, no exclamation marks.
- No questions, no quotation marks, no greetings like "Hello" or "Welcome", no advice or warnings.
- Vary your wording; don't just repeat the description.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (rateLimited(req, 40, 5 * 60 * 1000)) return res.status(429).json({ error: 'Too many requests' })

  const context = SECTIONS[req.body?.section]
  if (!context) return res.status(400).json({ error: 'Unknown section' })

  const result = await callGroq({
    messages: [
      { role: 'system', content: NARRATOR },
      { role: 'user', content: `Section on screen: ${context}` },
    ],
    maxTokens: 400,
    temperature: 0.7,
  })
  if (result.error) return res.status(result.status).json({ error: result.error })
  return res.status(200).json({ reply: result.reply })
}
