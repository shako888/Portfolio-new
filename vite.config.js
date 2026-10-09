import { defineConfig, loadEnv } from 'vite'

/*
   Dev-only: serve the Vercel functions in /api from the Vite dev server, so the mascot and
   chat work locally exactly as in production. The Groq key is read from .env on the server
   side (GROQ_API_KEY) and never reaches the browser bundle.
*/
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = /^\/api\/([a-z]+)(?:\?|$)/.exec(req.url || '')
        if (!match) return next()

        let handler
        try {
          handler = (await server.ssrLoadModule(`/api/${match[1]}.js`)).default
        } catch {
          return next()
        }

        let raw = ''
        for await (const chunk of req) raw += chunk
        try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }

        res.status = code => { res.statusCode = code; return res }
        res.json = obj => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }
        try {
          await handler(req, res)
        } catch (err) {
          console.error(`[dev-api] /api/${match[1]} failed:`, err)
          if (!res.writableEnded) res.status(500).json({ error: 'Dev API error' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load ALL .env keys for the dev server process only (no VITE_ prefix = never bundled)
  const env = loadEnv(mode, process.cwd(), '')
  const key = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY
  if (key && !process.env.GROQ_API_KEY) process.env.GROQ_API_KEY = key
  if (env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN) process.env.GITHUB_TOKEN = env.GITHUB_TOKEN

  return {
    server: { open: true },
    plugins: [devApi()],
  }
})
