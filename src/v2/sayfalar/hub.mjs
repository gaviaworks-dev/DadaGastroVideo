// V2 · Hub: v2/video-mutfagi.html (hub ajanı).
// İskelet (kabuk, iskelet.mjs): koyu banner = donör /bugun-ne-pisirsem `.bnp-top` (kırıntı · eyebrow · h1 + .accent · .lead ·
// .bnp-stats gerçek katalog sayaçları) + beyaz panel `.bnp-body`. `main` panelin içine girer.
// Panel sırası: 1.1 koyu oynatıcı sahnesi (V1'den AYNEN; başlığı banner'a çıktı) · reklam üst · 1.2 süzgeç barı · İzlemeye devam et
// (Gastro .feat-side yatay .r-card) · 1.3 30 Saniyede Tat (.row-track) · 1.4 seri rayları (her seri bir Gastro bölümü: .sec-head +
// .row-track) · şefler (izle'nin sef-kart.mjs → Gastro .chef-row) · E.2b tüm videolar (Gastro .grid-4) · reklam alt.
// donör: Gastro ana sayfa render DOM (http://127.0.0.1:8960/) `section.sec > .sec-head` + `.row-track` / `.feat-side` / `.grid-4` / `.chef-row`.
import * as K from '../kart.mjs';
import { oynatici } from '../oynatici.mjs';
import { kisaGoruntuleyici } from './kisa.mjs'; // izle ajanının tam ekran dikey görüntüleyicisi, hub'da katman (1.3b)
import { reklamSlotu, sponsorEtiketi } from '../reklam.mjs'; // REVİZE 1 madde 7 (reklam ajanının API'si)
import { sefRayi } from '../sef-kart.mjs'; // izle ajanı: Gastro ana sayfa "Tarifin ustaları" şef kartı BİREBİR

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
  // V2: sahnenin başlık/giriş kısmı banner'a (iskelet) çıktı; sahne sekmelerle başlar
  const spot = `<section class="vd-spot" aria-label="Haftanın vitrini" data-rk-hero="">
 <div class="wrap">
  <div class="vd-spot__bas vd-spot__bas--v2">
   <span class="eyebrow">${ui('fa-clapperboard')} Vitrin</span>
   <div class="vd-spot__sekmeler" role="tablist" aria-label="Vitrin">${sekmeler}</div>
  </div>
  ${paneller}
 </div>
</section>`;

  /* ---------- 1.2 Yapışkan süzgeç barı ---------- */
  const konseptCip = KAT.konseptler.map((k) => `<button class="chip vd-cip" type="button" data-vd-konsept="${konseptKodu(k)}" aria-pressed="false">${ui(KONSEPT_IKON[k] || 'fa-tag')}<span>${esc(k)}</span></button>`).join('');
  const sureCip = KAT.sure_suzgecleri.map((s) => `<button class="chip vd-cip" type="button" data-vd-sure="${esc(s.kod)}" aria-pressed="false">${ui('fa-clock')}<span>${esc(s.ad)}</span></button>`).join('');
  const suzgec = `<div class="vd-suzgec" data-vd-suzgec>
 <div class="vd-suzgec__ic">
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

  // Gastro bölüm başlığı (ana sayfa .sec-head): eyebrow · h2 · lead · sağda .sec-tools
  const basl = ({ ikon, ust, baslik, id, lead = '', araclar = '', etiket = '' }) => `<div class="sec-head">
   <div><span class="eyebrow">${ui(ikon)} ${ust}</span><h2 id="${id}">${baslik}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</div>
   ${araclar || etiket ? `<div class="sec-tools">${etiket}${araclar}</div>` : ''}
  </div>`;
  const okDugmeleri = (ad) => `<div class="row-nav"><button type="button" data-vd-ray-onceki aria-label="${esc(ad)}: önceki">${ui('fa-chevron-left')}</button><button type="button" data-vd-ray-sonraki aria-label="${esc(ad)}: sonraki">${ui('fa-chevron-right')}</button></div>`;

  /* ---------- İzlemeye devam et (prototip örneği) — Gastro .feat-side yatay .r-card ---------- */
  const devamListe = videolar.filter((v) => v.ornek_ilerleme);
  const devam = devamListe.length ? `<section class="sec vd-devam" id="devam" aria-labelledby="vd-devam-h" data-vd-anasayfa>
  ${basl({ ikon: 'fa-clock-rotate-left', ust: 'Kaldığın yerden', baslik: 'İzlemeye devam et', id: 'vd-devam-h', etiket: `<span class="vd-ornek">${ui('fa-flask')} Prototip örneği · üyeye görünür</span>` })}
  <div class="feat-side vd-devam-izgara">${devamListe.map((v) => K.videoKarti(v, o, { boyut: 'yatay', baslikSeviye: 'h3' })).join('')}</div>
</section>` : '';

  /* ---------- 1.3 30 Saniyede Tat rayı ---------- */
  const kisaSeri = seriler.find((s) => s.format === '9:16');
  const kisa = `<section class="sec vd-kisalar vd-ray vd-ray--kisa" id="kisa" aria-labelledby="vd-kisa-h" data-vd-anasayfa data-vd-ray>
  ${basl({ ikon: kisaSeri ? kisaSeri.ikon : 'fa-bolt', ust: esc(kisaSeri ? kisaSeri.ad : '30 Saniyede Tat'), baslik: '30 saniyede bir fikir', id: 'vd-kisa-h', lead: `${esc(kisaSeri ? kisaSeri.vaat : '')} Dokun, tam ekranda yukarı kaydırarak sıradakine geç.`, araclar: `${kisaSeri ? `<a class="see-all" href="${esc(o.seriAdresi(kisaSeri))}">Seriyi Aç ${ui('fa-arrow-right')}</a>` : ''}${okDugmeleri('Kısa videolar')}` })}
  <div class="row-track" data-vd-ray-iz>${kisalar.map((k) => K.kisaKarti(k, o)).join('')}</div>
</section>`;

  /* ---------- 1.4 Seri rayları — her seri bir Gastro bölümü ---------- */
  const uzunSeriler = seriler.filter((s) => s.format !== '9:16');
  const seriRay = (s) => {
    const bol = videolar.filter((v) => v.seri === s.slug).sort((a, b) => a.bolum - b.bolum);
    const sef = o.SEF[s.sef];
    const sponsor = s.sponsor_yuvasi ? `<aside class="vd-sponsor" data-vd-reklamsiz aria-label="Sponsor alanı (prototip örneği)">
     <span class="vd-sponsor__logo" aria-hidden="true">${ui('fa-handshake')}</span>
     <span class="vd-sponsor__metin"><b>Sponsor alanı</b> Bu serinin bölümleri bir mutfak aleti markasıyla ortak yayınlanabilir; marka adı ve ürün bağlantısı bu yuvada görünür.</span>
     <span class="vd-ornek">${ui('fa-flask')} Prototip örneği</span>
    </aside>` : '';
    const ust = `Video serisi · ${bol.length} bölüm · ${K.sureAraligi(s)} · ${esc(s.ritim)}`;
    const lead = `${esc(s.vaat)}${sef ? ` Sunan: <a class="vd-sec-bag" href="${esc(o.sefAdresi(s.sef))}">${esc(sef.ad)}</a>.` : ''}`;
    const araclar = `${s.pro ? `<a class="see-all vd-pro-bag" href="https://dadagastro.com/pro">${ui('fa-crown')} Pro'ya Yükselt</a>` : ''}<a class="see-all" href="${esc(o.seriAdresi(s))}">Seriyi Aç ${ui('fa-arrow-right')}</a>${okDugmeleri(s.ad)}`;
    return `<section class="sec vd-seri-ray vd-ray vd-ray--video" id="seri-${esc(s.slug)}" aria-labelledby="vd-ray-${s.slug}" data-vd-anasayfa data-vd-ray>
  ${basl({ ikon: s.ikon, ust, baslik: `${esc(s.ad)}${s.pro ? ` <span class="vlock-badge vd-baslik-rozet">${ui('fa-lock')} Pro</span>` : ''}`, id: `vd-ray-${s.slug}`, lead, araclar })}
  ${sponsorEtiketi(s.slug)}
  ${sponsor}
  <div class="row-track" data-vd-ray-iz>${bol.map((v) => K.videoKarti(v, o, { boyut: 'ray', sefGoster: false })).join('')}</div>
</section>`;
  };

  /* ---------- Video şefleri — izle'nin sef-kart.mjs (Gastro .chef-row > .chef-card) ---------- */
  const sefler = [...new Set(seriler.map((s) => s.sef))].filter((k) => o.SEF[k]);
  const sefBolum = `<section class="sec chefs vd-sefler" id="sefler" aria-labelledby="vd-sef-h" data-vd-anasayfa>
  ${basl({ ikon: 'fa-utensils', ust: 'Şefler &amp; Yazarlar', baslik: 'Videoların ustaları', id: 'vd-sef-h', lead: 'Her seriyi bir Dada Gastro şefi sunar; tarifleri sitede de yayında.' })}
  ${sefRayi(sefler, o)}
</section>`;

  /* ---------- E.2b Tüm videolar — Gastro .grid-4 ---------- */
  const sirali = [...videolar].sort((a, b) => (seriler.indexOf(seri(a.seri)) - seriler.indexOf(seri(b.seri))) || a.bolum - b.bolum);
  // karışık sıra: her seriden sırayla bir bölüm (ızgara tek seriye boğulmasın)
  const kuyruk = uzunSeriler.map((s) => sirali.filter((v) => v.seri === s.slug));
  const karisik = [];
  while (kuyruk.some((q) => q.length)) for (const q of kuyruk) if (q.length) karisik.push(q.shift());
  const kart = (v) => K.videoKarti(v, o, { baslikSeviye: 'h3' });
  const tum = `<section class="sec vd-tum" id="tum-videolar" aria-labelledby="vd-tum-h">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-film')} Video arşivi</span><h2 id="vd-tum-h" data-vd-tum-baslik>Tüm videolar</h2>
   <p class="lead" data-vd-tum-alt>Bütün serilerin bölümleri bir arada. Aşağı kaydırdıkça yenileri yüklenir.</p></div>
  </div>
  <div class="grid-4 vd-tum__izgara" data-vd-izgara>
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
</section>`;

  const main = `<!-- V2 · hub ajanı · donör: Gastro ana sayfa http://127.0.0.1:8960/ (section.sec > .sec-head · .row-track · .feat-side · .grid-4 · .r-card · .chef-row) — portal-*.css · kart-standart.css; koyu sahne V1'den -->
<div class="vd-hub vd-v2" data-vd-hub data-vd-toplam="${videolar.length}">
${spot}
${reklamSlotu('ust', o, { sayfa: 'hub' })}
${suzgec}
${devam}
${kisa}
${uzunSeriler.map(seriRay).join('\n')}
${sefBolum}
${tum}
${reklamSlotu('alt', o, { sayfa: 'hub' })}
</div>
${kisaGoruntuleyici(o, { katman: true })}`;

  return [{
    dosya: 'video-mutfagi.html',
    baslik: 'Video Mutfağı — adım adım tarif videoları · Dada Gastro (prototip)',
    aciklama: 'Dada Gastro Video Mutfağı: adım adım tarif videoları, şef teknikleri, restoran sırları, yöresel keşifler ve 30 saniyelik kısa videolar; video ilerledikçe malzemeler yanında açılır.',
    iskelet: {
      kirinti: [{ ad: 'Video Mutfağı' }],
      eyebrow: { ikon: 'fa-circle-play', metin: 'İzle & Pişir' },
      baslik: 'Videoyu izle, malzemeler yanında açılsın',
      vurgu: 'malzemeler yanında',
      aciklama: 'Adım adım tarif videoları, şef teknikleri, restoran sırları ve 30 saniyelik pratik fikirler. Video ilerledikçe sırası gelen malzeme açılır, yazılı tarife tek tıkla geçersin.',
      sayaclar: [{ deger: String(videolar.length), etiket: 'Video' }, { deger: String(seriler.length), etiket: 'Seri' }, { deger: String(kisalar.length), etiket: 'Kısa video' }],
    },
    aktif: 'kesfet',
    main,
    css: ['oynatici', 'kisa', 'hub'],
    js: ['oynatici', 'kisa', 'hub'],
    govdeSinifi: 'vd-govde',
  }];
}
