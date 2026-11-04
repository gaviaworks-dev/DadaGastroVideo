/* Portal altbilgi perdesi (turuncu altbilgili 42 görünüm): altbilgi pencereden uzunsa köke `altbilgi-akista` (bkz. altbilgi-perde.css).
   Ölçü, perde hâlinde de akış hâlinde de altbilginin kendi yüksekliğidir (genişlik ikisinde de pencere eni). */
(function () {
  var kok = document.documentElement;
  var altbilgi = document.querySelector('.footer.orange');
  if (!altbilgi) return;
  var perdeEni = window.matchMedia('(min-width:641px)');
  function ayarla() {
    kok.classList.toggle('altbilgi-akista', perdeEni.matches && altbilgi.offsetHeight > window.innerHeight);
  }
  ayarla();
  window.addEventListener('resize', ayarla);
  window.addEventListener('load', ayarla);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ayarla);
  if (window.ResizeObserver) new ResizeObserver(ayarla).observe(altbilgi);
})();
