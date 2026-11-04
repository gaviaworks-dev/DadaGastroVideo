/* DadaGastro · alt sabit eylem çubuğunun görünürlüğü. Tarif detayı (#rdActbar) ve püf detayı (#actbar)
   AYNI kuralı bu dosyadan alır.
   Revize P1 · Kalem 5 (tarif, d4383c8b): kural `revize/p1/tarif-pisirme.js`te yazıldı.
   Revize 5 · madde 53: kural buraya taşındı ve püf de ona bağlandı; tarif davranışı birebir aynı kaldı.

   Kural:
   · Çubuk hero (tarifte `#rdStage`, püfte `#pufHero`; yoksa ilk `h1`) ekranın üstünden TAMAMEN çıkınca
     görünür (RU arayüz düzeltmeleri, 25 Eki). Önceki kural (madde 53) çubuğu açılıştan gösteriyordu; ilk
     ekranda çubuk içeriğin üstüne biniyordu — RU'da başlık sütunu daralıp çubuk 246 px'e uzayınca hero
     başlığını örttü (ölçüldü, canlı «Влажный кекс с вишней»), TR'de de 1440'ta A−/A+ satırını, 390'da
     künye şeridini örtüyordu. Eşik sabit piksel değil hero'nun kendisi: hero ne kadar uzunsa çubuk o kadar
     geç, hero biter bitmez gelir (püfteki eski 460 px eşiğinin "geç çıkıyor" şikâyeti sabit eşikteydi).
     Tarifte `tarif-detay.js` (`.rd-head`), püfte kanon betiği (`j-f3e0503fbd73.js`, 460 px) kendi
     eşikleriyle sınıf veriyor; o dosyalar donör/kanon kopyası, dokunulmaz. Burası ÜST KATMAN: aynı olaylara
     SONRA bağlanan dinleyici aynı olay turunda son sözü söyler (bu dosya onlardan sonra `defer` yüklenir).
     Arada boyama olmadığı için sınıfın bir an düşüp geri gelmesi ekrana yansımaz.
   · Altbilgi: sayfa sonuna 220 px kala gizlenir, yukarı kayınca geri gelir (tarif donörünün kuralı).
   · Çerez bandı: portal.css bant açıkken çubuğu zaten `display:none` yapıyor. Bant 700 ms sonra
     açıldığı için onaysız ilk ziyarette çubuk bir an görünüp kaybolurdu; onay durumu belli olana
     kadar `show` verilmez.
   · İlk karede geçiş kapalı (`.rv-anlik`, `alt-eylem-cubugu.css`): açılışta kayma animasyonu oynamaz;
     sonraki gizlen/görün (altbilgi) donörün kendi geçişiyle oynar. */
(function () {
  var cubuklar = ['rdActbar', 'actbar'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!cubuklar.length) return;
  var cerez = document.getElementById('cookieBanner');

  function onayVar() {
    try { return !!localStorage.getItem('dm-cookie-consent'); } catch (e) { return false; }
  }
  var bantGoruldu = false;
  var cerezCozuldu = !cerez || onayVar();

  var hero = document.getElementById('rdStage') || document.getElementById('pufHero') || document.querySelector('h1');

  function heroGecildi() {
    return !hero || hero.getBoundingClientRect().bottom <= 0;
  }
  function sonaYakin() {
    return (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 220;
  }
  function guncelle() {
    var goster = cerezCozuldu && heroGecildi() && !sonaYakin();
    cubuklar.forEach(function (bar) { bar.classList.toggle('show', goster); });
  }

  if (!cerezCozuldu) {
    new MutationObserver(function () {
      if (cerez.classList.contains('show')) { bantGoruldu = true; return; }
      if (bantGoruldu || onayVar()) { cerezCozuldu = true; guncelle(); }
    }).observe(cerez, { attributes: true, attributeFilter: ['class'] });
  }

  cubuklar.forEach(function (bar) { bar.classList.add('rv-anlik'); });
  guncelle();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { cubuklar.forEach(function (bar) { bar.classList.remove('rv-anlik'); }); });
  });
  window.addEventListener('scroll', guncelle, { passive: true });
  window.addEventListener('resize', guncelle, { passive: true });
})();
