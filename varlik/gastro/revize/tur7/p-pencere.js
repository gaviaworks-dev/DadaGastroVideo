/* Revize 7 · madde 87 — sağ üst × VEKİL düğmesi.
 *
 * Kendi sürücüsü yalnız pencerenin karar düğmelerini bağlayan pencerelerde
 * (ör. BNP `#bnpOnay`: Vazgeç · İptal et) sağ üst ×, pencerenin "vazgeç"
 * yolunu tetikler: `data-pencere-vekil="<düğme kimliği>"`. Böylece × sürücünün
 * kendi kapanışından geçer (dinleyiciler sökülür, sonuç "hayır" döner) —
 * ikinci bir kapatma yolu kurulmaz.
 */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var x = e.target.closest && e.target.closest('[data-pencere-vekil]');
    if (!x) return;
    var hedef = document.getElementById(x.getAttribute('data-pencere-vekil'));
    if (!hedef) return;
    e.preventDefault();
    hedef.click();
  });
})();
