/* Video Mutfağı · şef kanalı (izle ajanı) — erişilebilir sekmeler (tablist: oklar, Home/End, #sekme adresi) + Takip Et (bellek).
   Takipçi sayısı basılmaz. */
(function () {
  'use strict';
  var kok = document.querySelector('[data-vd-kanal]');
  if (!kok) return;
  var bildir = function (a, b) { if (window.vdBildir) return window.vdBildir(a, b); if (window.VD && window.VD.bildirim) window.VD.bildirim(b ? a + ' · ' + b : a); };
  var sekmeler = Array.prototype.slice.call(kok.querySelectorAll('[role="tab"]'));
  function sec(s, odakla, adres) {
    sekmeler.forEach(function (x) {
      var on = x === s;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (odakla) s.focus();
    if (adres !== false) try { history.replaceState(history.state, '', '#' + s.getAttribute('data-vd-sekme')); } catch (_) {}
    var bar = s.parentNode;
    var sol = s.offsetLeft - bar.offsetLeft;
    if (sol < bar.scrollLeft || sol + s.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollTo({ left: Math.max(0, sol - 16), behavior: 'smooth' });
  }
  sekmeler.forEach(function (s, i) {
    s.addEventListener('click', function () { sec(s); });
    s.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % sekmeler.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + sekmeler.length) % sekmeler.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = sekmeler.length - 1;
      if (j === null) return;
      e.preventDefault(); sec(sekmeler[j], true);
    });
  });
  function hashSekme() {
    var h = (location.hash || '').slice(1);
    var s = sekmeler.filter(function (x) { return x.getAttribute('data-vd-sekme') === h; })[0];
    if (s) sec(s, false, false);
  }
  hashSekme();
  window.addEventListener('hashchange', hashSekme);

  kok.querySelectorAll('[data-vd-takip]').forEach(function (d) {
    d.addEventListener('click', function () {
      var on = d.getAttribute('aria-pressed') !== 'true';
      d.setAttribute('aria-pressed', on ? 'true' : 'false');
      var i = d.querySelector('i'); if (i) i.className = 'fa-solid ' + (on ? 'fa-check' : 'fa-user-plus');
      var y = d.querySelector('span'); if (y) y.textContent = on ? 'Takip ediliyor' : 'Takip Et';
      var ad = d.getAttribute('data-ad') || 'Şef';
      bildir(on ? ad + ' takip ediliyor' : ad + ' takipten çıkarıldı', 'Prototip örneği · sayfa açıkken hatırlanır');
    });
  });
})();
