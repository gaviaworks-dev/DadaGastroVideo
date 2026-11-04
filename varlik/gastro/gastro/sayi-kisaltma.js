/* Revize 5 · madde 52 — public sayaçların kısa yazımı, tarayıcı tarafı.
   Eşi `App\Support\SayiKisaltma` (PHP). Kural tablosu tek: `config/sayi-kisaltma.php`;
   kabuk onu `<meta name="dada-sayi-kurallari">` JSON'u olarak basar, bu dosya yalnız
   algoritmadır. İki uygulama da `tests/Fixtures/sayi-kisaltma.json` tablosuna karşı sınanır.

   Sayaçları tıklama sonrası yazan betikler (kanon paketi, `f6/tarif-eylem.js`) ham sayı
   yazar ("1.000", "1000"). Bu betik `[data-engagement-count]` ve `[data-sayi-kisa]`
   öğelerini izler, ham sayıyı kısaltır ve tamını title/aria-label'a koyar. Kancası
   olmayan sayfada hiçbir şey yapmaz. */
(function (kok) {
  function binlik(n, ayrac) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ayrac);
  }
  function kisa(k, deger) {
    var n = Math.floor(Number(deger) || 0);
    for (var i = 0; i < k.birimler.length; i++) {
      var alt = k.birimler[i][0], birim = k.birimler[i][1];
      if (n < alt) continue;
      var kat = Math.floor(n / alt);
      if (kat < k.ondalik_sinir) {
        var onda = Math.floor(n * 10 / alt), kesir = onda % 10;
        return binlik(Math.floor(onda / 10), k.binlik_ayrac) + (kesir ? k.ondalik_ayrac + kesir : '') + k.ara + birim;
      }
      return binlik(kat, k.binlik_ayrac) + k.ara + birim;
    }
    return binlik(n, k.binlik_ayrac);
  }
  function tam(k, deger) { return binlik(Math.floor(Number(deger) || 0), k.binlik_ayrac); }

  var api = { kisa: kisa, tam: tam };
  kok.GastroSayi = api;
  if (!kok.document) return;

  var d = kok.document;
  var meta = d.querySelector('meta[name="dada-sayi-kurallari"]');
  if (!meta) return;
  var kurallar;
  try { kurallar = JSON.parse(meta.getAttribute('content')); } catch (e) { return; }
  api.kurallar = kurallar;
  /* Puan (bir ondalık): prototip «4.8»; ayracı dil tablosu verir (RU «4,8»). Eşi `SayiKisaltma::puan`. */
  api.puan = function (deger) { return (Number(deger) || 0).toFixed(1).replace('.', kurallar.puan_ayrac || '.'); };

  var HAM = /^\d{1,3}(?:\.\d{3})+$|^\d+$/;
  /* Ham sayı yazılmış öğeyi kısaltır. Kısaltılmış metin ham desene uymaz; yazım yalnız
     metin değişiyorsa yapılır, gözlemci kendi yazımında döngüye girmez. */
  function uygula(el) {
    var metin = el.textContent.trim();
    if (!HAM.test(metin)) return;
    var n = Number(metin.replace(/\./g, ''));
    var kisaMetin = kisa(kurallar, n), tamMetin = tam(kurallar, n);
    if (kisaMetin !== metin) el.textContent = kisaMetin;
    if (kisaMetin !== tamMetin) { el.setAttribute('title', tamMetin); el.setAttribute('aria-label', tamMetin); }
    else { el.removeAttribute('title'); el.removeAttribute('aria-label'); }
  }
  api.uygula = uygula;
  var SECICI = '[data-engagement-count], [data-sayi-kisa]';
  function tara(kap) {
    if (kap.matches && kap.matches(SECICI)) uygula(kap);
    if (kap.querySelectorAll) Array.prototype.forEach.call(kap.querySelectorAll(SECICI), uygula);
  }
  function baslat() {
    tara(d);
    new MutationObserver(function (kayitlar) {
      kayitlar.forEach(function (k) {
        var hedef = k.target.nodeType === 3 ? k.target.parentElement : k.target;
        if (!hedef) return;
        var sayac = hedef.closest ? hedef.closest(SECICI) : null;
        if (sayac) uygula(sayac);
        Array.prototype.forEach.call(k.addedNodes || [], function (dugum) { if (dugum.nodeType === 1) tara(dugum); });
      });
    }).observe(d.documentElement, { subtree: true, childList: true, characterData: true });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', baslat); else baslat();
})(this);
