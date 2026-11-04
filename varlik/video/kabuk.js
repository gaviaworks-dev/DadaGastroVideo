/* Dada Gastro Video Mutfağı prototipi — kabuk davranışı (kabuk ajanı; tüm sayfalarda yüklü).
   · Yapışkan tek katman (Health/Kids R3 yapiskanKur birebir): Video sayfalarında aşağı kayınca YALNIZ Gastro header.header gizlenir
     (siyah üst bant + Video alt menüsü kalır); yukarı kayınca geri gelir. Mega menü/çekmece açıkken ya da header'da odak varken gizlenmez.
     Geçiş CSS'te (kabuk.css); reduced-motion'da anında.
   · --vd-ust-bosluk (alt menünün yapıştığı üst) ve --vd-bar-alt (alt menünün alt kenarı: sayfa yapışkan barları buna yapışır)
     CSS değişkenleri html'e yazılır. Değerler ölçümden gelir; kabuk.css aynı değerleri ölçümden önce tahminle verir (CLS 0).
   Kullanıcı verisi saklanmaz (localStorage/sessionStorage yok). */
(function () {
  'use strict';
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  function yapiskanKur() {
    var kok = document.documentElement, bar = $('.vd-ust');
    var sayfa = document.body.classList.contains('pg-video') && !!bar;
    if (!sayfa) return;
    var gastro = $$('header.header, .topbar, .ust-bant').filter(function (e, i, d) { return d.indexOf(e) === i; });
    var alt = 0, bant = 0, gizli = false, sonY = Math.max(0, scrollY), birikim = 0, bekliyor = false;
    function olc() {
      alt = 0; bant = 0;
      gastro.forEach(function (el) {
        var cs = getComputedStyle(el); if (cs.display === 'none' || !el.offsetHeight) return;
        if (cs.position === 'fixed' || cs.position === 'sticky') {
          var a = (parseFloat(cs.top) || 0) + el.offsetHeight; alt = Math.max(alt, a);
          if (!el.matches('header.header')) bant = Math.max(bant, a);
        }
      });
      alt = Math.round(alt); bant = Math.round(bant);
      kok.style.setProperty('--vd-gastro-alt', alt + 'px');
      kok.style.setProperty('--vd-bar-h', Math.round(bar.offsetHeight) + 'px');
      uygula();
    }
    function uygula() { kok.style.setProperty('--vd-ust-bosluk', (gizli ? bant : alt) + 'px'); kok.classList.toggle('vd-ust-gizli', gizli); }
    function acikMi() { return !!document.querySelector('.has-mega:hover, .has-mega:focus-within, .drawer.open, header.header:focus-within, .topbar:focus-within'); }
    function ayarla(y) { if (y !== gizli) { gizli = y; birikim = 0; uygula(); } }
    function kaydir() {
      bekliyor = false;
      var y = Math.max(0, scrollY), dy = y - sonY; sonY = y;
      if (y <= alt + 24 || acikMi()) { ayarla(false); return; }
      birikim = (dy > 0) === (birikim > 0) ? birikim + dy : dy;
      if (birikim > 10) ayarla(true); else if (birikim < -10) ayarla(false);
    }
    addEventListener('scroll', function () { if (!bekliyor) { bekliyor = true; requestAnimationFrame(kaydir); } }, { passive: true });
    addEventListener('resize', olc);
    gastro.forEach(function (el) { el.addEventListener('focusin', function () { ayarla(false); }); });
    olc(); setTimeout(olc, 400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(olc);
    kaydir();
    window.VDKabuk = { gizliMi: function () { return gizli; }, olc: olc };
  }

  /* Alt menü taşma gölgesi (390'da yatay kaydırılır) + etkin bağ görünür (ilk boyamada; kaydırma animasyonu yok) */
  function menuKur() {
    var m = $('.vd-ust__menu'); if (!m) return;
    function tasma() { m.classList.toggle('vd-tasma-sag', m.scrollLeft + m.clientWidth < m.scrollWidth - 2); m.classList.toggle('vd-tasma-sol', m.scrollLeft > 2); }
    var a = $('[aria-current="page"]', m);
    if (a) { var mr = m.getBoundingClientRect(), ar = a.getBoundingClientRect(); if (ar.right > mr.right - 8) m.scrollLeft += ar.right - (mr.right - 8) + 24; }
    m.addEventListener('scroll', tasma, { passive: true }); addEventListener('resize', tasma); tasma();
  }

  function basla() { yapiskanKur(); menuKur(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
