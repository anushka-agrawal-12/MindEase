# MindEase on Cloudflare (site + backend, all in one)

The site (`../dist`) and the backend (`worker.js`) deploy together as one Cloudflare Worker.
Data lives in Supabase Postgres. No Render, no sleeping server.

## One-time setup

1. **Supabase**: the tables must exist (run `../supabase/schema.sql` in Supabase → SQL Editor if you have not).
   Copy the **Transaction pooler** connection string (Connect button, port 6543) with your database password in it.
2. **Install** (needs Node 20+):
   ```
   cd cloudflare
   npm install
   npx wrangler login
   ```
3. **Secrets** (stored encrypted by Cloudflare, never in git):
   ```
   npx wrangler secret put DATABASE_URL     # paste the Supabase string
   npx wrangler secret put SESSION_SECRET   # paste any long random text, 32+ characters
   ```
4. **Build the site and deploy**:
   ```
   python3 ../build_static.py
   npx wrangler deploy
   ```
   Keep the Worker name `mindease` to replace your current link.

## Test locally
Create `.dev.vars` (never commit it):
```
DATABASE_URL=postgresql://...
SESSION_SECRET=any-long-random-text-here-123456
```
`npx wrangler dev` then open http://127.0.0.1:8787 .

## Tests
`DATABASE_URL=postgresql://... npm test` (this WIPES the MindEase tables, so use a scratch database).

## Notes
- Passwords use PBKDF2 (the strongest Cloudflare's runtime allows). On the free Workers plan each request has about 10 ms of CPU; if sign-ups or sign-ins ever fail with a CPU-limit error in the logs, the $5/month Workers plan fixes it.
- Sign-in rate limits are stored in the database (`auth_attempts`), so they hold across all Cloudflare locations.
- Sessions are signed cookies (30 days). Changing `SESSION_SECRET` signs everyone out.
- Custom domain later: Cloudflare dashboard → Workers → mindease → Settings → Domains.
