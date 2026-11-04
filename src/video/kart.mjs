// Video Mutfağı ortak kart bileşenleri (hub ajanı). Hub, seriler, seri detayı; izle/şef sayfaları da kullanır.
// Taban işaretleme Gastro'nun tarif kartıdır (.r-card > .r-media-wrap > .r-media · .r-body > h4 · .r-facts · .r-foot .r-author;
// kaydet .r-save, rozet .r-chip) — stilleri kabuğun yüklediği portal-*.css + kabuk/kart-standart.css'ten gelir.
// Gastro'da karşılığı olmayan parçalar (süre etiketi, Pro kilidi, izleme çubuğu, hover önizleme, 9:16 kısa kart, bölüm satırı,
// seri afişi) `vd-` önekli ve varlik/video/video.css'te.
import { sponsorEtiketi } from './reklam.mjs'; // REVİZE 1 madde 7: seri sponsor hapı (afiş görselinin sağ üstü)
// Kural: sahte sayaç yok (izlenme/puan/takipçi basılmaz); veri yoksa rozet hiç basılmaz.

const e = (o, x) => (o && o.esc ? o.esc(x) : String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
const ik = (ad, sinif = '') => `<i class="fa-solid ${ad}${sinif ? ' ' + sinif : ''}" aria-hidden="true"></i>`;
const sureMetni = (o, sn) => {
  if (o && o.sureMetni) return o.sureMetni(sn);
  const d = Math.floor(sn / 60), s = Math.round(sn % 60);
  return `${String(d).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
const sefDosya = (k) => `video-sef-${String(k).replace(/\./g, '')}.html`;
export const videoHref = (v, o) => (o && o.videoAdresi ? o.videoAdresi(v) : `video-izle-${v.slug}.html`);
export const kisaHref = (k) => `video-kisa.html?v=${encodeURIComponent(k.slug)}`;
export const seriHref = (s, o) => (o && o.seriAdresi ? o.seriAdresi(s) : `video-seri-${s.slug}.html`);
export const sefHref = (k, o) => (o && o.sefAdresi ? o.sefAdresi(k) : sefDosya(k));
export const tarifHref = (slug, o) => (o && o.tarifAdresi ? o.tarifAdresi(slug) : `tarif-${slug}.html`);

/* ---------- veri yardımcıları ---------- */
const katalog = (o) => o.KATALOG || {};
export const seriBul = (slug, o) => (katalog(o).seriler || []).find((s) => s.slug === slug) || null;
export const seriBolumleri = (slug, o) => [...(katalog(o).videolar || []), ...(katalog(o).kisalar || [])].filter((v) => v.seri === slug).sort((a, b) => a.bolum - b.bolum);
const tarifi = (v, o) => (v && v.tarif && o.TARIF ? o.TARIF[v.tarif] || null : null);

/** Kapak: bağlı tarifin kapağı. Tarifsiz videoda null → kart seri afişi (tipografik, seri ikonu) basar.
 *  Karar (hub, önerimle): tarifsiz videoya başka bir tarifin fotoğrafı konmaz — bıçak rehberine biftek kapağı yanıltıcı olurdu. */
export function kapakBul(v, o, { buyuk = false } = {}) {
  // Tek kaynak: kabuğun ortak.mjs `videoPosteri(v)` → { k640, k1600, alt } (tarif kapağı; tarifsizde katalog `poster_tarif`, lead 1c8872e).
  const p = o.videoPosteri(v);
  const src = p && (buyuk ? p.k1600 || p.k640 : p.k640 || p.k1600);
  return src ? { src, alt: v.baslik } : null;
}
/** Süre süzgeci dakikası: tarif süresi (hazırlık + pişirme); tarifsizde video süresi (katalog _not, 3 Kas karar 7). */
function kartSureDk(v, o) {
  const t = tarifi(v, o);
  const dk = t ? (Number(t.hazirlik_dk) || 0) + (Number(t.pisirme_dk) || 0) : 0;
  return dk || Math.max(1, Math.round((v.sure_sn || 0) / 60));
}
// ortak.mjs'in sureKodu'su varsa o (tek kural); kart dışa sureDk/sureKodu VERMEZ (build ortak+kart birleşiminde çakışmasın).
const kartSureKodu = (v, o) => (o && typeof o.sureKodu === 'function' && o.sureKodu !== kartSureKodu ? o.sureKodu(v) : ((d) => (d < 15 ? '15-alti' : d <= 30 ? '15-30' : '30-ustu'))(kartSureDk(v, o)));
/** Doküman E.1c: Kolay / Orta / İleri. Gastro'nun beş zorluğu üçe katlanır. */
export const zorlukUc = (z) => ({ 'Çok Kolay': 'Kolay', Kolay: 'Kolay', Orta: 'Orta', Zor: 'İleri', 'Ustalık Gerektirir': 'İleri' }[z] || '');
const ZORLUK_IKON = { Kolay: 'fa-signal', Orta: 'fa-signal', İleri: 'fa-signal' };

/** Konsept adı → adres kodu ("10 Dakikada Pratik" → "10-dakikada-pratik"); hub süzgecinin ?konsept= değeri. */
export const konseptKodu = (ad) => String(ad || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Süzgeç öznitelikleri (hub süzgeci; seri konsepti + fit + süre kodu). */
export function suzgecVerisi(v, o) {
  const s = seriBul(v.seri, o);
  return `data-vd-video="${e(o, v.slug)}" data-konsept="${(s && s.konsept) ? konseptKodu(s.konsept) : ''}" data-sure="${kartSureKodu(v, o)}" data-fit="${v.fit ? 1 : 0}"`;
}

/* ---------- E.1c meta rozetleri (Gastro .r-facts) ---------- */
export function metaRozetleri(v, o, { sinif = '' } = {}) {
  const t = tarifi(v, o);
  const p = [];
  if (t) {
    const hz = (Number(t.hazirlik_dk) || 0) + (Number(t.pisirme_dk) || 0);
    if (hz) p.push(`<span title="Hazırlık süresi (hazırlık + pişirme)">${ik('fa-clock')} <span class="rf-txt">Hazırlık ${hz} dk</span></span>`);
    const z = zorlukUc(t.zorluk);
    if (z) p.push(`<span title="Zorluk: ${e(o, z)}" data-vd-zorluk="${e(o, z)}">${ik(ZORLUK_IKON[z] || 'fa-gauge-simple')} <span class="rf-txt">${e(o, z)}</span></span>`);
    const kal = Number(t.kalori);
    if (t.kalori != null && kal > 0) p.push(`<span title="Porsiyon başına kalori">${ik('fa-fire-flame-curved')} <span class="rf-txt">${Math.round(kal)} kcal/porsiyon</span></span>`);
  } else if (v.ekipman && v.ekipman.length) {
    p.push(`<span title="Videoda kullanılan ekipman">${ik('fa-kitchen-set')} <span class="rf-txt">${v.ekipman.length} ekipman</span></span>`);
  }
  if (!p.length) return '';
  return `<div class="r-facts vd-meta${sinif ? ' ' + sinif : ''}"> ${p.join(' ')} </div>`;
}

/* ---------- avatar + şef ---------- */
function avatar(sef, o, sinif = 'av') {
  if (!sef) return '';
  const harf = e(o, sef.bas_harf || String(sef.ad || '?').trim().charAt(0).toLocaleUpperCase('tr'));
  return sef.avatar
    ? `<div class="${sinif}"><img src="${e(o, sef.avatar)}" alt="" loading="lazy" decoding="async" data-avatar-gorsel><span data-avatar-harf hidden aria-hidden="true">${harf}</span></div>`
    : `<div class="${sinif}"><span aria-hidden="true">${harf}</span></div>`;
}
/** Kart şef satırı: videonun sunucusu (seri sunucusu şef). Gastro .r-author. */
function sefSatiri(v, o) {
  const s = seriBul(v.seri, o);
  const k = s && s.sef;
  const sef = k && o.SEF ? o.SEF[k] : null;
  if (!sef) return '';
  return `<a class="r-author vd-kart__sef" href="${e(o, sefHref(k, o))}" title="${e(o, sef.ad)} — video şefi">${avatar(sef, o)} <span><b>${e(o, sef.ad)}</b></span></a>`;
}
export function sefRozeti(k, o, { boyut = 'kucuk', etiket = '' } = {}) {
  const sef = o.SEF ? o.SEF[k] : null;
  if (!sef) return '';
  if (boyut === 'kart') {
    const seriler = (katalog(o).seriler || []).filter((s) => s.sef === k);
    return `<a class="vd-sef-kart" href="${e(o, sefHref(k, o))}">
  ${avatar(sef, o, 'vd-sef-kart__av')}
  <span class="vd-sef-kart__ad" data-vd-kirp="2">${e(o, sef.ad)}</span>
  ${sef.unvan ? `<span class="vd-sef-kart__unvan">${e(o, sef.unvan)}</span>` : ''}
  ${seriler.length ? `<span class="vd-sef-kart__seri">${ik(seriler[0].ikon || 'fa-video')} ${e(o, seriler.map((s) => s.ad).join(' · '))}</span>` : ''}
  ${sef.tarif_sayisi ? `<span class="vd-sef-kart__sayi"><b>${Number(sef.tarif_sayisi).toLocaleString('tr')}</b> tarif</span>` : ''}
 </a>`;
  }
  return `<a class="vd-sef" href="${e(o, sefHref(k, o))}">${avatar(sef, o, 'vd-sef__av')}<span class="vd-sef__metin">${etiket ? `<small>${e(o, etiket)}</small>` : ''}<b>${e(o, sef.ad)}</b>${sef.unvan ? `<small>${e(o, sef.unvan)}</small>` : ''}</span></a>`;
}

/* ---------- parçalar ---------- */
const kaydetDugmesi = (v, o, sinif = 'r-save vd-kaydet') =>
  `<button type="button" class="${sinif}" data-vd-kaydet="${e(o, v.slug)}" aria-pressed="false" aria-label="Mutfak Defterine kaydet: ${e(o, v.baslik)}" title="Mutfak Defterine kaydet">${ik('fa-bookmark')}</button>`;
const ilerlemeCubugu = (v) => (v.ornek_ilerleme
  ? `<span class="vd-ilerleme" role="img" aria-label="İzleme ilerlemesi %${Math.round(v.ornek_ilerleme * 100)} (prototip örneği)" style="--vd-ilerleme:${Math.round(v.ornek_ilerleme * 100)}%"><span></span></span>`
  : '');
const proEtiketi = (s) => (s && s.pro ? `<span class="vd-pro">${ik('fa-lock')} Pro</span>` : '');
/** Tarifsiz video kapağı: seri afişi (tipografik). */
const afisKapak = (v, o, s) => `<span class="vd-afis-kapak" aria-hidden="true"><span class="vd-afis-kapak__ikon">${ik((s && s.ikon) || 'fa-video')}</span><span class="vd-afis-kapak__seri">${e(o, (s && s.ad) || '')}</span></span>`;
const kapakImg = (k, o, { sinif, gen = 640, yuk = 360, oncelik = false } = {}) =>
  `<img class="${sinif}" src="${e(o, k.src)}" alt="" width="${gen}" height="${yuk}" ${oncelik ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

/* ---------- 16:9 video kartı ---------- */
export function videoKarti(v, o, { boyut = 'izgara', baslikSeviye = 'h4', sefGoster = true, ilerleme = true, oncelik = false, gizli = false } = {}) {
  const s = seriBul(v.seri, o);
  const k = kapakBul(v, o);
  const href = videoHref(v, o);
  // Bölüm numarası her zaman görünür; dar yerde yalnız seri adı üç noktayla kısalır (lead 5 Kas düzeltme 2)
  const seriEt = s ? `<span class="r-chip vd-kart__seri">${ik(s.ikon || 'fa-video')} ${boyut === 'ray' ? '' : `<span class="vd-kart__seri-ad" data-vd-kirp="1">${e(o, s.ad)}</span><span class="vd-kart__seri-ayrac" aria-hidden="true">·</span>`}<span class="vd-kart__seri-no">Bölüm ${v.bolum}</span></span>` : '';
  const h = baslikSeviye;
  const medya = `<div class="r-media-wrap vd-kart__kap"><div class="r-media vd-kart__medya${k ? '' : ' vd-kart__medya--afis'}">
   ${k ? kapakImg(k, o, { sinif: 'vd-kart__kapak', oncelik }) : afisKapak(v, o, s)}
   ${seriEt}
   ${proEtiketi(s)}
   <span class="vd-sure">${ik('fa-play')} ${sureMetni(o, v.sure_sn)}</span>
   <span class="vd-onizleme" aria-hidden="true"><span class="vd-onizleme__etiket">${ik('fa-volume-xmark')} Önizleme</span><span class="vd-onizleme__cizgi"></span></span>
   ${ilerleme ? ilerlemeCubugu(v) : ''}
  </div>
  ${kaydetDugmesi(v, o)}</div>`; // yer imi .r-media'nın DIŞINDA: hover'da .r-media transform'u yığın bağlamı kurar ve içindeki düğme kartın bağ örtüsünün (h a::after) altında kalır (ölçüldü)
  if (boyut === 'kompakt') {
    const kalan = v.ornek_ilerleme ? Math.max(1, Math.round((v.sure_sn * (1 - v.ornek_ilerleme)) / 60)) : 0;
    return `<article class="r-card vd-kart vd-kart--kompakt" ${suzgecVerisi(v, o)}>
  ${medya}
  <div class="r-body">
   ${s ? `<span class="vd-kart__ust" data-vd-kirp="2">Bölüm ${v.bolum} · ${e(o, s.ad)}</span>` : ''}
   <${h} data-vd-kirp="2"><a href="${e(o, href)}">${e(o, v.baslik)}</a></${h}>
   ${kalan ? `<span class="vd-kart__kalan">${ik('fa-clock-rotate-left')} ${kalan} dk kaldı · %${Math.round(v.ornek_ilerleme * 100)} izlendi</span>` : ''}
  </div>
 </article>`;
  }
  return `<article class="r-card vd-kart vd-kart--${boyut}" ${suzgecVerisi(v, o)}${gizli ? ' hidden' : ''}>
  ${medya}
  <div class="r-body">
   <${h} data-vd-kirp="2"><a href="${e(o, href)}">${e(o, v.baslik)}</a></${h}>
   ${metaRozetleri(v, o)}
   ${sefGoster ? `<div class="r-foot"> ${sefSatiri(v, o)} </div>` : ''}
  </div>
 </article>`;
}

/* ---------- 9:16 kısa video kartı ---------- */
export function kisaKarti(k, o, { oncelik = false } = {}) {
  const kp = kapakBul(k, o);
  const s = seriBul(k.seri, o);
  const rozet = (k.rozetler || []).slice(0, 2).map((r) => `<span class="vd-rozet">${e(o, r)}</span>`).join('');
  return `<a class="vd-kisa" href="${e(o, kisaHref(k))}" data-vd-kisa="${e(o, k.slug)}" data-fit="${k.fit ? 1 : 0}" data-sure="15-alti">
  <span class="vd-kisa__medya">${kp ? kapakImg(kp, o, { sinif: 'vd-kisa__kapak', gen: 360, yuk: 640, oncelik }) : afisKapak(k, o, s)}</span>
  <span class="vd-kisa__sure">${ik('fa-bolt')} ${k.sure_sn} sn</span>
  <span class="vd-kisa__oynat" aria-hidden="true">${ik('fa-play')}</span>
  <span class="vd-kisa__alt">${rozet ? `<span class="vd-kisa__rozetler">${rozet}</span>` : ''}<span class="vd-kisa__baslik" data-vd-kirp="3">${e(o, k.baslik)}</span></span>
 </a>`;
}

/* ---------- Bölüm satırı (binge dizilimi) ---------- */
export function bolumKarti(v, o, { baslikSeviye = 'h3', ozet = true } = {}) {
  const s = seriBul(v.seri, o);
  const k = kapakBul(v, o);
  const href = videoHref(v, o);
  const h = baslikSeviye;
  const yuzde = v.ornek_ilerleme ? Math.round(v.ornek_ilerleme * 100) : 0;
  return `<article class="vd-bolum${s && s.pro ? ' vd-bolum--pro' : ''}" ${suzgecVerisi(v, o)}>
  <span class="vd-bolum__no" aria-hidden="true">${String(v.bolum).padStart(2, '0')}</span>
  <div class="vd-bolum__medya">
   ${k ? kapakImg(k, o, { sinif: 'vd-bolum__kapak' }) : afisKapak(v, o, s)}
   <span class="vd-bolum__oynat" aria-hidden="true">${ik(s && s.pro ? 'fa-lock' : 'fa-play')}</span>
   ${proEtiketi(s)}
   <span class="vd-sure">${ik('fa-play')} ${sureMetni(o, v.sure_sn)}</span>
   ${ilerlemeCubugu(v)}
  </div>
  <div class="vd-bolum__govde">
   <span class="vd-bolum__ust">Bölüm ${v.bolum}${yuzde ? ` · <span class="vd-bolum__izlendi">%${yuzde} izlendi</span>` : ''}</span>
   <${h} class="vd-bolum__baslik" data-vd-kirp="2"><a href="${e(o, href)}">${e(o, v.baslik)}</a></${h}>
   ${ozet && v.ozet ? `<p class="vd-bolum__ozet" data-vd-kirp="2">${e(o, v.ozet)}</p>` : ''}
   ${metaRozetleri(v, o, { sinif: 'vd-bolum__meta' })}
  </div>
  ${kaydetDugmesi(v, o, 'r-save vd-kaydet vd-bolum__kaydet')}
 </article>`;
}

/* ---------- Seri afişi ---------- */
const formatAd = (s) => (s.format === '9:16' ? 'Dikey 9:16' : 'Yatay 16:9');
export function sureAraligi(s) {
  const [a, b] = s.sure_araligi_sn || [0, 0];
  return a < 60 ? `${a}–${b} sn` : `${Math.round(a / 60)}–${Math.round(b / 60)} dk`;
}
export function seriAfisi(s, o, { boyut = 'kart', baslikSeviye = 'h3', ornekler = 0 } = {}) {
  const bol = seriBolumleri(s.slug, o);
  const kapaklar = bol.map((v) => kapakBul(v, o)).filter(Boolean).slice(0, 3);
  const sef = o.SEF ? o.SEF[s.sef] : null;
  const dikey = s.format === '9:16';
  const kolaj = kapaklar.length
    ? `<span class="vd-seri-afis__kolaj vd-seri-afis__kolaj--${dikey ? 'dikey' : 'yatay'}">${kapaklar.map((k, i) => kapakImg(k, o, { sinif: `vd-seri-afis__img vd-seri-afis__img--${i + 1}` })).join('')}</span>`
    : `<span class="vd-seri-afis__kolaj">${afisKapak({}, o, s)}</span>`;
  const h = baslikSeviye;
  return `<article class="vd-seri-afis vd-seri-afis--${boyut}${s.pro ? ' vd-seri-afis--pro' : ''}">
  <div class="vd-seri-afis__medya">${kolaj}${sponsorEtiketi(s.slug, { medya: true })}
   <span class="vd-seri-afis__format">${ik(dikey ? 'fa-mobile-screen' : 'fa-tv')} ${formatAd(s)}</span>
   ${s.pro ? `<span class="vd-pro">${ik('fa-lock')} Pro</span>` : ''}
   <span class="vd-seri-afis__ikon">${ik(s.ikon || 'fa-video')}</span>
  </div>
  <div class="vd-seri-afis__govde">
   <${h} class="vd-seri-afis__ad" data-vd-kirp="2"><a href="${e(o, seriHref(s, o))}">${e(o, s.ad)}</a></${h}>
   <p class="vd-seri-afis__vaat" data-vd-kirp="3">${e(o, s.vaat)}</p>
   <ul class="vd-seri-afis__kunye">
    <li>${ik('fa-film')} ${bol.length} bölüm</li>
    <li>${ik('fa-hourglass-half')} ${sureAraligi(s)}</li>
    <li>${ik('fa-calendar-days')} ${e(o, s.ritim)}</li>
   </ul>
   ${ornekler ? `<ol class="vd-seri-afis__ornek" aria-label="İlk bölümler">${bol.slice(0, ornekler).map((v) => `<li><a href="${e(o, videoHref(v, o))}"><span>${String(v.bolum).padStart(2, '0')}</span>${e(o, v.baslik)}</a></li>`).join('')}</ol>` : ''}
   ${sef ? `<span class="vd-seri-afis__sef">${avatar(sef, o, 'av')}<span>Sunan: <b>${e(o, sef.ad)}</b></span></span>` : ''}
  </div>
 </article>`;
}
