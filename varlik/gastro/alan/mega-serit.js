/* =====================================================================
   donör: https://gaviaworks-dev.github.io/DadaSaglik/tarifler.html · varlik/saglik/saglik.js (DadaSaglik main = bdb53ef)
   MEGA MENÜ İKİLİ ŞERİDİ DÖNGÜSÜ — yalnız `html.sg-js` + `megaDonguKur` (gövde BİREBİR) + `$$` yardımcısı (birebir).
   Her Gastro sayfasında `x-alan.mega-serit` yükler (@once); `/alan/alan.js` bu işlevi artık TAŞIMAZ (iki betik aynı sayfada
   ikişer zamanlayıcı kurmasın diye oradan çıkarıldı). Depo erişimi yok.
   ===================================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('sg-js');
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  /* Mega menü yuvası: Sağlık ↔ Kids şeritleri 6 sn'de bir; fare/odakta durur; reduced-motion'da otomatik geçiş yok (noktalarla elle) */
  function megaDonguKur() {
    $$('[data-sg-dongu]').forEach(function (y) {
      var ogeler = $$('[data-sg-dongu-oge]', y), i = 0, dur = false, sure = null;
      if (ogeler.length < 2) return;
      function goster(n) {
        i = (n + ogeler.length) % ogeler.length;
        ogeler.forEach(function (o, k) { o.classList.toggle('sg-dongu-aktif', k === i); if (k === i) o.removeAttribute('aria-hidden'); else o.setAttribute('aria-hidden', 'true'); $$('a', o).forEach(function (a) { if (k === i) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); }); });
        $$('[data-sg-dongu-git]', y).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sg-dongu-git') === ogeler[i].getAttribute('data-sg-dongu-oge'))); });
      }
      $$('[data-sg-dongu-git]', y).forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); goster(ogeler.map(function (o) { return o.getAttribute('data-sg-dongu-oge'); }).indexOf(b.getAttribute('data-sg-dongu-git'))); }); });
      y.addEventListener('mouseenter', function () { dur = true; }); y.addEventListener('mouseleave', function () { dur = false; });
      y.addEventListener('focusin', function () { dur = true; }); y.addEventListener('focusout', function () { dur = false; });
      goster(0);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) sure = setInterval(function () { if (!dur && !document.hidden) goster(i + 1); }, 6000);
      y._sgDongu = goster;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', megaDonguKur); else megaDonguKur();   // [alan] saglik.js basla()'daki çağrının karşılığı
})();
