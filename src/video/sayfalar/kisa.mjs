// Video Mutfağı · kısa video görüntüleyici (1.3, izle ajanı) → video-kisa.html?v=<slug>
// Tam ekran dikey (9:16) akış: yukarı/aşağı kaydırma (dokunma, tekerlek, ok tuşları, scroll-snap), her videoda simüle oynatma,
// üstte segment ilerleme, mikro rozetler, sağ kolonda Kaydet · Paylaş · Tarife git · Ses. Gastro'da karşılığı yok → vd-dikey.
// Hub da aynı görüntüleyiciyi katman olarak kullanır: `kisaGoruntuleyici(o, { katman: true })` markup'ı + css 'kisa' + js 'kisa';
// kisa.js hub sayfasında `a[data-vd-kisa]` tıklamasını yakalayıp `window.vdKisa.ac(slug)` ile katmanı açar.
import { posterYolu } from '../oynatici.mjs';

const DONOR = '<!-- Video Mutfağı kısa video görüntüleyici · donör: Gastro tarif detayı kabuğu (yerel 8960 render); görüntüleyici yeni (vd-dikey) -->';

export function kisaGoruntuleyici(o, { katman = false } = {}) {
  const { esc } = o;
  const kisalar = o.KATALOG.kisalar;
  const seri = o.SERI['30-saniyede-tat'];
  const sef = seri && o.SEF[seri.sef];
  const oge = (k, i) => {
    const t = o.videoTarifi(k);
    const p = posterYolu(k, o, 1600);
    const tarifBag = t ? `<a class="vd-dikey__eylem" href="${esc(o.tarifAdresi(t.slug))}" data-vd-dikey-tarif><span class="vd-dikey__eylem-ikon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></span><span>Tarife git</span></a>` : '';
    return `<article class="vd-dikey__oge" data-vd-dikey-oge="${esc(k.slug)}" data-sure="${k.sure_sn}" data-i="${i}" aria-roledescription="kısa video" aria-label="${esc(k.baslik)} (${i + 1} / ${kisalar.length})">
    <div class="vd-dikey__sahne" data-vd-dikey-sahne>
     ${p ? `<img class="vd-dikey__poster" src="${esc(p)}" alt="" width="1600" height="1067" ${i < 2 ? 'decoding="async"' : 'loading="lazy" decoding="async"'}>` : `<span class="vd-dikey__poster vd-dikey__poster--yazi" aria-hidden="true"><i class="fa-solid fa-bolt"></i></span>`}
     <span class="vd-dikey__perde" aria-hidden="true"></span>
     <span class="vd-dikey__temsili">${esc(o.TEMSILI || 'Görüntü temsilîdir · prototip')}</span>
     <span class="vd-dikey__durum" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
     <div class="vd-dikey__bilgi">
      ${(k.rozetler || []).length ? `<div class="vd-dikey__rozetler">${k.rozetler.map((r) => `<span class="vd-dikey__rozet">${esc(r)}</span>`).join('')}</div>` : ''}
      <h2 class="vd-dikey__baslik">${esc(k.baslik)}</h2>
      ${k.ozet ? `<p class="vd-dikey__ozet">${esc(k.ozet)}</p>` : ''}
      ${!t && k.malzemeler?.length ? `<ul class="vd-dikey__mz" aria-label="Malzemeler">${k.malzemeler.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      <p class="vd-dikey__kim">${sef ? `${sef.avatar ? `<img src="${esc(sef.avatar)}" alt="" width="24" height="24" loading="lazy">` : `<span aria-hidden="true">${esc(sef.bas_harf)}</span>`}<a href="${esc(o.sefAdresi(sef.kullanici_adi))}">${esc(sef.ad)}</a> · ` : ''}<span>${esc(seri?.ad || '')} · ${k.sure_sn} sn</span></p>
     </div>
     <div class="vd-dikey__eylemler">
      <button class="vd-dikey__eylem" type="button" data-vd-kaydet="${esc(k.slug)}" aria-pressed="false" aria-label="Mutfak Defterine kaydet"><span class="vd-dikey__eylem-ikon"><i class="fa-regular fa-bookmark vd-dikey__kapali" aria-hidden="true"></i><i class="fa-solid fa-bookmark vd-dikey__acik" aria-hidden="true"></i></span><span class="vd-dikey__kapali">Kaydet</span><span class="vd-dikey__acik">Kaydedildi</span></button>
      <button class="vd-dikey__eylem" type="button" data-vd-dikey-paylas data-baslik="${esc(k.baslik)}"><span class="vd-dikey__eylem-ikon"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></span><span>Paylaş</span></button>
      ${tarifBag}
      <button class="vd-dikey__eylem" type="button" data-vd-dikey-ses aria-pressed="false"><span class="vd-dikey__eylem-ikon"><i class="fa-solid fa-volume-xmark" aria-hidden="true"></i></span><span>Ses</span></button>
     </div>
    </div>
   </article>`;
  };
  return `<div class="vd-dikey${katman ? ' vd-dikey--katman' : ''}" data-vd-dikey${katman ? ' data-katman hidden' : ''} role="dialog" aria-modal="true" aria-label="${esc(seri?.ad || 'Kısa videolar')}">
  <div class="vd-dikey__zemin" aria-hidden="true"><img data-vd-dikey-zemin src="${esc(posterYolu(kisalar[0], o, 640) || '')}" alt=""></div>
  <div class="vd-dikey__ust">
   <div class="vd-dikey__segmentler" aria-hidden="true">${kisalar.map((k, i) => `<span data-vd-dikey-segment="${i}"><span></span></span>`).join('')}</div>
   <div class="vd-dikey__ust-satir">
    ${katman ? `<button class="vd-dikey__kapat" type="button" data-vd-dikey-kapat aria-label="Kısa videoları kapat"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>Video Mutfağı</span></button>` : `<a class="vd-dikey__kapat" href="video-mutfagi.html" data-vd-dikey-kapat aria-label="Kısa videoları kapat, Video Mutfağı'na dön"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>Video Mutfağı</span></a>`}
    <span class="vd-dikey__seri"><i class="fa-solid fa-bolt" aria-hidden="true"></i> ${esc(seri?.ad || 'Kısa videolar')}</span>
    <span class="vd-dikey__sira" data-vd-dikey-sira aria-live="polite">1 / ${kisalar.length}</span>
   </div>
  </div>
  <div class="vd-dikey__akis" data-vd-dikey-akis tabindex="-1">
   ${kisalar.map(oge).join('')}
  </div>
  <div class="vd-dikey__gezinti">
   <button class="vd-dikey__git" type="button" data-vd-dikey-onceki aria-label="Önceki kısa video"><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>
   <button class="vd-dikey__git" type="button" data-vd-dikey-sonraki aria-label="Sonraki kısa video"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
  </div>
  <p class="vd-dikey__ipucu" aria-hidden="true"><i class="fa-solid fa-arrows-up-down"></i> Kaydır ya da ↑ ↓ tuşları</p>
 </div>`;
}

export default async (o) => [{
  dosya: 'video-kisa.html',
  baslik: '30 Saniyede Tat — kısa videolar | Video Mutfağı — Dada Gastro (prototip)',
  aciklama: 'Dada Gastro Video Mutfağı kısa videoları: 15–45 saniyelik dikey tarif ve püf noktası videoları.',
  main: `${DONOR}\n${kisaGoruntuleyici(o)}`,
  css: ['kisa'],
  js: ['kisa'],
  govdeSinifi: 'pg-video-kisa',
  altMenu: 'kisa',
  gorsel: posterYolu(o.KATALOG.kisalar[0], o, 1600),
}];
