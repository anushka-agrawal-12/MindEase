/* MindEase motion helpers: sparkle bursts, fireflies, an occasional shooting star, scroll reveal */
(function () {
  'use strict';
  var MI = window.MI = window.MI || {};
  var reduced = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.getAttribute('data-motion') === 'off';
  function accent() { return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFC978'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  // sparkles that fly out from a point (or from the centre of an element)
  function burst(where, opts) {
    if (reduced) return;
    opts = opts || {};
    var x, y;
    if (where && where.getBoundingClientRect) { var r = where.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    else { x = where.x; y = where.y; }
    var colors = opts.colors || ['#FFC978', '#FFF1DC', accent(), '#F4A6A0'], n = opts.count || 14, spread = opts.spread || 90;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i'), a = (Math.PI * 2 * i) / n + rnd(-0.3, 0.3), d = rnd(spread * 0.5, spread);
      p.className = 'fx-p' + (i % 3 === 0 ? ' star' : '');
      p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + colors[i % colors.length] + ';--dx:' + Math.cos(a) * d + 'px;--dy:' + Math.sin(a) * d + 'px;width:' + rnd(5, 10) + 'px;height:' + rnd(5, 10) + 'px;animation-delay:' + rnd(0, 0.06) + 's';
      document.body.appendChild(p);
      setTimeout((function (el) { return function () { el.remove(); }; })(p), 1100);
    }
  }

  // a soft ring that expands behind an element (used when Mo changes mood)
  function bloom(host) {
    if (reduced || !host) return;
    var b = document.createElement('span'); b.className = 'bloom'; host.appendChild(b);
    setTimeout(function () { b.remove(); }, 1200);
  }

  // slow-drifting fireflies in the background
  function fireflies(n) {
    if (reduced) return;
    var host = document.querySelector('.ambient'); if (!host) return;
    for (var i = 0; i < (n || 8); i++) {
      var f = document.createElement('b'); f.className = 'ff';
      f.style.cssText = 'left:' + rnd(3, 97) + '%;top:' + rnd(35, 95) + '%;animation-duration:' + rnd(16, 30) + 's;animation-delay:-' + rnd(0, 24) + 's';
      host.appendChild(f);
    }
  }

  // one shooting star every so often
  function shootingStars() {
    if (reduced) return;
    function go() {
      if (!document.hidden) {
        var s = document.createElement('i'); s.className = 'shoot';
        s.style.cssText = 'left:' + rnd(45, 95) + '%;top:' + rnd(4, 22) + '%';
        document.body.appendChild(s); setTimeout(function () { s.remove(); }, 1800);
      }
      setTimeout(go, rnd(22000, 42000));
    }
    setTimeout(go, 7000);
  }

  // gentle reveal for sections as they scroll into view
  function reveal(sel) {
    var els = document.querySelectorAll(sel); if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) { for (var i = 0; i < els.length; i++) els[i].classList.add('in'); return; }
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    for (var j = 0; j < els.length; j++) {
      els[j].style.transitionDelay = ((j % 5) * 70) + 'ms';
      io.observe(els[j]);
    }
  }

  MI.fx = { burst: burst, bloom: bloom, fireflies: fireflies, shootingStars: shootingStars, reveal: reveal, reduced: reduced };
})();
