// MindEase backend as a Cloudflare Worker (JavaScript) on Supabase Postgres.
// The site itself is served from ../dist by Cloudflare's static assets; this code only handles /api/* and /healthz.
import postgres from 'postgres';

const MOODS = new Set(['veryhappy', 'happy', 'grateful', 'calm', 'neutral', 'tired', 'sad', 'anxious', 'overwhelmed', 'angry']);
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TAG = /^[a-z0-9-]{1,20}$/;
const EXTRA_KEYS = ['programs', 'safety', 'study', 'prefs', 'daily'];
const MAX_LOGS = 500, MAX_JOURNAL = 800, MAX_LIST = 500;
const SCOPE_KEYS = ['moods', 'tags', 'notes', 'journal', 'daily', 'alerts'];
const DEFAULT_SCOPE = { moods: true, tags: true, notes: false, journal: false, daily: true, alerts: true };
const HEAVY = new Set(['sad', 'anxious', 'overwhelmed', 'angry']);
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_SHARES = 5, INVITE_DAYS = 7, DAY = 86400000;
const PBKDF2_ITER = 100000; // the most Cloudflare allows
const COOKIE = 'mi_session';
const SESSION_DAYS = 30;

const enc = new TextEncoder();

/* ───────────── small helpers ───────────── */
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } });
const err = (message, status) => json({ error: message }, status);
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const nowIso = () => new Date().toISOString();

function loads(text, fallback) {
  try {
    const v = JSON.parse(text);
    return v !== null && typeof v === typeof fallback && Array.isArray(v) === Array.isArray(fallback) ? v : fallback;
  } catch { return fallback; }
}
function jsonText(value, fallback, maxChars) {
  if (value === null || typeof value !== typeof fallback || Array.isArray(value) !== Array.isArray(fallback)) return JSON.stringify(fallback);
  if (Array.isArray(value)) value = value.slice(0, MAX_LIST);
  const t = JSON.stringify(value);
  return t.length <= maxChars ? t : JSON.stringify(fallback);
}
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/* ───────────── passwords + sessions (Web Crypto) ───────────── */
async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64u(salt)}$${b64u(await pbkdf2(password, salt, PBKDF2_ITER))}`;
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
const DUMMY_HASH = `pbkdf2$${PBKDF2_ITER}$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
async function verifyPassword(password, stored) {
  const [kind, iter, salt, hash] = String(stored).split('$');
  if (kind !== 'pbkdf2') return false;
  const got = await pbkdf2(password, unb64u(salt), Number(iter));
  return sameBytes(got, unb64u(hash));
}
async function hmacKey(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 16) throw new Error('SESSION_SECRET is not set');
  return crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function makeSession(env, uid) {
  const body = b64u(enc.encode(JSON.stringify({ uid, exp: Date.now() + SESSION_DAYS * DAY })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(body));
  return `${body}.${b64u(sig)}`;
}
async function readSession(env, request) {
  const raw = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const [body, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!body || !sig) return null;
  try {
    if (!(await crypto.subtle.verify('HMAC', await hmacKey(env), unb64u(sig), enc.encode(body)))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return p.exp > Date.now() ? p.uid : null;
  } catch { return null; }
}
const cookieHeader = (value, maxAge, secure) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

/* ───────────── sign-in rate limit (kept in the database, so it works across Workers) ───────────── */
async function tooMany(sql, bucket) {
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM auth_attempts WHERE bucket = ${bucket} AND at > ${Date.now() - 600000}`;
  return n >= 8;
}
async function recordFail(sql, bucket) {
  await sql`INSERT INTO auth_attempts (bucket, at) VALUES (${bucket}, ${Date.now()})`;
  if (Math.random() < 0.05) await sql`DELETE FROM auth_attempts WHERE at < ${Date.now() - 3600000}`;
}
function clientIp(request) {
  return (request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'local').trim().slice(0, 64);
}

/* ───────────── router ───────────── */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/') && url.pathname !== '/healthz') {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
    const sql = postgres(env.DATABASE_URL, {
      max: 1, prepare: false, fetch_types: false, idle_timeout: 5, connect_timeout: 10, onnotice() {},
      types: { bigint: { to: 20, from: [20], serialize: (x) => String(x), parse: (x) => Number(x) } },
    });
    try {
      const res = await handle(request, env, sql, url);
      res.headers.set('Cache-Control', 'no-store');
      res.headers.set('X-Content-Type-Options', 'nosniff');
      return res;
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      return err('Something went wrong on our side. Please try again.', 500);
    } finally {
      ctx.waitUntil(sql.end({ timeout: 2 }));
    }
  },
};

async function handle(request, env, sql, url) {
  const method = request.method, path = url.pathname, secure = url.protocol === 'https:';

  if (path === '/healthz') { await sql`SELECT 1`; return json({ ok: true }); }

  // browsers cannot send application/json cross-site without permission, which blocks CSRF
  let body = {};
  if (method === 'POST' || method === 'PUT') {
    const len = Number(request.headers.get('content-length') || 0);
    if (len > 2 * 1024 * 1024) return err('That is too large.', 413);
    if (len && !(request.headers.get('content-type') || '').includes('application/json')) return err('Expected JSON.', 415);
    body = (await request.json().catch(() => null)) ?? {};
  }
  const ip = clientIp(request);
  const user = async () => {
    const uid = await readSession(env, request);
    if (!uid) return null;
    const [u] = await sql`SELECT * FROM users WHERE id = ${uid}`;
    return u || null;
  };
  const need = async () => (await user()) || null;
  const signIn = async (u) => ({ 'set-cookie': cookieHeader(await makeSession(env, u.id), SESSION_DAYS * 86400, secure) });
  const userJson = (u) => ({ signedIn: true, name: u.name, email: u.email });
  const unauth = () => err('Please sign in first.', 401);
  let m;

  /* ── auth ── */
  if (path === '/api/auth/me' && method === 'GET') {
    const u = await user();
    return json(u ? userJson(u) : { signedIn: false });
  }
  if (path === '/api/auth/register' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    let name = String(body.name || '').trim();
    if (email.length > 254 || !EMAIL.test(email)) return err('Please enter a valid email address.', 400);
    if (password.length < 8) return err('Password needs at least 8 characters.', 400);
    if (password.length > 128) return err('Password is too long (128 characters max).', 400);
    const bucket = `register|${ip}`;
    if (await tooMany(sql, bucket)) return err('Too many tries. Please wait a few minutes and try again.', 429);
    await recordFail(sql, bucket); // counts every sign-up attempt from this address
    if (!name) name = email.split('@')[0];
    name = name.slice(0, 60);
    const [dup] = await sql`SELECT 1 FROM users WHERE email = ${email}`;
    if (dup) return err('An account with this email already exists. Try signing in.', 400);
    let u;
    try {
      [u] = await sql`INSERT INTO users (email, name, password_hash, created_at) VALUES (${email}, ${name}, ${await hashPassword(password)}, ${nowIso()}) RETURNING id, email, name`;
    } catch (e) {
      if (e.code === '23505') return err('An account with this email already exists. Try signing in.', 400);
      throw e;
    }
    return json({ signedIn: true, name: u.name, email: u.email }, 200, await signIn(u));
  }
  if (path === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const bucket = `login|${ip}|${email}`;
    if (await tooMany(sql, bucket)) return err('Too many tries. Please wait a few minutes and try again.', 429);
    const [u] = await sql`SELECT * FROM users WHERE email = ${email}`;
    const ok = await verifyPassword(password, u ? u.password_hash : DUMMY_HASH); // same work whether or not the email exists
    if (!u || !ok) { await recordFail(sql, bucket); return err('That email and password do not match.', 401); }
    return json(userJson(u), 200, await signIn(u));
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    return json({ signedIn: false }, 200, { 'set-cookie': cookieHeader('', 0, secure) });
  }
  if (path === '/api/auth/delete' && method === 'POST') {
    const u = await need(); if (!u) return unauth();
    if (!(await verifyPassword(String(body.password || ''), u.password_hash))) return err('That password is not correct.', 400);
    await sql`DELETE FROM users WHERE id = ${u.id}`; // logs, journal and shares go with it
    return json({ signedIn: false }, 200, { 'set-cookie': cookieHeader('', 0, secure) });
  }

  /* ── saved data ── */
  if (path === '/api/sync' && method === 'GET') {
    const u = await need(); if (!u) return unauth();
    return json(await loadState(sql, u));
  }
  if (path === '/api/export' && method === 'GET') {
    const u = await need(); if (!u) return unauth();
    const data = { ...(await loadState(sql, u)), name: u.name, email: u.email, exportedAt: nowIso() };
    return json(data, 200, { 'content-disposition': 'attachment; filename=mindease-export.json' });
  }
  if (path === '/api/sync' && method === 'PUT') {
    const u = await need(); if (!u) return unauth();
    if (!isObj(body)) return err('Expected a JSON object.', 400);
    await saveState(sql, u, body);
    return json({ ok: true });
  }

  /* ── sharing: owner ── */
  if (path === '/api/share/mine' && method === 'GET') {
    const u = await need(); if (!u) return unauth();
    const rows = await sql`SELECT s.*, k.name AS kname FROM shares s LEFT JOIN users k ON k.id = s.keeper_id
      WHERE s.owner_id = ${u.id} AND s.status != 'revoked' ORDER BY s.id DESC`;
    const cutoff = new Date(Date.now() - INVITE_DAYS * DAY).toISOString();
    const out = [];
    for (const r of rows) {
      if (r.status === 'pending' && r.created_at < cutoff) { await sql`DELETE FROM shares WHERE id = ${r.id}`; continue; }
      out.push(shareJson(r, r.kname));
    }
    return json({ shares: out });
  }
  if (path === '/api/share/invite' && method === 'POST') {
    const u = await need(); if (!u) return unauth();
    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM shares WHERE owner_id = ${u.id} AND status != 'revoked'`;
    if (n >= MAX_SHARES) return err(`You can share with up to ${MAX_SHARES} people. Stop sharing with someone first.`, 400);
    const label = String(body.label || '').trim().slice(0, 40);
    const code = await newCode(sql);
    const [r] = await sql`INSERT INTO shares (owner_id, code, label, scope_json, status, created_at)
      VALUES (${u.id}, ${code}, ${label}, ${JSON.stringify(scopeOf(body.scope))}, 'pending', ${nowIso()}) RETURNING id`;
    return json({ id: r.id, code });
  }
  if ((m = path.match(/^\/api\/share\/(\d+)$/)) && (method === 'PUT' || method === 'DELETE')) {
    const u = await need(); if (!u) return unauth();
    const sid = Number(m[1]);
    if (method === 'DELETE') {
      const r = await sql`DELETE FROM shares WHERE id = ${sid} AND owner_id = ${u.id} RETURNING id`;
      return r.length ? json({ ok: true }) : err('Not found.', 404);
    }
    const [r] = await sql`SELECT * FROM shares WHERE id = ${sid} AND owner_id = ${u.id} AND status != 'revoked'`;
    if (!r) return err('Not found.', 404);
    const scope = scopeOf(loads(r.scope_json, {}));
    if (isObj(body.scope)) for (const k of SCOPE_KEYS) if (typeof body.scope[k] === 'boolean') scope[k] = body.scope[k];
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 40) : r.label;
    await sql`UPDATE shares SET scope_json = ${JSON.stringify(scope)}, label = ${label} WHERE id = ${sid}`;
    return json({ ok: true });
  }

  /* ── sharing: keeper ── */
  if (path === '/api/share/accept' && method === 'POST') {
    const u = await need(); if (!u) return unauth();
    const bucket = `accept|${ip}`;
    if (await tooMany(sql, bucket)) return err('Too many tries. Please wait a few minutes.', 429);
    const code = String(body.code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const [r] = code ? await sql`SELECT * FROM shares WHERE code = ${code} AND status = 'pending'` : [];
    if (!r || r.created_at < new Date(Date.now() - INVITE_DAYS * DAY).toISOString()) {
      await recordFail(sql, bucket);
      return err('That code did not work. It may have expired. Ask them for a new one.', 400);
    }
    if (r.owner_id === u.id) return err('That is your own code. Send it to the person who will keep an eye on you.', 400);
    const [dup] = await sql`SELECT 1 FROM shares WHERE owner_id = ${r.owner_id} AND keeper_id = ${u.id} AND status = 'active'`;
    if (dup) return err('You already look after this person.', 400);
    await sql`UPDATE shares SET keeper_id = ${u.id}, status = 'active', code = NULL, accepted_at = ${nowIso()} WHERE id = ${r.id}`;
    return json({ ok: true });
  }
  if (path === '/api/keeper/people' && method === 'GET') {
    const u = await need(); if (!u) return unauth();
    const rows = await sql`SELECT s.id, s.scope_json, s.accepted_at, o.id AS oid, o.name FROM shares s JOIN users o ON o.id = s.owner_id
      WHERE s.keeper_id = ${u.id} AND s.status = 'active' ORDER BY s.id DESC`;
    const people = [];
    for (const r of rows) {
      const sc = scopeOf(loads(r.scope_json, {}));
      const logs = (await sql`SELECT mood_key, energy, logged_at FROM mood_logs WHERE user_id = ${r.oid} ORDER BY logged_at DESC LIMIT 5`)
        .map((x) => ({ k: x.mood_key, energy: x.energy, t: x.logged_at }));
      people.push({
        id: r.id, name: r.name, lastCheckin: logs.length && sc.moods ? logs[0].t : null, lastMood: logs.length && sc.moods ? logs[0].k : null,
        alerts: sc.alerts ? alertsFor(logs) : [], since: r.accepted_at,
      });
    }
    return json({ people });
  }
  if ((m = path.match(/^\/api\/keeper\/(\d+)$/)) && (method === 'GET' || method === 'DELETE')) {
    const u = await need(); if (!u) return unauth();
    const sid = Number(m[1]);
    if (method === 'DELETE') { // a keeper can step away at any time
      const r = await sql`DELETE FROM shares WHERE id = ${sid} AND keeper_id = ${u.id} RETURNING id`;
      return r.length ? json({ ok: true }) : err('Not found.', 404);
    }
    const [r] = await sql`SELECT s.*, o.name AS oname, o.extra_json AS oextra FROM shares s JOIN users o ON o.id = s.owner_id
      WHERE s.id = ${sid} AND s.keeper_id = ${u.id} AND s.status = 'active'`;
    if (!r) return err('Not found.', 404);
    return json(await keeperView(sql, r));
  }

  return err('Not found.', 404);
}

/* ───────────── data ───────────── */
async function loadState(sql, u) {
  const logs = (await sql`SELECT * FROM mood_logs WHERE user_id = ${u.id} ORDER BY logged_at DESC`)
    .map((r) => ({ k: r.mood_key, note: r.note || '', energy: r.energy, t: r.logged_at, tags: loads(r.tags, []) }));
  const journal = {};
  for (const r of await sql`SELECT * FROM journal_entries WHERE user_id = ${u.id}`) journal[r.entry_date] = { text: r.text, u: r.updated_at };
  return {
    logs, journal, gratitude: loads(u.gratitude_json, []), saved: loads(u.saved_json, []), remind: loads(u.remind_json, {}), extra: loads(u.extra_json, {}),
  };
}
function parseTime(text) {
  const d = new Date(String(text));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
async function saveState(sql, u, s) {
  const logs = [];
  for (const l of Array.isArray(s.logs) ? s.logs : []) {
    if (logs.length >= MAX_LOGS) break;
    if (!isObj(l) || !MOODS.has(l.k)) continue;
    const when = parseTime(l.t); if (!when) continue;
    let energy = parseInt(l.energy ?? 5, 10); energy = Number.isNaN(energy) ? 5 : Math.max(1, Math.min(10, energy));
    const tags = Array.isArray(l.tags) ? l.tags.filter((t) => typeof t === 'string' && TAG.test(t)).slice(0, 8) : [];
    logs.push({ user_id: u.id, mood_key: l.k, note: String(l.note || '').slice(0, 500), energy, logged_at: when, tags: JSON.stringify(tags) });
  }
  const entries = [];
  if (isObj(s.journal)) {
    for (const [day, d] of Object.entries(s.journal)) {
      if (entries.length >= MAX_JOURNAL) break;
      if (!DATE.test(day) || !isObj(d)) continue;
      const stamp = parseInt(d.u || 0, 10);
      entries.push({ user_id: u.id, entry_date: day, text: String(d.text || '').slice(0, 20000), updated_at: Number.isNaN(stamp) ? 0 : stamp });
    }
  }
  const extra = {};
  if (isObj(s.extra)) for (const k of EXTRA_KEYS) if (isObj(s.extra[k])) extra[k] = s.extra[k];

  await sql.begin(async (tx) => {
    await tx`DELETE FROM mood_logs WHERE user_id = ${u.id}`;
    if (logs.length) await tx`INSERT INTO mood_logs ${tx(logs, 'user_id', 'mood_key', 'note', 'energy', 'logged_at', 'tags')}`;
    await tx`DELETE FROM journal_entries WHERE user_id = ${u.id}`;
    if (entries.length) await tx`INSERT INTO journal_entries ${tx(entries, 'user_id', 'entry_date', 'text', 'updated_at')}`;
    await tx`UPDATE users SET gratitude_json = ${jsonText(s.gratitude, [], 100000)}, saved_json = ${jsonText(s.saved, [], 100000)},
      remind_json = ${jsonText(s.remind, {}, 2000)}, extra_json = ${jsonText(extra, {}, 60000)} WHERE id = ${u.id}`;
  });
}

/* ───────────── sharing helpers ───────────── */
function scopeOf(raw) {
  const out = { ...DEFAULT_SCOPE };
  if (isObj(raw)) for (const k of SCOPE_KEYS) if (typeof raw[k] === 'boolean') out[k] = raw[k];
  return out;
}
function shareJson(r, keeperName) {
  return {
    id: r.id, label: r.label, status: r.status, scope: scopeOf(loads(r.scope_json, {})), created: r.created_at, accepted: r.accepted_at,
    lastViewed: r.last_viewed_at, views: r.views, keeperName: keeperName ?? null, code: r.status === 'pending' ? r.code : null,
  };
}
async function newCode(sql) {
  for (let i = 0; i < 20; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const c = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    const [hit] = await sql`SELECT 1 FROM shares WHERE code = ${c}`;
    if (!hit) return c;
  }
  throw new Error('could not make a code');
}
// gentle, factual flags for a keeper; logs are newest first
function alertsFor(logs) {
  const out = [];
  if (!logs.length) return out;
  const quiet = Math.floor((Date.now() - new Date(logs[0].t).getTime()) / DAY);
  if (quiet >= 2) out.push({ kind: 'quiet', text: `No check-in for ${quiet} days.` });
  const recent = logs.slice(0, 5);
  if (recent.length >= 3 && recent.filter((l) => HEAVY.has(l.k)).length >= 3) out.push({ kind: 'heavy', text: 'Most of the last few check-ins have felt heavy.' });
  const low = logs.slice(0, 3);
  if (low.length === 3 && low.reduce((a, l) => a + l.energy, 0) / 3 <= 3) out.push({ kind: 'energy', text: 'Energy has been low in the last few check-ins.' });
  return out;
}
function streakOf(days) {
  const d = new Date(); d.setUTCHours(12, 0, 0, 0);
  let n = 0;
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
async function keeperView(sql, r) {
  const sc = scopeOf(loads(r.scope_json, {})), oid = r.owner_id;
  const all = (await sql`SELECT * FROM mood_logs WHERE user_id = ${oid} ORDER BY logged_at DESC`)
    .map((x) => ({ k: x.mood_key, note: x.note || '', energy: x.energy, t: x.logged_at, tags: loads(x.tags, []) }));
  const since = new Date(Date.now() - 90 * DAY).toISOString();
  const logs = [];
  if (sc.moods) {
    for (const l of all) {
      if (l.t < since) continue;
      const item = { k: l.k, energy: l.energy, t: l.t };
      if (sc.tags) item.tags = l.tags;
      if (sc.notes) item.note = l.note;
      logs.push(item);
    }
  }
  const journal = {};
  if (sc.journal) for (const x of await sql`SELECT entry_date, text FROM journal_entries WHERE user_id = ${oid} ORDER BY entry_date DESC LIMIT 30`) journal[x.entry_date] = x.text;
  let daily = null;
  if (sc.daily) {
    const d = loads(r.oextra, {}).daily;
    if (isObj(d) && isObj(d.done)) {
      const tasks = (Array.isArray(d.tasks) ? d.tasks : []).filter((t) => isObj(t) && t.on !== false);
      const done = {};
      for (const [k, v] of Object.entries(d.done).slice(-60)) if (Array.isArray(v) && DATE.test(k)) done[k] = v.length;
      daily = { total: tasks.length, done };
    }
  }
  const days = new Set(all.map((l) => l.t.slice(0, 10)));
  await sql`UPDATE shares SET last_viewed_at = ${nowIso()}, views = views + 1 WHERE id = ${r.id}`;
  return {
    name: r.oname, scope: sc, logs, journal, daily, streak: sc.moods ? streakOf(days) : null, total: sc.moods ? all.length : null,
    alerts: sc.alerts ? alertsFor(all) : [],
  };
}
