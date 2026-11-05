/* Video Mutfağı · şef kanalı (izle ajanı) — erişilebilir sekmeler (tablist: oklar, Home/End, #sekme adresi) + Takip Et (bellek).
   Takipçi sayısı basılmaz. */
(function () {
  'use strict';
  var kok = document.querySelector('[data-vd-kanal]');
  if (!kok) return;
  var sekmeler = Array.prototype.slice.call(kok.querySelectorAll('[role="tab"]'));
  function sec(s, odakla, adres) {
    sekmeler.forEach(function (x) {
      var on = x === s;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.classList.toggle('active', on); // Gastro .pf-tabs .dt.active
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

  /* Takip Et: hub'ın video.js'indeki ortak dinleyici (VD.takip, yakalama evresi) yönetir — burada dinleyici YOK. */
})();
