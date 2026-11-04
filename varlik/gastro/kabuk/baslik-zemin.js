/* ÜST BAŞLIK — ZEMİNİ ÖLÇER, SINIFA GÜVENMEZ.
 *
 * 🔴 İLK SÜRÜMÜN KUSURU (2026-09-15, Beyar `/ara`da yakaladı). Kural
 * `body:not(.has-dark-hero)` diye YAZILMIŞTI, yani kararı bir SINIFA
 * dayandırıyordu. `/ara` koyu hero taşıyor ama o sınıfı taşımıyor (hero
 * `.arama-hero`, kabuk betiğinin tanıdığı kalıplardan değil) — kural yanlış
 * yere uygulandı, başlık opak beyaz oldu ve BEYAZ SVG LOGO beyaz zeminde
 * kayboldu. Ölçüldü: `headerBg rgb(255,255,255)` · `logo rgb(255,255,255)` ·
 * kontrast **1.00**. Aynı kusur ders sayfalarında ve ansiklopedi detayında da
 * vardı; ilk taramam yalnız MENÜ BAĞINA baktığı için üçünü de "ok" saymıştı.
 *
 * Doğrusu: zemini SOR. Bu betik başlığın arkasındaki gerçek katmanı okur ve
 * `<html data-baslik-zemin="acik|koyu">` yazar; boyama kararını CSS o
 * bayrağa göre verir. Sayfa adı, body sınıfı, rota yok — yarın hero'lu ya da
 * hero'suz yeni bir ekran doğduğunda ölçü aynı çalışır.
 *
 * ⚠ BELİRSİZSE DOKUNMA. Zemin kesin olarak AÇIK diye ölçülemiyorsa bayrak
 * `koyu` kalır, yani donörün kendi hâli korunur. Yanlış yöne düşmenin bedeli
 * ölçüldü: çalışan bir ekranı bozmak, bozuk bir ekranı bozuk bırakmaktan
 * pahalı. Arka plan GÖRSELİ taşıyan katman (hero fotoğrafı/degrade) da
 * "açık" sayılmaz — pikselini okuyamayız, donör orada beyaz yazı basıyor.
 */
(function () {
  'use strict';

  var KOYU = 'koyu';
  var ACIK = 'acik';

  function kanal(v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function parlaklik(renk) {
    var p = (renk.match(/[\d.]+/g) || []).map(Number);
    if (p.length < 3) return null;
    if (p.length > 3 && p[3] <= 0.5) return null; /* saydam: zemin değil */
    return 0.2126 * kanal(p[0]) + 0.7152 * kanal(p[1]) + 0.0722 * kanal(p[2]);
  }

  /* Bir noktadaki yığında başlığın ALTINDAKİ ilk belirleyici katman. */
  function noktaninZemini(x, y, baslik) {
    var yigin = document.elementsFromPoint(x, y) || [];
    for (var i = 0; i < yigin.length; i++) {
      var e = yigin[i];
      if (e === baslik || baslik.contains(e)) continue;
      var st = getComputedStyle(e);
      if (st.backgroundImage && st.backgroundImage !== 'none') return KOYU;
      var l = parlaklik(st.backgroundColor);
      if (l !== null) return l < 0.5 ? KOYU : ACIK;
    }
    return null;
  }

  function olc() {
    var baslik = document.querySelector('header.header');
    if (!baslik) return;

    var k = baslik.getBoundingClientRect();
    if (k.height === 0) return;
    var y = k.top + k.height / 2;

    /* İki nokta: markanın durduğu sol taraf ve orta. Biri koyu diyorsa
       başlık koyu zemin üstünde sayılır — beyaz yazı orada doğru. */
    var noktalar = [k.left + 60, k.left + k.width / 2];
    var sonuc = null;
    for (var i = 0; i < noktalar.length; i++) {
      var z = noktaninZemini(noktalar[i], y, baslik);
      if (z === KOYU) { sonuc = KOYU; break; }
      if (z === ACIK) sonuc = ACIK;
    }

    document.documentElement.setAttribute('data-baslik-zemin', sonuc === ACIK ? ACIK : KOYU);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', olc);
  } else {
    olc();
  }
  /* Hero görseli geç yüklenebilir, genişlik değişince bant yüksekliği oynar. */
  window.addEventListener('load', olc);
  window.addEventListener('resize', olc);
})();
