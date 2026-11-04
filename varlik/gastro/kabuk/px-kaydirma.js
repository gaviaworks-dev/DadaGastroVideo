/* Revize P2 · T3 · Kalem 1 — hero bandındaki görselin dikey kırpması.
 *
 * 🔴 NEDEN VAR (ölçüldü, keşif B):
 * Türetilmiş markup, donörün JS KOŞTUKTAN SONRAKİ anlık görüntüsünden alındı; bu yüzden
 * `.px-clip`in `--px-shift` değeri satır içinde DONMUŞ bir sayı. O sayı donörün o anki
 * viewport'uyla (1000px) ve o anki band yüksekliğiyle hesaplanmıştı. Sonra
 * `varliklar/reference/shared/dm-hero.css` bantları eşitledi (liste 552 · profil 704 ·
 * detay 616/504) → band uzadı, merkez aşağı indi, sayı yerinde kaldı. Sonuç: 26 public
 * ekranda görsel 49–181px YUKARIDA, `/video-mutfagi`nde 105px AŞAĞIDA; 9 üye ekranında
 * donörde 150/128px sapma. Değer viewport yüksekliğine de bağlı olduğundan tek bir sayı
 * hiçbir ekranda doğru olamaz — kanon da sayı taşımaz, çalışma anında hesaplar.
 *
 * 🔴 KANONUN BETİĞİ YÜKLÜ AMA BU BANDI ATLIYOR: `varliklar/build/assets/parallax-*.js`
 * public ekranlarda 200 dönüyor ve koşuyor, ama tarayıcısı
 * `if (e.dataset.pxBand || e.classList.contains("px-clip") || …) continue` diyor — markup
 * bandı zaten `data-px-band="1"` ve `.px-clip` ile bastığı için betik onu "zaten
 * dönüştürdüm" sayıyor, izlediği bant listesi BOŞ kalıyor ve `resize`/`load` yeniden
 * hesabı hiç bağlanmıyor. Ölçüldü: 900→700 küçültmede bizde değer değişmedi, kanonda
 * değişti. 9 üye blade'inde ise parallax betiği hiç yüklü değil ve `--px-shift` yazan
 * başka bir betik `public/` altında YOK.
 *
 * Bu betik kanonun kendi `b()` formülünün AYNISIDIR (parallax-DWpYIxig.js):
 *   i = bandÜst + scrollY + bandY/2
 *   d = clamp(i − vh/2, 0, belgeYüksekliği − vh)
 *   kayma = i − d − vh/2
 * Görselin merkezi bandın merkezine oturur. `--px-r` de kanondaki gibi bandın
 * `border-radius`ından gelir.
 *
 * Kanca yoksa HİÇBİR ŞEY yapmaz (44 blade değişmedi; donmuş değer JS kapalı hâl için
 * yedek kalır). `prefers-reduced-motion` kuralı CSS'te zaten kaymayı yok sayıyor.
 */
(function () {
  var SECICI = '[data-px-band] > .px-clip, [data-fit-px] > .px-clip';

  function yaz(clip) {
    var band = clip.parentElement;
    if (!band) return;
    var bs = getComputedStyle(band);
    clip.style.setProperty('--px-r', bs.borderRadius && bs.borderRadius !== '0px' ? bs.borderRadius : '0px');

    var r = band.getBoundingClientRect();
    var vh = window.innerHeight;
    var merkez = r.top + window.scrollY + r.height / 2;
    var enFazla = Math.max(0, document.documentElement.scrollHeight - vh);
    var kaydirma = Math.min(Math.max(merkez - vh / 2, 0), enFazla);
    clip.style.setProperty('--px-shift', (merkez - kaydirma - vh / 2).toFixed(1) + 'px');
  }

  function hepsi() {
    var kancalar = document.querySelectorAll(SECICI);
    for (var i = 0; i < kancalar.length; i++) yaz(kancalar[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hepsi);
  } else {
    hepsi();
  }
  window.addEventListener('load', hepsi);
  window.addEventListener('resize', hepsi);
})();
