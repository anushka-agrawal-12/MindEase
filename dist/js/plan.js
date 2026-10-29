/* MindEase daily plan: a few small things to do each day. Shows on Today, the calendar and the journal. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = MI.esc, KEY = 'mindease.daily';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var DEFAULTS = [
    { id: 'checkin', label: 'Check in with your mood', auto: true, on: true },
    { id: 'breathe', label: 'Do one breathing round', auto: true, on: true },
    { id: 'journal', label: 'Write a line in your journal', auto: true, on: true },
    { id: 'good', label: 'Name one good thing', auto: true, on: true }
  ];
  function load() {
    var d = store.get(KEY, null);
    if (!d || !Array.isArray(d.tasks)) d = { tasks: DEFAULTS.map(function (t) { return Object.assign({}, t); }), done: {} };
    if (!d.done || typeof d.done !== 'object') d.done = {};
    return d;
  }
  function save(d) { d.u = Date.now(); store.set(KEY, d); }
  function today() { return MI.ymd(new Date()); }

  // things we can tell from the data itself, for any day
  function computed(ds) {
    var s = {};
    if (MI.logs.get().some(function (l) { return MI.ymd(new Date(l.t)) === ds; })) s.checkin = 1;
    var j = store.get('mindease.journal', {})[ds]; if (j && String(j).trim()) s.journal = 1;
    return s;
  }
  function doneIds(d, ds) {
    var set = {}; (d.done[ds] || []).forEach(function (i) { set[i] = 1; });
    var c = computed(ds); Object.keys(c).forEach(function (i) { set[i] = 1; });
    return set;
  }
  function summary(ds) {
    var d = load(), set = doneIds(d, ds), act = d.tasks.filter(function (t) { return t.on !== false; });
    var done = act.filter(function (t) { return set[t.id]; });
    return { done: done.length, total: act.length, tasks: act.map(function (t) { return { label: t.label, ok: !!set[t.id] }; }) };
  }
  function mark(id) {
    var d = load(), ds = today(), arr = d.done[ds] || [];
    if (arr.indexOf(id) < 0) { arr.push(id); d.done[ds] = arr; save(d); }
    refresh();
  }
  // keep today's saved list in step with what the data shows, so it syncs and a keeper can see it
  function settle() {
    var d = load(), ds = today(), arr = d.done[ds] || [], c = computed(ds), ch = false;
    Object.keys(c).forEach(function (i) { if (arr.indexOf(i) < 0) { arr.push(i); ch = true; } });
    if (ch) { d.done[ds] = arr; save(d); }
    var keys = Object.keys(d.done).sort();
    if (keys.length > 120) { keys.slice(0, keys.length - 120).forEach(function (k) { delete d.done[k]; }); save(d); }
  }

  var editing = false, celebrated = '';
  function ring(n, t) {
    var p = t ? n / t : 0, c = 2 * Math.PI * 20;
    return '<svg class="plan-ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,241,220,.16)" stroke-width="5"/><circle cx="24" cy="24" r="20" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 24 24)"/></svg>';
  }
  function draw() {
    var host = $('#planCard'); if (!host) return;
    var d = load(), ds = today(), set = doneIds(d, ds), act = d.tasks.filter(function (t) { return t.on !== false; });
    var n = act.filter(function (t) { return set[t.id]; }).length, h;
    h = '<div class="plan-top">' + ring(n, act.length) + '<div><span class="lbl" style="margin:0">Today\'s plan</span><p class="muted plan-sub" id="planSub">' +
      (act.length ? (n === act.length ? 'All done. That is a real win.' : n + ' of ' + act.length + ' done') : 'No tasks yet') + '</p></div>' +
      '<button class="btn btn-ghost btn-sm" id="planEdit" aria-expanded="' + editing + '">' + (editing ? 'Done' : 'Edit') + '</button></div>';
    h += '<ul class="plan-list">' + act.map(function (t) {
      var ok = !!set[t.id], manual = !t.auto;
      return '<li class="' + (ok ? 'ok' : '') + '"><label>' + (manual ? '<input type="checkbox" data-t="' + esc(t.id) + '"' + (ok ? ' checked' : '') + '/>' : '<span class="plan-dot" aria-hidden="true">' + (ok ? '✓' : '') + '</span>') +
        '<span>' + esc(t.label) + '</span>' + (!ok && t.auto ? '<small class="muted"> · goes in by itself</small>' : '') + '</label></li>';
    }).join('') + '</ul>';
    if (editing) {
      h += '<div class="plan-edit"><p class="muted">Switch tasks on or off, or add your own.</p>' + d.tasks.map(function (t) {
        return '<div class="plan-row"><label><input type="checkbox" data-on="' + esc(t.id) + '"' + (t.on !== false ? ' checked' : '') + '/> <span>' + esc(t.label) + '</span></label>' +
          (t.auto ? '' : '<button class="btn btn-ghost btn-sm" data-rm="' + esc(t.id) + '" aria-label="Remove ' + esc(t.label) + '">Remove</button>') + '</div>';
      }).join('') + '<div class="plan-add"><label class="sr" for="planNew">New task</label><input class="field" id="planNew" maxlength="60" placeholder="e.g. Take a 10-minute walk"/><button class="btn btn-lamp btn-sm" id="planAdd">Add</button></div></div>';
    }
    host.innerHTML = h;
    if (act.length && n === act.length && celebrated !== ds) {
      celebrated = ds;
      if (host.dataset.ready) { MI.toast('Daily plan complete. Well done.'); MI.sound.sfx('win'); MI.fx.burst($('.plan-ring', host)); }
    }
    host.dataset.ready = '1';
  }
  function refresh() { settle(); draw(); }

  document.addEventListener('click', function (e) {
    var host = $('#planCard'); if (!host || !host.contains(e.target)) return;
    var d = load();
    if (e.target.id === 'planEdit') { editing = !editing; draw(); return; }
    if (e.target.id === 'planAdd') {
      var v = ($('#planNew').value || '').trim(); if (!v) return;
      if (d.tasks.length >= 10) { MI.toast('Up to ten tasks'); return; }
      d.tasks.push({ id: 'c' + Date.now().toString(36), label: v.slice(0, 60), on: true }); save(d); draw(); var f = $('#planNew'); if (f) f.focus(); return;
    }
    var rm = e.target.closest('[data-rm]');
    if (rm) { d.tasks = d.tasks.filter(function (t) { return t.id !== rm.dataset.rm; }); save(d); draw(); }
  });
  document.addEventListener('change', function (e) {
    var host = $('#planCard'); if (!host || !host.contains(e.target)) return;
    var d = load(), ds = today(), id;
    if ((id = e.target.dataset.t)) {
      var arr = d.done[ds] || [], i = arr.indexOf(id);
      if (e.target.checked && i < 0) arr.push(id); else if (!e.target.checked && i > -1) arr.splice(i, 1);
      d.done[ds] = arr; save(d); MI.sound.sfx('tap'); draw();
    } else if ((id = e.target.dataset.on)) {
      d.tasks.forEach(function (t) { if (t.id === id) t.on = e.target.checked; }); save(d); draw();
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'planNew') { e.preventDefault(); $('#planAdd').click(); } });

  MI.on('logs', refresh); MI.on('page', refresh);
  MI.on('breath-done', function () { mark('breathe'); });
  MI.on('good-added', function () { mark('good'); });
  MI.plan = { summary: summary, refresh: refresh };
  refresh();
})();
