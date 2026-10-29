/* MindEase extras inside the "You" tab: weekly summary, programs, study mode, safety plan, settings.
   Everything is stored in this browser (and synced when signed in). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = MI.esc;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function save(key, obj) { obj.u = Date.now(); store.set(key, obj); }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  var DOWFULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  MI.subs = MI.subs || {};
  function addTab(id, label, fn, before) {
    var c = document.createElement('button'); c.className = 'chip'; c.dataset.p = id; c.textContent = label;
    var ref = before ? $('#yseg .chip[data-p="' + before + '"]') : null;
    $('#yseg').insertBefore(c, ref);
    var p = document.createElement('div'); p.className = 'panel'; p.id = 'yp-' + id; p.innerHTML = '<div id="x-' + id + '"></div>';
    $('#page-you').appendChild(p); MI.subs[id] = fn;
  }
  function openTab(id) { MI.go('you', id); }

  /* jump to another part of the app */
  function jump(a) {
    var pg = a[0];
    if (pg === 'you') { openTab(a[1]); return; }
    MI.go(pg);
    if (pg === 'breathe' && a[1] != null) { var t = $('.tech[data-i="' + a[1] + '"]'); if (t) t.click(); }
    if (pg === 'ground' && a[1]) { var c = $('#gseg .chip[data-p="' + a[1] + '"]'); if (c) c.click(); }
    if (pg === 'play' && a[1]) { var g = $('#gtabs .gtab[data-g="' + a[1] + '"]'); if (g) g.click(); }
  }

  /* ═════════ WEEKLY SUMMARY ═════════ */
  function range(offsetDays) {
    var end = new Date(); end.setHours(23, 59, 59, 999); end.setDate(end.getDate() - offsetDays);
    var start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    return [start, end];
  }
  function weekStats(logs, r) {
    var l = logs.filter(function (x) { var t = new Date(x.t); return t >= r[0] && t <= r[1]; });
    var days = {}, mood = {}, tag = {}, byDay = {};
    l.forEach(function (x) {
      var d = MI.ymd(new Date(x.t)); days[d] = 1; mood[x.k] = (mood[x.k] || 0) + 1;
      (byDay[d] = byDay[d] || []).push(MI.get(x.k).v);
      (x.tags || []).forEach(function (t) { tag[t] = (tag[t] || 0) + 1; });
    });
    var dayAvg = Object.keys(byDay).map(function (d) { return { d: d, v: avg(byDay[d]) }; }).sort(function (a, b) { return b.v - a.v; });
    var topMood = Object.keys(mood).sort(function (a, b) { return mood[b] - mood[a]; })[0];
    var topTag = Object.keys(tag).sort(function (a, b) { return tag[b] - tag[a]; })[0];
    return { n: l.length, days: Object.keys(days).length, avg: l.length ? avg(l.map(function (x) { return MI.get(x.k).v; })) : null,
             topMood: topMood, topTag: topTag, best: dayAvg.length >= 3 ? dayAvg[0] : null, hard: dayAvg.length >= 3 ? dayAvg[dayAvg.length - 1] : null };
  }
  function moodWord(v) { return v >= 4.2 ? 'bright' : v >= 3.4 ? 'steady' : v >= 2.6 ? 'mixed' : 'heavy'; }
  function dayName(ymd) { return DOWFULL[new Date(ymd + 'T12:00:00').getDay()]; }
  function weeklyLines() {
    var logs = MI.logs.get(), r1 = range(0), r0 = range(7), a = weekStats(logs, r1), b = weekStats(logs, r0), L = [];
    var fmt = function (d) { return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); };
    var head = fmt(r1[0]) + ' to ' + fmt(r1[1]);
    if (!a.n) return { head: head, lines: ['No check-ins this week yet. A quick one takes under a minute.'], mood: null, closing: 'Whenever you are ready, I am here.' };
    L.push('You checked in on ' + a.days + ' of 7 days (' + a.n + ' check-in' + (a.n === 1 ? '' : 's') + ').');
    L.push('Most common feeling: ' + MI.get(a.topMood).label + '.');
    L.push('Overall your week felt ' + moodWord(a.avg) + '.');
    if (a.best && a.hard && a.best.d !== a.hard.d) L.push('Easiest day: ' + dayName(a.best.d) + '. Hardest day: ' + dayName(a.hard.d) + '.');
    if (a.topTag) L.push('Most tagged: ' + MI.tagName(a.topTag) + '.');
    var closing = 'Thank you for showing up for yourself.';
    if (b.n && a.avg != null && b.avg != null) {
      var diff = a.avg - b.avg;
      if (diff >= 0.4) { L.push('That is a little brighter than last week.'); closing = 'Something is working. Notice what you did differently.'; }
      else if (diff <= -0.4) { L.push('That is a bit heavier than last week.'); closing = 'Harder weeks happen. Be gentle with yourself, and reach out to someone if it keeps feeling heavy.'; }
      else L.push('About the same as last week.');
    }
    return { head: head, lines: L, mood: a.topMood, closing: closing, heavy: a.avg < 2.6 };
  }
  function renderWeekly() {
    var w = weeklyLines(), host = $('#x-weekly');
    host.innerHTML = '<div class="glass pad" id="weeklyCard" style="max-width:720px"><div class="wk-head">' + (w.mood ? MI.face(w.mood, { halo: false }) : MI.face('calm', { halo: false })) +
      '<div><span class="lbl" style="margin:0">Your week with Mo</span><small class="muted">' + esc(w.head) + '</small></div></div>' +
      '<ul class="wk-list">' + w.lines.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="wk-close">' + esc(w.closing) + '</p>' +
      (w.heavy ? '<p class="small"><a href="#help" data-go="help" style="color:var(--accent);font-weight:700">See who you can reach</a></p>' : '') +
      '<div class="wk-btns" id="weeklyBtns"><button class="btn btn-lamp btn-sm" id="wkCopy">Copy summary</button><button class="btn btn-ghost btn-sm" id="wkPrint">Print or save as PDF</button></div></div>';
    $('#wkCopy').onclick = function () {
      var txt = 'MindEase, ' + w.head + '\n' + w.lines.join('\n') + '\n' + w.closing;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { MI.toast('Summary copied'); }, function () { MI.toast('Could not copy here'); });
    };
    $('#wkPrint').onclick = function () {
      document.body.classList.add('print-weekly');
      var done = function () { document.body.classList.remove('print-weekly'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done); window.print();
    };
  }

  /* ═════════ PROGRAMS ═════════ */
  var PROGRAMS = [
    { id: 'exam', name: 'Exam calm', blurb: 'Seven small steps to meet exams with a steadier mind.', days: [
      { t: 'Name the worry', d: 'Getting fears out of your head and onto paper makes them smaller and easier to look at.', a: [['you', 'journal', 'Open journal']], j: 'What am I most afraid might happen? How likely is it, really?' },
      { t: 'Make a small plan', d: 'Break studying into short blocks with breaks. Small and doable beats big and scary.', a: [['you', 'study', 'Open focus timer']], j: 'What are three small things I can do tomorrow?' },
      { t: 'Breathe before you begin', d: 'Before a study session, take four slow rounds of box breathing. It tells your body it is safe to focus.', a: [['breathe', 0, 'Box breathing']] },
      { t: 'Protect your sleep', d: 'Sleep helps memory. Keep a steady bedtime and put screens away 30 minutes earlier tonight.', a: [['you', 'journal', 'Open journal']], j: 'What will my wind-down look like tonight?' },
      { t: 'Talk back to the thought', d: 'Try swapping "I will fail" for "I have prepared, and I will do my best".', a: [['words', null, 'Kind words']], j: 'A kinder thing I can tell myself is...' },
      { t: 'Come back to the room', d: 'If your mind races, name five things you can see, four you can hear, and so on.', a: [['ground', 'senses', '5-4-3-2-1 grounding']] },
      { t: 'Exam day kit', d: 'Water, ID, a slow breath at the door, and one question at a time. You only need to do the next one.', a: [['breathe', 3, 'Belly breathing']], j: 'One thing that went well in my preparation was...' }
    ] },
    { id: 'sleep', name: 'Sleep wind-down', blurb: 'A week of gentle habits for an easier night. Not a treatment for sleep problems.', days: [
      { t: 'Pick your times', d: 'Choose a bedtime and a wake time you can keep, even on weekends.', a: [['you', 'journal', 'Open journal']], j: 'The bedtime and wake time I will try are...' },
      { t: 'Dim and unplug', d: 'Lower the lights and put your phone away 30 minutes before bed.', a: [['you', 'remind', 'Set a reminder']] },
      { t: 'Body scan in bed', d: 'Slowly notice each part of your body and let it soften.', a: [['ground', 'scan', 'Body scan']] },
      { t: 'Brain dump', d: 'Write tomorrow\'s tasks and worries on paper so your mind can let go of them.', a: [['you', 'journal', 'Open journal']], j: 'Things I am carrying that can wait until tomorrow:' },
      { t: 'A long exhale', d: 'The 4-7-8 pattern has a long out-breath, which helps the body slow down.', a: [['breathe', 1, '4-7-8 breathing']] },
      { t: 'Cool and quiet', d: 'A slightly cool, dark, quiet room helps most people. A cool splash on the face can also help you settle.', a: [['ground', 'cool', 'Temperature reset']] },
      { t: 'What helped?', d: 'Look back over the week and keep the two things that helped most.', a: [['you', 'journal', 'Open journal']], j: 'The two habits I want to keep are...' }
    ], note: 'If sleep trouble lasts for weeks, please talk to a doctor.' },
    { id: 'gentle', name: 'Gentle start', blurb: 'The basics of handling anxious moments, one tool a day.', days: [
      { t: 'What anxiety is', d: 'Anxiety is your body\'s alarm system. It feels awful, but it passes, and there are things that help.', a: [['you', 'journal', 'Open journal']], j: 'Where do I feel anxiety in my body?' },
      { t: 'Slow your breath', d: 'Even, slow breathing at about five seconds in and out calms the body.', a: [['breathe', 2, 'Coherence breathing']] },
      { t: 'Notice, do not fight', d: 'Try watching a worry like a cloud passing. You do not have to push it away.', a: [['you', 'journal', 'Open journal']], j: 'A worry I can let pass by today is...' },
      { t: 'Ground in the room', d: 'Using your senses brings attention back from "what if" to "right now".', a: [['ground', 'senses', '5-4-3-2-1 grounding']] },
      { t: 'Move a little', d: 'A ten-minute walk can ease tension. Notice how your body feels before and after.', a: [['you', 'journal', 'Open journal']], j: 'After moving, I feel...' },
      { t: 'Reach out', d: 'Telling one person you trust that you are having a hard time can lighten the load.', a: [['help', null, 'Open help page']] },
      { t: 'Build your toolkit', d: 'Look back at the week. Which tools helped most? Add them to your safety plan so they are easy to find.', a: [['you', 'safety', 'Open safety plan']] }
    ] }
  ];
  var progOpen = null;
  function progState() { return store.get('mindease.programs', {}); }
  function renderPrograms() {
    var host = $('#x-programs'), st = progState();
    if (!progOpen) {
      host.innerHTML = '<div class="prog-grid">' + PROGRAMS.map(function (p) {
        var done = (st[p.id] && st[p.id].done || []).length;
        return '<div class="glass pad prog-card"><h2>' + esc(p.name) + '</h2><p class="muted">' + esc(p.blurb) + '</p>' +
          '<div class="meter" style="margin:1rem 0 .5rem"><i style="width:' + (done / 7 * 100) + '%"></i></div><small class="muted">' + done + ' of 7 days done</small>' +
          '<div style="margin-top:1rem"><button class="btn btn-lamp btn-sm" data-open="' + p.id + '">' + (done ? (done === 7 ? 'Review' : 'Continue') : 'Start') + '</button></div></div>';
      }).join('') + '</div><p class="small muted" style="margin-top:1rem">These are gentle self-care routines, not treatment. If things feel too heavy, the Help page lists people you can call.</p>';
      $$('[data-open]', host).forEach(function (b) { b.onclick = function () { progOpen = b.dataset.open; renderPrograms(); }; });
      return;
    }
    var p = PROGRAMS.filter(function (x) { return x.id === progOpen; })[0], done = (st[p.id] && st[p.id].done) || [];
    var next = -1; for (var i = 0; i < 7; i++) { if (done.indexOf(i) === -1) { next = i; break; } }
    host.innerHTML = '<button class="btn btn-ghost btn-sm" id="progBack">Back to programs</button><h2 class="display" style="font-size:1.9rem;margin:1rem 0 .3rem">' + esc(p.name) + '</h2>' +
      '<div class="day-list">' + p.days.map(function (d, i) {
        var isDone = done.indexOf(i) > -1;
        return '<div class="glass pad day' + (isDone ? ' done' : '') + (i === next ? ' next' : '') + '"><div class="day-n">' + (isDone ? '✓' : (i + 1)) + '</div><div class="day-b"><h3>Day ' + (i + 1) + ': ' + esc(d.t) + (i === next ? ' <span class="today">Next step</span>' : '') + '</h3><p>' + esc(d.d) + '</p><div class="day-act">' +
          d.a.map(function (a, k) { return '<button class="btn btn-ghost btn-sm" data-act="' + i + ':' + k + '">' + esc(a[2]) + '</button>'; }).join('') +
          (d.j ? '<button class="btn btn-ghost btn-sm" data-jr="' + i + '">Journal prompt</button>' : '') +
          '<button class="btn ' + (isDone ? 'btn-ghost' : 'btn-lamp') + ' btn-sm" data-done="' + i + '">' + (isDone ? 'Undo' : 'Mark done') + '</button></div></div></div>';
      }).join('') + '</div>' + (p.note ? '<p class="small muted" style="margin-top:1rem">' + esc(p.note) + '</p>' : '');
    $('#progBack').onclick = function () { progOpen = null; renderPrograms(); };
    $$('[data-act]', host).forEach(function (b) { b.onclick = function () { var ij = b.dataset.act.split(':'); jump(p.days[+ij[0]].a[+ij[1]]); }; });
    $$('[data-jr]', host).forEach(function (b) { b.onclick = function () { MI.journalPrompt = p.days[+b.dataset.jr].j; openTab('journal'); }; });
    $$('[data-done]', host).forEach(function (b) {
      b.onclick = function () {
        var s2 = progState(), i2 = +b.dataset.done; s2[p.id] = s2[p.id] || { done: [] };
        var at = s2[p.id].done.indexOf(i2);
        if (at > -1) s2[p.id].done.splice(at, 1); else { s2[p.id].done.push(i2); MI.sound.sfx('ok'); MI.fx.burst(b, { count: 10, spread: 60 }); if (s2[p.id].done.length === 7) MI.toast('Program complete. Well done.'); }
        save('mindease.programs', s2); renderPrograms();
      };
    });
  }

  /* ═════════ STUDY MODE ═════════ */
  var T = { mode: 'focus', total: 25 * 60, end: 0, left: 25 * 60, running: false, tick: null };
  function study() { return store.get('mindease.study', { focus: 25, exam: null, count: 0, day: '' }); }
  function todayCount() { var s = study(); return s.day === MI.ymd(new Date()) ? s.count : 0; }
  function fmt(sec) { sec = Math.max(0, Math.round(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }
  function setMode(mode) {
    var s = study(); T.mode = mode; T.total = (mode === 'focus' ? s.focus : (s.focus >= 50 ? 10 : 5)) * 60; T.left = T.total; T.running = false; clearInterval(T.tick); T.end = 0;
  }
  function drawTimer() {
    var el = $('#stTime'); if (!el) return;
    el.textContent = fmt(T.left); $('#stMode').textContent = T.mode === 'focus' ? 'Focus' : 'Break';
    $('#stFill').style.width = (100 - T.left / T.total * 100) + '%'; $('#stGo').textContent = T.running ? 'Pause' : (T.left < T.total ? 'Resume' : 'Start');
    $('#stCount').textContent = todayCount();
    $('#stBreak').hidden = T.mode !== 'break';
  }
  function tickTimer() {
    T.left = Math.max(0, (T.end - Date.now()) / 1000);
    document.title = T.running ? fmt(T.left) + ' · MindEase' : 'MindEase — your cozy corner';
    if (T.left <= 0) {
      clearInterval(T.tick); T.running = false; MI.sound.sfx('win');
      if (T.mode === 'focus') {
        var s = study(), d = MI.ymd(new Date()); s.count = (s.day === d ? s.count : 0) + 1; s.day = d; save('mindease.study', s);
        MI.toast('Focus session done. Time for a short break.'); notify('Focus session done. Take a short break.'); setMode('break');
      } else { MI.toast('Break over. Ready for another round?'); notify('Break over.'); setMode('focus'); }
      document.title = 'MindEase — your cozy corner';
    }
    drawTimer();
  }
  function notify(msg) { try { if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification('MindEase', { body: msg }); } catch (e) {} }
  function renderStudy() {
    var s = study(), host = $('#x-study');
    var days = s.exam && s.exam.date ? Math.ceil((new Date(s.exam.date + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000) : null;
    host.innerHTML = '<div class="study-grid"><div class="glass pad"><span class="lbl">Focus timer</span><p class="muted" style="margin-bottom:1rem">Work in short blocks, rest in between.</p>' +
      '<div class="chips-row" id="stPresets" role="radiogroup" aria-label="Focus length">' + [15, 25, 50].map(function (m) { return '<button class="chip" role="radio" aria-checked="' + (s.focus === m) + '" data-m="' + m + '">' + m + ' min</button>'; }).join('') + '</div>' +
      '<div class="st-clock"><small id="stMode" class="muted"></small><div id="stTime" class="st-time" aria-live="off">25:00</div><div class="meter"><i id="stFill"></i></div></div>' +
      '<div class="wk-btns"><button class="btn btn-lamp" id="stGo">Start</button><button class="btn btn-ghost" id="stReset">Reset</button></div>' +
      '<button class="btn btn-ghost btn-sm" id="stBreak" style="margin-top:.8rem" hidden>Take a breathing break</button>' +
      '<p class="muted" style="margin-top:1rem">Focus sessions finished today: <b id="stCount" style="color:var(--cream)">0</b></p></div>' +
      '<div class="glass pad"><span class="lbl">Exam countdown</span>' +
      (days !== null ? '<div class="exam-n"><b>' + (days > 0 ? days : (days === 0 ? 'Today' : 'Done')) + '</b><span>' + (days > 0 ? (days === 1 ? 'day to ' : 'days to ') : '') + esc(s.exam.name || 'your exam') + '</span></div>' : '<p class="muted">Add your next exam to see how many days are left.</p>') +
      '<label class="lbl" for="exName">Exam name</label><input class="field" id="exName" maxlength="40" value="' + esc(s.exam ? s.exam.name || '' : '') + '" placeholder="e.g. Semester exam"/>' +
      '<label class="lbl" for="exDate">Date</label><input class="field" id="exDate" type="date" value="' + esc(s.exam ? s.exam.date || '' : '') + '"/>' +
      '<div class="wk-btns"><button class="btn btn-ghost btn-sm" id="exSave">Save</button>' + (s.exam ? '<button class="btn btn-ghost btn-sm" id="exClear">Remove</button>' : '') + '</div>' +
      '<p class="small muted" style="margin-top:1rem">Tip: the Exam calm program pairs well with this.</p></div></div>';
    $('#stPresets').onclick = function (e) {
      var b = e.target.closest('.chip'); if (!b) return; var st = study(); st.focus = +b.dataset.m; save('mindease.study', st); setMode('focus'); renderStudy();
    };
    $('#stGo').onclick = function () {
      if (T.running) { T.running = false; clearInterval(T.tick); T.left = Math.max(0, (T.end - Date.now()) / 1000); }
      else { T.running = true; T.end = Date.now() + T.left * 1000; clearInterval(T.tick); T.tick = setInterval(tickTimer, 250);
        try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} }
      drawTimer();
    };
    $('#stReset').onclick = function () { setMode('focus'); document.title = 'MindEase — your cozy corner'; drawTimer(); };
    $('#stBreak').onclick = function () { jump(['breathe', 4]); };
    $('#exSave').onclick = function () { var st = study(), d = $('#exDate').value; st.exam = d ? { name: $('#exName').value.trim(), date: d } : null; save('mindease.study', st); MI.toast('Saved'); renderStudy(); };
    var ec = $('#exClear'); if (ec) ec.onclick = function () { var st = study(); st.exam = null; save('mindease.study', st); renderStudy(); };
    if (!T.running) { if (T.total !== study().focus * 60 && T.mode === 'focus' && T.left === T.total) setMode('focus'); }
    drawTimer();
  }

  /* ═════════ SAFETY PLAN ═════════ */
  function plan() { return store.get('mindease.safety', { signs: '', helps: '', people: [{ n: '', p: '' }, { n: '', p: '' }, { n: '', p: '' }], place: '', reasons: '' }); }
  function renderSafety() {
    var p = plan(), host = $('#x-safety'), timer = null;
    while (p.people.length < 3) p.people.push({ n: '', p: '' });
    host.innerHTML = '<div class="glass pad" style="max-width:760px"><h2 class="display" style="font-size:1.7rem;margin-bottom:.3rem">My safety plan</h2>' +
      '<p class="muted">Fill this in while you are feeling okay. It is for harder moments, when it is difficult to think clearly. It also shows on the Help page.</p>' +
      '<label class="lbl" for="spSigns">Signs that things are getting hard for me</label><textarea class="field" id="spSigns" rows="2" placeholder="e.g. I stop eating well, I cannot sleep, I pull away from people">' + esc(p.signs) + '</textarea>' +
      '<label class="lbl" for="spHelps">Things that help me calm down</label><textarea class="field" id="spHelps" rows="2" placeholder="e.g. box breathing, a walk, music, tea">' + esc(p.helps) + '</textarea>' +
      '<span class="lbl">People I can reach out to</span>' + p.people.slice(0, 3).map(function (x, i) {
        return '<div class="sp-person"><input class="field" aria-label="Person ' + (i + 1) + ' name" data-pn="' + i + '" placeholder="Name" maxlength="40" value="' + esc(x.n) + '"/><input class="field" aria-label="Person ' + (i + 1) + ' phone" data-pp="' + i + '" placeholder="Phone" maxlength="20" inputmode="tel" value="' + esc(x.p) + '"/></div>';
      }).join('') +
      '<label class="lbl" for="spPlace">A place where I feel safe</label><input class="field" id="spPlace" maxlength="80" value="' + esc(p.place) + '"/>' +
      '<label class="lbl" for="spReasons">What matters to me</label><textarea class="field" id="spReasons" rows="2" placeholder="People, goals, small joys">' + esc(p.reasons) + '</textarea>' +
      '<p class="small muted" style="margin-top:1rem" id="spState">Saved on this device as you type.</p>' +
      '<p class="small" style="margin-top:.6rem">If you are in danger right now, call <a href="tel:112" style="color:var(--accent);font-weight:700">112</a>. For free support any time in India, call <a href="tel:14416" style="color:var(--accent);font-weight:700">Tele-MANAS 14416</a>.</p></div>';
    function collect() {
      var o = { signs: $('#spSigns').value, helps: $('#spHelps').value, place: $('#spPlace').value, reasons: $('#spReasons').value, people: [] };
      for (var i = 0; i < 3; i++) o.people.push({ n: $('[data-pn="' + i + '"]').value, p: $('[data-pp="' + i + '"]').value });
      return o;
    }
    host.oninput = function () { clearTimeout(timer); $('#spState').textContent = 'Saving…'; timer = setTimeout(function () { save('mindease.safety', collect()); $('#spState').textContent = 'Saved on this device as you type.'; helpPlan(); }, 500); };
  }
  function telHref(p) { var c = String(p || '').replace(/[^\d+]/g, ''); return c.length >= 3 ? 'tel:' + c : ''; }
  function helpPlan() {
    var grid = $('#page-help .help-grid'); if (!grid) return;
    var old = $('#helpPlan'); if (old) old.remove();
    var p = store.get('mindease.safety', null); if (!p) return;
    var people = (p.people || []).filter(function (x) { return x.n || x.p; });
    if (!p.signs && !p.helps && !people.length && !p.place && !p.reasons) return;
    var h = '<div class="glass pad help-card wide" id="helpPlan"><h2>My safety plan</h2>';
    function row(label, v) { return v ? '<p><b>' + label + '</b><br>' + esc(v).replace(/\n/g, '<br>') + '</p>' : ''; }
    h += row('Signs things are getting hard', p.signs) + row('What helps me calm down', p.helps);
    if (people.length) h += '<p><b>People I can reach</b></p><div class="row" style="margin-bottom:1rem">' + people.map(function (x) {
      var href = telHref(x.p); return href ? '<a class="btn btn-lamp btn-sm" href="' + esc(href) + '">' + esc(x.n || x.p) + '</a>' : '<span class="chip">' + esc(x.n) + '</span>';
    }).join('') + '</div>';
    h += row('A safe place', p.place) + row('What matters to me', p.reasons) + '<button class="btn btn-ghost btn-sm" id="editPlan">Edit my plan</button></div>';
    grid.insertBefore((function () { var d = document.createElement('div'); d.innerHTML = h; return d.firstChild; })(), grid.children[1] || null);
    $('#editPlan').onclick = function () { openTab('safety'); };
  }
  MI.on('page', function (id) { if (id === 'help') helpPlan(); });

  /* ═════════ SETTINGS ═════════ */
  var SKIES = [['auto', 'Follow my mood'], ['calm', 'Teal night'], ['anxious', 'Ember'], ['hopeful', 'Violet'], ['tired', 'Midnight blue'], ['joyful', 'Amber']];
  function renderSettings() {
    var p = MI.prefs.get(), host = $('#x-settings');
    host.innerHTML = '<div class="glass pad" style="max-width:640px"><h2 class="display" style="font-size:1.6rem;margin-bottom:1rem">Display and language</h2>' +
      '<span class="lbl">Sky colors</span><div class="snd-chips" id="stTheme" role="radiogroup" aria-label="Sky colors">' + SKIES.map(function (s) { return '<button class="chip" role="radio" aria-checked="' + ((p.theme || 'auto') === s[0]) + '" data-v="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>' +
      '<span class="lbl" style="margin-top:1.3rem">Text size</span><div class="snd-chips" id="stSize" role="radiogroup" aria-label="Text size">' + [['m', 'Normal'], ['l', 'Large'], ['xl', 'Extra large']].map(function (s) { return '<button class="chip" role="radio" aria-checked="' + ((p.size || 'm') === s[0]) + '" data-v="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>' +
      '<div id="stContrast" style="margin-top:1.3rem"></div><div id="stMotion"></div>' +
      '<span class="lbl" style="margin-top:1.3rem">Language</span><div class="snd-chips" id="stLang" role="radiogroup" aria-label="Language"><button class="chip" role="radio" aria-checked="' + (p.lang !== 'hi') + '" data-v="en">English</button><button class="chip" role="radio" aria-checked="' + (p.lang === 'hi') + '" data-v="hi">हिन्दी</button></div>' +
      '<p class="small muted" style="margin-top:.6rem">Hindi covers the main screens. Some content, like affirmations and games, stays in English for now.</p></div>';
    function radio(id, key, after) {
      $(id).onclick = function (e) {
        var b = e.target.closest('.chip'); if (!b) return; var o = {}; o[key] = b.dataset.v; MI.prefs.set(o);
        $$('.chip', $(id)).forEach(function (c) { c.setAttribute('aria-checked', c === b ? 'true' : 'false'); }); if (after) after();
      };
    }
    radio('#stTheme', 'theme'); radio('#stSize', 'size'); radio('#stLang', 'lang', function () { setTimeout(function () { location.reload(); }, 150); });
    MI.sound.switchEl($('#stContrast'), 'High contrast', function () { return !!MI.prefs.get().contrast; }, function (v) { MI.prefs.set({ contrast: v }); });
    MI.sound.switchEl($('#stMotion'), 'Reduce motion and sparkles', function () { return MI.prefs.get().motion === 'off'; }, function (v) { MI.prefs.set({ motion: v ? 'off' : 'auto' }); });
  }

  /* ═════════ register ═════════ */
  addTab('weekly', 'Weekly', renderWeekly, 'remind');
  addTab('programs', 'Programs', renderPrograms, 'remind');
  addTab('study', 'Study', renderStudy, 'remind');
  addTab('safety', 'Safety plan', renderSafety, 'remind');
  addTab('settings', 'Settings', renderSettings, null);
  helpPlan();
})();
