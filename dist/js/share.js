/* MindEase sharing: you choose a keeper (partner, friend, family) and exactly what they can see.
   Keepers get a read-only view. You can stop sharing at any time. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = MI.esc;

  function api(method, url, body) {
    var o = { method: method, headers: {}, credentials: 'same-origin' };
    if (body !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    return fetch(url, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong.'); e.status = r.status; throw e; } return j; });
    });
  }
  function signInPrompt(what) {
    return '<div class="glass pad"><h2>Sign in first</h2><p class="muted" style="margin:.5rem 0 1rem">' + what + '</p><button class="btn btn-lamp" data-signin>Sign in or create an account</button></div>';
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-signin]')) { var b = $('#acctIn'); if (b) b.click(); } });
  function ago(iso) {
    var m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 2) return 'just now'; if (m < 60) return m + ' minutes ago'; var h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
  }
  function fmtCode(c) { return c ? c.slice(0, 4) + '-' + c.slice(4) : ''; }

  var SCOPES = [
    ['moods', 'Moods and energy', 'How you felt and when. This is the heart of it.'],
    ['tags', 'What is behind it', 'Tags like Sleep or Exams.'],
    ['notes', 'Your check-in notes', 'The short note you can add to a check-in.'],
    ['journal', 'Journal entries', 'Off unless you choose it. Most people keep this private.'],
    ['daily', 'Daily plan progress', 'Whether you finished your daily tasks.'],
    ['alerts', 'Gentle heads-up', 'Lets them know after several heavy check-ins or a few quiet days.']
  ];
  function sw(id, key, on, label, hint, extra) {
    return '<label class="sh-sw"><input type="checkbox" ' + extra + ' data-k="' + key + '"' + (on ? ' checked' : '') + '/><span><b>' + label + '</b><small class="muted">' + hint + '</small></span></label>';
  }

  /* ═════════ owner: My space → Sharing ═════════ */
  function renderSharing() {
    var host = $('#x-sharing'); if (!host) return;
    if (!MI.signedIn) { host.innerHTML = signInPrompt('Sharing needs an account, so your keeper can see your updates on their own phone.'); return; }
    host.innerHTML = '<p class="muted">Loading…</p>';
    api('GET', '/api/share/mine').then(function (r) { draw(host, r.shares); }).catch(function (e) { host.innerHTML = '<div class="glass pad"><p>' + esc(e.message) + '</p></div>'; });
  }
  function draw(host, shares) {
    var h = '<div class="glass pad"><h2>Let someone keep an eye on you</h2><p class="muted" style="margin:.5rem 0 0">Pick a person you trust, like a partner, a friend or family. They get a read-only view on their own phone. ' +
      'You decide what they see, you can see when they looked, and you can stop at any time. Your safety plan, settings and gratitude jar are never shared.</p></div>';
    shares.forEach(function (s) {
      var who = s.keeperName ? esc(s.keeperName) : (s.label ? esc(s.label) : 'Invite');
      h += '<div class="glass pad sh-card" data-id="' + s.id + '"><div class="sh-head"><div><h3>' + who + (s.label && s.keeperName ? ' <span class="muted">(' + esc(s.label) + ')</span>' : '') + '</h3>' +
        '<p class="small muted">' + (s.status === 'pending' ? 'Waiting for them to join' : 'Looking after you since ' + new Date(s.accepted).toLocaleDateString([], { month: 'short', day: 'numeric' }) + (s.lastViewed ? ' · last looked ' + ago(s.lastViewed) : ' · has not looked yet')) + '</p></div>' +
        '<button class="btn btn-ghost btn-sm" data-stop>Stop sharing</button></div>';
      if (s.status === 'pending') h += '<div class="sh-code"><span class="sh-code-t" aria-label="Invite code">' + fmtCode(s.code) + '</span><button class="btn btn-lamp btn-sm" data-copy="' + s.code + '">Copy invite</button></div><p class="small muted">The code works once and expires in 7 days.</p>';
      h += '<div class="sh-sws">' + SCOPES.map(function (x) { return sw(s.id, x[0], s.scope[x[0]], x[1], x[2], 'data-id="' + s.id + '"'); }).join('') + '</div></div>';
    });
    h += '<div class="glass pad" id="shNew"><h3>Invite someone</h3><label class="lbl" for="shLabel" style="margin-top:.8rem">Who is it? <span class="muted">(just for you)</span></label><input class="field" id="shLabel" maxlength="40" placeholder="e.g. Riya" style="max-width:320px"/>' +
      '<div class="sh-sws" style="margin-top:1rem">' + SCOPES.map(function (x) { return sw('n', x[0], { moods: 1, tags: 1, daily: 1, alerts: 1 }[x[0]], x[1], x[2], 'data-new'); }).join('') + '</div>' +
      '<div style="margin-top:1rem"><button class="btn btn-lamp" id="shMake">Create invite code</button> <span id="shErr" class="small" role="alert"></span></div></div>';
    host.innerHTML = h;
  }
  function inviteText(code) {
    return 'I would like you to keep an eye on how I am doing in MindEase. Open ' + location.origin + '/app , sign in, choose Keeper, and enter this code: ' + fmtCode(code) + ' (it expires in 7 days).';
  }
  document.addEventListener('click', function (e) {
    var host = $('#x-sharing'); if (!host || !host.contains(e.target)) return;
    var copy = e.target.closest('[data-copy]');
    if (copy) {
      var t = inviteText(copy.dataset.copy);
      if (navigator.share) navigator.share({ title: 'MindEase invite', text: t }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { MI.toast('Invite copied. Send it to them.'); }, function () { MI.toast('Could not copy'); });
      return;
    }
    if (e.target.id === 'shMake') {
      var scope = {}; host.querySelectorAll('#shNew [data-new]').forEach(function (i) { scope[i.dataset.k] = i.checked; });
      api('POST', '/api/share/invite', { label: $('#shLabel').value, scope: scope }).then(function () { MI.sound.sfx('save'); renderSharing(); }).catch(function (er) { $('#shErr').textContent = er.message; });
      return;
    }
    var stop = e.target.closest('[data-stop]');
    if (stop) {
      if (!stop.dataset.armed) { stop.dataset.armed = '1'; stop.textContent = 'Tap again to confirm'; setTimeout(function () { stop.dataset.armed = ''; stop.textContent = 'Stop sharing'; }, 3000); return; }
      api('DELETE', '/api/share/' + stop.closest('.sh-card').dataset.id).then(function () { MI.toast('Sharing stopped. They can no longer see anything.'); renderSharing(); });
    }
  });
  document.addEventListener('change', function (e) {
    var i = e.target; if (!i.matches || !i.matches('#x-sharing [data-id]')) return;
    var o = {}; o[i.dataset.k] = i.checked;
    api('PUT', '/api/share/' + i.dataset.id, { scope: o }).then(function () { MI.toast('Updated'); }).catch(function (er) { MI.toast(er.message); i.checked = !i.checked; });
  });

  /* ═════════ keeper: the Keeper page ═════════ */
  var cur = null, poll = null;
  function renderKeeper() {
    var host = $('#keeperBody'); if (!host) return;
    clearInterval(poll); cur = null;
    if (!MI.signedIn) { host.innerHTML = signInPrompt('Sign in with your own account to look after someone. You will see only what they choose to share.'); return; }
    api('GET', '/api/keeper/people').then(function (r) { people(host, r.people); poll = setInterval(function () { if ($('#page-keeper').classList.contains('active') && !cur) renderKeeper(); }, 60000); })
      .catch(function (e) { host.innerHTML = '<div class="glass pad"><p>' + esc(e.message) + '</p></div>'; });
  }
  function people(host, list) {
    var h = '<div class="glass pad"><h3>Join with a code</h3><p class="muted" style="margin:.4rem 0 .8rem">Someone you care about can invite you from My space → Sharing.</p><div class="plan-add"><label class="sr" for="kCode">Invite code</label><input class="field" id="kCode" maxlength="9" autocomplete="off" placeholder="ABCD-EFGH" style="max-width:220px;text-transform:uppercase"/><button class="btn btn-lamp" id="kJoin">Join</button></div><p class="small" id="kErr" role="alert"></p></div>';
    if (!list.length) h += '<div class="glass pad"><p class="muted">You are not looking after anyone yet.</p></div>';
    list.forEach(function (p) {
      h += '<button class="glass pad k-card" data-open="' + p.id + '"><span class="k-face">' + (p.lastMood ? MI.face(p.lastMood, { halo: false }) : '') + '</span><span class="k-main"><b>' + esc(p.name) + '</b><small class="muted">' + (p.lastCheckin ? 'Last check-in ' + ago(p.lastCheckin) : 'No check-ins shared yet') + '</small>' +
        (p.alerts.length ? '<span class="k-alerts">' + p.alerts.map(function (a) { return '<i>' + esc(a.text) + '</i>'; }).join('') + '</span>' : '') + '</span><span aria-hidden="true">›</span></button>';
    });
    host.innerHTML = h;
  }
  function detail(id) {
    var host = $('#keeperBody'); cur = id;
    api('GET', '/api/keeper/' + id).then(function (d) {
      var sc = d.scope, h = '<button class="btn btn-ghost btn-sm" id="kBack">← Everyone</button><div class="page-head" style="margin:1rem 0 1.2rem"><h2 class="display" style="font-size:2rem">' + esc(d.name) + '</h2><p class="muted">You see only what ' + esc(d.name) + ' chose to share with you.</p></div>';
      if (d.alerts.length) h += '<div class="glass pad k-warn"><b>Worth a gentle check-in</b><ul>' + d.alerts.map(function (a) { return '<li>' + esc(a.text) + '</li>'; }).join('') + '</ul><p class="small">A kind message or call can mean a lot. <a href="#help" data-go="help" style="color:var(--accent);font-weight:700">Ideas for what to say, and where to get help</a></p></div>';
      if (sc.moods) {
        var by = {}; d.logs.forEach(function (l) { var k = l.t.slice(0, 10); if (!by[k]) by[k] = l; });
        var strip = '', i; for (i = 29; i >= 0; i--) { var dt = new Date(); dt.setDate(dt.getDate() - i); var k = MI.ymd(dt), l = by[k];
          strip += '<span class="k-day' + (l ? ' on' : '') + '" style="' + (l ? 'background:' + MI.get(l.k).color : '') + '" title="' + k + (l ? ': ' + MI.get(l.k).label : ': no check-in') + '"></span>'; }
        h += '<div class="glass pad"><div class="stats" style="margin:0 0 1rem"><div class="stat"><b>' + d.streak + '</b><span>day streak</span></div><div class="stat"><b>' + d.total + '</b><span>check-ins</span></div></div><span class="lbl">Last 30 days</span><div class="k-strip" role="img" aria-label="Mood by day for the last 30 days">' + strip + '</div></div>';
        h += '<div class="glass pad"><span class="lbl">Recent check-ins</span><div class="entries">' + (d.logs.slice(0, 12).map(function (l) {
          return '<div class="entry">' + MI.face(l.k, { halo: false }) + '<div><b>' + MI.get(l.k).label + '</b>' + (l.note ? ' <span class="muted">— ' + esc(l.note) + '</span>' : '') + '<small>Energy ' + l.energy + ' of 10 · ' + ago(l.t) + '</small>' +
            (l.tags && l.tags.length ? '<span class="tagmini">' + l.tags.map(function (t) { return '<i>' + esc(MI.tagName(t)) + '</i>'; }).join('') + '</span>' : '') + '</div></div>'; }).join('') || '<p class="muted">Nothing yet.</p>') + '</div></div>';
      }
      if (d.daily) {
        var rows = '', j; for (j = 13; j >= 0; j--) { var dd = new Date(); dd.setDate(dd.getDate() - j); var kk = MI.ymd(dd), n = d.daily.done[kk] || 0;
          rows += '<span class="k-day' + (n ? ' on' : '') + (d.daily.total && n >= d.daily.total ? ' full' : '') + '" title="' + kk + ': ' + n + ' of ' + d.daily.total + '"></span>'; }
        h += '<div class="glass pad"><span class="lbl">Daily plan, last 14 days</span><div class="k-strip small">' + rows + '</div><p class="small muted">Brighter means more of the day\'s tasks done.</p></div>';
      }
      var jk = Object.keys(d.journal || {});
      if (sc.journal) h += '<div class="glass pad"><span class="lbl">Journal</span>' + (jk.length ? jk.slice(0, 5).map(function (k) { return '<div class="jr-item"><b>' + new Date(k + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }) + '</b><p>' + esc(d.journal[k].slice(0, 300)) + '</p></div>'; }).join('') : '<p class="muted">No entries yet.</p>') + '</div>';
      h += '<div class="glass pad"><button class="btn btn-ghost btn-sm" id="kLeave">Stop looking after ' + esc(d.name) + '</button></div>';
      host.innerHTML = h; window.scrollTo(0, 0);
      clearInterval(poll); poll = setInterval(function () { if ($('#page-keeper').classList.contains('active') && cur === id) detail(id); }, 60000);
    }).catch(function (e) { host.innerHTML = '<div class="glass pad"><p>' + esc(e.message) + '</p></div>'; cur = null; });
  }
  document.addEventListener('click', function (e) {
    var host = $('#keeperBody'); if (!host || !host.contains(e.target)) return;
    var o = e.target.closest('[data-open]'); if (o) { detail(+o.dataset.open); return; }
    if (e.target.id === 'kBack') { renderKeeper(); return; }
    if (e.target.id === 'kJoin') {
      api('POST', '/api/share/accept', { code: $('#kCode').value }).then(function () { MI.sound.sfx('save'); MI.toast('You are now looking after them.'); renderKeeper(); }).catch(function (er) { $('#kErr').textContent = er.message; });
      return;
    }
    if (e.target.id === 'kLeave') {
      var b = e.target; if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Tap again to confirm'; setTimeout(function () { b.dataset.armed = ''; }, 3000); return; }
      api('DELETE', '/api/keeper/' + cur).then(function () { renderKeeper(); });
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'kCode') $('#kJoin').click(); });

  MI.on('page', function (id) { if (id === 'keeper') renderKeeper(); else { clearInterval(poll); } });
  MI.on('user', function () { if ($('#page-keeper') && $('#page-keeper').classList.contains('active')) renderKeeper(); var c = $('#yseg .chip[data-p="sharing"].on'); if (c) renderSharing(); });

  /* add "Sharing" to My space */
  var c = document.createElement('button'); c.className = 'chip'; c.dataset.p = 'sharing'; c.textContent = 'Sharing';
  $('#yseg').insertBefore(c, $('#yseg .chip[data-p="remind"]'));
  var p = document.createElement('div'); p.className = 'panel'; p.id = 'yp-sharing'; p.innerHTML = '<div id="x-sharing"></div>'; $('#page-you').appendChild(p);
  MI.subs = MI.subs || {}; MI.subs.sharing = renderSharing;
})();
