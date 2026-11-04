// Hub: video-mutfagi.html (hub ajanı).
// Sıra (doküman Modül 01): 1.1 Spotlight (üç vitrin sekmesi; oynatıcı + senkron malzeme paneli + iki aksiyon = izle ajanının
// oynatici() bileşeni, kip 'spotlight') · 1.2 yapışkan süzgeç barı (?konsept&sure) · İzlemeye devam et (prototip örneği) ·
// 1.3 30 Saniyede Tat rayı (9:16) · 1.4 seri rayları (bölüm kartları) · video şefleri · E.2b tüm videolar (ilk 12 statik,
// kalanı kaydırdıkça).
// İşaretleme tabanı Gastro: .sec-head/.eyebrow/.lead, .see-all, .row-nav/.row-track, .chip, .btn, .r-card (kart.mjs).
import * as K from '../kart.mjs';
import { oynatici } from '../oynatici.mjs';
import { kisaGoruntuleyici } from './kisa.mjs'; // izle ajanının tam ekran dikey görüntüleyicisi, hub'da katman (1.3b)
import { reklamSlotu, sponsorEtiketi } from '../reklam.mjs'; // REVİZE 1 madde 7 (reklam ajanının API'si)

export const KONSEPT_IKON = { '10 Dakikada Pratik': 'fa-stopwatch', 'Şef Teknikleri': 'fa-book-open', 'Restoran Sırları': 'fa-bell-concierge', 'Yöresel Keşifler': 'fa-map-location-dot', 'Fit Tarifler': 'fa-leaf' };
const { konseptKodu } = K;
// Sekme alt yazısı: Haftanın Serisi → seri adı · Mevsimin Tarifi → tarifin kısa adı · Sponsorlu Şef → şefin adı
const VITRIN = [
  { ad: 'Haftanın Serisi', ikon: 'fa-star', alt: 'seri' },
  { ad: 'Mevsimin Tarifi', ikon: 'fa-leaf', alt: 'video' },
  { ad: 'Sponsorlu Şef', ikon: 'fa-bullhorn', alt: 'sef', sponsor: true },
];
const kisaAd = (b) => String(b).split(/[:·]/)[0].trim();
const ILK = 12; // E.2b: sunucu render ilk sayfa (4'ün, 3'ün, 2'nin katı → hiçbir genişlikte yarım satır yok)

export default async function (o) {
  const { esc } = o;
  const ui = (ad) => `<i class="fa-solid ${ad.startsWith('fa-') ? ad : 'fa-' + ad}" aria-hidden="true"></i>`;
  const KAT = o.KATALOG;
  const seriler = KAT.seriler;
  const videolar = KAT.videolar;
  const kisalar = KAT.kisalar;
  const seri = (slug) => seriler.find((s) => s.slug === slug);

  /* ---------- 1.1 Spotlight ---------- */
  const vitrinler = VITRIN.map((x) => ({ ...x, v: videolar.find((v) => v.vitrin === x.ad) })).filter((x) => x.v);
  const sekmeler = vitrinler.map((x, i) => {
    const s = seri(x.v.seri);
    return `<button class="vd-spot__sekme" type="button" role="tab" id="vd-sekme-${i}" aria-controls="vd-vitrin-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-vd-sekme="${i}">
     <span class="vd-spot__sekme-ikon">${ui(x.ikon)}</span>
     <span class="vd-spot__sekme-metin"><small>${esc(x.ad)}</small><b>${esc(x.alt === 'seri' && s ? s.ad : x.alt === 'sef' && s && o.SEF[s.sef] ? o.SEF[s.sef].ad : kisaAd(x.v.baslik))}</b></span>
    </button>`;
  }).join('');
  const paneller = vitrinler.map((x, i) => {
    const v = x.v; const s = seri(v.seri);
    return `<div class="vd-spot__panel" role="tabpanel" id="vd-vitrin-${i}" aria-labelledby="vd-sekme-${i}" data-vd-vitrin="${i}"${i ? ' hidden' : ''}>
    <div class="vd-spot__kunye">
     <div class="vd-spot__kunye-sol">
      <div class="vd-spot__kunye-ust">
       ${s ? `<a class="vd-spot__seri" href="${esc(o.seriAdresi(s))}">${ui(s.ikon)} ${esc(s.ad)} · Bölüm ${v.bolum}</a>` : ''}
       ${x.sponsor ? `<span class="vd-ornek vd-ornek--koyu" data-vd-reklamsiz>${ui('fa-bullhorn')} Sponsor alanı · prototip örneği</span>${s ? sponsorEtiketi(s.slug) : ''}` : ''}
      </div>
      <h2 class="vd-spot__baslik"><a href="${esc(o.videoAdresi(v))}">${esc(v.baslik)}</a></h2>
     </div>
     <div class="vd-spot__alt">${s ? K.sefRozeti(s.sef, o, { etiket: 'Sunan' }) : ''}${K.metaRozetleri(v, o, { sinif: 'vd-spot__meta' })}</div>
    </div>
    ${oynatici(v, o, { kip: 'spotlight', kilitli: !!(s && s.pro), baslikSeviye: 'h3', oncelik: i === 0 })}
   </div>`;
  }).join('');
  const spot = `<section class="vd-spot" aria-labelledby="vd-h1" data-rk-hero="">
 <div class="wrap">
  <div class="vd-spot__bas">
   <div class="vd-spot__giris">
    <span class="eyebrow">${ui('fa-clapperboard')} İzle &amp; pişir</span>
    <h1 id="vd-h1">Video Mutfağı</h1>
    <p>Adım adım tarif videoları, şef teknikleri ve 30 saniyelik fikirler. Video ilerledikçe malzemeler yanında açılır.</p>
   </div>
   <div class="vd-spot__sekmeler" role="tablist" aria-label="Vitrin">${sekmeler}</div>
  </div>
  ${paneller}
 </div>
</section>`;

  /* ---------- 1.2 Yapışkan süzgeç barı ---------- */
  const konseptCip = KAT.konseptler.map((k) => `<button class="chip vd-cip" type="button" data-vd-konsept="${konseptKodu(k)}" aria-pressed="false">${ui(KONSEPT_IKON[k] || 'fa-tag')}<span>${esc(k)}</span></button>`).join('');
  const sureCip = KAT.sure_suzgecleri.map((s) => `<button class="chip vd-cip" type="button" data-vd-sure="${esc(s.kod)}" aria-pressed="false">${ui('fa-clock')}<span>${esc(s.ad)}</span></button>`).join('');
  const suzgec = `<div class="vd-suzgec" data-vd-suzgec>
 <div class="wrap vd-suzgec__ic">
  <div class="vd-suzgec__iz" role="toolbar" aria-label="Videoları süz">
   <button class="chip vd-cip" type="button" data-vd-tumu aria-pressed="true">${ui('fa-border-all')}<span>Tümü</span></button>
   <span class="vd-suzgec__ayrac" aria-hidden="true"></span>
   <span class="vd-suzgec__grup" role="group" aria-label="Konsept">${konseptCip}</span>
   <span class="vd-suzgec__ayrac" aria-hidden="true"></span>
   <span class="vd-suzgec__grup" role="group" aria-label="Süre">${sureCip}</span>
  </div>
  <p class="vd-suzgec__sonuc" aria-live="polite"><b data-vd-sonuc-sayi>${videolar.length}</b> video</p>
 </div>
</div>`;

  /* ---------- İzlemeye devam et (prototip örneği) ---------- */
  const devamListe = videolar.filter((v) => v.ornek_ilerleme);
  const devam = devamListe.length ? `<section class="vd-alan vd-devam" id="devam" aria-labelledby="vd-devam-h" data-vd-anasayfa>
 <div class="wrap">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-clock-rotate-left')} Kaldığın yerden</span><h2 id="vd-devam-h">İzlemeye devam et</h2></div>
   <div class="sec-tools"><span class="vd-ornek">${ui('fa-flask')} Prototip örneği · üyeye görünür</span></div>
  </div>
  <div class="vd-izgara vd-izgara--3 vd-devam__izgara">${devamListe.map((v) => K.videoKarti(v, o, { boyut: 'kompakt', baslikSeviye: 'h3' })).join('')}</div>
 </div>
</section>` : '';

  /* ---------- 1.3 30 Saniyede Tat rayı ---------- */
  const kisaSeri = seriler.find((s) => s.format === '9:16');
  const kisa = `<section class="vd-alan vd-alan--krem vd-kisalar" id="kisa" aria-labelledby="vd-kisa-h" data-vd-anasayfa>
 <div class="wrap vd-ray vd-ray--kisa" data-vd-ray>
  <div class="sec-head">
   <div><span class="eyebrow">${ui(kisaSeri ? kisaSeri.ikon : 'fa-bolt')} ${esc(kisaSeri ? kisaSeri.ad : '30 Saniyede Tat')}</span><h2 id="vd-kisa-h">30 saniyede bir fikir</h2>
   <p class="lead">${esc(kisaSeri ? kisaSeri.vaat : '')} Dokun, tam ekranda yukarı kaydırarak sıradakine geç.</p></div>
   <div class="sec-tools">${kisaSeri ? `<a class="see-all" href="${esc(o.seriAdresi(kisaSeri))}">Seriyi aç ${ui('fa-arrow-right')}</a>` : ''}<div class="row-nav"><button type="button" data-vd-ray-onceki aria-label="Önceki kısa videolar">${ui('fa-chevron-left')}</button><button type="button" data-vd-ray-sonraki aria-label="Sonraki kısa videolar">${ui('fa-chevron-right')}</button></div></div>
  </div>
  <div class="row-track" data-vd-ray-iz>${kisalar.map((k) => K.kisaKarti(k, o)).join('')}</div>
 </div>
</section>`;

  /* ---------- 1.4 Seri rayları ---------- */
  const uzunSeriler = seriler.filter((s) => s.format !== '9:16');
  const seriRay = (s) => {
    const bol = videolar.filter((v) => v.seri === s.slug).sort((a, b) => a.bolum - b.bolum);
    const sef = o.SEF[s.sef];
    const sponsor = s.sponsor_yuvasi ? `<aside class="vd-sponsor" data-vd-reklamsiz aria-label="Sponsor alanı (prototip örneği)">
     <span class="vd-sponsor__logo" aria-hidden="true">${ui('fa-handshake')}</span>
     <span class="vd-sponsor__metin"><b>Sponsor alanı</b> Bu serinin bölümleri bir mutfak aleti markasıyla ortak yayınlanabilir; marka adı ve ürün bağlantısı bu yuvada görünür.</span>
     <span class="vd-ornek">${ui('fa-flask')} Prototip örneği</span>
    </aside>` : '';
    return `<article class="vd-seri-ray" aria-labelledby="vd-ray-${s.slug}">
   <div class="vd-ray vd-ray--video" data-vd-ray>
    <div class="vd-seri-ray__bas">
     <span class="vd-seri-ray__ikon">${ui(s.ikon)}</span>
     <div class="vd-seri-ray__metin">
      <h3 id="vd-ray-${s.slug}"><a href="${esc(o.seriAdresi(s))}">${esc(s.ad)}</a>${s.pro ? ` <span class="vd-pro vd-pro--satir">${ui('fa-lock')} Pro</span>` : ''}</h3>${sponsorEtiketi(s.slug)}
      <p>${esc(s.vaat)}</p>
      <ul class="vd-seri-ray__kunye">
       <li>${ui('fa-film')} ${bol.length} bölüm</li><li>${ui('fa-hourglass-half')} ${K.sureAraligi(s)}</li><li>${ui('fa-calendar-days')} ${esc(s.ritim)}</li>${sef ? `<li>${ui('fa-user')} Sunan: <a href="${esc(o.sefAdresi(s.sef))}">${esc(sef.ad)}</a></li>` : ''}
      </ul>
     </div>
     <div class="vd-seri-ray__arac">
      ${s.pro ? `<a class="btn btn-ghost vd-pro-bag" href="https://dadagastro.com/pro">${ui('fa-crown')} Pro'ya Yükselt</a>` : ''}
      <a class="see-all" href="${esc(o.seriAdresi(s))}">Seriyi aç ${ui('fa-arrow-right')}</a>
      <div class="row-nav"><button type="button" data-vd-ray-onceki aria-label="${esc(s.ad)}: önceki bölümler">${ui('fa-chevron-left')}</button><button type="button" data-vd-ray-sonraki aria-label="${esc(s.ad)}: sonraki bölümler">${ui('fa-chevron-right')}</button></div>
     </div>
    </div>
    ${sponsor}
    <div class="row-track" data-vd-ray-iz>${bol.map((v) => K.videoKarti(v, o, { boyut: 'ray', sefGoster: false })).join('')}</div>
   </div>
  </article>`;
  };
  const seriBolum = `<section class="vd-alan vd-seriler" id="seriler" aria-labelledby="vd-seri-h" data-vd-anasayfa>
 <div class="wrap">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-layer-group')} Video serileri</span><h2 id="vd-seri-h">Bölüm bölüm ustalaş</h2>
   <p class="lead">Her seri bir konuya odaklanır; Bölüm 1'den başla, kaldığın bölümden devam et.</p></div>
   <div class="sec-tools"><a class="see-all" href="video-seriler.html">Tüm seriler ${ui('fa-arrow-right')}</a></div>
  </div>
  <div class="vd-seri-raylari">${uzunSeriler.map(seriRay).join('')}</div>
 </div>
</section>`;

  /* ---------- Video şefleri ---------- */
  const sefler = [...new Set(seriler.map((s) => s.sef))].filter((k) => o.SEF[k]);
  const sefBolum = `<section class="vd-alan vd-sefler" id="sefler" aria-labelledby="vd-sef-h" data-vd-anasayfa>
 <div class="wrap">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-kitchen-set')} Video şefleri</span><h2 id="vd-sef-h">Kameranın arkasındaki mutfak</h2>
   <p class="lead">Her seriyi bir Dada Gastro şefi sunar; tarifleri sitede de yayında.</p></div>
  </div>
  <div class="vd-izgara vd-izgara--6">${sefler.map((k) => K.sefRozeti(k, o, { boyut: 'kart' })).join('')}</div>
 </div>
</section>`;

  /* ---------- E.2b Tüm videolar ---------- */
  const sirali = [...videolar].sort((a, b) => (seriler.indexOf(seri(a.seri)) - seriler.indexOf(seri(b.seri))) || a.bolum - b.bolum);
  // karışık sıra: her seriden sırayla bir bölüm (ızgara tek seriye boğulmasın)
  const kuyruk = uzunSeriler.map((s) => sirali.filter((v) => v.seri === s.slug));
  const karisik = [];
  while (kuyruk.some((q) => q.length)) for (const q of kuyruk) if (q.length) karisik.push(q.shift());
  const kart = (v) => K.videoKarti(v, o, { baslikSeviye: 'h3' });
  const tum = `<section class="vd-alan vd-tum" id="tum-videolar" aria-labelledby="vd-tum-h">
 <div class="wrap">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-film')} Video arşivi</span><h2 id="vd-tum-h" data-vd-tum-baslik>Tüm videolar</h2>
   <p class="lead" data-vd-tum-alt>Bütün serilerin bölümleri bir arada. Aşağı kaydırdıkça yenileri yüklenir.</p></div>
  </div>
  <div class="vd-izgara vd-tum__izgara" data-vd-izgara>
   ${[...karisik.slice(0, 3).map(kart), reklamSlotu('native', o, { sayfa: 'hub' }), ...karisik.slice(3, ILK).map(kart)].join('\n   ')}
   <div class="vd-son" data-vd-son hidden>
    <span class="vd-son__ikon">${ui('fa-circle-check')}</span>
    <span class="vd-son__metin"><b>Hepsi bu kadar</b><span data-vd-son-alt>Yeni bölümler serilerin yayın ritmine göre eklenir.</span></span>
    <a class="see-all" href="video-seriler.html" data-vd-son-seri>Serilere göz at ${ui('fa-arrow-right')}</a>
    <button class="see-all" type="button" data-vd-temizle hidden>Süzgeçleri temizle ${ui('fa-xmark')}</button>
   </div>
  </div>
  <template data-vd-devam>${karisik.slice(ILK).map(kart).join('')}</template>
  <div class="vd-yukleniyor" data-vd-gozcu role="status"><span class="vd-yukleniyor__nokta" aria-hidden="true"></span>Daha fazla video yükleniyor…</div>
  <div class="vd-bos" data-vd-bos hidden>
   <span class="vd-bos__ikon">${ui('fa-film')}</span>
   <h3>Bu süzgeçlere uyan video yok</h3>
   <p data-vd-bos-alt>Süreyi genişletmeyi ya da başka bir konsept seçmeyi dene.</p>
   <button class="btn btn-ghost" type="button" data-vd-temizle>${ui('fa-xmark')} Süzgeçleri temizle</button>
  </div>
 </div>
</section>`;

  const main = `<!-- donör: Gastro kabuğu = yerel Gastro tarif sayfası (src/donor/kabuk.html); bölüm başlığı .sec-head/.eyebrow, ray .row-track/.row-nav, çip .chip, kart .r-card — portal-*.css · hub ajanı -->
<div class="vd-hub" data-vd-hub data-vd-toplam="${videolar.length}">
${spot}
${reklamSlotu('ust', o, { sayfa: 'hub' })}
${suzgec}
${devam}
${kisa}
${seriBolum}
${sefBolum}
${tum}
${reklamSlotu('alt', o, { sayfa: 'hub' })}
</div>
${kisaGoruntuleyici(o, { katman: true })}`;

  return [{
    dosya: 'video-mutfagi.html',
    baslik: 'Video Mutfağı — adım adım tarif videoları · Dada Gastro (prototip)',
    aciklama: 'Dada Gastro Video Mutfağı: adım adım tarif videoları, şef teknikleri, restoran sırları, yöresel keşifler ve 30 saniyelik kısa videolar; video ilerledikçe malzemeler yanında açılır.',
    main,
    css: ['oynatici', 'kisa', 'hub'],
    js: ['oynatici', 'kisa', 'hub'],
    altMenu: 'kesfet',
    govdeSinifi: 'vd-govde',
  }];
}
