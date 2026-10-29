/* MindEase shared: Mo the mascot, mood list, and the mood-reactive sky */
(function () {
  var INK = '#2A2035';

  // order = happiest to heaviest, so the picker reads like a gentle scale
  var MOODS = [
    { key: 'veryhappy', v: 5, heavy: false,   label: 'Very happy',  emoji: '😄', sky: 'joyful',  color: '#FFD27A', say: 'Look at you glowing. Log it so you can remember it.' },
    { key: 'happy', v: 4, heavy: false,       label: 'Happy',       emoji: '🙂', sky: 'hopeful', color: '#FFB48A', say: 'A good moment is worth noticing.' },
    { key: 'grateful', v: 4.5, heavy: false,    label: 'Grateful',    emoji: '🥰', sky: 'hopeful', color: '#F7B6D2', say: 'Hold that warm feeling for one more breath.' },
    { key: 'calm', v: 4, heavy: false,        label: 'Calm',        emoji: '😌', sky: 'calm',    color: '#8EE3D0', say: 'Steady and soft. Keep it going.' },
    { key: 'neutral', v: 3, heavy: false,     label: 'Neutral',     emoji: '😐', sky: 'calm',    color: '#CFC6E8', say: 'Okay is okay. Nothing has to be big today.' },
    { key: 'tired', v: 2.5, heavy: false,       label: 'Tired',       emoji: '😴', sky: 'tired',   color: '#9FB2EA', say: 'Rest counts. Go easy on yourself.' },
    { key: 'sad', v: 1.5, heavy: true,         label: 'Sad',         emoji: '😔', sky: 'tired',   color: '#8FA3D9', say: "That sounds heavy. I'm here. Maybe a few slow breaths?" },
    { key: 'anxious', v: 1.5, heavy: true,     label: 'Anxious',     emoji: '😰', sky: 'anxious', color: '#F4A6A0', say: "That's a lot to carry. Let's slow things down together." },
    { key: 'overwhelmed', v: 1, heavy: true, label: 'Overwhelmed', emoji: '🤯', sky: 'anxious', color: '#C8B3FF', say: 'One small thing at a time. Start with a breath.' },
    { key: 'angry', v: 1.5, heavy: true,       label: 'Angry',       emoji: '😤', sky: 'anxious', color: '#FF8F7A', say: 'Big feelings need room. Try one long exhale.' }
  ];

  function get(key) {
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i].key === key) return MOODS[i];
    return MOODS[3];
  }

  var cheeks = function (o) {
    return '<circle cx="58" cy="122" r="9" fill="#FF8FA8" opacity="' + (o || .45) + '" stroke="none"/>' +
           '<circle cx="142" cy="122" r="9" fill="#FF8FA8" opacity="' + (o || .45) + '" stroke="none"/>';
  };
  var dots = '<circle class="eye" cx="74" cy="100" r="6" fill="' + INK + '" stroke="none"/><circle class="eye" cx="126" cy="100" r="6" fill="' + INK + '" stroke="none"/>';

  var FEATURES = {
    veryhappy: '<path d="M58 102q16-22 32 0M110 102q16-22 32 0"/><path d="M78 124q22 36 44 0z" fill="' + INK + '"/><path d="M92 143q8-9 16 0q-8 6-16 0z" fill="#FF8FA8" stroke="none"/>' + cheeks(.5),
    happy: dots + '<path d="M80 124q20 18 40 0"/>' + cheeks(),
    grateful: '<path d="M58 104q16 14 32 0M110 104q16 14 32 0"/><path d="M80 124q20 18 40 0"/>' + cheeks(.55) +
              '<path d="M150 66c-8-8-18 2-10 10l10 9l10-9c8-8-2-18-10-10z" fill="#FF7A8A" stroke="none"/>',
    calm: '<path d="M58 102q16 12 32 0M110 102q16 12 32 0"/><path d="M88 126q12 9 24 0"/>' + cheeks(.6),
    neutral: dots + '<path d="M84 128h32"/>',
    tired: '<path d="M58 102h32M110 102h32"/><path d="M64 111q10 6 20 0M116 111q10 6 20 0" stroke-width="3"/><path d="M88 132h24"/>' +
           '<text x="150" y="76" font-family="Fraunces,serif" font-weight="700" font-size="26" fill="' + INK + '" stroke="none">z</text>' +
           '<text x="168" y="52" font-family="Fraunces,serif" font-weight="700" font-size="18" fill="' + INK + '" stroke="none">z</text>',
    sad: dots + '<path d="M60 88l26-8M114 80l26 8"/><path d="M82 138q18-16 36 0"/><path d="M136 110q8 12 0 17q-8-5 0-17z" fill="#A8D8F0" stroke="none"/>',
    anxious: '<g class="eye"><circle cx="72" cy="102" r="13" fill="#FFF1DC"/><circle cx="72" cy="104" r="4" fill="' + INK + '" stroke="none"/></g><g class="eye"><circle cx="128" cy="102" r="13" fill="#FFF1DC"/><circle cx="128" cy="104" r="4" fill="' + INK + '" stroke="none"/></g>' +
             '<path d="M54 80l30-9M116 71l30 9"/><path d="M78 134q6-8 11 0t11 0t11 0"/>' +
             '<path d="M152 78q9 14 0 20q-9-6 0-20z" fill="#A8D8F0" stroke="none"/>',
    overwhelmed: '<path d="M74 100m-10 0a10 10 0 1 1 10 10a6 6 0 1 1-6-6a3 3 0 1 1 3 3" stroke-width="4"/>' +
                 '<path d="M126 100m-10 0a10 10 0 1 1 10 10a6 6 0 1 1-6-6a3 3 0 1 1 3 3" stroke-width="4"/>' +
                 '<path d="M76 136l8-7 8 7 8-7 8 7 8-7 8 7"/>',
    angry: '<path d="M54 76l30 14M146 76l-30 14"/><circle class="eye" cx="74" cy="104" r="5" fill="' + INK + '" stroke="none"/><circle class="eye" cx="126" cy="104" r="5" fill="' + INK + '" stroke="none"/>' +
           '<path d="M84 136q16-11 32 0"/>' + cheeks(.7)
  };

  function face(key, opts) {
    opts = opts || {};
    var m = get(key), size = opts.size ? ' width="' + opts.size + '" height="' + opts.size + '"' : '';
    var halo = opts.halo === false ? '' : '<circle cx="100" cy="104" r="92" fill="' + m.color + '" opacity=".18" stroke="none"/>';
    return '<svg class="mo ' + (opts.idle ? 'mo-idle ' : '') + (opts.cls || '') + '" viewBox="0 0 200 200"' + size + ' role="img" aria-label="Mo, feeling ' + m.label.toLowerCase() + '">' +
      halo +
      '<circle cx="100" cy="104" r="68" fill="' + m.color + '" stroke="none"/>' +
      '<ellipse cx="78" cy="72" rx="22" ry="12" fill="#fff" opacity=".28" transform="rotate(-24 78 72)" stroke="none"/>' +
      '<g fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' + FEATURES[m.key] + '</g></svg>';
  }

  // ----- the remembered mood / sky -----
  var KEY = 'mindease.mood';
  function saved() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function remember(k) { try { localStorage.setItem(KEY, k); } catch (e) {} }
  // ----- display preferences (theme, text size, contrast, motion, language) -----
  var PKEY = 'mindease.prefs';
  function getPrefs() { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } }
  function applyPrefs() {
    var p = getPrefs(), h = document.documentElement;
    h.setAttribute('data-size', p.size || 'm');
    h.setAttribute('data-contrast', p.contrast ? 'high' : 'normal');
    h.setAttribute('data-motion', p.motion === 'off' ? 'off' : 'auto');
    h.setAttribute('lang', p.lang === 'hi' ? 'hi' : 'en');
  }
  function setPrefs(patch) {
    var p = getPrefs(); for (var k in patch) p[k] = patch[k]; p.u = Date.now();
    try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {}
    applyPrefs(); applySky(lastSky); if (window.MI) MI.emit('prefs', p);
  }
  var lastSky = 'calm';
  function applySky(sky) {
    lastSky = sky; var t = getPrefs().theme;
    document.documentElement.setAttribute('data-sky', t && t !== 'auto' ? t : sky);
  }
  applyPrefs();
  function setMood(key, persist) {
    var m = get(key); applySky(m.sky);
    if (persist !== false) remember(key);
    return m;
  }
  // apply immediately so there is no flash of the wrong sky
  var s = saved(); if (s) applySky(get(s).sky); else applySky('calm');

  // ----- toast -----
  function toast(msg) {
    var host = document.querySelector('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; host.appendChild(t);
    setTimeout(function () { t.remove(); }, 3100);
  }

  var handlers = {};
  function on(e, f) { (handlers[e] = handlers[e] || []).push(f); }
  function emit(e, d) { (handlers[e] || []).forEach(function (f) { try { f(d); } catch (x) { if (window.console) console.error(x); } }); }
  function ymd(d) { d = d instanceof Date ? d : new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  window.MI = { prefs: { get: getPrefs, set: setPrefs }, on: on, emit: emit, ymd: ymd, esc: esc, MOODS: MOODS, get: get, face: face, saved: saved, setMood: setMood, toast: toast };
})();
