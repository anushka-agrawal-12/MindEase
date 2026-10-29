/* MindEase accounts: sign in / sign up, and keep browser data in step with the server.
   Without an account everything still works and stays in this browser. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = MI.esc;
  var K = { logs: 'mindease.logs', journal: 'mindease.journal', ju: 'mindease.journalU', grat: 'mindease.gratitude', saved: 'mindease.saved', remind: 'mindease.remind',
    programs: 'mindease.programs', safety: 'mindease.safety', study: 'mindease.study', prefs: 'mindease.prefs', daily: 'mindease.daily' };
  var EXTRA = ['programs', 'safety', 'study', 'prefs', 'daily'];
  var user = null, applying = false, timer = null, dirty = false;

  /* ---- storage helpers (writes done here do not trigger a new sync) ---- */
  var rawSet = Storage.prototype.setItem;
  function rd(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function wr(k, v) { applying = true; try { rawSet.call(localStorage, k, JSON.stringify(v)); } catch (e) {} applying = false; }
  var WATCH = /^mindease\.(logs|journal|journalU|gratitude|saved|remind|programs|safety|study|prefs|daily)$/;
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (!applying && user && this === window.localStorage && WATCH.test(k)) schedule();
  };

  /* ---- talking to the server ---- */
  function api(method, url, body) {
    return fetch(url, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong.'); e.status = r.status; throw e; } return j; });
      });
  }

  function extraLocal() { var o = {}; EXTRA.forEach(function (k) { var v = rd(K[k], null); if (v && typeof v === 'object') o[k] = v; }); return o; }
  function localState() {
    var logs = rd(K.logs, []).filter(function (l) { return !l.s; });
    var j = rd(K.journal, {}), ju = rd(K.ju, {}), out = {};
    Object.keys(j).forEach(function (d) { out[d] = { text: j[d], u: ju[d] || 0 }; });
    Object.keys(ju).forEach(function (d) { if (!(d in j)) out[d] = { text: '', u: ju[d] }; });
    return {
      logs: logs.map(function (l) { return { k: l.k, note: l.note || '', energy: l.energy, t: l.t, tags: l.tags || [] }; }),
      journal: out, gratitude: rd(K.grat, []), saved: rd(K.saved, []), remind: rd(K.remind, {}), extra: extraLocal()
    };
  }

  /* ---- merge what the server has with what this browser has ---- */
  function merge(srv) {
    var changed = { logs: false, journal: false, saved: false, prefs: false };
    // check-ins: union by time
    var all = rd(K.logs, []), samples = all.filter(function (l) { return l.s; }), seen = {}, merged = [];
    all.filter(function (l) { return !l.s; }).concat((srv.logs || [])
      .map(function (l) { return { k: l.k, note: l.note || '', energy: l.energy, t: l.t, tags: l.tags || [] }; })).forEach(function (l) {
      var ms = Date.parse(l.t); if (isNaN(ms) || seen[ms]) return; seen[ms] = 1; var o = { k: l.k, note: l.note, energy: l.energy, t: l.t, _ms: ms }; if (l.tags && l.tags.length) o.tags = l.tags; merged.push(o);
    });
    merged.sort(function (a, b) { return b._ms - a._ms; });
    merged = merged.slice(0, 200).map(function (l) { var o = { k: l.k, note: l.note, energy: l.energy, t: l.t }; if (l.tags) o.tags = l.tags; return o; });
    var before = all.filter(function (l) { return !l.s; });
    if (JSON.stringify(before) !== JSON.stringify(merged)) { changed.logs = true; MI.logs.set(merged.concat(samples)); }

    // journal: newest edit per day wins
    var j = rd(K.journal, {}), ju = rd(K.ju, {}), sj = srv.journal || {}, nj = {}, nju = {}, jchanged = false;
    var dates = {}; Object.keys(j).forEach(function (d) { dates[d] = 1; }); Object.keys(ju).forEach(function (d) { dates[d] = 1; }); Object.keys(sj).forEach(function (d) { dates[d] = 1; });
    Object.keys(dates).forEach(function (d) {
      var lu = ju[d] || (d in j ? Date.now() : 0), su = sj[d] ? (sj[d].u || 0) : -1, text, u;
      if (su > lu) { text = sj[d].text; u = su; } else { text = d in j ? j[d] : ''; u = lu; }
      if (u) nju[d] = u;
      if (text) nj[d] = text;
      if ((nj[d] || '') !== (j[d] || '')) jchanged = true;
    });
    if (jchanged) { changed.journal = true; }
    wr(K.journal, nj); wr(K.ju, nju);

    // gratitude jar: union
    var g = rd(K.grat, []), sg = srv.gratitude || [], gm = g.slice();
    sg.forEach(function (x) { if (gm.indexOf(x) === -1) gm.push(x); });
    if (gm.length !== g.length) wr(K.grat, gm);

    // saved affirmations: union by value
    var sv = rd(K.saved, []), svs = sv.map(function (x) { return JSON.stringify(x); }), sm = sv.slice();
    (srv.saved || []).forEach(function (x) { if (svs.indexOf(JSON.stringify(x)) === -1) sm.push(x); });
    if (sm.length !== sv.length) { wr(K.saved, sm); changed.saved = true; }

    // reminder settings: use the server's if this browser has none switched on
    var lr = rd(K.remind, {}), sr = srv.remind || {};
    if (!lr.on && sr && Object.keys(sr).length) wr(K.remind, sr);
    // programs, safety plan, study settings, display preferences: newest edit wins
    var se = srv.extra || {};
    EXTRA.forEach(function (k) {
      var lv = rd(K[k], null), sv2 = se[k];
      if (sv2 && typeof sv2 === 'object' && (!lv || (sv2.u || 0) > (lv.u || 0))) { wr(K[k], sv2); if (k === 'prefs') changed.prefs = true; }
    });
    return changed;
  }

  function push() {
    if (!user) return Promise.resolve();
    dirty = false; setStatus('Saving…');
    return api('PUT', '/api/sync', localState()).then(function () { setStatus('Saved'); }, function (e) {
      if (e.status === 401) { user = null; draw(); } else { dirty = true; setStatus('Could not save'); }
    });
  }
  function schedule() { dirty = true; clearTimeout(timer); timer = setTimeout(push, 1500); }
  function fullSync() {
    setStatus('Syncing…');
    return api('GET', '/api/sync').then(function (srv) {
      var c = merge(srv);
      return push().then(function () {
        if (c.saved || c.prefs) { try { if (!sessionStorage.getItem('mi.reloaded')) { sessionStorage.setItem('mi.reloaded', '1'); location.reload(); } } catch (e) {} }
        else { try { sessionStorage.removeItem('mi.reloaded'); } catch (e) {} MI.emit('logs'); }
      });
    }).catch(function (e) { if (e.status === 401) { user = null; draw(); } else setStatus('Could not sync'); });
  }
  window.addEventListener('pagehide', function () {
    if (user && dirty) { try { fetch('/api/sync', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localState()) }); } catch (e) {} }
  });

  /* ---- UI ---- */
  var host = $('#acctHost'), statusTxt = '';
  function setStatus(t) { statusTxt = t; var el = $('#acctStatus'); if (el) el.textContent = t; }
  function initial() { return esc((user.name || '?').charAt(0).toUpperCase()); }

  function draw() {
    MI.userName = user ? user.name : ''; MI.signedIn = !!user; MI.emit('user');
    if (!user) {
      host.innerHTML = '<button class="acct-btn" id="acctIn">Sign in</button>';
      $('#acctIn').onclick = function () { openDialog('in'); };
      return;
    }
    host.innerHTML = '<div class="snd acct"><button class="snd-btn acct-av" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + initial() + '</button>' +
      '<div class="snd-panel glass-solid" hidden><p class="snd-h">' + esc(user.name) + '</p><p class="snd-note" style="margin:-.4rem 0 .8rem">' + esc(user.email) + '</p>' +
      '<p class="snd-note" id="acctStatus">' + esc(statusTxt) + '</p>' +
      '<div class="acct-actions"><button class="btn btn-ghost btn-sm" id="acctSync">Sync now</button><button class="btn btn-ghost btn-sm" id="acctOut">Sign out</button></div>' +
      '<p class="snd-note" style="margin-top:.8rem">Signing out removes your data from this device. It stays saved in your account.</p>' +
      '<button class="acct-del" id="acctDel">Delete account…</button>' +
      '<div id="acctDelBox" hidden><input class="field" type="password" id="acctDelPw" placeholder="Your password" autocomplete="current-password"/><button class="btn btn-ghost btn-sm" id="acctDelGo" style="margin-top:.6rem">Delete everything</button><p class="snd-note" id="acctDelMsg"></p></div></div></div>';
    var btn = $('.acct-av', host), panel = $('.snd-panel', host);
    function open(v) { panel.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    btn.onclick = function (e) { e.stopPropagation(); open(panel.hidden); };
    document.addEventListener('click', function (e) { if (panel.isConnected && !host.contains(e.target)) open(false); });
    $('#acctSync').onclick = function () { fullSync(); };
    $('#acctOut').onclick = signOut;
    $('#acctDel').onclick = function () { $('#acctDelBox').hidden = false; $('#acctDelPw').focus(); };
    $('#acctDelGo').onclick = function () {
      api('POST', '/api/auth/delete', { password: $('#acctDelPw').value }).then(function () { clearLocal(); location.reload(); }, function (e) { $('#acctDelMsg').textContent = e.message; });
    };
  }

  function clearLocal() { applying = true; Object.keys(K).forEach(function (k) { try { localStorage.removeItem(K[k]); } catch (e) {} }); applying = false; user = null; }
  function signOut() {
    clearTimeout(timer);
    (dirty ? push() : Promise.resolve()).then(function () { return api('POST', '/api/auth/logout'); }).catch(function () {}).then(function () { clearLocal(); location.reload(); });
  }

  var dlg = null, mode = 'in';
  function buildDialog() {
    dlg = document.createElement('dialog'); dlg.className = 'acct-dlg glass-solid'; dlg.setAttribute('aria-labelledby', 'acctTitle');
    dlg.innerHTML = '<form method="dialog" id="acctForm" novalidate><div class="acct-head"><h2 id="acctTitle"></h2><button type="button" class="cal-nav" id="acctX" aria-label="Close">×</button></div>' +
      '<p class="muted" id="acctLead"></p>' +
      '<div id="acctNameRow"><label class="lbl" for="acctName">Name <span class="muted">(optional)</span></label><input class="field" id="acctName" autocomplete="name" maxlength="60"/></div>' +
      '<label class="lbl" for="acctEmail">Email</label><input class="field" id="acctEmail" type="email" autocomplete="email" required/>' +
      '<label class="lbl" for="acctPw">Password</label><input class="field" id="acctPw" type="password" autocomplete="current-password" required/>' +
      '<p class="acct-err" id="acctErr" role="alert"></p>' +
      '<button class="btn btn-lamp" id="acctGo" type="submit"></button>' +
      '<p class="acct-swap"><span id="acctSwapTxt"></span> <button type="button" id="acctSwap" class="linkish"></button></p></form>';
    document.body.appendChild(dlg);
    $('#acctX').onclick = function () { dlg.close(); };
    $('#acctSwap').onclick = function () { setMode(mode === 'in' ? 'up' : 'in'); };
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    $('#acctForm').addEventListener('submit', function (e) { e.preventDefault(); submit(); });
  }
  function setMode(m) {
    mode = m; var up = m === 'up';
    $('#acctTitle').textContent = up ? 'Create your account' : 'Welcome back';
    $('#acctLead').textContent = up ? 'Save your check-ins, journal and gratitude jar so they follow you. What is already on this device will be added to your account.' : 'Sign in to load your saved check-ins and journal.';
    $('#acctNameRow').hidden = !up; $('#acctGo').textContent = up ? 'Create account' : 'Sign in';
    $('#acctSwapTxt').textContent = up ? 'Already have an account?' : 'New here?'; $('#acctSwap').textContent = up ? 'Sign in' : 'Create an account';
    $('#acctPw').autocomplete = up ? 'new-password' : 'current-password'; $('#acctErr').textContent = '';
  }
  function openDialog(m) { if (!dlg) buildDialog(); setMode(m); dlg.showModal(); $('#acctEmail').focus(); }
  function submit() {
    var up = mode === 'up', go = $('#acctGo'), err = $('#acctErr');
    var body = { email: $('#acctEmail').value, password: $('#acctPw').value, name: $('#acctName').value };
    if (!body.email || !body.password) { err.textContent = 'Please fill in your email and password.'; return; }
    go.disabled = true; err.textContent = '';
    api('POST', up ? '/api/auth/register' : '/api/auth/login', body).then(function (u) {
      user = u; dlg.close(); $('#acctPw').value = ''; draw(); MI.toast(up ? 'Account created. Your data is saved.' : 'Signed in. Welcome back.'); MI.sound.sfx('save');
      fullSync();
    }).catch(function (e) {
      err.textContent = e.status ? e.message : 'Could not reach MindEase. Is the app running?';
    }).then(function () { go.disabled = false; });
  }

  /* ---- start ---- */
  draw();
  api('GET', '/api/auth/me').then(function (u) { if (u && u.signedIn) { user = u; draw(); fullSync(); } }).catch(function () {});
  if (MI.start) MI.start();
})();
