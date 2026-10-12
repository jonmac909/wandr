# Hosting and release policy

Hosting: Cloudflare only. Never Vercel or Netlify.

Trippified runs on Cloudflare Workers through OpenNext (`wrangler.toml`,
`open-next.config.ts`). Release with the Docker gate, not GitHub Actions:

1. `docker build -f Dockerfile.gate -t trippified-gate .` (type check, OpenNext build).
2. PR, merge, then copy `.open-next` out of the gate image built from the merged
   commit and run `wrangler deploy --env preview` to check it on workers.dev.
3. `wrangler deploy` for production (trippified.com and www.trippified.com).

OpenNext builds are not reliable on Windows; always build in the Linux gate image.
Secrets live in the Cloudflare Worker (`wrangler secret put`) and are never
committed or printed.
