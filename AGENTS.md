Hosting: Cloudflare only. Never Vercel or Netlify.

Trippified runs on Cloudflare Workers through OpenNext (`wrangler.jsonc`, `open-next.config.ts`).
Check changes with the Docker gate (`docker build -f Dockerfile.gate .`). No GitHub Actions.
