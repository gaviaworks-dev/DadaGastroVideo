// Video prototipi V2 — sayfa iskeleti (kabuk ajanı): Gastro "Ne Pişirsem?" sayfasının koyu banner'ı + altındaki beyaz radiuslu panel.
// Donör: http://127.0.0.1:8960/bugun-ne-pisirsem (src/donor/v2/bnp.html, satır "section.bnp-top" ve "section.bnp-body"). İşaretleme
// donörden birebir; yalnız dinamik parçalar (kırıntı, eyebrow, başlık + vurgu, açıklama, sayaçlar, arka plan görseli) doldurulur.
//   section.bnp-top.below-header.px-band[data-px-band][data-hero-band] > .px-clip(.px-media + .px-veil) + .wrap > nav.rd-crumb + .bnp-head
//     .bnp-head > .lh-main(span.eyebrow + h1(span.accent) + p.lead) + .bnp-stats(.st > b + span)*
//   section.bnp-body > .wrap > <main içeriği>
// Beyaz panelin kenar yuvarlağı ve banner'a 22px binmesi Gastro'nun genel kuralından gelir (portal CSS:
// `.below-header:not(.pf-top)+section{margin-top:-22px;border-radius:22px 22px 0 0}`); banner yazısının dikey ortalaması kabuk
// `banner-standart.css`ten (`.wrap > nav + .bnp-head:last-child`). Bu yüzden `.wrap`ın son çocuğu `.bnp-head`, kırıntıdan hemen önce
// gelen öğe yok: "Reklamlı görünüm" aracı yuvası (`[data-vd-v2-arac]`, reklam ajanı doldurur) `.wrap`ın İLK çocuğu, mutlak konumlu
// (kırıntı satırının sağı; kabuk.css).
// `data-rk-hero` (reklam ajanı isteği): reklam.js yan kart/alt barı en alttaki hero'nun başlık çizgisini geçince açar (R15).
// Arka plan: donörde satır içi `background-image` (degrade + görsel). V2'de satır içi stil YOK: görsel `data-vd-banner="<tarif slug>"`
// ile seçilir, kural `varlik/v2/banner.css`te (build-v2 her tarif kapağı için üretir; url stil dosyasına göre çözülür — satır içi
// `--x:url()` değişkeni tarayıcılar arasında farklı tabana göre çözüldüğü için kullanılmaz). Degrade donördeki değerle kabuk.css'te.
import { esc, ui, videoPosteri, vitrinVideosu } from './ortak.mjs';

const OK = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';

/** Banner görseli: `iskelet.gorsel` = tarif slug'ı ya da `varlik/video/tarif/<slug>-1600.webp` yolu; verilmezse haftanın serisi videosunun posteri. */
export const varsayilanGorsel = () => { const v = vitrinVideosu('Haftanın Serisi') || vitrinVideosu(); const p = v && videoPosteri(v); return p ? p.k1600 : ''; };
export const bannerAnahtari = (g) => String(g || '').replace(/^.*\/tarif\//, '').replace(/-(640|1600)\.webp$/, '');

/**
 * @param {{ kirinti?: {ad:string, href?:string}[], eyebrow?: {ikon?:string, metin:string}, baslik: string, vurgu?: string,
 *           aciklama?: string, sayaclar?: {deger:(string|number), etiket:string}[], gorsel?: string }} k
 * @param {string} main  beyaz panelin içine girecek HTML
 */
export function iskelet(k, main) {
  const kirinti = [{ ad: 'Ana sayfa', href: 'index.html', ev: true }, ...(k.kirinti || [])];
  const yol = kirinti.map((x, i) => {
    if (x.ev) return `<a href="index.html" aria-label="Dada Gastro ana sayfa"><i class="fa-solid fa-house" aria-hidden="true"></i></a>`;
    return i === kirinti.length - 1 || !x.href ? `<b>${esc(x.ad)}</b>` : `<a href="${esc(x.href)}">${esc(x.ad)}</a>`;
  }).join(`\n                ${OK}\n                `);
  // Başlık + vurgu: vurgu başlığın içinde geçiyorsa yerinde span.accent, geçmiyorsa başlığın sonuna eklenir (donör: "… <span class="accent">birlikte</span> karar verelim")
  let h1 = esc(k.baslik || '');
  if (k.vurgu) {
    const v = esc(k.vurgu);
    h1 = h1.includes(v) ? h1.replace(v, `<span class="accent">${v}</span>`) : `${h1} <span class="accent">${v}</span>`;
  }
  const sayac = (k.sayaclar || []).map((s) => `<div class="st"><b>${esc(typeof s.deger === 'number' ? s.deger.toLocaleString('tr-TR') : s.deger)}</b><span>${esc(s.etiket)}</span></div>`).join('\n                    ');
  const gorsel = bannerAnahtari(k.gorsel === undefined ? varsayilanGorsel() : k.gorsel);
  return `<section class="bnp-top below-header px-band vd-v2-banner"${gorsel ? ` data-vd-banner="${esc(gorsel)}"` : ''} data-px-band="1" data-hero-band="" data-rk-hero=""><div class="px-clip"><div class="px-media"></div><div class="px-veil"></div></div>
        <div class="wrap">
            <div class="vd-v2-arac" data-vd-v2-arac></div>
            <nav class="rd-crumb" aria-label="Sayfa yolu">
                ${yol}
            </nav>
            <div class="bnp-head">
                <div class="lh-main">
                    ${k.eyebrow ? `<span class="eyebrow">${k.eyebrow.ikon ? ui(k.eyebrow.ikon) + ' ' : ''}${esc(k.eyebrow.metin)}</span>` : ''}
                    <h1>${h1}</h1>
                    ${k.aciklama ? `<p class="lead">${esc(k.aciklama)}</p>` : ''}
                </div>${sayac ? `
                <div class="bnp-stats">
                    ${sayac}
                </div>` : ''}
            </div>
        </div>
    </section>
    <section class="bnp-body vd-v2-panel">
        <div class="wrap">
${main}
        </div>
    </section>`;
}
