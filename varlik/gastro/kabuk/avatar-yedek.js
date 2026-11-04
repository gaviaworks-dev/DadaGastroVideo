/* Avatar düşüşü — revize 20 Eki · madde 3 (Beyar). Kabuk her sayfaya enjekte eder (`KabukKimligi`).
 * Avatar bileşeni (`parcalar/topluluk/avatar-ic`) fotoğrafın yanına gizli baş harfi de basar. Görsel yüklenemezse görsel kaldırılır,
 * harf açılır ve kaba `data-avatar-kap-sinifi` eklenir; kırık görsel ikonu kalmaz. `error` olayı kabarmaz: belge düzeyinde yakalama
 * evresinde dinlenir, böylece sonradan eklenen avatarlar da (Dolapta Ne Var kartları) aynı yoldan düşer. Betik koşmadan önce
 * kırılmış görseller açılışta taranır (`complete` ve `naturalWidth` 0). Tembel yüklenen ve henüz istenmemiş görsel `complete`
 * değildir; o, istendiğinde `error` ile gelir. */
(function () {
  'use strict';
  function dus(gorsel) {
    var kap = gorsel.parentElement;
    var harf = gorsel.nextElementSibling;
    if (harf && harf.hasAttribute('data-avatar-harf')) harf.hidden = false;
    var sinif = gorsel.getAttribute('data-avatar-kap-sinifi');
    if (kap && sinif) kap.classList.add(sinif);
    gorsel.remove();
  }
  document.addEventListener('error', function (olay) {
    var hedef = olay.target;
    if (hedef && hedef.tagName === 'IMG' && hedef.hasAttribute('data-avatar-gorsel')) dus(hedef);
  }, true);
  function tara() {
    document.querySelectorAll('img[data-avatar-gorsel]').forEach(function (gorsel) {
      if (gorsel.complete && gorsel.naturalWidth === 0) dus(gorsel);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tara);
  else tara();
})();
