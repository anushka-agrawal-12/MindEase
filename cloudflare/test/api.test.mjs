// Run: DATABASE_URL=postgresql://... npm test   (this WIPES the MindEase tables in that database)
import test from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import worker from '../worker.js';

const DB = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5433/mindease';
const env = { DATABASE_URL: DB, SESSION_SECRET: 'test-secret-test-secret-test-secret' };
const pending = [];
const ctx = { waitUntil: (p) => pending.push(p) };

class Client {
  constructor(ip = '1.1.1.1') { this.cookie = ''; this.ip = ip; }
  async call(method, path, body, raw) {
    const headers = { 'cf-connecting-ip': this.ip };
    if (this.cookie) headers.cookie = this.cookie;
    let payload;
    if (raw) { payload = raw; headers['content-type'] = 'application/x-www-form-urlencoded'; headers['content-length'] = String(raw.length); }
    else if (body !== undefined) { payload = JSON.stringify(body); headers['content-type'] = 'application/json'; headers['content-length'] = String(payload.length); }
    const res = await worker.fetch(new Request('https://mindease.test' + path, { method, headers, body: payload }), env, ctx);
    const sc = res.headers.get('set-cookie');
    if (sc) this.cookie = sc.startsWith('mi_session=;') ? '' : sc.split(';')[0];
    let data = null; try { data = await res.clone().json(); } catch {}
    return { status: res.status, data, headers: res.headers };
  }
  get(p) { return this.call('GET', p); }
  post(p, b = {}) { return this.call('POST', p, b); }
  put(p, b = {}) { return this.call('PUT', p, b); }
  del(p) { return this.call('DELETE', p); }
}
const signup = async (c, email, name = 'Test') => {
  const r = await c.post('/api/auth/register', { email, password: 'password123', name });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r;
};

test.beforeEach(async () => {
  const sql = postgres(DB, { max: 1, onnotice() {} });
  await sql`TRUNCATE shares, journal_entries, mood_logs, users, auth_attempts RESTART IDENTITY CASCADE`;
  await sql.end();
});
test.after(async () => { await Promise.all(pending); });

test('auth flow', async () => {
  const c = new Client();
  assert.deepEqual((await c.get('/api/auth/me')).data, { signedIn: false });
  assert.equal((await c.post('/api/auth/register', { email: 'bad', password: 'password123' })).status, 400);
  assert.equal((await c.post('/api/auth/register', { email: 'a@b.co', password: 'short' })).status, 400);
  await signup(c, 'a@b.co', 'Asha');
  assert.equal((await c.get('/api/auth/me')).data.name, 'Asha');
  assert.equal((await new Client('2.2.2.2').post('/api/auth/register', { email: 'A@b.co', password: 'password123' })).status, 400); // duplicate, case-insensitive
  await c.post('/api/auth/logout');
  assert.equal((await c.get('/api/auth/me')).data.signedIn, false);
  assert.equal((await c.post('/api/auth/login', { email: 'a@b.co', password: 'nope' })).status, 401);
  assert.equal((await c.post('/api/auth/login', { email: 'a@b.co', password: 'password123' })).status, 200);
});

test('login rate limit and tampered cookie', async () => {
  const c = new Client('3.3.3.3');
  await signup(c, 'a@b.co');
  await c.post('/api/auth/logout');
  let last;
  for (let i = 0; i < 9; i++) last = (await c.post('/api/auth/login', { email: 'a@b.co', password: 'x' })).status;
  assert.equal(last, 429);
  const t = new Client('4.4.4.4'); t.cookie = 'mi_session=eyJ1aWQiOjEsImV4cCI6OTk5OTk5OTk5OTk5OX0.AAAA';
  assert.equal((await t.get('/api/sync')).status, 401); // forged cookie
});

test('writes need json', async () => {
  const r = await new Client().call('POST', '/api/auth/login', undefined, 'email=a');
  assert.equal(r.status, 415);
});

test('sync roundtrip and validation', async () => {
  const c = new Client();
  assert.equal((await c.get('/api/sync')).status, 401);
  await signup(c, 'a@b.co');
  const state = {
    logs: [{ k: 'calm', note: 'ok', energy: 7, t: '2026-10-29T10:00:00.123Z', tags: ['sleep', 'BAD TAG'] }, { k: 'not-a-mood', energy: 3, t: '2026-10-29T10:00:00Z' }],
    journal: { '2026-10-29': { text: 'hello', u: 5 }, nope: { text: 'x' } },
    gratitude: ['chai'], saved: [1], remind: { on: true },
    extra: { daily: { tasks: [], done: {} }, evil: { x: 1 } },
  };
  assert.equal((await c.put('/api/sync', state)).status, 200);
  const got = (await c.get('/api/sync')).data;
  assert.equal(got.logs.length, 1);
  assert.deepEqual(got.logs[0].tags, ['sleep']);
  assert.equal(got.logs[0].t, '2026-10-29T10:00:00.123Z'); // time comes back exactly as the browser sent it
  assert.deepEqual(Object.keys(got.journal), ['2026-10-29']);
  assert.equal(got.journal['2026-10-29'].u, 5);
  assert.ok(!('evil' in got.extra) && 'daily' in got.extra);
  assert.deepEqual(got.gratitude, ['chai']);
  assert.equal((await c.put('/api/sync', { logs: [] })).status, 200); // replacing with empty works
  assert.equal((await c.get('/api/sync')).data.logs.length, 0);
});

test('export and delete account', async () => {
  const c = new Client();
  await signup(c, 'a@b.co', 'Asha');
  const r = await c.get('/api/export');
  assert.equal(r.data.email, 'a@b.co');
  assert.match(r.headers.get('content-disposition'), /attachment/);
  assert.equal((await c.post('/api/auth/delete', { password: 'wrong' })).status, 400);
  assert.equal((await c.post('/api/auth/delete', { password: 'password123' })).status, 200);
  assert.equal((await c.post('/api/auth/login', { email: 'a@b.co', password: 'password123' })).status, 401);
});

test('health, headers, unknown routes', async () => {
  const c = new Client();
  const h = await c.get('/healthz');
  assert.equal(h.status, 200);
  assert.equal(h.headers.get('cache-control'), 'no-store');
  assert.equal((await c.get('/api/nothing')).status, 404);
});

const log = (k, t, extra = {}) => ({ k, energy: 5, t, note: 'n', ...extra });

test('sharing: consent, scope, revoke', async () => {
  const owner = new Client('5.5.5.5'), keeper = new Client('6.6.6.6'), stranger = new Client('7.7.7.7');
  await signup(owner, 'o@x.co', 'Owner'); await signup(keeper, 'k@x.co', 'Keeper'); await signup(stranger, 's@x.co', 'Stranger');
  await owner.put('/api/sync', { logs: [log('sad', '2026-10-29T10:00:00Z', { note: 'private note' }), log('anxious', '2026-10-28T10:00:00Z'), log('overwhelmed', '2026-10-27T10:00:00Z')], journal: { '2026-10-29': { text: 'dear diary', u: 1 } } });
  const { code } = (await owner.post('/api/share/invite', { label: 'K' })).data;
  assert.match(code, /^[A-Z2-9]{8}$/);
  assert.deepEqual((await keeper.get('/api/keeper/people')).data.people, []);
  assert.equal((await owner.post('/api/share/accept', { code })).status, 400);       // own code
  assert.equal((await keeper.post('/api/share/accept', { code: 'WRONGCDE' })).status, 400);
  assert.equal((await keeper.post('/api/share/accept', { code: code.slice(0, 4) + '-' + code.slice(4).toLowerCase() })).status, 200); // dash + case ok
  assert.equal((await stranger.post('/api/share/accept', { code })).status, 400);    // single use
  const sid = (await keeper.get('/api/keeper/people')).data.people[0].id;
  let v = (await keeper.get(`/api/keeper/${sid}`)).data;
  assert.equal(v.name, 'Owner'); assert.equal(v.logs.length, 3);
  assert.ok(!('note' in v.logs[0])); assert.deepEqual(v.journal, {});               // private by default
  assert.ok(v.alerts.some((a) => a.kind === 'heavy'));
  assert.equal((await stranger.get(`/api/keeper/${sid}`)).status, 404);
  assert.equal((await owner.put(`/api/share/${sid}`, { scope: { notes: true, journal: true } })).status, 200);
  v = (await keeper.get(`/api/keeper/${sid}`)).data;
  assert.equal(v.logs[0].note, 'private note'); assert.ok('2026-10-29' in v.journal);
  assert.ok((await owner.get('/api/share/mine')).data.shares[0].views >= 2);
  assert.equal((await stranger.put(`/api/share/${sid}`, { scope: { moods: false } })).status, 404);
  await owner.put(`/api/share/${sid}`, { scope: { moods: false } });
  assert.deepEqual((await keeper.get(`/api/keeper/${sid}`)).data.logs, []);
  assert.equal((await owner.del(`/api/share/${sid}`)).status, 200);
  assert.equal((await keeper.get(`/api/keeper/${sid}`)).status, 404);
});

test('keeper is read-only and can leave; deleting the owner removes shares', async () => {
  const owner = new Client('8.8.8.8'), keeper = new Client('9.9.9.9');
  await signup(owner, 'o@x.co'); await signup(keeper, 'k@x.co');
  const { code } = (await owner.post('/api/share/invite', {})).data;
  await keeper.post('/api/share/accept', { code });
  const sid = (await keeper.get('/api/keeper/people')).data.people[0].id;
  assert.equal((await keeper.put(`/api/share/${sid}`, { scope: { moods: false } })).status, 404);
  assert.equal((await keeper.del(`/api/share/${sid}`)).status, 404);
  assert.equal((await keeper.del(`/api/keeper/${sid}`)).status, 200);
  assert.deepEqual((await owner.get('/api/share/mine')).data.shares, []);
  const { code: c2 } = (await owner.post('/api/share/invite', {})).data;
  await keeper.post('/api/share/accept', { code: c2 });
  await owner.post('/api/auth/delete', { password: 'password123' });
  assert.deepEqual((await keeper.get('/api/keeper/people')).data.people, []);
});

test('invite limit and daily plan visible to keeper', async () => {
  const owner = new Client('10.0.0.1'), keeper = new Client('10.0.0.2');
  await signup(owner, 'o@x.co'); await signup(keeper, 'k@x.co');
  await owner.put('/api/sync', { extra: { daily: { tasks: [{ id: 'a', on: true }, { id: 'b', on: true }, { id: 'c', on: false }], done: { '2026-10-29': ['a'] } } } });
  const { code } = (await owner.post('/api/share/invite', {})).data;
  await keeper.post('/api/share/accept', { code });
  const sid = (await keeper.get('/api/keeper/people')).data.people[0].id;
  const v = (await keeper.get(`/api/keeper/${sid}`)).data;
  assert.deepEqual(v.daily, { total: 2, done: { '2026-10-29': 1 } });
  for (let i = 0; i < 4; i++) assert.equal((await owner.post('/api/share/invite', {})).status, 200);
  assert.equal((await owner.post('/api/share/invite', {})).status, 400); // 5 max
});
