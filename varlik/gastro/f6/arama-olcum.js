/* G90 — tamamlanan arama. Gönderim yalnız mevcut, onaya bağlı dmAnalitik
   kapısından geçer; bu dosya Google yüklemez, çerez veya ayrı kuyruk yaratmaz. */
(function () {
  'use strict';
  function baslat() {
    var sozluk = document.getElementById('szSearch');
    var arama = document.getElementById('fsInput');
    // Dizinlerde arama header'dan açılır; sonuçların ölçümü ikinci bir
    // input'un varlığına bağlı olmamalı. Hata sayfasında sonuç alanı yoktur.
    var dizin = document.getElementById('lstGrid') || document.querySelector('.pufl-grid');
    if (!sozluk && !arama && !dizin) return;
    var yol = location.pathname;
    var yuzey = sozluk ? 'sozluk' : yol.indexOf('/tarifler') === 0 ? 'tarif' : yol === '/puf-noktalari' ? 'puf' : 'genel';
    var son = '';
    var zamanlayici;
    function gonder(metin) {
      var q = String(metin || '').trim();
      if (!q) { son = ''; return; }
      if (q === son) return;
      son = q;
      if (window.dmAnalitik && typeof window.dmAnalitik.olay === 'function') {
        /* Terim KIRPILMADAN verilir: `olay()` önce e-posta/telefonu ayıklar, sonra
           GA4'ün 100 karakter sınırına kırpar. Burada kırpılsaydı sınırda yarım kalan
           bir e-posta ya da numara desene uymaz ve ham giderdi. */
        window.dmAnalitik.olay('search', { search_term: q, search_surface: yuzey });
      }
    }
    var param = new URLSearchParams(location.search);
    var nav = performance.getEntriesByType('navigation')[0];
    if ((!nav || nav.type === 'navigate') && !(Number(param.get('page')) > 1 || Number(param.get('sayfa')) > 1)) {
      gonder(param.get('q'));
    } else {
      son = (param.get('q') || '').trim();
    }
    if (sozluk) {
      function tamamla() { clearTimeout(zamanlayici); gonder(sozluk.value); }
      sozluk.addEventListener('input', function () {
        clearTimeout(zamanlayici);
        zamanlayici = setTimeout(tamamla, 500);
      });
      sozluk.addEventListener('change', tamamla);
      sozluk.addEventListener('keydown', function (e) { if (e.key === 'Enter') tamamla(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat, { once: true });
  else baslat();
})();
