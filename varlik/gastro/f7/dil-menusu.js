/* DadaGastro dil menüsü: aynı sunucu seçimi, masaüstü ve mobil kabuk.
 * Açılış olayını capture evresinde sahiplenir; eski kabuk ikinci kez açıp
 * kapatamaz. localStorage yoktur.
 *
 * Aşama 2 · K7 — seçim adresle olur. Sunucu `<meta name="dada-dil-adresleri"
 * content='{"tr":"/…","en":"/en/…"}'>` basar (yalnız bu sayfanın YAYINDA
 * karşılıkları). Hedef dilin adresi varsa oraya gidilir; yoksa seçicide
 * sayfanın kendi `<template data-dil-yok="xx">` notu gösterilir ve hiçbir yere
 * gidilmez (sessizce ana sayfaya ya da Türkçeye atmak yok). Meta hiç yoksa
 * eski yol: `?dil=xx` (sunucu aynı sayfanın o dildeki adresine yönlendirir).
 * Metinlerin hepsi sayfaya basılı; betik metin yazmaz, yalnız basılı notu
 * kopyalar.
 *
 * Karar A (taslak dil ziyaretçiden gizli) açıksa betik etiketinde
 * `data-acik-diller` vardır: çekmecedeki seçici (kabuğun kendi markup'ı) o
 * listeye budanır, tek dil kalırsa çekmeceden kaldırılır.
 */
(function () {
  'use strict';
  var betik = document.currentScript;
  var acikDiller = betik && betik.dataset && betik.dataset.acikDiller
    ? betik.dataset.acikDiller.split(',') : null;

  function adresler() {
    var meta = document.querySelector('meta[name="dada-dil-adresleri"]');
    if (!meta) return null;
    try {
      var veri = JSON.parse(meta.getAttribute('content') || '');
      return veri && typeof veri === 'object' && !Array.isArray(veri) ? veri : null;
    } catch (hata) { return null; }
  }

  function buda(kutular) {
    if (!acikDiller) return kutular;
    return kutular.filter(function (kutu) {
      kutu.querySelectorAll('[data-lang]').forEach(function (secim) {
        if (acikDiller.indexOf(secim.dataset.lang) < 0) secim.remove();
      });
      if (kutu.querySelectorAll('[data-lang]').length > 1) return true;
      kutu.remove();
      return false;
    });
  }

  function baglaninca() {
    var kutular = buda(Array.from(document.querySelectorAll('.tb-lang, .drawer-lang')));
    if (!kutular.length) return;
    var aktif = document.querySelector('.tb-lang [data-lang][aria-checked="true"]');
    var kod = aktif ? aktif.dataset.lang : document.documentElement.lang || 'tr';
    function tetik(kutu) { return kutu.querySelector('.tb-lang-btn, .drawer-lang-toggle'); }
    function notuKaldir(kutu) {
      kutu.querySelectorAll('[data-dil-yok-not]').forEach(function (not) { not.remove(); });
    }
    function kapat(kutu) {
      kutu.classList.remove('open');
      notuKaldir(kutu);
      if (tetik(kutu)) tetik(kutu).setAttribute('aria-expanded', 'false');
    }
    function ac(kutu) {
      kutular.forEach(function (diger) { if (diger !== kutu) kapat(diger); });
      kutu.classList.add('open'); tetik(kutu).setAttribute('aria-expanded', 'true');
    }
    /* Hedef dilde bu sayfa yok: basılı notu seçicinin listesinin sonuna koy. */
    function yokNotu(kutu, hedef) {
      notuKaldir(kutu);
      var sablon = document.querySelector('template[data-dil-yok="' + hedef + '"]');
      var liste = kutu.querySelector('.tb-lang-menu, .drawer-lang-list');
      if (!sablon || !liste) return false;
      liste.appendChild(sablon.content.cloneNode(true));
      return true;
    }
    kutular.forEach(function (kutu) {
      kapat(kutu);
      kutu.querySelectorAll('[data-lang]').forEach(function (secim) {
        var secili = secim.dataset.lang === kod;
        secim.setAttribute('aria-checked', String(secili)); secim.classList.toggle('active', secili);
      });
      var mobilKod = kutu.querySelector('.drawer-lang-cur span[lang]');
      if (mobilKod) { mobilKod.textContent = kod.toUpperCase(); mobilKod.lang = kod; }
    });
    document.addEventListener('click', function (olay) {
      var hedef = olay.target.closest('.tb-lang-btn, .drawer-lang-toggle, [data-lang]');
      var kutu = hedef && hedef.closest('.tb-lang, .drawer-lang');
      if (!kutu) { kutular.forEach(kapat); return; }
      olay.preventDefault(); olay.stopImmediatePropagation();
      if (!hedef.hasAttribute('data-lang')) {
        if (kutu.classList.contains('open')) kapat(kutu); else ac(kutu);
        return;
      }
      var dil = hedef.dataset.lang;
      if (hedef.getAttribute('aria-checked') === 'true' || !dil) { kapat(kutu); return; }
      var harita = adresler();
      if (harita) {
        if (typeof harita[dil] === 'string' && harita[dil]) {
          kapat(kutu);
          window.location.assign(harita[dil]);
        } else {
          yokNotu(kutu, dil);
        }
        return;
      }
      kapat(kutu);
      var url = new URL(window.location.href);
      url.searchParams.set('dil', dil);
      window.location.assign(url.toString());
    }, true);
    document.addEventListener('keydown', function (olay) {
      var kutu = olay.target.closest('.tb-lang, .drawer-lang');
      if (olay.key === 'Escape') {
        var acik = kutular.find(function (k) { return k.classList.contains('open'); });
        if (acik) { olay.preventDefault(); olay.stopImmediatePropagation(); kapat(acik); tetik(acik).focus(); }
        return;
      }
      if (!kutu || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(olay.key)) return;
      olay.preventDefault(); olay.stopImmediatePropagation(); ac(kutu);
      var secimler = Array.from(kutu.querySelectorAll('[data-lang]'));
      var i = secimler.indexOf(document.activeElement);
      var sira = olay.key === 'Home' ? 0 : olay.key === 'End' ? secimler.length - 1
        : olay.key === 'ArrowDown' ? (i + 1) % secimler.length : (i < 0 ? secimler.length - 1 : (i - 1 + secimler.length) % secimler.length);
      if (secimler[sira]) secimler[sira].focus();
    }, true);
    document.addEventListener('focusin', function (olay) {
      if (!olay.target.closest('.tb-lang, .drawer-lang')) kutular.forEach(kapat);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baglaninca);
  else baglaninca();
})();
