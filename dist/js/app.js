(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var timers = [];
  function clearTimers() { timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; }

  /* ───── nav ───── */
  var ICONS = {
    mood:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 14.5q3.5 3.5 7 0"/></svg>',
    breathe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/></svg>',
    ground: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V12"/><path d="M12 15c-5 .5-7.500-3-7-7 5-.5 7.500 2.500 7 7z"/><path d="M12 12c4 0 6.500-2.500 6.500-6-4.500 0-7 2-6.500 6z"/></svg>',
    words: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20C5 15.500 4 10.500 7.500 8.500 9.500 7.500 11.500 8.500 12 10.500c.5-2 2.500-3 4.500-2C20 10.500 19 15.500 12 20z"/></svg>',
    you: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 5-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="15" r="5"/><circle cx="16" cy="8.500" r="3.500"/><circle cx="17.500" cy="17.500" r="2.500"/></svg>'
  };
  ICONS.insights = ICONS.you;
  ICONS.keeper = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.500C5 16 3.500 11.500 6 8.500c2-2.300 5-1.500 6 .8 1-2.300 4-3.100 6-.8 2.500 3 1 7.500-6 12z"/><circle cx="12" cy="12" r="1.200"/></svg>';
  ICONS.journal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h11a2 2 0 0 1 2 2v15H8a2 2 0 0 1-2-2V3z"/><path d="M6 18a2 2 0 0 1 2-2h11M10 8h5"/></svg>';
  ICONS.programs = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="M12 9c0-3 2-5 5-5 0 3-2 5-5 5z"/><path d="M12 13c0-2.500-1.800-4-4.500-4 0 2.500 1.800 4 4.500 4z"/></svg>';
  ICONS.study = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7.500"/><path d="M12 9v4l2.500 1.500M9.500 3h5"/></svg>';
  ICONS.me = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.500 20c1-4 4-6 7.500-6s6.500 2 7.500 6"/></svg>';
  ICONS.more = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5.500" cy="12" r="1.200"/><circle cx="12" cy="12" r="1.200"/><circle cx="18.500" cy="12" r="1.200"/></svg>';
  ICONS.home = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/></svg>';
  /* routes: some share the "you" page and show only their own sub-panels */
  var ROUTES = [
    { id: 'mood', label: 'Today', grp: 'Home', head: null },
    { id: 'breathe', label: 'Breathe', grp: 'Calm' },
    { id: 'ground', label: 'Ground', grp: 'Calm' },
    { id: 'words', label: 'Words', grp: 'Calm' },
    { id: 'play', label: 'Play', grp: 'Calm' },
    { id: 'insights', label: 'Insights', grp: 'Track', page: 'you', subs: ['insights', 'calendar', 'weekly'], h: 'Your patterns', p: 'See how your moods, energy and days fit together. Everything stays on this device.' },
    { id: 'journal', label: 'Journal', grp: 'Track', page: 'you', subs: ['journal'], h: 'Your journal', p: 'A private place to write. Nobody else can read it.' },
    { id: 'programs', label: 'Programs', grp: 'Grow', page: 'you', subs: ['programs'], h: 'Guided programs', p: 'Short step-by-step plans for sleep, exams and low days.' },
    { id: 'study', label: 'Study mode', grp: 'Grow', page: 'you', subs: ['study'], h: 'Study mode', p: 'Focus rounds with calm breaks built in.' },
    { id: 'keeper', label: 'Keeper view', grp: 'Me' },
    { id: 'me', label: 'My space', grp: 'Me', page: 'you', subs: ['safety', 'sharing', 'remind', 'settings'], h: 'My space', p: 'Your safety plan, sharing, reminders and settings.' }
  ];
  var BOTTOM = ['mood', 'breathe', 'journal', 'insights'];
  function route(id) { for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i]; return null; }
  function subRoute(sub) { for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].subs && ROUTES[i].subs.indexOf(sub) > -1) return ROUTES[i]; return ROUTES[5]; }
  function tabBtn(r, extra) { return '<button class="tab' + (extra || '') + '" data-page="' + r.id + '" aria-current="false">' + ICONS[r.id] + '<span>' + r.label + '</span></button>'; }
  var navHtml = '', lastGrp = '';
  ROUTES.forEach(function (r) {
    if (r.grp !== lastGrp) { if (r.grp !== 'Home') navHtml += '<div class="nav-h">' + r.grp + '</div>'; lastGrp = r.grp; }
    navHtml += tabBtn(r);
  });
  $('#nav').innerHTML = navHtml;
  $('#bnav').innerHTML = BOTTOM.map(function (id) { return tabBtn(route(id)); }).join('') +
    '<button class="tab" id="moreBtn" aria-haspopup="true" aria-expanded="false" aria-controls="more">' + ICONS.more + '<span>More</span></button>';
  $('#more').innerHTML = ROUTES.filter(function (r) { return BOTTOM.indexOf(r.id) < 0; }).map(function (r) { return tabBtn(r); }).join('') +
    '<a class="tab" href="/">' + ICONS.home + '<span>Home page</span></a>';
  function closeMore() { $('#more').hidden = true; $('#moreBtn').setAttribute('aria-expanded', 'false'); }
  $('#moreBtn').addEventListener('click', function (e) { e.stopPropagation(); var h = $('#more').hidden; $('#more').hidden = !h; this.setAttribute('aria-expanded', h ? 'true' : 'false'); });
  document.addEventListener('click', function (e) { if (!e.target.closest('#more,#moreBtn')) closeMore(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#more').hidden) { closeMore(); $('#moreBtn').focus(); } });

  function markNav(id) {
    $$('.tab[data-page]').forEach(function (t) { t.setAttribute('aria-current', t.dataset.page === id ? 'page' : 'false'); });
    var inMore = id !== 'help' && BOTTOM.indexOf(id) < 0;
    $('#moreBtn').classList.toggle('is-on', inMore);
  }
  /* show only the sub-panels that belong to a "you" route */
  function setupYou(r, wantSub) {
    var subs = r.subs;
    $('#youH').textContent = r.h; $('#youP').textContent = r.p;
    $$('#yseg .chip').forEach(function (c) { c.hidden = subs.indexOf(c.dataset.p) < 0; });
    $('#yseg').hidden = subs.length < 2;
    var target = wantSub && subs.indexOf(wantSub) > -1 ? wantSub : subs[0];
    var c = $('#yseg .chip[data-p="' + target + '"]'); if (c) c.click();
  }
  function showPage(id, sub) {
    if (id === 'you') id = sub ? subRoute(sub).id : 'insights';
    var r = route(id), pg = r ? (r.page || r.id) : id;
    if (!$('#page-' + pg)) { id = 'mood'; r = route(id); pg = 'mood'; }
    clearTimers(); stopBreath(true); closeMore();
    $$('.page').forEach(function (p) { p.classList.toggle('active', p.id === 'page-' + pg); });
    markNav(id);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    if (pg === 'play') openGame(curGame);
    if (pg === 'you') setupYou(r, sub);
    document.title = (r ? r.label : 'Help') + ' · MindEase';
    MI.emit('page', id);
    window.scrollTo(0, 0);
  }
  /* keep the sidebar in step when a sub-panel is opened from elsewhere (chips, calendar, nudges) */
  $('#yseg').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    var r = subRoute(b.dataset.p);
    markNav(r.id); $('#youH').textContent = r.h; $('#youP').textContent = r.p;
    try { history.replaceState(null, '', '#' + r.id); } catch (e2) {}
  });
  document.addEventListener('click', function (e) { var b = e.target.closest('.tab[data-page]'); if (b) showPage(b.dataset.page); });
  $('#helpBtn').addEventListener('click', function (e) { e.preventDefault(); MI.sound.sfx('tap'); showPage('help'); });
  document.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); showPage(g.dataset.go); } });
  window.addEventListener('hashchange', function () { var h = location.hash.replace('#', ''); if (h && (route(h) || $('#page-' + h))) showPage(h); });
  MI.go = function (id, sub) { showPage(id, sub); };
  document.getElementById('logoMo').innerHTML = MI.face('happy', { halo: false, size: 38 }); document.getElementById('logoMo2').innerHTML = MI.face('happy', { halo: false, size: 32 });

  $('#skip').addEventListener('click', function (e) { e.preventDefault(); var pg = $('.page.active'); if (pg) { pg.setAttribute('tabindex', '-1'); pg.focus(); } });
  MI.sound.mount($('#sndHost'));
  MI.sound.autoAmbient(true);
  document.addEventListener('click', function (e) {
    if (e.target.closest('.snd')) return;
    if (e.target.closest('.btn,.chip,.tab,.tech,.sw,.mem,.tile,.slot,.cal-d,.jr-item')) MI.sound.sfx('tap');
  });
  MI.fx.fireflies(7); MI.fx.shootingStars();

  /* ───── mood ───── */
  var selected = '';
  var logs = store.get('mindease.logs', []);
  var bigMo = $('#bigMo'), moSay = $('#moSay');
  $('#faces').innerHTML = MI.MOODS.map(function (m) {
    return '<button class="face-btn" role="radio" aria-checked="false" data-k="' + m.key + '">' + MI.face(m.key, { halo: false }) + '<span>' + m.label + '</span></button>';
  }).join('');
  function showMo(key, say, animate) {
    bigMo.innerHTML = MI.face(key, { cls: animate ? 'mo-pop' : '' });
    moSay.textContent = say;
  }
  function pick(key) {
    selected = key;
    var m = MI.setMood(key, true);
    $$('.face-btn').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.k === key ? 'true' : 'false'); });
    showMo(key, m.say, true);
    var more = $('#moodMore'); if (more.hidden) { more.hidden = false; more.classList.remove('in'); void more.offsetWidth; more.classList.add('in'); }
    MI.sound.mood(key); MI.fx.bloom(bigMo);
  }
  $('#faces').addEventListener('click', function (e) { var b = e.target.closest('.face-btn'); if (b) pick(b.dataset.k); });
  var s0 = MI.saved();
  showMo(s0 || 'calm', 'Tap a face and I will keep you company.', false);

  /* tags: what is behind a feeling */
  var TAGS = [['sleep', 'Sleep'], ['studies', 'Studies'], ['exams', 'Exams'], ['family', 'Family'], ['friends', 'Friends'], ['health', 'Health'],
              ['food', 'Food'], ['exercise', 'Exercise'], ['weather', 'Weather'], ['money', 'Money'], ['screens', 'Screen time'], ['work', 'Work']];
  var TAGNAME = {}; TAGS.forEach(function (t) { TAGNAME[t[0]] = t[1]; });
  MI.tagName = function (k) { return TAGNAME[k] || k; }; MI.TAGS = TAGS;
  var selTags = [];
  $('#tags').innerHTML = TAGS.map(function (t) { return '<button class="chip" aria-pressed="false" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  $('#tags').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return; var k = b.dataset.t, i = selTags.indexOf(k);
    if (i > -1) selTags.splice(i, 1); else if (selTags.length < 6) selTags.push(k); else { MI.toast('Up to six tags'); return; }
    b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
  });

  var energy = $('#energy');
  function energyWord(v) { return v <= 2 ? 'drained' : v <= 4 ? 'low' : v <= 6 ? 'okay' : v <= 8 ? 'good' : 'buzzing'; }
  function energyUi() {
    var v = +energy.value;
    energy.style.setProperty('--p', ((v - 1) / 9 * 100) + '%');
    $('#energyTxt').textContent = v + ' of 10, ' + energyWord(v);
  }
  energy.addEventListener('input', energyUi); energyUi();

  $('#saveBtn').addEventListener('click', function () {
    if (!selected) { MI.toast('Pick a face first'); return; }
    var m = MI.get(selected), note = $('#note').value.trim(), en = +energy.value;
    var before = badgeList(logs).filter(function (b) { return b.on; }).length;
    var entry = { k: selected, note: note, energy: en, t: new Date().toISOString() }; if (selTags.length) entry.tags = selTags.slice();
    logs.unshift(entry);
    logs = logs.slice(0, 200); store.set('mindease.logs', logs);

    $('#note').value = ''; selected = ''; selTags = []; $$('#tags .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    $$('.face-btn').forEach(function (b) { b.setAttribute('aria-checked', 'false'); });
    $('#moodMore').hidden = true; $('#tagBox').open = false; energy.value = 5; energyUi();
    var savedKey = m.key;
    renderMood(); MI.emit('logs'); MI.toast('Saved. Thanks for checking in.');
    MI.sound.sfx('save'); MI.fx.burst($('#saveBtn'));
    suggest(savedKey);
    if (window.innerWidth < 860) { var sb = $('#suggest'); if (sb && !sb.hidden) sb.scrollIntoView({ behavior: MI.fx.reduced ? 'auto' : 'smooth', block: 'center' }); }
    var after = badgeList(logs).filter(function (b) { return b.on; }).length;
    if (after > before) setTimeout(function () { MI.toast('New badge earned'); MI.sound.sfx('win'); }, 900);
  });

  /* mood-based suggestions: the tabs talk to each other */
  var SUGGEST = {
    anxious:     { t: 'Let\'s slow things down', d: 'A steady square breath is a good place to start.', go: [['breathe', 'Box breathing', 0], ['ground', '5-4-3-2-1 grounding']] },
    overwhelmed: { t: 'One small thing at a time', d: 'Grounding can bring you back to the room around you.', go: [['ground', '5-4-3-2-1 grounding'], ['breathe', 'Quick reset', 4]] },
    angry:       { t: 'Give the feeling some room', d: 'A longer exhale helps your body settle.', go: [['breathe', 'Belly breathing', 3], ['ground', 'Temperature reset', null, 'cool']] },
    sad:         { t: 'Something gentle for a heavy moment', d: 'Kind words or a few good things can soften the edges.', go: [['words', 'Kind words'], ['play', 'Gratitude jar', null, 'jar']] },
    tired:       { t: 'Rest counts', d: 'A slow body scan can help you unwind.', go: [['ground', 'Body scan', null, 'scan']] },
    neutral:     { t: 'A calm in-between day', d: 'Something small and playful keeps things light.', go: [['play', 'Color match', null, 'color'], ['you', 'Write in your journal', null, 'journal']] },
    calm:        { t: 'Keep that steady feeling', d: 'Slow even breaths can hold it a little longer.', go: [['breathe', 'Coherence', 2], ['words', 'Growth words']] },
    happy:       { t: 'Save the good moment', d: 'A good thing in the jar is easy to find on harder days.', go: [['play', 'Gratitude jar', null, 'jar']] },
    veryhappy:   { t: 'Save the good moment', d: 'A good thing in the jar is easy to find on harder days.', go: [['play', 'Gratitude jar', null, 'jar']] },
    grateful:    { t: 'Keep it warm', d: 'Add it to your gratitude jar while it is fresh.', go: [['play', 'Gratitude jar', null, 'jar']] }
  };
  function suggest(key) {
    var sg = SUGGEST[key], box = $('#suggest'); if (!sg) return;
    var recent = logs.slice(0, 5), heavyN = recent.filter(function (l) { return MI.get(l.k).heavy; }).length;
    var html = '<h3>' + sg.t + '</h3><p>' + sg.d + '</p><div class="row">' + sg.go.map(function (g, i) {
      return '<button class="btn ' + (i ? 'btn-ghost' : 'btn-lamp') + ' btn-sm" data-page="' + g[0] + '" data-tech="' + (g[2] == null ? '' : g[2]) + '" data-sub="' + (g[3] || '') + '">' + g[1] + '</button>';
    }).join('') + '</div>';
    if (recent.length >= 3 && heavyN >= 3) html += '<p class="small" style="margin-top:1rem">The last few days have sounded heavy. Talking to someone can really help. <a href="#help" data-go="help" style="color:var(--accent);font-weight:700">See who you can reach</a></p>';
    box.innerHTML = html; box.hidden = false; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
  }
  $('#suggest').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-page]'); if (!b) return;
    var pg = b.dataset.page, sub = b.dataset.sub, t = b.dataset.tech;
    if (pg === 'you') showPage('you', sub); else showPage(pg);
    if (pg === 'breathe' && t !== '') { var tb = $('.tech[data-i="' + t + '"]'); if (tb) tb.click(); }
    if (pg === 'ground' && sub) { var c = $('#gseg .chip[data-p="' + sub + '"]'); if (c) c.click(); }
    if (pg === 'play' && sub) openGame(sub);
  });
  MI.logs = { get: function () { return logs; }, set: function (v) { logs = v; store.set('mindease.logs', logs); renderMood(); MI.emit('logs'); } };

  function ymd(d) { return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function ago(iso) {
    var d = new Date(iso), mins = Math.round((Date.now() - d) / 60000);
    if (mins < 1) return 'Just now'; if (mins < 60) return mins + ' min ago';
    if (ymd(d) === ymd(new Date())) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  }
  /* streak badges */
  var BADGES = [['n1', 'First check-in', function (c) { return c.total >= 1; }], ['s3', '3-day streak', function (c) { return c.best >= 3; }],
                ['s7', 'A week of showing up', function (c) { return c.best >= 7; }], ['n10', '10 check-ins', function (c) { return c.total >= 10; }],
                ['s14', 'Two-week streak', function (c) { return c.best >= 14; }], ['n50', '50 check-ins', function (c) { return c.total >= 50; }],
                ['s30', 'A month of care', function (c) { return c.best >= 30; }]];
  function bestStreak(list) {
    var days = {}; list.forEach(function (l) { if (!l.s) days[Math.floor((new Date(l.t).getTime() - new Date(l.t).getTimezoneOffset() * 60000) / 86400000)] = 1; });
    var ks = Object.keys(days).map(Number).sort(function (a, b) { return a - b; }), best = 0, run = 0, prev = null;
    ks.forEach(function (k) { run = prev !== null && k === prev + 1 ? run + 1 : 1; prev = k; if (run > best) best = run; });
    return best;
  }
  function badgeList(list) {
    var c = { total: list.filter(function (l) { return !l.s; }).length, best: bestStreak(list) };
    return BADGES.map(function (b) { return { id: b[0], label: b[1], on: b[2](c) }; });
  }
  MI.badges = function () { return badgeList(logs); };
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.300 5.800 20.900l1.600-7L2 9.200l7.100-.6z"/></svg>';
  function renderBadges() {
    $('#badges').innerHTML = badgeList(logs).map(function (b) { return '<span class="badge' + (b.on ? '' : ' off') + '">' + (b.on ? STAR : '') + b.label + '</span>'; }).join('');
  }
  function renderMood() {
    renderBadges();
    // week
    var days = [], max = 1, i;
    for (i = 6; i >= 0; i--) {
      var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
      var these = logs.filter(function (l) { return ymd(new Date(l.t)) === ymd(d); });
      days.push({ d: d, n: these.length, last: these[0] }); max = Math.max(max, these.length);
    }
    $('#week').innerHTML = days.map(function (x) {
      var h = x.n ? 28 + (x.n / max) * 72 : 12, col = x.last ? MI.get(x.last.k).color : '';
      var tip = x.n + (x.n === 1 ? ' check-in' : ' check-ins');
      return '<div class="wday"><div class="wbar" style="height:' + h + '%;' + (col ? 'background:' + col : '') + '" data-tip="' + tip + '"></div><span class="wlbl">' +
        x.d.toLocaleDateString([], { weekday: 'short' }) + '</span></div>';
    }).join('');
    // streak
    var streak = 0, cur = new Date();
    var has = function (dt) { return logs.some(function (l) { return ymd(new Date(l.t)) === ymd(dt); }); };
    if (!has(cur)) cur.setDate(cur.getDate() - 1);
    while (has(cur)) { streak++; cur.setDate(cur.getDate() - 1); }
    $('#streak').textContent = streak; $('#total').textContent = logs.length;
    $('#seeAll').hidden = !logs.length;
    // entries
    $('#entries').innerHTML = logs.length ? logs.slice(0, 4).map(function (l) {
      var m = MI.get(l.k);
      return '<div class="entry">' + MI.face(l.k, { halo: false }) + '<div><b>' + m.label + '</b>' + (l.note ? ' <span class="muted">— ' + esc(l.note.slice(0, 80)) + '</span>' : '') +
        '<small>Energy ' + l.energy + ' of 10 · ' + ago(l.t) + '</small>' + (l.tags && l.tags.length ? '<span class="tagmini">' + l.tags.map(function (t) { return '<i>' + esc(MI.tagName(t)) + '</i>'; }).join('') + '</span>' : '') + '</div></div>';
    }).join('') : '<p class="empty">No check-ins yet. Pick a face above to start.</p>';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  renderMood();
  function greet() {
    var h = new Date().getHours(), w = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
    var n = (MI.userName || '').split(' ')[0];
    $('#greet').textContent = n ? w + ', ' + n : w;
  }
  greet(); MI.on('user', greet);

  /* ───── breathing ───── */
  var TECHS = [
    { n: 'Box breathing', r: '4-4-4-4', d: 'Four equal sides. Steady and grounding.', p: [4, 4, 4, 4] },
    { n: '4-7-8 breathing', r: '4-7-8', d: 'A long exhale to help you wind down.', p: [4, 7, 8, 0] },
    { n: 'Coherence', r: '5-5', d: 'Even, slow breaths at an easy pace.', p: [5, 0, 5, 0] },
    { n: 'Belly breathing', r: '4-6', d: 'A longer exhale to settle your body.', p: [4, 0, 6, 0] },
    { n: 'Quick reset', r: '2-1-4', d: 'A short, light round to freshen up.', p: [2, 1, 4, 0] },
    { n: 'Triangle', r: '4-4-4', d: 'Breathe in, hold, breathe out.', p: [4, 4, 4, 0] }
  ];
  var tech = 0, phases = [], pi = 0, left = 0, running = false, rounds = 0, tick = null;
  var orb = $('#orb'), prog = $('#prog');
  $('#techs').innerHTML = TECHS.map(function (t, i) {
    return '<button class="tech' + (i ? '' : ' on') + '" role="radio" aria-checked="' + (i ? 'false' : 'true') + '" data-i="' + i + '"><span><b>' + t.n + '</b><small>' + t.d + '</small></span><span class="ratio">' + t.r + '</span></button>';
  }).join('');
  function buildPhases() {
    var p = TECHS[tech].p; phases = [];
    if (p[0]) phases.push({ l: 'Breathe in', k: 'in', s: p[0] });
    if (p[1]) phases.push({ l: 'Hold', k: 'hold', s: p[1] });
    if (p[2]) phases.push({ l: 'Breathe out', k: 'out', s: p[2] });
    if (p[3]) phases.push({ l: 'Hold', k: 'hold2', s: p[3] });
  }
  function orbTo(scale, secs) { orb.style.transition = 'transform ' + secs + 's ease-in-out'; orb.style.transform = 'scale(' + scale + ')'; }
  function ringTo(secs) {
    prog.style.transition = 'none'; prog.style.strokeDashoffset = '1'; void prog.getBoundingClientRect();
    prog.style.transition = 'stroke-dashoffset ' + secs + 's linear'; prog.style.strokeDashoffset = '0';
  }
  function enter(secsLeft) {
    var ph = phases[pi];
    $('#bPhase').textContent = ph.l; $('#bCount').textContent = secsLeft;
    if (ph.k === 'in') orbTo(1.25, secsLeft); else if (ph.k === 'out') orbTo(1, secsLeft);
    ringTo(secsLeft);
    MI.sound.cue(ph.k, ph.l === 'Hold' ? 'Hold' : ph.l);
  }
  function curScale() { var m = getComputedStyle(orb).transform; if (!m || m === 'none') return 1; return parseFloat(m.split('(')[1]); }
  function holdScale() { var s = curScale(); orb.style.transition = 'none'; orb.style.transform = 'scale(' + s + ')'; }
  function startBreath() {
    if (running) return; running = true; $('#bStart').textContent = 'Pause';
    if (!left) { left = phases[pi].s; }
    enter(left);
    tick = setInterval(function () {
      left--;
      if (left <= 0) {
        pi = (pi + 1) % phases.length;
        if (pi === 0) { rounds++; MI.sound.sfx('ok'); $('#cycles').textContent = 'Rounds completed: ' + rounds; MI.emit('breath-done'); }
        left = phases[pi].s;
        if (phases[pi].k === 'hold' || phases[pi].k === 'hold2') { holdScale(); }
        enter(left);
      } else { $('#bCount').textContent = left; }
    }, 1000);
  }
  function pauseBreath() { running = false; clearInterval(tick); $('#bStart').textContent = 'Resume'; holdScale(); prog.style.transition = 'none'; }
  function stopBreath(silent) {
    running = false; clearInterval(tick); tick = null; pi = 0; left = 0; rounds = 0; buildPhases();
    orb.style.transition = 'transform .8s ease-in-out'; orb.style.transform = 'scale(1)';
    prog.style.transition = 'none'; prog.style.strokeDashoffset = '0';
    $('#bStart').textContent = 'Start'; $('#bCount').textContent = phases[0].s; $('#bPhase').textContent = 'Ready';
    $('#cycles').textContent = 'Rounds completed: 0';
  }
  $('#bStart').addEventListener('click', function () { running ? pauseBreath() : startBreath(); });
  $('#bReset').addEventListener('click', function () { stopBreath(); });
  $('#techs').addEventListener('click', function (e) {
    var b = e.target.closest('.tech'); if (!b) return;
    tech = +b.dataset.i;
    $$('.tech').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); });
    $('#techName').textContent = TECHS[tech].n + ' · ' + TECHS[tech].r; stopBreath();
  });
  MI.sound.ambientChips($('#bAmb'));
  MI.sound.switchEl($('#bVoice'), 'Voice guide', function () { return MI.sound.prefs().voice; }, MI.sound.setVoice);
  buildPhases(); $('#techName').textContent = TECHS[0].n + ' · ' + TECHS[0].r; $('#bCount').textContent = phases[0].s;

  /* ───── grounding ───── */
  $('#gseg').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    $$('#gseg .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    $$('.panel').forEach(function (p) { p.classList.toggle('active', p.id === 'gp-' + b.dataset.p); });
  });
  var SENSES = [
    { n: 5, w: 'See', h: 'Five things you can see', c: '#FFD27A', o: ['A chair', 'The wall', 'A window', 'A lamp', 'Your hands'] },
    { n: 4, w: 'Hear', h: 'Four things you can hear', c: '#F4A6A0', o: ['A sound nearby', 'Distant noise', 'Your breathing', 'Something subtle'] },
    { n: 3, w: 'Touch', h: 'Three things you can feel', c: '#B9A7E8', o: ['The surface beneath you', 'Your clothing', 'Something within reach'] },
    { n: 2, w: 'Smell', h: 'Two things you can smell', c: '#9CC9B0', o: ['The air around you', 'Something nearby'] },
    { n: 1, w: 'Taste', h: 'One thing you can taste', c: '#8FB4E8', o: ['The taste in your mouth'] }
  ];
  $('#senseList').innerHTML = SENSES.map(function (s) {
    return '<div class="glass sense"><div class="num" style="background:' + s.c + '">' + s.n + '</div><div><h3>' + s.w + '</h3><p>' + s.h + '</p><div class="opts">' +
      s.o.map(function (o) { return '<button class="chip opt" aria-pressed="false">' + o + '</button>'; }).join('') + '</div></div></div>';
  }).join('');
  $('#senseList').addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (!b) return;
    var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('on', on);
    var n = $$('.opt.on').length; $('#sCount').textContent = n; $('#sFill').style.width = (n / 15 * 100) + '%';
    if (n === 15) MI.toast('All noticed. Take one slow breath.');
  });
  var SCAN = [
    ['Crown of your head', 'Notice any tension, tingling or warmth at the very top.'],
    ['Face and jaw', 'Soften your forehead and eyes. Let your jaw unclench.'],
    ['Neck and shoulders', 'Drop your shoulders away from your ears.'],
    ['Chest and heart', 'Feel each breath gently expand and soften your chest.'],
    ['Belly', 'Let your belly go soft. You can stop holding it in.'],
    ['Hands and arms', 'Notice the weight of your arms. Uncurl your fingers.'],
    ['Legs and feet', 'Feel the ground beneath you and where your feet touch it.']
  ];
  var scanAt = -1;
  function renderScan() {
    $('#scanList').innerHTML = SCAN.map(function (s, i) {
      return '<li class="' + (i === scanAt ? 'now' : i < scanAt ? 'past' : '') + '"><span class="dot">' + (i + 1) + '</span><div><b>' + s[0] + '</b><span>' + s[1] + '</span></div></li>';
    }).join('');
    $('#scanBtn').textContent = scanAt < 0 ? 'Start body scan' : scanAt >= SCAN.length - 1 ? 'Finish' : 'Next area';
  }
  $('#scanBtn').addEventListener('click', function () {
    if (scanAt >= SCAN.length - 1) { scanAt = -1; MI.toast('Well done. Notice how your body feels now.'); }
    else scanAt++;
    renderScan();
    var now = $('#scanList .now'); if (now && now.scrollIntoView) now.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  renderScan();

  /* ───── affirmations ───── */
  var AFF = [
    ['I am worthy of love, peace and all the good that life has to offer.', 'Self-worth'],
    ['I release what I cannot control and hold on to what I can.', 'Anxiety'],
    ['I am stronger than my anxiety. I have gotten through hard things before.', 'Strength'],
    ['I am grateful for this breath, this moment, this life.', 'Gratitude'],
    ['Every day I grow a little wiser, a little kinder, a little freer.', 'Growth'],
    ['My feelings are valid. I let myself feel them and then let them go.', 'Self-worth'],
    ['I choose peace over worry. I am safe right now.', 'Anxiety'],
    ['I face challenges with courage and come out the other side.', 'Strength'],
    ['There is so much beauty in my life when I pause to notice it.', 'Gratitude'],
    ['I am becoming the person I was always meant to be.', 'Growth'],
    ['I deserve kindness, especially from myself.', 'Self-worth'],
    ['This feeling will pass. I am bigger than this moment.', 'Anxiety'],
    ['I have everything within me to handle what comes today.', 'Strength'],
    ['I find gratitude in small things: a warm cup, a deep breath, a smile.', 'Gratitude'],
    ['Growth happens slowly, and that is perfectly okay.', 'Growth'],
    ['I am enough exactly as I am right now.', 'Self-worth'],
    ['I breathe in calm. I breathe out tension.', 'Anxiety'],
    ['My resilience is my superpower.', 'Strength'],
    ['I wake up grateful for another chance to be alive.', 'Gratitude'],
    ['I welcome change as an invitation to grow.', 'Growth']
  ];
  var CATS = ['All', 'Self-worth', 'Anxiety', 'Strength', 'Gratitude', 'Growth', 'Saved'];
  var cat = 'All', affIdx = 0, saved = store.get('mindease.saved', []), showAll = false;
  $('#affChips').innerHTML = CATS.map(function (c) { return '<button class="chip' + (c === 'All' ? ' on' : '') + '" data-c="' + c + '">' + (c === 'Saved' ? 'Saved ♥' : c) + '</button>'; }).join('');
  function pool() { return AFF.filter(function (a) { return cat === 'All' ? true : cat === 'Saved' ? saved.indexOf(a[0]) > -1 : a[1] === cat; }); }
  function heroAff(a, fade) {
    var q = $('#affQuote');
    var set = function () { q.textContent = a[0]; $('#affTag').textContent = a[1]; q.style.opacity = 1; syncSave(); };
    if (fade) { q.style.opacity = 0; setTimeout(set, 280); } else set();
  }
  function syncSave() {
    var t = $('#affQuote').textContent, on = saved.indexOf(t) > -1;
    $('#affSave').textContent = on ? 'Saved' : 'Save this'; $('#affSave').setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function toggleSaved(t) {
    var i = saved.indexOf(t); if (i > -1) saved.splice(i, 1); else saved.push(t);
    store.set('mindease.saved', saved); renderAff(); syncSave();
  }
  function renderAff() {
    var p = pool(), list = showAll ? p : p.slice(0, 6);
    $('#affGrid').innerHTML = p.length ? list.map(function (a) {
      var on = saved.indexOf(a[0]) > -1;
      return '<div class="aff-card" data-t="' + esc(a[0]) + '" ><p tabindex="0" role="button" aria-label="Show this affirmation">' + esc(a[0]) + '</p><small>' + a[1] + '</small>' +
        '<button class="heart' + (on ? ' on' : '') + '" aria-label="' + (on ? 'Remove from saved' : 'Save') + '"><svg viewBox="0 0 24 24"><path d="M12 20C5 15.500 4 10.500 7.500 8.500 9.500 7.500 11.500 8.500 12 10.500c.5-2 2.500-3 4.500-2C20 10.500 19 15.500 12 20z" stroke-linejoin="round"/></svg></button></div>';
    }).join('') + (!showAll && p.length > 6 ? '<button class="btn btn-ghost" id="affMore" style="grid-column:1/-1;justify-self:center">Show all ' + p.length + '</button>' : '')
      : '<p class="empty" style="grid-column:1/-1">Nothing saved yet. Tap a heart to keep a line you like.</p>';
  }
  $('#affChips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return; cat = b.dataset.c; showAll = false;
    $$('#affChips .chip').forEach(function (c) { c.classList.toggle('on', c === b); }); renderAff();
  });
  $('#affNext').addEventListener('click', function () {
    var p = pool(); if (!p.length) p = AFF; affIdx = (affIdx + 1) % p.length; heroAff(p[affIdx], true);
  });
  $('#affSave').addEventListener('click', function () { toggleSaved($('#affQuote').textContent); });
  $('#affGrid').addEventListener('click', function (e) {
    if (e.target.id === 'affMore') { showAll = true; renderAff(); return; }
    var card = e.target.closest('.aff-card'); if (!card) return;
    var t = card.dataset.t;
    if (e.target.closest('.heart')) { toggleSaved(t); return; }
    var a = AFF.filter(function (x) { return x[0] === t; })[0]; if (a) { heroAff(a, true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  $('#affGrid').addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'P' && e.target.closest('.aff-card')) { e.preventDefault(); e.target.click(); }
  });
  heroAff(AFF[0], false); renderAff();

  /* ───── games ───── */
  var GAMES = [['memory', '🧩', 'Memory match'], ['color', '🎨', 'Color match'], ['bubble', '🫧', 'Bubble release'],
               ['word', '🔤', 'Word tiles'], ['tap', '🌬️', 'Tap and breathe'], ['jar', '🫙', 'Gratitude jar']];
  var curGame = 'memory', stage = $('#gstage');
  $('#gtabs').innerHTML = GAMES.map(function (g) {
    return '<button class="chip gtab' + (g[0] === 'memory' ? ' on' : '') + '" data-g="' + g[0] + '"><span class="gi">' + g[1] + '</span>' + g[2] + '</button>';
  }).join('');
  $('#gtabs').addEventListener('click', function (e) { var b = e.target.closest('.gtab'); if (b) openGame(b.dataset.g); });
  function openGame(id) {
    clearTimers(); curGame = id;
    $$('.gtab').forEach(function (b) { b.classList.toggle('on', b.dataset.g === id); });
    ({ memory: memory, color: color, bubble: bubble, word: word, tap: tap, jar: jar })[id]();
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* memory */
  var SYM = {
    moon: '<path d="M26 7a13 13 0 1 0 8 23A11 11 0 0 1 26 7z" fill="#FFB84D"/>',
    leaf: '<path d="M7 33C7 16 17 7 33 7c0 15-9 26-26 26z" fill="#6FB394"/><path d="M8 32L24 16" stroke="#2A2035" stroke-width="2" fill="none"/>',
    star: '<path d="M20 5l4.500 10 11 1-8.300 7.300 2.600 10.700L20 28l-9.800 6 2.600-10.700L4.500 16l11-1z" fill="#FF9B6A"/>',
    cloud: '<path d="M12 30a7 7 0 0 1 0-14 9 9 0 0 1 17-2 7.500 7.500 0 0 1 0 16z" fill="#9C86E0"/>',
    flower: '<g fill="#F08C86"><circle cx="20" cy="10" r="6"/><circle cx="30" cy="18" r="6"/><circle cx="26" cy="30" r="6"/><circle cx="14" cy="30" r="6"/><circle cx="10" cy="18" r="6"/></g><circle cx="20" cy="21" r="5" fill="#FFD27A"/>',
    heart: '<path d="M20 33C6 24 6 12 13 10c4-1 7 2 7 5 0-3 3-6 7-5 7 2 7 14-7 23z" fill="#F0668A"/>',
    sun: '<circle cx="20" cy="20" r="8" fill="#FFB84D"/><g stroke="#FFB84D" stroke-width="3" stroke-linecap="round"><path d="M20 4v5M20 31v5M4 20h5M31 20h5M9 9l3.500 3.500M27.500 27.500L31 31M31 9l-3.500 3.500M12.500 27.500L9 31"/></g>',
    drop: '<path d="M20 5c8 10 11 15 11 21a11 11 0 0 1-22 0c0-6 3-11 11-21z" fill="#6E9BE0"/>'
  };
  function memory() {
    var keys = Object.keys(SYM), deck = shuffle(keys.concat(keys)), open = [], found = 0, moves = 0, lock = false;
    stage.innerHTML = '<h2>Memory match</h2><p class="sub">Flip two cards at a time and find all eight pairs.</p><div class="mgrid" id="mg"></div><p class="msg" id="mm">Moves: 0</p><button class="btn btn-ghost btn-sm" id="mr">New game</button>';
    $('#mg').innerHTML = deck.map(function (k, i) {
      return '<button class="mem" data-k="' + k + '" aria-label="Card ' + (i + 1) + '"><div class="in"><div class="b"></div><div class="f"><svg viewBox="0 0 40 40" aria-hidden="true">' + SYM[k] + '</svg></div></div></button>';
    }).join('');
    $('#mr').onclick = memory;
    $('#mg').onclick = function (e) {
      var c = e.target.closest('.mem'); if (!c || lock || c.classList.contains('flip')) return;
      c.classList.add('flip'); open.push(c); MI.sound.sfx('flip');
      if (open.length === 2) {
        moves++; $('#mm').textContent = 'Moves: ' + moves; lock = true;
        if (open[0].dataset.k === open[1].dataset.k) {
          open.forEach(function (x) { x.classList.add('done'); }); open = []; lock = false; found++; MI.sound.sfx('match');
          if (found === 8) MI.sound.sfx('win'); if (found === 8) $('#mm').textContent = 'All eight pairs in ' + moves + ' moves. Lovely.';
        } else {
          timers.push(setTimeout(function () { open.forEach(function (x) { x.classList.remove('flip'); }); open = []; lock = false; }, 850));
        }
      }
    };
  }

  /* colour */
  var COLORS = [['Teal', '#4FD1C0'], ['Coral', '#FF7A66'], ['Sky', '#8FB4E8'], ['Lilac', '#B9A7E8'], ['Sun', '#FFC978'], ['Rose', '#F4A6C0']];
  function color() {
    var streak = 0;
    stage.innerHTML = '<h2>Color match</h2><p class="sub">Look at the glowing color, then tap the matching swatch.</p><div class="cwrap"><div class="corb" id="co"></div><div class="swatches" id="sw"></div></div><p class="msg" id="cm">Streak: 0</p>';
    function next() {
      var set = shuffle(COLORS).slice(0, 4), tgt = set[0];
      var co = $('#co'); co.style.color = tgt[1]; co.dataset.n = tgt[0];
      $('#sw').innerHTML = shuffle(set).map(function (c) { return '<button class="sw" style="background:' + c[1] + '" data-n="' + c[0] + '" aria-label="' + c[0] + '"></button>'; }).join('');
    }
    $('#sw').onclick = function (e) {
      var b = e.target.closest('.sw'); if (!b) return;
      if (b.dataset.n === $('#co').dataset.n) { streak++; MI.sound.sfx('ok'); MI.fx.burst(b, { count: 8, spread: 60 }); $('#cm').textContent = 'Streak: ' + streak + '. Nicely spotted.'; timers.push(setTimeout(next, 700)); }
      else { b.style.opacity = '.25'; streak = 0; MI.sound.sfx('error'); $('#cm').textContent = 'Not that one. Try again, no rush.'; }
    };
    next();
  }

  /* bubbles */
  var WORRIES = ['stress', 'worry', 'doubt', 'tension', 'rush', 'noise', 'fatigue', 'fear'];
  var BCOL = ['#9CC9B0', '#8FB4E8', '#B9A7E8', '#F4A6A0', '#FFC978'];
  function bubble() {
    var popped = 0;
    stage.innerHTML = '<h2>Bubble release</h2><p class="sub">Each bubble carries a worry. Pop it and let it go.</p><div class="bfield" id="bf"></div><p class="msg" id="bm">Released: 0</p>';
    var field = $('#bf');
    function spawn() {
      var size = 54 + Math.random() * 30, b = document.createElement('button');
      b.className = 'bub';
      b.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + Math.random() * (field.clientWidth - size) + 'px;bottom:-' + size + 'px;background:' + BCOL[Math.floor(Math.random() * BCOL.length)] + ';animation-duration:' + (6 + Math.random() * 4) + 's';
      b.textContent = WORRIES[Math.floor(Math.random() * WORRIES.length)]; b.setAttribute('aria-label', 'Pop the worry: ' + b.textContent);
      b.onclick = function () {
        b.classList.add('pop'); popped++; MI.sound.sfx('pop'); MI.fx.burst(b, { count: 7, spread: 50 }); $('#bm').textContent = popped >= 10 && popped % 10 === 0 ? 'Released: ' + popped + '. Take a slow breath.' : 'Released: ' + popped;
        setTimeout(function () { b.remove(); }, 320);
      };
      field.appendChild(b);
      setTimeout(function () { if (b.parentNode) b.remove(); }, 10500);
    }
    spawn(); timers.push(setInterval(spawn, 1100));
  }

  /* word tiles */
  var WORDS = [['CALM', 'A state of peace'], ['LOVE', 'The warmest feeling'], ['HOPE', 'Looking forward'], ['GROW', 'Getting better'], ['PEACE', 'Inner stillness'], ['BRAVE', 'Facing fear'], ['GRACE', 'Gentle strength'], ['BLOOM', 'What a flower does']];
  function word() {
    var wi = 0, w, letters, slots;
    stage.innerHTML = '<h2>Word tiles</h2><p class="sub" id="wh"></p><div class="slots" id="ws"></div><div class="tiles" id="wt"></div><p class="msg" id="wm"></p><div class="row"><button class="btn btn-ghost btn-sm" id="wc">Clear</button></div>';
    function load() {
      w = WORDS[wi % WORDS.length]; slots = [];
      do { letters = shuffle(w[0].split('')); } while (letters.join('') === w[0]);
      $('#wh').textContent = 'Hint: ' + w[1]; $('#wm').textContent = ''; draw();
    }
    function draw() {
      $('#ws').innerHTML = w[0].split('').map(function (_, i) { var s = slots[i]; return '<button class="slot' + (s ? ' fill' : '') + '" data-i="' + i + '" aria-label="Slot ' + (i + 1) + '">' + (s ? s.ch : '') + '</button>'; }).join('');
      $('#wt').innerHTML = letters.map(function (ch, i) {
        var used = slots.some(function (s) { return s && s.from === i; });
        return '<button class="tile' + (used ? ' used' : '') + '" data-i="' + i + '">' + ch + '</button>';
      }).join('');
    }
    function check() {
      var n = 0; slots.forEach(function (s) { if (s) n++; });
      if (n < w[0].length) return;
      var guess = w[0].split('').map(function (_, i) { return slots[i].ch; }).join('');
      if (guess === w[0]) { MI.sound.sfx('win'); MI.fx.burst($('#ws'), { count: 16 }); $('#wm').textContent = 'Yes. ' + w[0] + '. Hold that feeling.'; wi++; timers.push(setTimeout(load, 1500)); }
      else { MI.sound.sfx('error'); $('#wm').textContent = 'Not quite. Tap a letter to take it out.'; $('#ws').classList.add('shake'); setTimeout(function () { $('#ws').classList.remove('shake'); }, 450); }
    }
    $('#wt').onclick = function (e) {
      var t = e.target.closest('.tile'); if (!t) return;
      for (var i = 0; i < w[0].length; i++) if (!slots[i]) { slots[i] = { ch: letters[+t.dataset.i], from: +t.dataset.i }; break; }
      draw(); check();
    };
    $('#ws').onclick = function (e) { var s = e.target.closest('.slot'); if (!s) return; slots[+s.dataset.i] = null; $('#wm').textContent = ''; draw(); };
    $('#wc').onclick = function () { slots = []; $('#wm').textContent = ''; draw(); };
    load();
  }

  /* tap and breathe */
  function tap() {
    var cnt = 0, T = 4, phase = 'in', roundsDone = 0;
    stage.innerHTML = '<h2>Tap and breathe</h2><p class="sub">Tap the orb once for each count. Breathe in for four, then out for four.</p><button class="tap" id="tp" aria-label="Tap to count"><div><div class="n" id="tn">4</div><div class="p" id="tl">Breathe in</div></div></button><p class="msg" id="tm">Rounds: 0</p>';
    var el = $('#tp');
    el.onclick = function () {
      cnt++; MI.sound.sfx('tap');
      var frac = cnt / T; el.style.transform = 'scale(' + (phase === 'in' ? 1 + frac * .22 : 1.22 - frac * .22) + ')';
      if (cnt >= T) {
        cnt = 0; phase = phase === 'in' ? 'out' : 'in';
        if (phase === 'in') { roundsDone++; $('#tm').textContent = 'Rounds: ' + roundsDone; }
        $('#tl').textContent = phase === 'in' ? 'Breathe in' : 'Breathe out';
      }
      $('#tn').textContent = T - cnt;
    };
  }

  /* gratitude jar */
  var MARB = ['#FFC978', '#F4A6A0', '#B9A7E8', '#8EE3D0', '#8FB4E8', '#F7B6D2'];
  function jar() {
    var items = store.get('mindease.gratitude', []);
    stage.innerHTML = '<h2>Gratitude jar</h2><p class="sub">Add something you are grateful for and watch the jar glow.</p>' +
      '<div class="row" style="width:100%;max-width:420px"><input class="field" id="gi" placeholder="I\'m grateful for..." style="flex:1" maxlength="80"/><button class="btn btn-lamp btn-sm" id="ga">Add</button></div>' +
      '<div class="jar-wrap"><svg class="jar" viewBox="0 0 170 210" aria-hidden="true"><rect x="40" y="6" width="90" height="22" rx="8" fill="#D9A877"/><path d="M48 28h74v14c20 8 30 24 30 44v84a22 22 0 0 1-22 22H40a22 22 0 0 1-22-22V86c0-20 10-36 30-44z" fill="rgba(255,241,220,.08)" stroke="#FFF1DC" stroke-width="3" stroke-linejoin="round"/><g id="jm"></g></svg><div class="gnotes" id="gn"></div></div>';
    function draw() {
      var shown = items.slice(0, 28);
      $('#jm').innerHTML = shown.slice().reverse().map(function (_, i) {
        var row = Math.floor(i / 5), col = i % 5;
        var x = 40 + col * 22 + (row % 2 ? 11 : 0), y = 184 - row * 19;
        return '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + MARB[i % MARB.length] + '"><title>grateful</title></circle>';
      }).join('');
      $('#gn').innerHTML = items.length ? items.map(function (t, i) { return '<div class="gnote"><i style="background:' + MARB[(items.length - 1 - i) % MARB.length] + '"></i>' + esc(t) + '</div>'; }).join('') : '<p class="muted">Your jar is empty. Add the first thing.</p>';
    }
    function dropMarble() {
      var g = $('#jm'); if (!g || !g.lastChild || MI.fx.reduced) return;
      var m = g.lastChild; m.classList.add('drop');
    }
    function add() {
      var v = $('#gi').value.trim(); if (!v) { MI.toast('Write something first'); return; }
      items.unshift(v); store.set('mindease.gratitude', items); MI.emit('good-added'); $('#gi').value = ''; draw(); MI.sound.sfx('select'); dropMarble();
      if (items.length % 5 === 0) MI.toast(items.length + ' good things in your jar');
    }
    $('#ga').onclick = add; $('#gi').onkeydown = function (e) { if (e.key === 'Enter') add(); };
    draw();
  }

  /* start */
  var started = false;
  MI.start = function () {
    if (started) return; started = true;
    var h = (location.hash || '').replace('#', '');
    showPage(h && (route(h) || $('#page-' + h)) ? h : 'mood');
  };
  window.addEventListener('load', MI.start);
})();
