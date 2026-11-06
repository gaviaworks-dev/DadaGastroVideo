// V2 · Seri detayı: v2/video-seri-<slug>.html × 6 (hub ajanı).
// İskelet (kabuk): donör /bugun-ne-pisirsem `.bnp-top` banner (kırıntı · konsept eyebrow · seri adı + .accent · vaat · sayaçlar:
// bölüm sayısı / toplam süre — gerçek katalog) + `.bnp-body` panel; `gorsel` = ilk bölümün kapağı.
// Panel: seri özeti (sunan şef · künye · Baştan izle / Devam et / Pro'ya Yükselt) · reklam üst · Bölümler (Gastro `section.sec >
// .sec-head` + `.feat-side` yatay `.r-card`; 30 Saniyede Tat: 9:16 ızgara) · Diğer seriler (`.row-track` + seri `.r-card`) · reklam alt.
// Pro seri: kilit anlatımı + "Pro'ya Yükselt" → dadagastro.com/pro. Akıllı Ekipman & Test: sponsor yuvası (prototip örneği).
// donör: Gastro ana sayfa render DOM (http://127.0.0.1:8960/) `.sec-head`, `.feat-side .r-card`, `.row-track`, `.btn` — portal-*.css.
import * as K from '../kart.mjs';
import { reklamSlotu, sponsorEtiketi } from '../reklam.mjs';
import { suzgecDuzeni, szVeri, secenekler } from '../suzgec.mjs'; // Patron revizesi K3: bölüm listesi süzgeci (süre + sıralama)

const PRO = 'https://dadagastro.com/pro';

export default async function (o) {
  const { esc } = o;
  const ui = (ad) => `<i class="fa-solid ${ad}" aria-hidden="true"></i>`;
  const { seriler, videolar, kisalar } = o.KATALOG;

  return seriler.map((s) => {
    const dikey = s.format === '9:16';
    const bol = (dikey ? kisalar : videolar).filter((v) => v.seri === s.slug).sort((a, b) => a.bolum - b.bolum);
    const ilk = bol[0];
    const devam = bol.find((v) => v.ornek_ilerleme);
    const sef = o.SEF[s.sef];
    const sahne = ilk ? K.kapakBul(ilk, o, { buyuk: true }) : null;
    const toplamSn = bol.reduce((t, v) => t + (v.sure_sn || 0), 0);
    const toplamMetin = toplamSn < 600 ? `${Math.round(toplamSn / 60 * 10) / 10} dk`.replace('.', ',') : `${Math.round(toplamSn / 60)} dk`;
    const ilkHref = ilk ? o.videoAdresi(ilk) : '#';

    // V1'in hero'su banner'a (iskelet) çıktı; künye, sunan şef ve eylemler panelin ilk bloğu
    const ozet = `<div class="vd-seri-ozet">
   <div class="vd-seri-ozet__sol">
    ${sef ? K.sefRozeti(s.sef, o, { etiket: 'Sunan' }) : ''}
    <ul class="vd-seri-ozet__kunye">
     <li>${ui(dikey ? 'fa-mobile-screen' : 'fa-tv')} ${dikey ? 'Dikey 9:16' : 'Yatay 16:9'}</li>
     <li>${ui('fa-hourglass-half')} ${K.sureAraligi(s)} / bölüm</li>
     <li>${ui('fa-calendar-days')} ${esc(s.ritim)}</li>
    </ul>
    ${sponsorEtiketi(s.slug)}
   </div>
   <div class="vd-seri-ozet__eylem">
    ${s.pro ? `<a class="btn btn-primary" href="${PRO}">${ui('fa-crown')} Pro'ya Yükselt</a><a class="btn btn-ghost" href="${esc(ilkHref)}">${ui('fa-play')} Bölüm 1'e bak</a>`
      : `<a class="btn btn-primary" href="${esc(ilkHref)}">${ui('fa-play')} ${dikey ? 'Tam ekranda izle' : 'Baştan izle'}</a>`}
    ${devam ? `<a class="btn btn-ghost vd-devam-bag" href="${esc(o.videoAdresi(devam))}">${ui('fa-clock-rotate-left')} Devam et · Bölüm ${devam.bolum}<span class="vd-devam-bag__cubuk" style="--vd-ilerleme:${Math.round(devam.ornek_ilerleme * 100)}%"><span></span></span></a><span class="vd-ornek">${ui('fa-flask')} İlerleme: prototip örneği</span>` : ''}
   </div>
  </div>`;

    const kilit = s.pro ? `<aside class="vd-kilit" aria-label="Pro serisi">
   <span class="vd-kilit__ikon">${ui('fa-lock')}</span>
   <div class="vd-kilit__metin"><b>Bu seri Gastro Pro üyelerine açık</b><p>Bölüm başlıkları, süreleri ve yazılı tarifler herkese açık; bölümleri izlemek için Gastro Pro üyeliği gerekir. Bir bölüme tıklayınca izleme sayfasında kilit ekranı açılır.</p></div>
   <a class="btn btn-primary" href="${PRO}">${ui('fa-crown')} Pro'ya Yükselt</a>
  </aside>` : '';
    const sponsor = s.sponsor_yuvasi ? `<aside class="vd-sponsor" data-vd-reklamsiz aria-label="Sponsor alanı (prototip örneği)">
   <span class="vd-sponsor__logo" aria-hidden="true">${ui('fa-handshake')}</span>
   <span class="vd-sponsor__metin"><b>Sponsor alanı</b> Bu seri bir mutfak aleti markasıyla ortak yayınlanabilir; marka adı, logo ve ürün bağlantısı bu yuvada ve her bölümün altında görünür.</span>
   <span class="vd-ornek">${ui('fa-flask')} Prototip örneği</span>
  </aside>` : '';

    // K3 · bölüm listesi süzgeci: süre (bölüm tarifinin hazırlık süresi, hub ile aynı kural) + sıralama.
    // Sezon: katalogda hiçbir seride ikinci sezon yok → alan veri modeline bağlı, sezon sayısı > 1 ise görünür (şu an gizli).
    const sezonlar = [...new Set(bol.map((v) => v.sezon || 1))];
    const SURE_SIRA = ['15-alti', '15-30', '30-ustu'];
    const sureAd = Object.fromEntries((o.KATALOG.sure_suzgecleri || []).map((x) => [x.kod, x.ad]));
    const duz = bol.map((v) => ({ sure: [o.sureKodu(v)], ...(sezonlar.length > 1 ? { sezon: [String(v.sezon || 1)] } : {}) }));
    const gruplar = [
      ...(sezonlar.length > 1 ? [{ kod: 'sezon', ad: 'Sezon', ikon: 'fa-layer-group', secenekler: secenekler(duz, 'sezon', Object.fromEntries(sezonlar.map((z) => [String(z), `Sezon ${z}`])), { sira: sezonlar.map(String) }) }] : []),
      { kod: 'sure', ad: 'Süre', ikon: 'fa-clock', secenekler: secenekler(duz, 'sure', sureAd, { sira: SURE_SIRA, tum: SURE_SIRA }) },
    ];
    const siralar = [
      { kod: 'bolum-sirasi', ad: 'Bölüm sırası', ikon: 'fa-list-ol' },
      { kod: 'kisadan-uzuna', ad: 'Kısadan uzuna', ikon: 'fa-arrow-up-short-wide', alan: 'sure', yon: 'artan' },
      { kod: 'uzundan-kisaya', ad: 'Uzundan kısaya', ikon: 'fa-arrow-down-wide-short', alan: 'sure', yon: 'azalan' },
    ];
    const sz = (v, i) => szVeri(duz[i], { sure: v.sure_sn }, i);
    const listeIc = dikey
      ? `<div class="vd-kisa-izgara" data-sz-liste>${bol.map((k, i) => K.kisaKarti(k, o, { sz: sz(k, i) })).join('')}
     <a class="vd-kisa-son" href="${esc(ilkHref)}" data-sz-son><span class="vd-kisa-son__ikon">${ui('fa-bolt')}</span><b>${esc(s.ritim)}</b><span>Tam ekranda yukarı kaydırarak bir videodan ötekine geç.</span><span class="vd-kisa-son__bag">Tam ekranda izle ${ui('fa-arrow-right')}</span></a>
    </div>`
      : `<div class="feat-side vd-bolum-liste" data-sz-liste>${bol.map((v, i) => K.bolumKarti(v, o, { baslikSeviye: 'h3', sz: sz(v, i) })).join('')}</div>`;
    const liste = suzgecDuzeni({ dosya: `video-seri-${s.slug}.html`, birim: dikey ? 'video' : 'bölüm', toplam: bol.length, gruplar, siralar, liste: listeIc, bos: { baslik: 'Bu süreye uyan bölüm yok', metin: 'Süre seçimini kaldır ya da süzgeçleri temizle.', dugme: 'Süzgeçleri temizle' } });

    const digerleri = seriler.filter((x) => x.slug !== s.slug);
    const diger = `<section class="sec vd-ray vd-ray--seri" aria-labelledby="vd-diger-h" data-vd-ray>
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-layer-group')} Keşfetmeye devam</span><h2 id="vd-diger-h">Diğer seriler</h2></div>
   <div class="sec-tools"><a class="see-all" href="video-seriler.html">Tüm Seriler ${ui('fa-arrow-right')}</a><div class="row-nav"><button type="button" data-vd-ray-onceki aria-label="Önceki seriler">${ui('fa-chevron-left')}</button><button type="button" data-vd-ray-sonraki aria-label="Sonraki seriler">${ui('fa-chevron-right')}</button></div></div>
  </div>
  <div class="row-track" data-vd-ray-iz>${digerleri.map((x) => K.seriAfisi(x, o)).join('')}</div>
 </section>`;

    const main = `<!-- V2 · hub ajanı · donör: Gastro ana sayfa http://127.0.0.1:8960/ (section.sec > .sec-head · .feat-side .r-card · .row-track · .btn) -->
<div class="vd-seri-sayfa vd-v2${dikey ? ' vd-seri-sayfa--dikey' : ''}">
 ${ozet}
 ${reklamSlotu('ust', o, { sayfa: 'seri' })}
 <section class="sec vd-zebra-sicak" aria-labelledby="vd-bolumler-h">
  <div class="sec-head">
   <div><span class="eyebrow">${ui(dikey ? 'fa-mobile-screen' : 'fa-list-ol')} ${dikey ? 'Kısa videolar' : 'Bölümler'}</span><h2 id="vd-bolumler-h">${dikey ? `${bol.length} kısa video` : `${bol.length} bölüm, baştan sona`}</h2>
   <p class="lead">${dikey ? 'Her biri 15–45 saniye: dokun, tam ekranda izle; yukarı kaydırınca sıradaki gelir.' : 'Bölümler sırayla birbirinin üstüne kurulur; her bölümün yazılı tarifi ve malzemeleri izleme sayfasında.'}</p></div>
  </div>
  ${kilit}${sponsor}
  ${liste}
 </section>
 ${diger}
 ${reklamSlotu('alt', o, { sayfa: 'seri' })}
</div>`;

    const kelime = s.ad.split(' ');
    return {
      dosya: `video-seri-${s.slug}.html`,
      baslik: `${s.ad} — Video Mutfağı · Dada Gastro (prototip)`,
      aciklama: `${s.ad}: ${s.vaat}`,
      iskelet: {
        kirinti: [{ ad: 'Video Mutfağı', href: 'video-mutfagi.html' }, { ad: 'Seriler', href: 'video-seriler.html' }, { ad: s.ad }],
        eyebrow: { ikon: s.ikon, metin: s.konsept || (dikey ? 'Kısa video serisi' : 'Video serisi') },
        baslik: s.ad,
        vurgu: kelime.length > 1 ? kelime[kelime.length - 1] : '',
        aciklama: s.vaat,
        sayaclar: [{ deger: String(bol.length), etiket: dikey ? 'Kısa video' : 'Bölüm' }, { deger: toplamMetin, etiket: 'Toplam süre' }],
        ...(sahne ? { gorsel: sahne.src } : {}),
      },
      aktif: dikey ? 'kisa' : 'seriler',
      main,
      css: ['seri', 'suzgec'],
      js: ['suzgec'],
      suzgec: true,
      govdeSinifi: 'vd-govde',
      gorsel: sahne ? sahne.src : '',
    };
  });
}
