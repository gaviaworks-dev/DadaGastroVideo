/* Video Mutfağı P0-5 — tarif sayfasının "Tarif videosu" bölümünü oynatıcı modülüne bağlar.

   Sunucu bölümü yalnız okuma kapısından geçen, kaynaklı videoda basar (`TarifDetayDenetleyicisi::tarifVideosu`) ve
   kaba `data-video-tanim` koyar; bu betik onu `window.DadaVideoOynatici.bagla` ile doldurur (gömmede kaptaki iframe'e
   adres verir, dosyada <video> kurar). Modül tanımı bu tarayıcıda oynatamıyorsa (`bagla` → null) bölüm ve pişirme
   modundaki "Tarif videosu" açılırı KALDIRILIR: boş oynatıcı yalan yüzeydir. Gizlemek yerine kaldırmak, çünkü
   `revize/p1/tarif-pisirme.js` bölümü pişirme moduna taşıyor; açılır kalırsa boş kutu orada görünürdü. */
(function () {
  'use strict';

  var bolum = document.querySelector('[data-tarif-ana-video]');
  if (!bolum) return;
  var kap = bolum.querySelector('[data-video-tanim]');
  var oynatici = kap && window.DadaVideoOynatici
    ? window.DadaVideoOynatici.bagla(kap, null, { baslik: kap.getAttribute('data-l-baslik') || '' })
    : null;
  if (oynatici) return;

  var acilir = document.querySelector('[data-cm-video]');
  if (acilir) acilir.remove();
  bolum.remove();
})();
