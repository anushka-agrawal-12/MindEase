/* MindEase sound: every sound is synthesized with the Web Audio API (no audio files).
   Sound effects, ambient beds (rain / ocean / warm hum), breathing cues and an optional voice guide. */
(function () {
  'use strict';
  var KEY = 'mindease.sound';
  var P = { sfx: true, ambient: 'off', voice: false, vol: 0.6 };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) for (var k in P) if (k in saved) P[k] = saved[k]; } catch (e) {}
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }

  var ctx = null, sfxBus = null, ambBus = null, ambNow = null, autoAmbient = false;

  /* ---------- building blocks (work on a live or an offline context) ---------- */
  function envGain(c, out, t, peak, att, dur) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out); return g;
  }
  function tone(c, out, t, o) {
    var dur = o.dur || 0.3, osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur * 0.9);
    osc.connect(envGain(c, out, t, o.peak || 0.3, o.att || 0.008, dur));
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function bell(c, out, t, f, dur, peak) {
    peak = peak || 0.3;
    tone(c, out, t, { f: f, dur: dur, peak: peak });
    tone(c, out, t, { f: f * 2.76, dur: dur * 0.5, peak: peak * 0.22 });
    tone(c, out, t, { f: f * 5.4, dur: dur * 0.25, peak: peak * 0.07 });
  }
  function noiseBuf(c, secs, kind) {
    var n = Math.floor(c.sampleRate * secs), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), i;
    if (kind === 'brown') {
      var last = 0;
      for (i = 0; i < n; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    } else if (kind === 'pink') {
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (i = 0; i < n; i++) {
        var x = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + x * 0.0555179; b1 = 0.99332 * b1 + x * 0.0750759; b2 = 0.969 * b2 + x * 0.153852;
        b3 = 0.8665 * b3 + x * 0.3104856; b4 = 0.55 * b4 + x * 0.5329522; b5 = -0.7616 * b5 - x * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362) * 0.11; b6 = x * 0.115926;
      }
    } else { for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    return b;
  }
  function noiseBurst(c, out, t, dur, freq, peak) {
    var src = c.createBufferSource(); src.buffer = noiseBuf(c, 0.2, 'white');
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.9;
    src.connect(bp); bp.connect(envGain(c, out, t, peak, 0.004, dur)); src.start(t); src.stop(t + dur + 0.05);
  }

  /* ---------- sound effects ---------- */
  var SFX = {
    tap:    function (c, o, t) { tone(c, o, t, { f: 640, f2: 430, dur: 0.11, peak: 0.2 }); },
    select: function (c, o, t) { tone(c, o, t, { f: 523.25, dur: 0.14, peak: 0.18, type: 'triangle' }); tone(c, o, t + 0.07, { f: 783.99, dur: 0.2, peak: 0.18, type: 'triangle' }); },
    save:   function (c, o, t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { bell(c, o, t + i * 0.09, f, 0.9, 0.15); }); },
    pop:    function (c, o, t) { tone(c, o, t, { f: 520, f2: 140, dur: 0.14, peak: 0.26 }); noiseBurst(c, o, t, 0.06, 2400, 0.12); },
    flip:   function (c, o, t) { noiseBurst(c, o, t, 0.05, 3200, 0.1); tone(c, o, t, { f: 210, f2: 150, dur: 0.07, peak: 0.12 }); },
    match:  function (c, o, t) { bell(c, o, t, 783.99, 0.7, 0.16); bell(c, o, t + 0.1, 1046.5, 0.9, 0.16); },
    error:  function (c, o, t) { tone(c, o, t, { f: 240, f2: 190, dur: 0.24, peak: 0.14, type: 'triangle' }); },
    toast:  function (c, o, t) { bell(c, o, t, 1318.5, 0.6, 0.1); },
    ok:     function (c, o, t) { bell(c, o, t, 659.25, 0.5, 0.14); bell(c, o, t + 0.09, 987.77, 0.7, 0.14); },
    win:    function (c, o, t) { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { bell(c, o, t + i * 0.1, f, 1.0, 0.14); }); },
    inhale: function (c, o, t) { tone(c, o, t, { f: 392, f2: 587.33, dur: 0.9, peak: 0.13, att: 0.25 }); tone(c, o, t, { f: 196, f2: 293.66, dur: 0.9, peak: 0.08, att: 0.25 }); },
    exhale: function (c, o, t) { tone(c, o, t, { f: 587.33, f2: 392, dur: 1.1, peak: 0.13, att: 0.2 }); tone(c, o, t, { f: 293.66, f2: 196, dur: 1.1, peak: 0.08, att: 0.2 }); },
    hold:   function (c, o, t) { tone(c, o, t, { f: 440, dur: 0.6, peak: 0.08, att: 0.15, type: 'triangle' }); },
    round:  function (c, o, t) { bell(c, o, t, 523.25, 1.2, 0.12); bell(c, o, t + 0.16, 783.99, 1.4, 0.12); }
  };
  // a short "hum" from Mo for each mood: [notes, gap, kind]
  var MOTIF = {
    veryhappy:   [[523.25, 659.25, 783.99, 1046.5], 0.085, 'bell'],
    happy:       [[523.25, 659.25, 783.99], 0.1, 'bell'],
    grateful:    [[349.23, 440, 523.25], 0.14, 'bell'],
    calm:        [[261.63, 392], 0.28, 'soft'],
    neutral:     [[293.66, 220], 0.22, 'soft'],
    tired:       [[220, 164.81], 0.34, 'soft'],
    sad:         [[220, 174.61], 0.34, 'soft'],
    anxious:     [[329.63, 349.23, 329.63], 0.09, 'soft'],
    overwhelmed: [[293.66, 311.13, 220], 0.11, 'soft'],
    angry:       [[110, 110], 0.14, 'low']
  };
  function motif(c, out, t, key) {
    var m = MOTIF[key] || MOTIF.calm;
    m[0].forEach(function (f, i) {
      var tt = t + i * m[1];
      if (m[2] === 'bell') bell(c, out, tt, f, 0.7, 0.14);
      else if (m[2] === 'low') tone(c, out, tt, { f: f, dur: 0.22, peak: 0.16, type: 'triangle' });
      else tone(c, out, tt, { f: f, dur: 0.6, peak: 0.13, type: 'triangle', att: 0.05 });
    });
  }

  /* ---------- ambient beds ---------- */
  function loopNoise(c, kind, secs) { var s = c.createBufferSource(); s.buffer = noiseBuf(c, secs || 6, kind); s.loop = true; return s; }
  function filt(c, type, f, q) { var b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }
  var AMB = {
    rain: function (c, out, live) {
      var s = loopNoise(c, 'pink'), hp = filt(c, 'highpass', 450), lp = filt(c, 'lowpass', 7200), g = c.createGain();
      g.gain.value = 0.55; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out); s.start();
      var timers = [];
      if (live) timers.push(setInterval(function () { noiseBurst(c, out, c.currentTime, 0.03, 3200 + Math.random() * 3500, 0.05 * Math.random()); }, 230));
      return { stop: function () { try { s.stop(); } catch (e) {} timers.forEach(clearInterval); } };
    },
    ocean: function (c, out) {
      var s = loopNoise(c, 'brown', 8), lp = filt(c, 'lowpass', 520), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), lfo2 = c.createOscillator(), lg2 = c.createGain();
      g.gain.value = 0.32; lfo.frequency.value = 0.1; lg.gain.value = 0.2; lfo.connect(lg); lg.connect(g.gain);
      lfo2.frequency.value = 0.07; lg2.gain.value = 260; lfo2.connect(lg2); lg2.connect(lp.frequency);
      s.connect(lp); lp.connect(g); g.connect(out); s.start(); lfo.start(); lfo2.start();
      return { stop: function () { try { s.stop(); lfo.stop(); lfo2.stop(); } catch (e) {} } };
    },
    hum: function (c, out) {
      var g = c.createGain(), lp = filt(c, 'lowpass', 760), trem = c.createOscillator(), tg = c.createGain(), oscs = [];
      g.gain.value = 0.6; trem.frequency.value = 0.16; tg.gain.value = 0.18; trem.connect(tg); tg.connect(g.gain);
      [[110, 0.16, -4], [164.81, 0.11, 3], [220, 0.08, -2], [277.18, 0.045, 5], [329.63, 0.03, 0]].forEach(function (n) {
        var o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = n[0]; o.detune.value = n[2]; og.gain.value = n[1];
        o.connect(og); og.connect(lp); o.start(); oscs.push(o);
      });
      lp.connect(g); g.connect(out); trem.start();
      return { stop: function () { try { oscs.forEach(function (o) { o.stop(); }); trem.stop(); } catch (e) {} } };
    }
  };

  /* ---------- live engine ---------- */
  function volume() { return Math.pow(P.vol, 1.6); }
  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.connect(comp);
      ambBus = ctx.createGain(); ambBus.gain.value = 0; ambBus.connect(comp);
      levels();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function levels() {
    if (!ctx) return;
    sfxBus.gain.setTargetAtTime(0.9 * volume(), ctx.currentTime, 0.03);
    ambBus.gain.setTargetAtTime(ambNow ? 0.5 * volume() : 0, ctx.currentTime, 0.4);
  }
  function startAmbient() {
    var c = ensure(); if (!c) return;
    if (ambNow && ambNow.name === P.ambient) return;
    stopAmbient(true);
    if (P.ambient === 'off' || !AMB[P.ambient]) { levels(); return; }
    ambNow = AMB[P.ambient](c, ambBus, true); ambNow.name = P.ambient;
    ambBus.gain.setValueAtTime(0, c.currentTime); levels();
  }
  function stopAmbient(instant) {
    if (!ambNow) return;
    var old = ambNow; ambNow = null;
    if (ctx) { ambBus.gain.setTargetAtTime(0, ctx.currentTime, instant ? 0.02 : 0.3); }
    setTimeout(function () { old.stop(); }, instant ? 60 : 1400);
  }

  /* ---------- voice guide ---------- */
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var vs = speechSynthesis.getVoices() || [];
    var pref = ['Samantha', 'Google UK English Female', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Microsoft Aria', 'Microsoft Zira'];
    for (var i = 0; i < pref.length; i++) for (var j = 0; j < vs.length; j++) if (vs[j].name.indexOf(pref[i]) > -1) return vs[j];
    for (var k = 0; k < vs.length; k++) if (/^en/i.test(vs[k].lang)) return vs[k];
    return vs[0] || null;
  }
  function speak(text) {
    if (!P.voice || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text); voice = voice || pickVoice(); if (voice) u.voice = voice;
      u.rate = 0.82; u.pitch = 1; u.volume = Math.min(1, 0.4 + P.vol * 0.6); speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- tiny event bus (shared with the rest of the site) ---------- */
  var MI = window.MI = window.MI || {};
  var handlers = {};
  if (!MI.on) {
    MI.on = function (e, f) { (handlers[e] = handlers[e] || []).push(f); };
    MI.emit = function (e, d) { (handlers[e] || []).forEach(function (f) { try { f(d); } catch (x) {} }); };
  }

  var S = {
    prefs: function () { return P; },
    unlock: function () { ensure(); if (autoAmbient && P.ambient !== 'off') startAmbient(); },
    autoAmbient: function (v) { autoAmbient = !!v; },
    sfx: function (name) { if (!P.sfx) return; var c = ensure(); if (!c || !SFX[name]) return; SFX[name](c, sfxBus, c.currentTime + 0.005); },
    mood: function (key) { if (!P.sfx) return; var c = ensure(); if (c) motif(c, sfxBus, c.currentTime + 0.005, key); },
    cue: function (kind, say) {
      var map = { 'in': 'inhale', out: 'exhale', hold: 'hold', hold2: 'hold' };
      if (P.sfx && map[kind]) S.sfx(map[kind]);
      if (say) speak(say);
    },
    speak: speak,
    setSfx: function (v) { P.sfx = !!v; persist(); MI.emit('sound'); },
    setVoice: function (v) { P.voice = !!v; persist(); if (!v && window.speechSynthesis) speechSynthesis.cancel(); MI.emit('sound'); },
    setVolume: function (v) { P.vol = Math.max(0, Math.min(1, v)); persist(); levels(); },
    setAmbient: function (n) { P.ambient = n; persist(); if (n === 'off') stopAmbient(); else startAmbient(); MI.emit('sound'); },
    stopAmbientNow: function () { stopAmbient(); },
    resumeAmbient: function () { if (P.ambient !== 'off') startAmbient(); },
    // renders a sound offline so its level can be checked without speakers
    measure: function (kind, name, secs) {
      var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; secs = secs || 1.6;
      var c = new OC(1, Math.floor(44100 * secs), 44100), out = c.createGain(); out.gain.value = 1; out.connect(c.destination);
      if (kind === 'amb') AMB[name](c, out, false); else if (kind === 'motif') motif(c, out, 0.01, name); else SFX[name](c, out, 0.01);
      return c.startRendering().then(function (buf) {
        var d = buf.getChannelData(0), peak = 0, sum = 0, i;
        for (i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; }
        return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4) };
      });
    },
    names: { sfx: Object.keys(SFX), amb: Object.keys(AMB), motif: Object.keys(MOTIF) }
  };
  MI.sound = S;

  document.addEventListener('pointerdown', function () { S.unlock(); }, { once: true, capture: true });
  document.addEventListener('keydown', function () { S.unlock(); }, { once: true, capture: true });
  if (window.speechSynthesis) { try { speechSynthesis.onvoiceschanged = function () { voice = null; }; } catch (e) {} }

  /* ---------- UI: speaker button + panel, and small reusable controls ---------- */
  var ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500z"/><path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500z"/><path d="M16 9.500l5 5M21 9.500l-5 5"/></svg>';
  var AMB_LABELS = [['off', 'Off'], ['rain', 'Rain'], ['ocean', 'Ocean'], ['hum', 'Warm hum']];

  S.ambientChips = function (host) {
    function draw() {
      host.innerHTML = AMB_LABELS.map(function (a) {
        return '<button class="chip" role="radio" aria-checked="' + (P.ambient === a[0]) + '" data-a="' + a[0] + '">' + a[1] + '</button>';
      }).join('');
    }
    host.setAttribute('role', 'radiogroup'); draw();
    host.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; S.unlock(); S.setAmbient(b.dataset.a); S.sfx('tap'); });
    MI.on('sound', draw);
  };
  S.switchEl = function (host, label, get, set) {
    function draw() { host.innerHTML = '<button class="switch" role="switch" aria-label="' + label + '" aria-checked="' + get() + '"><i></i></button><span>' + label + '</span>'; }
    host.className = (host.className + ' switch-row').trim(); draw();
    host.addEventListener('click', function () { S.unlock(); set(!get()); S.sfx('tap'); draw(); });
    MI.on('sound', draw);
  };
  S.mount = function (host) {
    host.classList.add('snd');
    host.innerHTML = '<button class="snd-btn" aria-haspopup="true" aria-expanded="false" aria-label="Sound settings"></button>' +
      '<div class="snd-panel glass-solid" hidden><p class="snd-h">Sound</p><div data-r="sfx"></div>' +
      '<p class="snd-l">Ambient background</p><div class="snd-chips" data-r="amb"></div>' +
      '<label class="snd-l" for="sndVol">Volume</label><input type="range" id="sndVol" min="0" max="1" step="0.05"/>' +
      (window.speechSynthesis ? '<div data-r="voice"></div><p class="snd-note">The voice guide speaks breathing steps out loud.</p>' : '') + '</div>';
    var btn = host.querySelector('.snd-btn'), panel = host.querySelector('.snd-panel'), vol = host.querySelector('#sndVol');
    function icon() { btn.innerHTML = (P.sfx || P.ambient !== 'off') ? ICON_ON : ICON_OFF; }
    icon(); MI.on('sound', icon);
    S.switchEl(host.querySelector('[data-r="sfx"]'), 'Sound effects', function () { return P.sfx; }, S.setSfx);
    S.ambientChips(host.querySelector('[data-r="amb"]'));
    var vr = host.querySelector('[data-r="voice"]'); if (vr) S.switchEl(vr, 'Voice guide', function () { return P.voice; }, S.setVoice);
    vol.value = P.vol; vol.addEventListener('input', function () { S.unlock(); S.setVolume(+vol.value); });
    vol.addEventListener('change', function () { S.sfx('tap'); });
    function open(v) { panel.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); S.unlock(); open(panel.hidden); });
    document.addEventListener('click', function (e) { if (!host.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  };
})();
