/* Revize P1 · kulvar dosyası — sahibi: tarif-malzeme. Tarif detay (/tarif/{slug}) dışında yüklenmez. */

/* ── Kalem 8 · ikame popover'ı — klavye ve durum bildirimi ──────────────────
   Aç/kapa tarif-detay.js'teki donör işleyicisinde (`.ing-swap` tıklaması
   satıra `swap-open` ekler, dış tık kaldırır); burada TEKRAR bağlanmaz.
   eklendi: Escape açık popover'ı kapatır ve odağı düğmeye geri verir;
   `aria-expanded` satırın `swap-open` durumunu izler. Donörde ikisi de yok. */
(function () {
  var liste = document.getElementById('ingList');
  if (!liste || !liste.querySelector('.ing-swap')) return;

  function esitle() {
    liste.querySelectorAll('.ing-swap').forEach(function (b) {
      var satir = b.closest('.ing-row');
      b.setAttribute('aria-expanded', satir && satir.classList.contains('swap-open') ? 'true' : 'false');
    });
  }

  new MutationObserver(esitle).observe(liste, { subtree: true, attributes: true, attributeFilter: ['class'] });
  esitle();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var acik = liste.querySelectorAll('.ing-row.swap-open');
    if (!acik.length) return;
    acik.forEach(function (satir) {
      satir.classList.remove('swap-open');
      if (satir.contains(document.activeElement)) {
        var b = satir.querySelector('.ing-swap');
        if (b) b.focus();
      }
    });
  });
})();
