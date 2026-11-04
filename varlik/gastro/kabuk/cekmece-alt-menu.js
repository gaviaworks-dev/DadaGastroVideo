/* ÇEKMECE ALT MENÜ DÜĞMESİ — Revize 5 · madde 56.
 *
 * Mobil menüdeki "Tarifler" ve "Mutfak Sırları" satırlarının ok düğmesi
 * (`.d-has-sub > .d-row > .d-toggle`) ölüydü: prototipin portal betiği
 * dinleyiciyi `.d-has-sub > .d-link`e bağlıyor, oysa markup'ta bağ `.d-row`un
 * içinde — seçici hiçbir öğeyi bulmuyor. Canlı donörde de aynı düğme ölü
 * (ölçüldü). Çalışan davranış markanın kabuk kaynağından alındı: FIT kabuğu
 * (`deneme/fit-*.html`) `.d-toggle` tıklamasında en yakın `.d-item`in `open`
 * sınıfını çevirir; açık hâli kanonun CSS'i çiziyor (`.d-item.open > .d-sub`
 * yükseklik, `.d-toggle i` dönüşü). Buna yalnız `aria-expanded` eşlemesi eklenir.
 * Portal betiğiyle çift tetik olmaz: onun seçicisi bu düğmeye hiç uymuyor.
 * 🔴 Ama üye sayfaları FIT kabuğunun gömülü kopyasını da yüklüyor
 * (`kanon/gomulu/j-b11cff639f21.js`) ve orada düğme ZATEN çalışıyor; ikinci bir
 * dinleyici aynı tıklamada sınıfı iki kez çevirip düğmeyi yeniden öldürüyordu
 * (ölçüldü: /hesabim/cozum-merkezi, tık sonrası `open` yok). Bu yüzden tıklamanın
 * başındaki durum yakalama evresinde kaydedilir; durum bu dinleyiciye gelene dek
 * değişmişse başka bir betik çevirmiştir — yalnız `aria-expanded` eşlenir.
 * Build dosyası, kanon ve 64 Blade kopyası değişmez.
 */
(function () {
  'use strict';

  var SECICI = '#drawer .d-has-sub > .d-row > .d-toggle';
  var baslangic = null;

  function kur() {
    var cekmece = document.getElementById('drawer');
    if (!cekmece || cekmece.dataset.altMenuBagli === '1') return;
    cekmece.dataset.altMenuBagli = '1';
    // Yakalama evresi her hedef dinleyicisinden önce koşar: tıklamanın başındaki hâl.
    document.addEventListener('click', function (e) {
      var dugme = e.target.closest && e.target.closest(SECICI);
      baslangic = dugme ? dugme.closest('.d-item').classList.contains('open') : null;
    }, true);
    [].forEach.call(cekmece.querySelectorAll(SECICI), function (dugme) {
      var oge = dugme.closest('.d-item');
      dugme.addEventListener('click', function () {
        var acik = oge.classList.contains('open');
        if (baslangic === null || acik === baslangic) acik = oge.classList.toggle('open');
        dugme.setAttribute('aria-expanded', acik ? 'true' : 'false');
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
