// Video Mutfağı · izleme sayfası (izle ajanı) → video-izle-<slug>.html (26 uzun video)
// Kabuk = Gastro tarif detayı (build). Kırıntı Gastro .rd-crumb, bölüm başlıkları .sec-head/.eyebrow/.lead, kartlar hub'ın kart.mjs'i
// (videoKarti → Gastro .r-card), meta rozetleri .r-facts. Gastro'da karşılığı olmayan parçalar (oynatıcı, senkron panel, bölüm
// damgaları, pişirme modu, sıradaki bölüm katmanı) vd- önekli ve izle.css / oynatici.css / pisirme.css'te.
import { oynatici, malzemeBolumleri, adimBolumu, posterYolu } from '../oynatici.mjs';
import * as kart from '../kart.mjs';

const DONOR = '<!-- Video Mutfağı izleme sayfası · donör: Gastro tarif detayı kabuğu (yerel 8960 render) + .rd-crumb/.sec-head/.r-card kalıpları · oynatıcı/panel/damga/pişirme modu yeni (vd-) -->';
const YAYIN = 'https://gaviaworks-dev.github.io/DadaVideo/';
const ORNEK_TARIH = '2026-10-'; // VideoObject uploadDate (örnek; bölüm sırasına göre gün)

export default async (o) => {
  const { esc, ui } = o;
  const uzunlar = o.KATALOG.videolar;
  return uzunlar.map((v) => sayfa(v, o, uzunlar));
};

function sayfa(v, o, uzunlar) {
  const { esc } = o;
  const s = o.SERI[v.seri];
  const t = o.videoTarifi(v);
  const sef = o.SEF[s?.sef];
  const kilitli = !!s?.pro;
  const seriBolum = uzunlar.filter((x) => x.seri === v.seri).sort((a, b) => a.bolum - b.bolum);
  const sira = seriBolum.findIndex((x) => x.slug === v.slug);
  const sonraki = seriBolum[sira + 1] || null;
  const { bolumler, malzemeler } = malzemeBolumleri(v, o);

  const main = `${DONOR}
<div class="vd-izle${kilitli ? ' vd-izle--kilitli' : ''}" data-vd-izle data-slug="${esc(v.slug)}"${sonraki && !kilitli ? ` data-sonraki="${esc(o.videoAdresi(sonraki))}"` : ''}>
 <section class="vd-izle__sinema" aria-label="Video">
  <div class="wrap">
   <nav class="rd-crumb vd-izle__kirinti" aria-label="Sayfa yolu">
    <a href="video-mutfagi.html"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i> Video Mutfağı</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    <a href="${esc(o.seriAdresi(s))}">${esc(s.ad)}</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    <b>Bölüm ${v.bolum}</b>
   </nav>
   ${oynatici(v, o, { kip: 'izle', kilitli, alt: damgalar(v, o, bolumler, kilitli) })}
  </div>
 </section>

 <div class="wrap vd-izle__govde">
  <header class="vd-izle__bas">
   <a class="vd-izle__seri" href="${esc(o.seriAdresi(s))}"><i class="fa-solid ${esc(s.ikon)}" aria-hidden="true"></i> ${esc(s.ad)} · Bölüm ${v.bolum} / ${seriBolum.length}</a>${kilitli ? ' <span class="vd-pro vd-izle__pro"><i class="fa-solid fa-lock" aria-hidden="true"></i> Pro</span>' : ''}
   <h1 class="vd-izle__baslik">${esc(v.baslik)}</h1>
   ${v.ozet ? `<p class="vd-izle__ozet">${esc(v.ozet)}</p>` : ''}
   <div class="vd-izle__meta">
    <span class="vd-izle__sure"><i class="fa-solid fa-circle-play" aria-hidden="true"></i> ${o.sureMetni(v.sure_sn)} video · ${bolumler.length} bölüm</span>
    ${kart.metaRozetleri(v, o, { sinif: 'vd-izle__rozet' })}
   </div>
   <div class="vd-izle__aksiyon">
    <button class="btn btn-ghost vd-izle__dugme" type="button" data-vd-kaydet="${esc(v.slug)}" aria-pressed="false"><i class="fa-regular fa-bookmark vd-izle__kapali" aria-hidden="true"></i><i class="fa-solid fa-bookmark vd-izle__acik" aria-hidden="true"></i><span class="vd-izle__kapali">Kaydet</span><span class="vd-izle__acik">Kaydedildi</span></button>
    <button class="btn btn-ghost vd-izle__dugme" type="button" data-vd-paylas data-baslik="${esc(v.baslik)}"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span>Paylaş</span></button>
    ${t && t.adimlar?.length ? `<button class="btn btn-primary vd-izle__dugme" type="button" data-vd-pisirme-ac aria-haspopup="dialog" aria-controls="vdPisirme"><i class="fa-solid fa-fire-burner" aria-hidden="true"></i><span>Pişirme Modu</span></button>` : ''}
   </div>
   ${t && v.ekipman?.length ? `<div class="vd-izle__ekipman"><span class="vd-izle__ekipman-bas"><i class="fa-solid fa-kitchen-set" aria-hidden="true"></i> Bu videodaki ekipman</span><ul>${v.ekipman.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
  </header>

  <aside class="vd-izle__yan" aria-label="${t ? 'Bu videonun yazılı tarifi' : 'Video künyesi'}">
   ${t ? tarifKarti(v, o, t) : kunyeKarti(v, o, s, bolumler)}
  </aside>

  ${sef ? sefKarti(v, o, s, sef, uzunlar) : ''}
  ${seriBaglami(v, o, s, seriBolum, sira, sonraki)}
 </div>

 ${benzerler(v, o, uzunlar)}
 ${t && t.adimlar?.length ? pisirmeModu(v, o, t, bolumler, malzemeler, kilitli) : ''}
 ${sonraki && !kilitli ? siradakiKatmani(v, o, sonraki) : ''}
 <script type="application/ld+json">${jsonLd(v, o, s, t, bolumler, sira).replace(/</g, '\\u003c')}</script>
</div>`;

  return {
    dosya: `video-izle-${v.slug}.html`,
    baslik: `${v.baslik} | ${s.ad} · Bölüm ${v.bolum} | Video Mutfağı — Dada Gastro (prototip)`,
    aciklama: v.ozet || `${s.ad} serisinin ${v.bolum}. bölümü.`,
    main,
    css: ['oynatici', 'izle', 'pisirme'],
    js: ['oynatici', 'izle', 'pisirme'],
    govdeSinifi: 'pg-video-izle',
    altMenu: 'seriler',
    gorsel: posterYolu(v, o, 1600),
  };
}

/* ---------- Bölüm damgaları (C.1) ---------- */
function damgalar(v, o, bolumler, kilitli) {
  const { esc } = o;
  return `<div class="vd-damgalar" data-vd-damgalar>
    <span class="vd-damgalar__bas"><i class="fa-solid fa-list-ul" aria-hidden="true"></i> Bölümler</span>
    <div class="vd-damgalar__iz" role="list">
     ${bolumler.map((b, i) => `<div role="listitem"><button class="vd-damga" type="button" data-vd-damga="${i}" data-sn="${b.sn}"${i === 0 ? ' aria-current="true"' : ''} aria-label="${esc(o.sureMetni(b.sn))} ${esc(b.baslik)}${kilitli ? ' (Pro)' : ''}"><span class="vd-damga__sn">${o.sureMetni(b.sn)}</span><span class="vd-damga__ad">${esc(b.baslik)}</span></button></div>`).join('')}
    </div>
   </div>`;
}

/* ---------- Yazılı tarif kartı (D.2b) ---------- */
function tarifKarti(v, o, t) {
  const { esc } = o;
  const tsef = o.SEF[t.sef];
  const toplam = (t.hazirlik_dk || 0) + (t.pisirme_dk || 0);
  const z = kart.zorlukUc(t.zorluk) || t.zorluk;
  return `<div class="vd-tarif-kart">
    <span class="eyebrow vd-tarif-kart__ust"><i class="fa-solid fa-book-open" aria-hidden="true"></i> Bu videonun yazılı tarifi</span>
    <a class="vd-tarif-kart__medya" href="${esc(o.tarifAdresi(t.slug))}" tabindex="-1" aria-hidden="true"><img src="${esc(t.kapak640)}" alt="" width="640" height="427" loading="lazy" decoding="async"></a>
    <div class="vd-tarif-kart__govde">
     <h2 class="vd-tarif-kart__ad"><a href="${esc(o.tarifAdresi(t.slug))}">${esc(t.baslik)}</a></h2>
     ${tsef ? `<p class="vd-tarif-kart__sef">${tsef.avatar ? `<img src="${esc(tsef.avatar)}" alt="" width="28" height="28" loading="lazy">` : `<span aria-hidden="true">${esc(tsef.bas_harf)}</span>`}<span>Tarif: <b>${esc(tsef.ad)}</b></span></p>` : ''}
     <ul class="vd-tarif-kart__kunye">
      ${toplam ? `<li><i class="fa-solid fa-clock" aria-hidden="true"></i><span><b>${toplam} dk</b><small>Hazırlık + pişirme</small></span></li>` : ''}
      ${z ? `<li><i class="fa-solid fa-signal" aria-hidden="true"></i><span><b>${esc(z)}</b><small>Zorluk</small></span></li>` : ''}
      ${t.porsiyon ? `<li><i class="fa-solid fa-utensils" aria-hidden="true"></i><span><b>${esc(t.porsiyon)} ${esc(t.porsiyon_birimi || 'kişilik')}</b><small>Porsiyon</small></span></li>` : ''}
      ${t.kalori ? `<li><i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i><span><b>${Math.round(t.kalori)} kcal</b><small>Porsiyon başına</small></span></li>` : ''}
     </ul>
     <p class="vd-tarif-kart__not">Malzemelerin tamamı, adım adım yapılışı ve püf noktaları Dada Gastro'daki yazılı tarifte.</p>
     <a class="btn btn-primary vd-tarif-kart__git" href="${esc(o.tarifAdresi(t.slug))}">Yazılı tarife git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>
   </div>`;
}

/** Tarifsiz video (ekipman rehberi): yazılı tarif yerine künye — sayı uydurmadan yalnız katalog verisi. */
function kunyeKarti(v, o, s, bolumler) {
  const { esc } = o;
  return `<div class="vd-tarif-kart vd-tarif-kart--kunye">
    <span class="eyebrow vd-tarif-kart__ust"><i class="fa-solid fa-kitchen-set" aria-hidden="true"></i> Ekipman rehberi</span>
    <div class="vd-tarif-kart__govde">
     <h2 class="vd-tarif-kart__ad">Bu videoda yazılı tarif yok</h2>
     <p class="vd-tarif-kart__not">${esc(s.ad)} serisinin bu bölümü bir tarif değil, ekipman rehberi. Ekipman listesi oynatıcının yanında; bölümler videoyla birlikte ilerler.</p>
     <ul class="vd-tarif-kart__kunye">
      <li><i class="fa-solid fa-circle-play" aria-hidden="true"></i><span><b>${o.sureMetni(v.sure_sn)}</b><small>Video süresi</small></span></li>
      <li><i class="fa-solid fa-list-ul" aria-hidden="true"></i><span><b>${bolumler.length} bölüm</b><small>Zaman damgalı</small></span></li>
      <li><i class="fa-solid fa-kitchen-set" aria-hidden="true"></i><span><b>${(v.ekipman || []).length} ekipman</b><small>Videoda kullanılan</small></span></li>
     </ul>
     <a class="btn btn-primary vd-tarif-kart__git" href="${esc(o.seriAdresi(s))}">Serinin tarifli bölümleri <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>
   </div>`;
}

/* ---------- Şef kartı (E.1a) ---------- */
function sefKarti(v, o, s, sef, uzunlar) {
  const { esc } = o;
  const k = sef.kullanici_adi;
  const seriler = o.KATALOG.seriler.filter((x) => x.sef === k);
  const diger = [...uzunlar, ...o.KATALOG.kisalar].filter((x) => x.slug !== v.slug && seriler.some((sr) => sr.slug === x.seri) && x.seri !== '30-saniyede-tat').slice(0, 3);
  const tanitim = sefTanitimi(sef, seriler);
  return `<section class="vd-sunucu" aria-labelledby="vdSunucuAd">
   <div class="vd-sunucu__bas">
    <a class="vd-sunucu__av" href="${esc(o.sefAdresi(k))}" tabindex="-1" aria-hidden="true">${sef.avatar ? `<img src="${esc(sef.avatar)}" alt="" width="72" height="72" loading="lazy" decoding="async">` : `<span>${esc(sef.bas_harf)}</span>`}</a>
    <div class="vd-sunucu__kim">
     <span class="vd-sunucu__rol">Seri sunucusu</span>
     <h2 class="vd-sunucu__ad" id="vdSunucuAd"><a href="${esc(o.sefAdresi(k))}">${esc(sef.ad)}</a></h2>
     <p class="vd-sunucu__unvan">${esc(sef.unvan || '')}${sef.mutfak ? ` · ${esc(sef.mutfak)}` : ''}</p>
    </div>
    <button class="btn btn-primary vd-sunucu__takip" type="button" data-vd-takip="${esc(k)}" data-ad="${esc(sef.ad)}" aria-pressed="false"><i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>Takip Et</span></button>
   </div>
   <p class="vd-sunucu__tanitim"><span class="vd-ornek"><i class="fa-solid fa-flask" aria-hidden="true"></i> Prototip örneği</span> ${esc(tanitim)}</p>
   ${diger.length ? `<div class="vd-sunucu__diger">
    <div class="vd-sunucu__diger-bas"><h3>Şefin diğer videoları</h3><a class="see-all" href="${esc(o.sefAdresi(k))}">Şefin kanalı <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>
    <div class="vd-sunucu__ray">${diger.map((x) => kart.videoKarti(x, o, { boyut: 'ray', baslikSeviye: 'h4', ilerleme: false, sefGoster: false })).join('')}</div>
   </div>` : `<a class="see-all vd-sunucu__kanal" href="${esc(o.sefAdresi(k))}">Şefin kanalı <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>`}
  </section>`;
}

/** Şef tanıtımı (prototip örneği): yalnız gerçek veriden — unvan, tarif sayısı, en çok tarifi olduğu mutfak, sunduğu seri. */
export function sefTanitimi(sef, seriler) {
  const u = String(sef.unvan || '');
  const n = Number(sef.tarif_sayisi || 0).toLocaleString('tr-TR');
  const kim = /^dada/i.test(u) ? `Dada Gastro'da ${u}` : u ? `Dada Gastro'da ${u.toLocaleLowerCase('tr-TR')} olarak tarif yazıyor` : `Dada Gastro'da tarif yazıyor`;
  const mutfak = sef.mutfak ? ` Tariflerinin çoğu ${sef.mutfak} tarifleri.` : '';
  const seri = seriler.length ? ` Video Mutfağı'nda ${seriler.map((x) => x.ad).join(' ve ')} ${seriler.length > 1 ? 'serilerini' : 'serisini'} sunuyor.` : '';
  return `${sef.ad}, ${kim}; sitede ${n} yazılı tarifi var.${mutfak}${seri}`;
}

/* ---------- Seri bağlamı ---------- */
function seriBaglami(v, o, s, seriBolum, sira, sonraki) {
  const { esc } = o;
  const kucukKapak = (x) => { const p = posterYolu(x, o, 640); return p ? `<img src="${esc(p)}" alt="" width="640" height="360" loading="lazy" decoding="async">` : `<span class="vd-seri-baglam__afis" aria-hidden="true"><i class="fa-solid ${esc(s.ikon)}"></i></span>`; };
  return `<section class="vd-seri-baglam" aria-labelledby="vdSeriBaglam">
   <div class="vd-seri-baglam__bas">
    <div><span class="eyebrow"><i class="fa-solid ${esc(s.ikon)}" aria-hidden="true"></i> ${esc(s.ad)}</span><h2 id="vdSeriBaglam">Serinin bölümleri</h2></div>
    <a class="see-all" href="${esc(o.seriAdresi(s))}">Seri sayfası <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
   </div>
   ${sonraki ? `<a class="vd-siradaki" href="${esc(o.videoAdresi(sonraki))}">
    <span class="vd-siradaki__medya">${kucukKapak(sonraki)}<span class="vd-siradaki__oynat" aria-hidden="true"><i class="fa-solid ${s.pro ? 'fa-lock' : 'fa-play'}"></i></span><span class="vd-sure"><i class="fa-solid fa-play" aria-hidden="true"></i> ${o.sureMetni(sonraki.sure_sn)}</span></span>
    <span class="vd-siradaki__metin"><span class="vd-siradaki__ust">Sıradaki bölüm · Bölüm ${sonraki.bolum}</span><b>${esc(sonraki.baslik)}</b>${sonraki.ozet ? `<small>${esc(sonraki.ozet)}</small>` : ''}</span>
   </a>` : `<div class="vd-siradaki vd-siradaki--son"><span class="vd-siradaki__metin"><span class="vd-siradaki__ust">Serinin son bölümü</span><b>${esc(s.ad)} serisini bitirdin</b><small>${esc(s.ritim)}.</small></span><a class="btn btn-ghost" href="${esc(o.videoAdresi(seriBolum[0]))}">Baştan izle</a></div>`}
   <ol class="vd-bolum-liste">
    ${seriBolum.map((x, i) => `<li class="vd-bolum-liste__oge${i === sira ? ' is-simdi' : ''}">
     <a href="${esc(o.videoAdresi(x))}"${i === sira ? ' aria-current="page"' : ''}>
      <span class="vd-bolum-liste__no" aria-hidden="true">${i === sira ? '<i class="fa-solid fa-play"></i>' : String(x.bolum).padStart(2, '0')}</span>
      <span class="vd-bolum-liste__medya">${kucukKapak(x)}</span>
      <span class="vd-bolum-liste__metin"><b>${esc(x.baslik)}</b><small>${i === sira ? '<span class="vd-bolum-liste__simdi">Şimdi izliyorsun</span> · ' : `Bölüm ${x.bolum} · `}${o.sureMetni(x.sure_sn)}</small></span>
     </a>
    </li>`).join('')}
   </ol>
  </section>`;
}

/* ---------- Benzer videolar ---------- */
function benzerler(v, o, uzunlar) {
  const t = o.videoTarifi(v);
  const s = o.SERI[v.seri];
  const puan = (x) => {
    const xs = o.SERI[x.seri]; const xt = o.videoTarifi(x);
    let p = 0;
    if (!!x.fit === !!v.fit) p += 2;
    if (xs?.konsept && xs.konsept === s?.konsept) p += 2;
    if (xt && t && xt.mutfak === t.mutfak) p += 1;
    if (xt && t && xt.zorluk === t.zorluk) p += 1;
    p -= Math.abs((x.sure_sn || 0) - (v.sure_sn || 0)) / 600;
    return p;
  };
  // Serinin kendi bölümleri "Serinin bölümleri"nde; burada başka serilerden 4 video (kendi serisinden en çok 0)
  const aday = uzunlar.filter((x) => x.seri !== v.seri).map((x) => [x, puan(x)]).sort((a, b) => b[1] - a[1]);
  const secim = []; const seriSay = {};
  for (const [x] of aday) { if ((seriSay[x.seri] || 0) >= 2) continue; secim.push(x); seriSay[x.seri] = (seriSay[x.seri] || 0) + 1; if (secim.length === 4) break; }
  return `<section class="vd-alan vd-alan--beyaz vd-izle__benzer" aria-labelledby="vdBenzer">
  <div class="wrap">
   <div class="sec-head">
    <div><span class="eyebrow"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i> Video Mutfağı</span><h2 id="vdBenzer">Benzer videolar</h2><p class="lead">Başka serilerden, bu bölüme yakın süre ve zorlukta videolar.</p></div>
    <div class="sec-tools"><a class="see-all" href="video-mutfagi.html">Tüm videolar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>
   </div>
   <div class="vd-izgara">${secim.map((x) => kart.videoKarti(x, o, { boyut: 'izgara', baslikSeviye: 'h3' })).join('')}</div>
  </div>
 </section>`;
}

/* ---------- Pişirme modu (C.3) ---------- */
function pisirmeModu(v, o, t, bolumler, malzemeler, kilitli) {
  const { esc } = o;
  const n = t.adimlar.length;
  return `<div class="vd-pisirme" id="vdPisirme" role="dialog" aria-modal="true" aria-labelledby="vdPisirmeAd" data-vd-pisirme hidden>
  <div class="vd-pisirme__ust">
   <div class="vd-pisirme__kim"><span class="vd-pisirme__etiket"><i class="fa-solid fa-fire-burner" aria-hidden="true"></i> Pişirme Modu</span><b id="vdPisirmeAd">${esc(t.baslik)}</b></div>
   <p class="vd-pisirme__kilit" data-vd-wake role="status" aria-live="polite"><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i><span data-vd-wake-yazi>Ekranı açık tutma isteniyor…</span></p>
   <button class="vd-pisirme__kapat" type="button" data-vd-pisirme-kapat aria-label="Pişirme modunu kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
  </div>
  <div class="vd-pisirme__ilerleme" aria-hidden="true">${t.adimlar.map((_, i) => `<span data-vd-pis-parca="${i}"></span>`).join('')}</div>
  <div class="vd-pisirme__sahne" data-vd-pis-sahne>
   ${t.adimlar.map((a, i) => {
     const b = adimBolumu(bolumler, i);
     const mz = malzemeler.filter((m) => m.adim === i);
     return `<section class="vd-pisirme__adim" data-vd-pis-adim="${i}"${i ? ' hidden' : ''} aria-roledescription="adım" aria-label="Adım ${i + 1} / ${n}">
     <div class="vd-pisirme__adim-ust"><span class="vd-pisirme__no">Adım ${i + 1} <small>/ ${n}</small></span>${a.sure_dk ? `<span class="vd-pisirme__dk"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> ~${a.sure_dk} dk</span>` : ''}</div>
     ${a.baslik ? `<h2 class="vd-pisirme__baslik">${esc(a.baslik)}</h2>` : ''}
     <p class="vd-pisirme__metin">${esc(a.metin)}</p>
     ${mz.length ? `<ul class="vd-pisirme__mz" aria-label="Bu adımın malzemeleri">${mz.map((m) => `<li>${[m.miktar_metin ?? m.miktar, m.birim].filter((x) => x !== null && x !== undefined && String(x).trim()).length ? `<b>${esc([m.miktar_metin ?? m.miktar, m.birim].filter((x) => x !== null && x !== undefined && String(x).trim()).join(' '))}</b> ` : ''}${esc(m.ad)}</li>`).join('')}</ul>` : ''}
     <div class="vd-pisirme__video">
      <span class="vd-pisirme__damga"><i class="fa-solid fa-clock" aria-hidden="true"></i> Videoda ${o.sureMetni(b.sn)} · ${esc(b.baslik)}</span>
      ${kilitli ? '' : `<button class="vd-pisirme__goster" type="button" data-vd-pis-goster="${b.sn}"><i class="fa-solid fa-circle-play" aria-hidden="true"></i> Videoda göster</button>`}
     </div>
    </section>`;
   }).join('')}
  </div>
  <div class="vd-pisirme__alt">
   <button class="vd-pisirme__nav" type="button" data-vd-pis-onceki disabled><i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>Önceki Adım</span></button>
   <span class="vd-pisirme__sayac" data-vd-pis-sayac aria-live="polite">1 / ${n}</span>
   <button class="vd-pisirme__nav vd-pisirme__nav--ileri" type="button" data-vd-pis-sonraki><span data-vd-pis-sonraki-yazi>Sonraki Adım</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
  </div>
 </div>`;
}

/* ---------- Video bitince "Sıradaki bölüm" katmanı (5 sn geri sayım) — izle.js oynatıcı sahnesine taşır ---------- */
function siradakiKatmani(v, o, sonraki) {
  const { esc } = o;
  return `<div class="vd-sonraki" data-vd-sonraki-katman hidden role="dialog" aria-label="Sıradaki bölüm">
  <span class="vd-sonraki__ust">Sıradaki bölüm · <span data-vd-geri-sayim>5</span> sn</span>
  <b class="vd-sonraki__ad">${esc(sonraki.baslik)}</b>
  <span class="vd-sonraki__halka" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21"></circle><circle class="vd-sonraki__dolu" cx="24" cy="24" r="21"></circle></svg><i class="fa-solid fa-play"></i></span>
  <div class="vd-sonraki__dugmeler">
   <a class="vd-sonraki__simdi" href="${esc(o.videoAdresi(sonraki))}">Şimdi izle</a>
   <button class="vd-sonraki__iptal" type="button" data-vd-sonraki-iptal>İptal</button>
  </div>
 </div>`;
}

/* ---------- VideoObject JSON-LD (E.2a) ---------- */
function jsonLd(v, o, s, t, bolumler, sira) {
  const sayfa = `${YAYIN}video-izle-${v.slug}.html`;
  const poster = posterYolu(v, o, 1600);
  const gun = String(Math.min(28, 2 + sira * 5 + o.KATALOG.seriler.findIndex((x) => x.slug === s.slug))).padStart(2, '0');
  const veri = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.baslik,
    description: v.ozet || `${s.ad} serisinin ${v.bolum}. bölümü.`,
    thumbnailUrl: poster ? [YAYIN + poster] : [],
    uploadDate: `${ORNEK_TARIH}${gun}T09:00:00+03:00`,
    duration: o.sureIso(v.sure_sn),
    // Prototip: gerçek video dosyası yok → contentUrl izleme sayfasının kendisi (Gastro'da barındırma kararından sonra HLS/MP4 adresi olur)
    contentUrl: sayfa,
    embedUrl: sayfa,
    inLanguage: 'tr',
    isFamilyFriendly: true,
    isAccessibleForFree: !s.pro,
    publisher: { '@type': 'Organization', name: 'Dada Gastro', url: 'https://dadagastro.com/' },
    hasPart: bolumler.map((b, i) => ({
      '@type': 'Clip',
      name: b.baslik,
      startOffset: b.sn,
      endOffset: i + 1 < bolumler.length ? bolumler[i + 1].sn : v.sure_sn,
      url: `${sayfa}#t=${b.sn}`,
    })),
  };
  const sef = o.SEF[s.sef];
  if (sef) veri.creator = { '@type': 'Person', name: sef.ad, url: o.sefGastroAdresi(sef.kullanici_adi) };
  if (t) veri.about = { '@type': 'Recipe', name: t.baslik, url: t.sayfa ? `${YAYIN}tarif-${t.slug}.html` : `https://dadagastro.com/tarif/${t.slug}` };
  return JSON.stringify(veri);
}
