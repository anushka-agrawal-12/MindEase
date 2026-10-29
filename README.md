# MindEase

A cozy mood tracker and anxiety-relief web app. Python (Flask) backend, Supabase Postgres (or SQLite for local use), plain HTML/CSS/JS front end. Installable on a phone (PWA).

## Run it

```bash
cd mindease
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://localhost:8080 . Data lives in `data/mindease.db` (delete `data/` to start fresh).

## What it does

- **Today**: mood check-in (note, energy, tags), daily plan, week chart, Mo companion
- **Calm**: breathing, grounding, kind words, gentle games
- **Track**: insights, calendar, journal (the daily plan shows on both calendar and journal)
- **Grow**: guided programs, study mode
- **Me**: safety plan, **Sharing**, reminders, settings (themes, text size, contrast, Hindi)
- **Keeper view**: see how someone who invited you is doing

## Sharing with a keeper (partner, friend, family)

Consent comes first. You create an invite in *My space → Sharing*, pick exactly what they can see (moods and energy, tags, check-in notes, journal, daily plan, gentle heads-up), and send them the one-time code (valid 7 days). They sign in with their own account, open *Keeper view*, and enter it.
- Notes and journal are **off by default**.
- The keeper view is read-only. Safety plan, settings and gratitude jar are never shared.
- You can see when they last looked, change what is shared, or stop sharing instantly. They can step away too.
- Heads-ups are simple rules: three heavy check-ins out of the last five, two or more quiet days, or low energy.

## Database: Supabase (Postgres)

Without `DATABASE_URL` the app uses a local SQLite file. To use Supabase:
1. Supabase → your project → **Connect** → copy the **Transaction pooler** connection string (port 6543) and put your database password in it.
2. `export DATABASE_URL='postgresql://postgres.xxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'`
3. `python app.py`. The tables are created on first start (`supabase/schema.sql` has the same SQL).

Row Level Security is on for every table with no policies, so the public Supabase API cannot read your users' data. Only this server can. Never put the database password in the browser or in git.

## Tests

SQLite: `pytest -q`. Against Postgres: `TEST_DATABASE_URL=postgresql://... pytest -q` (wipes those tables, so use a scratch database).

## Go live

**Recommended: everything on Cloudflare** (site + backend as a Worker, data in Supabase). See `cloudflare/README.md`. The Flask server below is the alternative if you prefer Python hosting.

One worker is deliberate: sign-in rate limits live in memory and the database is SQLite.

**Render**: push to GitHub, create a *Blueprint* from `render.yaml`, then paste your Supabase `DATABASE_URL` in the dashboard. HTTPS and a secret are set for you.
**Docker / any VPS**: `docker build -t mindease . && docker run -p 8080:8080 -v mindease-data:/data mindease`, then put it behind HTTPS (Caddy or nginx).
**Procfile hosts** (Railway, Heroku-style): `Procfile` is included; mount persistent storage and set `MINDEASE_DATA` to it.

Before real users: serve over HTTPS and set `MINDEASE_HTTPS=1`; turn on Supabase backups; confirm helpline details on the Help page.

| Variable | Meaning |
|---|---|
| `PORT` | Port (default 8080) |
| `HOST` | Bind address (default 127.0.0.1) |
| `DATABASE_URL` | Postgres/Supabase connection string (unset = local SQLite) |
| `MINDEASE_DATA` | Folder for the SQLite file and secret key (default `./data`) |
| `MINDEASE_SECRET` | Secret for sign-in cookies (default: random, kept in `data/secret.key`) |
| `MINDEASE_HTTPS=1` | Secure cookies and HSTS; set when served over HTTPS |
| `MINDEASE_DEBUG=1` | Auto-reload while developing |

## API

Auth: `GET /api/auth/me`, `POST /api/auth/register|login|logout|delete`
Data: `GET/PUT /api/sync`, `GET /api/export` (download everything), `GET /healthz`
Sharing (owner): `GET /api/share/mine`, `POST /api/share/invite`, `PUT|DELETE /api/share/<id>`
Sharing (keeper): `POST /api/share/accept`, `GET /api/keeper/people`, `GET|DELETE /api/keeper/<id>`

## Not built yet

Password reset by email, push notifications to a keeper's phone, and the AI companion (planned). Mood data is sensitive: add a privacy policy and terms before opening it to the public.

## Layout

```
app.py          server: pages, auth, sync, sharing
tests/          pytest suite
templates/      landing.html, app.html
static/         css, js, fonts, icons, manifest, service worker
data/           database (not committed)
```
