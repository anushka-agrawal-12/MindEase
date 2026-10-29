/* MindEase "You" tab: insights, calendar, journal, reminders. All data stays in this browser. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = MI.esc;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DOWFULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function dow(d) { return (d.getDay() + 6) % 7; } // Monday = 0
  function logs() { return MI.logs.get(); }
  function day(l) { return MI.ymd(new Date(l.t)); }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

  /* ───── sub tabs ───── */
  $('#yseg').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    $$('#yseg .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    $$('#page-you .panel').forEach(function (p) { p.classList.toggle('active', p.id === 'yp-' + b.dataset.p); });
    render();
  });
  function activeSub() { var c = $('#yseg .chip.on'); return c ? c.dataset.p : 'insights'; }
  function render() {
    var s = activeSub();
    if (s === 'insights') renderInsights(); else if (s === 'calendar') renderCal(); else if (s === 'journal') renderJournal(); else if (s === 'remind') renderRemind(); else if (MI.subs && MI.subs[s]) MI.subs[s]();
  }
  MI.on('you-open', render);
  MI.on('logs', function () { if ($('#page-you').classList.contains('active')) render(); checkNudge(); });

  /* ───── insights ───── */
  function sampleData() {
    var keys = ['neutral', 'calm', 'tired', 'anxious', 'calm', 'happy', 'grateful', 'neutral', 'sad', 'tired', 'calm', 'happy', 'veryhappy', 'calm', 'anxious', 'overwhelmed', 'tired', 'neutral', 'calm', 'happy', 'grateful'];
    var out = [], i;
    for (i = 20; i >= 0; i--) {
      var d = new Date(); d.setHours(19, 30, 0, 0); d.setDate(d.getDate() - i);
      var k = keys[20 - i], m = MI.get(k), en = Math.max(1, Math.min(10, Math.round(m.v * 1.5 + 1.8 + ((i * 7) % 3) - 1)));
      var TG = { tired: ['sleep'], anxious: ['exams'], overwhelmed: ['exams', 'studies'], happy: ['exercise'], calm: i % 2 ? ['exercise'] : [], grateful: ['friends'], veryhappy: ['friends'], sad: ['family'], neutral: [] };
      var entry = { k: k, note: '', energy: en, t: d.toISOString(), s: 1 }; if (TG[k] && TG[k].length) entry.tags = TG[k];
      out.unshift(entry);
    }
    return out;
  }
  function renderInsights() {
    var all = logs(), real = all.filter(function (l) { return !l.s; }), hasSample = all.length !== real.length;
    var host = $('#insBody');
    var tools = '<div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1.2rem;justify-content:flex-start">' +
      (hasSample ? '<button class="btn btn-ghost btn-sm" id="insClear">Clear sample data</button>' : (all.length < 5 ? '<button class="btn btn-ghost btn-sm" id="insSample">Try with sample data</button>' : '')) + '</div>';
    if (all.length < 3) {
      host.innerHTML = '<div class="glass pad"><h2 class="display" style="font-size:1.6rem;margin-bottom:.4rem">Not enough yet</h2><p class="muted">After a few check-ins, patterns will show up here. You can also peek at how it looks with sample data.</p>' + tools + '</div>';
      bindIns(); return;
    }
    // most common mood
    var count = {}; all.forEach(function (l) { count[l.k] = (count[l.k] || 0) + 1; });
    var top = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; })[0];
    // best weekday by average valence
    var by = {}; all.forEach(function (l) { var w = dow(new Date(l.t)); (by[w] = by[w] || []).push(MI.get(l.k).v); });
    var wk = Object.keys(by).map(function (w) { return { w: +w, v: avg(by[w]), n: by[w].length }; });
    var bestW = wk.length >= 2 ? wk.sort(function (a, b) { return b.v - a.v; })[0] : null;
    var enAvg = avg(all.map(function (l) { return l.energy; }));

    var cards = '<div class="ins-grid">' +
      '<div class="glass ins">' + MI.face(top, { halo: false }) + '<b>' + MI.get(top).label + '</b><span>most common mood</span></div>' +
      '<div class="glass ins"><b style="margin-top:1.1rem">' + (bestW ? DOWFULL[bestW.w] : 'Not clear yet') + '</b><span>' + (bestW ? 'tends to feel best' : 'needs more days') + '</span></div>' +
      '<div class="glass ins"><b style="margin-top:1.1rem">' + enAvg.toFixed(1) + ' / 10</b><span>average energy</span></div></div>';

    // 14-day trend
    var W = 560, H = 190, padL = 28, padB = 26, pts = [], i;
    for (i = 13; i >= 0; i--) {
      var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
      var ds = MI.ymd(d), these = all.filter(function (l) { return day(l) === ds; });
      pts.push({ d: d, v: these.length ? avg(these.map(function (l) { return MI.get(l.k).v; })) : null, k: these.length ? these[0].k : null });
    }
    function X(j) { return padL + j * ((W - padL - 12) / 13); }
    function Y(v) { return 12 + (5 - v) / 4 * (H - padB - 24); }
    var line = '', seg = [];
    pts.forEach(function (p, j) {
      if (p.v == null) { if (seg.length > 1) line += '<polyline points="' + seg.join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'; seg = []; return; }
      seg.push(X(j).toFixed(1) + ',' + Y(p.v).toFixed(1));
    });
    if (seg.length > 1) line += '<polyline points="' + seg.join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    var dots = pts.map(function (p, j) { return p.v == null ? '' : '<circle cx="' + X(j).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="6" fill="' + MI.get(p.k).color + '" stroke="#2A2035" stroke-width="2"><title>' + p.d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ': ' + MI.get(p.k).label + '</title></circle>'; }).join('');
    var lbls = pts.map(function (p, j) { return j % 2 ? '' : '<text x="' + X(j).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" fill="#cdbfdc" font-size="11">' + p.d.getDate() + '</text>'; }).join('');
    var grid = [1, 3, 5].map(function (v) { return '<line x1="' + padL + '" x2="' + (W - 8) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="rgba(255,241,220,.12)"/><text x="4" y="' + (Y(v) + 4).toFixed(1) + '" fill="#cdbfdc" font-size="11">' + (v === 5 ? 'high' : v === 1 ? 'low' : '') + '</text>'; }).join('');
    var trend = '<div class="glass pad"><span class="lbl">Mood over the last 14 days</span><svg class="trend" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Line chart of mood over the last 14 days">' + grid + line + dots + lbls + '</svg></div>';

    // energy by mood
    var em = {}; all.forEach(function (l) { (em[l.k] = em[l.k] || []).push(l.energy); });
    var rows = Object.keys(em).sort(function (a, b) { return MI.get(b).v - MI.get(a).v; }).map(function (k) {
      var a = avg(em[k]);
      return '<div class="ebar"><span>' + MI.get(k).label + '</span><div class="ebar-t"><i style="width:' + (a * 10) + '%;background:' + MI.get(k).color + '"></i></div><b>' + a.toFixed(1) + '</b></div>';
    }).join('');
    // gentle correlation wording
    var line2 = 'Not enough check-ins yet to say how your energy and mood relate.';
    if (all.length >= 8) {
      var xs = all.map(function (l) { return l.energy; }), ys = all.map(function (l) { return MI.get(l.k).v; }), mx = avg(xs), my = avg(ys), sxy = 0, sxx = 0, syy = 0;
      xs.forEach(function (x, j) { sxy += (x - mx) * (ys[j] - my); sxx += (x - mx) * (x - mx); syy += (ys[j] - my) * (ys[j] - my); });
      var r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
      line2 = r > 0.4 ? 'So far, higher energy tends to go along with a better mood for you.' : r < -0.4 ? 'So far, your energy and mood seem to move in opposite directions. That can happen, and it is worth noticing.' : 'So far there is no clear link between your energy and your mood.';
    }
    var en = '<div class="glass pad"><span class="lbl">Average energy by mood</span>' + rows + '<p class="note-line">' + line2 + '</p></div>';
    host.innerHTML = cards + '<div class="ins-two">' + trend + en + '</div>' + tagInsights(all) + '<p class="small muted" style="margin-top:1rem">These are patterns in what you logged, not a diagnosis. ' + (hasSample ? 'You are looking at sample data.' : '') + '</p>' + tools;
    bindIns();
  }
  // which tags go along with better or harder moods (a pattern, not a cause)
  function tagInsights(all) {
    var tagged = all.filter(function (l) { return l.tags && l.tags.length; });
    if (all.length < 6 || tagged.length < 3) return '<div class="glass pad" style="margin-top:1.1rem"><span class="lbl">What goes with your moods</span><p class="muted">Add tags like Sleep or Exams when you check in. After a few, you will see which ones go with better or harder days.</p></div>';
    var overall = avg(all.map(function (l) { return MI.get(l.k).v; })), rows = [];
    MI.TAGS.forEach(function (t) {
      var withT = all.filter(function (l) { return l.tags && l.tags.indexOf(t[0]) > -1; });
      if (withT.length < 3) return;
      rows.push({ name: t[1], n: withT.length, diff: avg(withT.map(function (l) { return MI.get(l.k).v; })) - overall });
    });
    rows.sort(function (a, b) { return b.diff - a.diff; });
    var ups = rows.filter(function (r) { return r.diff >= 0.4; }).slice(0, 3), downs = rows.filter(function (r) { return r.diff <= -0.4; }).reverse().slice(0, 3);
    function li(r) { return '<li><b>' + esc(r.name) + '</b> <span class="muted">(' + r.n + ' check-ins, ' + (r.diff > 0 ? 'about ' + r.diff.toFixed(1) + ' higher' : 'about ' + Math.abs(r.diff).toFixed(1) + ' lower') + ')</span></li>'; }
    var h = '<div class="glass pad" style="margin-top:1.1rem"><span class="lbl">What goes with your moods</span>';
    if (!ups.length && !downs.length) h += '<p class="muted">No tag stands out yet. Keep tagging and check back.</p>';
    if (ups.length) h += '<p class="muted" style="margin-bottom:.3rem">Tend to go with better days</p><ul class="taglist">' + ups.map(li).join('') + '</ul>';
    if (downs.length) h += '<p class="muted" style="margin:.8rem 0 .3rem">Tend to go with harder days</p><ul class="taglist">' + downs.map(li).join('') + '</ul>';
    return h + '<p class="note-line">This shows what happened together, not what caused what.</p></div>';
  }
  function bindIns() {
    var a = $('#insSample'), c = $('#insClear');
    if (a) a.onclick = function () { MI.logs.set(sampleData().concat(logs())); MI.sound.sfx('select'); };
    if (c) c.onclick = function () { MI.logs.set(logs().filter(function (l) { return !l.s; })); };
  }

  /* ───── calendar ───── */
  var cal = new Date(); cal.setDate(1);
  var calSel = MI.ymd(new Date());
  function renderCal() {
    var host = $('#calBody'), all = logs(), journal = store.get('mindease.journal', {});
    var y = cal.getFullYear(), m = cal.getMonth(), first = new Date(y, m, 1), dim = new Date(y, m + 1, 0).getDate(), lead = dow(first), today = MI.ymd(new Date());
    var lastByDay = {}; all.forEach(function (l) { var k = day(l); if (!lastByDay[k]) lastByDay[k] = l; });
    var h = '<div class="glass pad"><div class="cal-head"><button class="cal-nav" id="calPrev" aria-label="Previous month">‹</button><h2>' + first.toLocaleDateString([], { month: 'long', year: 'numeric' }) + '</h2><button class="cal-nav" id="calNext" aria-label="Next month">›</button></div><div class="cal-grid">';
    DOW.forEach(function (d) { h += '<div class="cal-dow">' + d + '</div>'; });
    var i; for (i = 0; i < lead; i++) h += '<div class="cal-d empty"></div>';
    for (i = 1; i <= dim; i++) {
      var ds = MI.ymd(new Date(y, m, i)), l = lastByDay[ds];
      h += '<button class="cal-d' + (l ? ' has' : '') + (ds === today ? ' today' : '') + (ds === calSel ? ' sel' : '') + (journal[ds] ? ' jr' : '') + (planFull(ds) ? ' pd' : '') + '" data-d="' + ds + '"' + (l ? ' style="background:' + MI.get(l.k).color + '"' : '') + ' aria-label="' + ds + (l ? ', ' + MI.get(l.k).label : '') + '">' + i + '</button>';
    }
    h += '</div><div class="cal-legend">' + MI.MOODS.map(function (mm) { return '<span><i style="background:' + mm.color + '"></i>' + mm.label + '</span>'; }).join('') + '<span>• dot = journal entry</span></div></div><div class="glass pad cal-detail" id="calDetail"></div>';
    host.innerHTML = h; detail();
    $('#calPrev').onclick = function () { cal.setMonth(cal.getMonth() - 1); renderCal(); };
    $('#calNext').onclick = function () { cal.setMonth(cal.getMonth() + 1); renderCal(); };
    host.querySelector('.cal-grid').onclick = function (e) { var b = e.target.closest('.cal-d[data-d]'); if (!b) return; calSel = b.dataset.d; renderCal(); };
  }
  function planFull(ds) { var s = MI.plan && MI.plan.summary(ds); return !!(s && s.total && s.done === s.total); }
  function planLine(ds) {
    var s = MI.plan && MI.plan.summary(ds); if (!s || !s.total || !s.done) return '';
    return '<p class="plan-line"><b>Daily plan:</b> ' + s.done + ' of ' + s.total + ' done <span class="muted">(' + s.tasks.filter(function (t) { return t.ok; }).map(function (t) { return esc(t.label); }).join(', ') + ')</span></p>';
  }
  function detail() {
    var all = logs().filter(function (l) { return day(l) === calSel; }), j = store.get('mindease.journal', {})[calSel];
    var dd = new Date(calSel + 'T12:00:00');
    var h = '<span class="lbl">' + dd.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + '</span>';
    if (!all.length && !j) h += '<p class="muted">Nothing logged on this day.</p>';
    all.forEach(function (l) {
      h += '<div class="entry">' + MI.face(l.k, { halo: false }) + '<div><b>' + MI.get(l.k).label + '</b>' + (l.note ? ' <span class="muted">— ' + esc(l.note.slice(0, 120)) + '</span>' : '') + '<small>Energy ' + l.energy + ' of 10 · ' + new Date(l.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</small></div></div>';
    });
    h += planLine(calSel);
    if (j) h += '<p style="margin-top:.8rem"><b>Journal:</b> <span class="muted">' + esc(j.slice(0, 220)) + (j.length > 220 ? '…' : '') + '</span></p>';
    h += '<button class="btn btn-ghost btn-sm" id="calWrite" style="margin-top:.9rem">' + (j ? 'Open this journal entry' : 'Write about this day') + '</button>';
    $('#calDetail').innerHTML = h;
    $('#calWrite').onclick = function () { jrDate = calSel; MI.go('you', 'journal'); };
  }

  /* ───── journal ───── */
  var jrDate = MI.ymd(new Date()), jrQuery = '', saveTimer = null;
  var PROMPTS = ['What is one thing that went okay today?', 'What is taking up space in my head?', 'What do I need right now?', 'Who or what made me smile?', 'What would I tell a friend feeling this way?'];
  function words(t) { t = t.trim(); return t ? t.split(/\s+/).length : 0; }
  function highlight(text, q) {
    if (!q) return esc(text);
    var low = text.toLowerCase(), ql = q.toLowerCase(), out = '', pos = 0, idx;
    while ((idx = low.indexOf(ql, pos)) !== -1) { out += esc(text.slice(pos, idx)) + '<mark>' + esc(text.slice(idx, idx + q.length)) + '</mark>'; pos = idx + q.length; }
    return out + esc(text.slice(pos));
  }
  function snippet(text, q) {
    var i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1, start = Math.max(0, i - 40);
    var s = text.slice(start, start + 140); return (start > 0 ? '…' : '') + s + (start + 140 < text.length ? '…' : '');
  }
  function renderJournal() {
    var host = $('#jrBody');
    host.innerHTML = '<div class="jr-layout"><div class="glass pad"><label class="lbl" for="jrDate">Entry for</label><input type="date" class="field" id="jrDate" max="' + MI.ymd(new Date()) + '" value="' + jrDate + '" style="max-width:200px;margin-bottom:.9rem"/>' +
      '<div class="jr-prompt">' + PROMPTS.map(function (p, i) { return '<button class="chip" data-p="' + i + '">' + (['A good thing', 'On my mind', 'What I need', 'A smile', 'To a friend'][i]) + '</button>'; }).join('') + '</div>' +
      '<textarea class="field" id="jrText" rows="11" placeholder="Write as much or as little as you like. Only you can see this."></textarea>' +
      '<p class="muted" id="jrPlan" style="margin-bottom:.6rem;font-size:.9rem"></p><div class="jr-meta"><span id="jrCount"></span><span id="jrState"></span></div>' +
      '<div style="display:flex;gap:.6rem;margin-top:.9rem"><button class="btn btn-ghost btn-sm" id="jrDel">Delete entry</button></div></div>' +
      '<div class="glass pad"><label class="lbl" for="jrSearch">Search your journal</label><input class="field" id="jrSearch" type="search" placeholder="Search words…" value="' + esc(jrQuery) + '"/><div id="jrList" style="margin-top:.8rem"></div></div></div>';
    loadEntry(); drawList();
    if (MI.journalPrompt) { var jt = $('#jrText'); jt.value = (jt.value ? jt.value.replace(/\s+$/, '') + '\n\n' : '') + MI.journalPrompt + '\n'; MI.journalPrompt = ''; jt.focus(); jt.dispatchEvent(new Event('input')); }
    $('#jrDate').onchange = function () { flush(); jrDate = this.value || MI.ymd(new Date()); loadEntry(); drawList(); };
    $('#jrText').oninput = function () {
      $('#jrCount').textContent = words(this.value) + ' words'; $('#jrState').textContent = 'Saving…';
      clearTimeout(saveTimer); saveTimer = setTimeout(function () { flush(); drawList(); }, 500);
    };
    $('#jrBody').querySelector('.jr-prompt').onclick = function (e) {
      var b = e.target.closest('.chip'); if (!b) return; var t = $('#jrText'), p = PROMPTS[+b.dataset.p];
      t.value = (t.value ? t.value.replace(/\s+$/, '') + '\n\n' : '') + p + '\n'; t.focus(); t.dispatchEvent(new Event('input'));
    };
    $('#jrSearch').oninput = function () { jrQuery = this.value.trim(); drawList(); };
    var del = $('#jrDel'), armed = false;
    del.onclick = function () {
      if (!store.get('mindease.journal', {})[jrDate]) { MI.toast('Nothing to delete for this day'); return; }
      if (!armed) { armed = true; del.textContent = 'Tap again to confirm'; setTimeout(function () { armed = false; del.textContent = 'Delete entry'; }, 3000); return; }
      var j = store.get('mindease.journal', {}); delete j[jrDate]; touch(jrDate); store.set('mindease.journal', j); armed = false; del.textContent = 'Delete entry';
      $('#jrText').value = ''; $('#jrCount').textContent = '0 words'; drawList(); MI.toast('Entry deleted');
    };
  }
  function touch(d) { var u = store.get('mindease.journalU', {}); u[d] = Date.now(); store.set('mindease.journalU', u); }
  function loadEntry() { var t = store.get('mindease.journal', {})[jrDate] || ''; var pl = $('#jrPlan'); if (pl) { var s = MI.plan && MI.plan.summary(jrDate); pl.textContent = s && s.total ? 'Daily plan that day: ' + s.done + ' of ' + s.total + ' done' : ''; } $('#jrText').value = t; $('#jrCount').textContent = words(t) + ' words'; $('#jrState').textContent = ''; }
  function flush() {
    clearTimeout(saveTimer); var t = $('#jrText'); if (!t) return;
    var j = store.get('mindease.journal', {}), v = t.value;
    if (v.trim()) j[jrDate] = v; else delete j[jrDate];
    touch(jrDate); store.set('mindease.journal', j); $('#jrState').textContent = v.trim() ? 'Saved on this device' : ''; if (MI.plan) MI.plan.refresh();
  }
  function planTag(ds) { var s = MI.plan && MI.plan.summary(ds); return s && s.total && s.done ? ' · plan ' + s.done + '/' + s.total : ''; }
  function drawList() {
    var j = store.get('mindease.journal', {}), keys = Object.keys(j).sort().reverse(), q = jrQuery;
    if (q) keys = keys.filter(function (k) { return j[k].toLowerCase().indexOf(q.toLowerCase()) !== -1; });
    $('#jrList').innerHTML = keys.length ? keys.map(function (k) {
      var d = new Date(k + 'T12:00:00');
      return '<div class="jr-item" data-d="' + k + '"><b>' + d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + '</b><small>' + words(j[k]) + ' words' + planTag(k) + '</small><p>' + highlight(snippet(j[k], q), q) + '</p></div>';
    }).join('') : '<p class="muted">' + (q ? 'No entries match "' + esc(q) + '".' : 'No entries yet. Your first one will show up here.') + '</p>';
    $('#jrList').onclick = function (e) { var it = e.target.closest('.jr-item'); if (!it) return; flush(); jrDate = it.dataset.d; $('#jrDate').value = jrDate; loadEntry(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  }

  /* ───── reminders ───── */
  var RM = 'mindease.remind';
  function rm() { return store.get(RM, { on: false, time: '20:00', last: '' }); }
  function checkedInToday() { var t = MI.ymd(new Date()); return logs().some(function (l) { return !l.s && day(l) === t; }); }
  function due(r) { var n = new Date(), p = r.time.split(':'); return n.getHours() * 60 + n.getMinutes() >= (+p[0]) * 60 + (+p[1]); }
  function renderRemind() {
    var r = rm(), supported = 'Notification' in window, perm = supported ? Notification.permission : 'denied';
    var h = '<div class="glass pad" style="max-width:640px"><h2 class="display" style="font-size:1.6rem;margin-bottom:.4rem">Daily check-in reminder</h2>' +
      '<p class="muted">A gentle nudge at a time you choose. Reminders work while MindEase is open in a browser tab.</p>' +
      '<div class="rm-row"><div id="rmSwitch"></div><label for="rmTime" class="muted">at</label><input type="time" class="field" id="rmTime" value="' + r.time + '"/></div>';
    if (!supported) h += '<p class="note-line">This browser does not support notifications. You will still see a reminder here when you open MindEase after your chosen time.</p>';
    else if (perm === 'denied') h += '<p class="note-line">Notifications are blocked for this site. You can allow them in your browser settings. Until then, you will see the reminder here in the app.</p>';
    h += '<div class="rm-row"><button class="btn btn-ghost btn-sm" id="rmTest">Send a test reminder</button></div>' +
      '<p class="small muted">Email reminders need accounts and a server, so they are not part of this version yet.</p></div>';
    $('#rmBody').innerHTML = h;
    MI.sound.switchEl($('#rmSwitch'), 'Remind me daily', function () { return rm().on; }, function (v) {
      var x = rm(); x.on = v; store.set(RM, x);
      if (v && supported && Notification.permission === 'default') Notification.requestPermission().then(renderRemind);
      checkNudge();
    });
    $('#rmTime').onchange = function () { var x = rm(); x.time = this.value || '20:00'; store.set(RM, x); checkNudge(); MI.toast('Reminder set for ' + x.time); };
    $('#rmTest').onclick = function () { notify(true); };
  }
  function notify(test) {
    var body = 'How are you feeling? Mo is here whenever you are ready.';
    if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('MindEase', { body: body }); } catch (e) {} }
    else if (test) MI.toast('Test reminder: ' + body);
    MI.sound.sfx('toast');
  }
  function checkNudge() {
    var r = rm(), host = $('#nudge');
    var show = r.on && due(r) && !checkedInToday();
    if (!host) {
      host = document.createElement('div'); host.id = 'nudge'; host.className = 'glass nudge'; host.hidden = true;
      var pm = $('#page-mood'); pm.insertBefore(host, pm.firstChild);
    }
    host.hidden = !show;
    host.innerHTML = show ? '<span>It is past ' + esc(r.time) + ' and you have not checked in yet today.</span><button class="btn btn-lamp btn-sm" id="nudgeGo">Check in</button>' : '';
    if (show) $('#nudgeGo').onclick = function () { MI.go('mood'); $('#faces').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  }
  setInterval(function () {
    var r = rm(), t = MI.ymd(new Date());
    if (r.on && due(r) && !checkedInToday() && r.last !== t) { r.last = t; store.set(RM, r); notify(false); }
    checkNudge();
  }, 30000);
  checkNudge();
})();
