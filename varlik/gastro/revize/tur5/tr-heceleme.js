/* Revize 5 · madde 41 — Türkçe hece sınırına yumuşak tire (U+00AD).
 *
 * 🔴 NEDEN VAR (ölçüldü 2026-09-24): `hyphens: auto` + `lang="tr"` Chromium'da (macOS)
 * Türkçe metni HİÇ bölmüyor — aynı paragraf `lang="en"` ile 7 kelime bölüyor, `lang="tr"`
 * ile 0. Tireleme sözlüğü olmayan tarayıcıda iki yana yaslı metin 390'da satırı kelime
 * arasındaki boşluğu açarak doldurur (püf detayında 37 px ≈ normal boşluğun 9 katı).
 * Türkçe heceleme kurallıdır; sınırlar burada hesaplanır ve tarayıcı yalnız gerektiği
 * satır sonunda tire koyar. Sözlüğü olan tarayıcıda da zararsızdır.
 *
 * Kural (TDK): iki ünlü arasındaki ünsüzlerin SONUNCUSU yeni heceyi başlatır
 * (a-ta · ar-ka · Türk-çe); ünsüz yoksa iki ünlünün arası bölünür (sa-at).
 * Rakam, kesme işareti ve kısa sözcükler (< 5 harf) dokunulmaz; bölümün iki yanında en az
 * 2 harf kalır (TDK: Türk-çe). Yalnız madde 41'in gövde metinlerine uygulanır.
 */
(function (kok) {
  'use strict';
  var UNLU = /[aeıioöuüâîû]/;
  var HARF_DIZISI = /[A-Za-zÇĞİIÖŞÜÂÎÛçğıöşüâîû]{5,}/g;
  var SOL = 2, SAG = 2, TIRE = '\u00AD';

  function hecele(sozcuk) {
    var k = sozcuk.toLocaleLowerCase('tr'), unluler = [];
    for (var i = 0; i < k.length; i++) if (UNLU.test(k[i])) unluler.push(i);
    var sinirlar = [];
    for (var j = 1; j < unluler.length; j++) {
      var a = unluler[j - 1], b = unluler[j];
      var sinir = b - a === 1 ? b : b - 1;
      if (sinir >= SOL && k.length - sinir >= SAG) sinirlar.push(sinir);
    }
    if (!sinirlar.length) return sozcuk;
    var cikti = '', onceki = 0;
    sinirlar.forEach(function (s) { cikti += sozcuk.slice(onceki, s) + TIRE; onceki = s; });
    return cikti + sozcuk.slice(onceki);
  }

  function metin(dize) {
    return dize.indexOf(TIRE) !== -1 ? dize : dize.replace(HARF_DIZISI, function (s) { return hecele(s); });
  }

  function metinDugumu(n) {
    var yeni = metin(n.data);
    if (yeni !== n.data) n.data = yeni;
  }

  /* Dokunulmayan düğümler: bağlantı, kod, form alanı, başlık, düğme, etiket ve madde 4'ün porsiyon
     miktarları (`[data-a]`, `.iq`) — orada metni başka betikler okur/yeniden yazar. Yalnız metin
     düğümü değişir; `innerHTML` yeniden yazılmaz (dinleyiciler, `<strong>`/`<a>` korunur). */
  var DOKUNMA = 'a,code,pre,kbd,samp,script,style,textarea,input,select,option,button,label,h1,h2,h3,h4,h5,h6,[data-a],.iq,[contenteditable]';

  function uygula(kap) {
    var y = kap.ownerDocument.createTreeWalker(kap, 4, {
      acceptNode: function (n) { return n.parentElement && n.parentElement.closest(DOKUNMA) ? 2 : 1; },
    });
    for (var n = y.nextNode(); n; n = y.nextNode()) metinDugumu(n);
  }

  var api = {hecele: hecele, metin: metin, uygula: uygula};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!kok || !kok.document) return;
  kok.DadaTrHeceleme = api;

  var SECICI = [
    '.rd-head .rd-sub', '.step-card__body > p', '.note-duo .remind-box .rb-body p',
    // Revize 7 · madde 81: zengin metin adım açıklamasının paragrafları ve liste maddeleri.
    '.step-card__body .adim-zengin-metin p', '.step-card__body .adim-zengin-metin li',
    '.art-intro > p', '.art-blok-metin', '.mod-body .art-tip p',
  ].join(', ');
  function hepsi() {
    var d = kok.document;
    if ((d.documentElement.lang || '').toLowerCase().indexOf('tr') !== 0) return;
    Array.prototype.forEach.call(d.querySelectorAll(SECICI), uygula);
  }
  if (kok.document.readyState === 'loading') kok.document.addEventListener('DOMContentLoaded', hepsi);
  else hepsi();
  /* Kopyalanan metne görünmez tire sızmasın: seçim yumuşak tiresiz panoya yazılır. */
  kok.document.addEventListener('copy', function (e) {
    var secim = String(kok.getSelection ? kok.getSelection() : '');
    if (secim.indexOf(TIRE) === -1 || !e.clipboardData) return;
    e.clipboardData.setData('text/plain', secim.split(TIRE).join(''));
    e.preventDefault();
  });
})(typeof window === 'undefined' ? null : window);
