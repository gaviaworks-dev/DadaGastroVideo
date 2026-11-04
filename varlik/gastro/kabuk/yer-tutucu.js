/* Dar ekranda kısa yer tutucu — revize 20 Eki · madde 6/7 (Beyar). Kabuk her sayfaya enjekte eder (`KabukKimligi`).
 * Ölçüldü: ana sayfanın sekmeli arama kutusu 390'da 155 px iç genişlik taşıyor; yer tutucuların hiçbiri sığmıyordu (ör. "Tarif, püf,
 * rehber, şef ar"), "Malzemeye göre" metni 1440'ta da kesiliyordu. Sığmayan metin `data-ph-kisa`da kısa biçimiyle basılır; 640 px
 * altında o yazılır, üstünde uzun biçim geri gelir (pencere döndürülünce de). Sekme düğmelerinde değiştirilen öznitelik `data-ph`dir
 * (portal betiği sekme tıklamasında girdinin yer tutucusunu oradan okur); girdinin kendi yer tutucusu etkin sekmeden yazılır.
 * Metinler sayfaya basılı (dil dosyası); betik metin üretmez. Dolapta Ne Var kutusunu kendi betiği yönetir (`tarif-bulucu.js`). */
(function () {
  'use strict';
  var dar = window.matchMedia('(max-width: 640px)');
  function uygula() {
    document.querySelectorAll('[data-ph-kisa]').forEach(function (oge) {
      var oznitelik = oge.hasAttribute('data-ph') ? 'data-ph' : 'placeholder';
      if (!oge.hasAttribute('data-ph-uzun')) oge.setAttribute('data-ph-uzun', oge.getAttribute(oznitelik) || '');
      oge.setAttribute(oznitelik, dar.matches ? oge.getAttribute('data-ph-kisa') : oge.getAttribute('data-ph-uzun'));
    });
    document.querySelectorAll('.search-tabs').forEach(function (grup) {
      var etkin = grup.querySelector('button.active[data-ph]');
      var kart = grup.closest('.searchcard');
      var girdi = kart && kart.querySelector('input[name="q"]');
      if (etkin && girdi) girdi.placeholder = etkin.getAttribute('data-ph');
    });
  }
  if (dar.addEventListener) dar.addEventListener('change', uygula);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uygula);
  else uygula();
})();
