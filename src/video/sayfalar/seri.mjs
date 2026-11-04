// Seri detayı: video-seri-<slug>.html × 6 (hub ajanı).
// Hero = afiş sahnesi (ilk bölümün kapağı) + koyu katman; seri adı, vaat, format · süre aralığı · ritim · bölüm sayısı, sunucu şef,
// "Baştan izle" + ilerleme varsa "Devam et" (prototip örneği). Numaralı bölüm listesi (binge; kart.mjs bolumKarti).
// Pro seri: kilit anlatımı + "Pro'ya Yükselt" → dadagastro.com/pro (bugünkü davranış: bölümler görünür, izleme sayfasında kilit).
// Akıllı Ekipman & Test: sponsor yuvası (prototip örneği). 30 Saniyede Tat: dikey 9:16 ızgara. Altta "Diğer seriler" rayı.
import * as K from '../kart.mjs';

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

    const hero = `<section class="vd-seri-hero${s.pro ? ' vd-seri-hero--pro' : ''}" aria-labelledby="vd-seri-h1">
  ${sahne ? `<img class="vd-seri-hero__sahne" src="${esc(sahne.src)}" alt="" width="1600" height="900" fetchpriority="high" decoding="async">` : ''}
  <div class="wrap vd-seri-hero__ic">
   <nav class="rd-crumb" aria-label="Sayfa yolu"><a href="index.html">${ui('fa-house')}</a>${ui('fa-chevron-right')}<a href="video-mutfagi.html">Video Mutfağı</a>${ui('fa-chevron-right')}<a href="video-seriler.html">Seriler</a>${ui('fa-chevron-right')}<b>${esc(s.ad)}</b></nav>
   <div class="vd-seri-hero__govde">
    <span class="eyebrow">${ui(s.ikon)} ${esc(s.konsept || (dikey ? 'Kısa video serisi' : 'Video serisi'))}</span>
    <h1 id="vd-seri-h1">${esc(s.ad)}${s.pro ? ` <span class="vd-pro vd-pro--satir">${ui('fa-lock')} Pro</span>` : ''}</h1>
    <p class="vd-seri-hero__vaat">${esc(s.vaat)}</p>
    <ul class="vd-seri-hero__kunye">
     <li>${ui(dikey ? 'fa-mobile-screen' : 'fa-tv')} ${dikey ? 'Dikey 9:16' : 'Yatay 16:9'}</li>
     <li>${ui('fa-hourglass-half')} ${K.sureAraligi(s)} / bölüm</li>
     <li>${ui('fa-film')} ${bol.length} ${dikey ? 'video' : 'bölüm'} · ${toplamMetin}</li>
     <li>${ui('fa-calendar-days')} ${esc(s.ritim)}</li>
    </ul>
    <div class="vd-seri-hero__alt">
     ${sef ? K.sefRozeti(s.sef, o, { etiket: 'Sunan' }) : ''}
     <div class="vd-seri-hero__eylem">
      ${s.pro ? `<a class="btn btn-primary" href="${PRO}">${ui('fa-crown')} Pro'ya Yükselt</a><a class="btn vd-btn-koyu" href="${esc(ilkHref)}">${ui('fa-play')} Bölüm 1'e bak</a>`
        : `<a class="btn btn-primary" href="${esc(ilkHref)}">${ui('fa-play')} ${dikey ? 'Tam ekranda izle' : 'Baştan izle'}</a>`}
      ${devam ? `<a class="btn vd-btn-koyu vd-devam-bag" href="${esc(o.videoAdresi(devam))}">${ui('fa-clock-rotate-left')} Devam et · Bölüm ${devam.bolum}<span class="vd-devam-bag__cubuk" style="--vd-ilerleme:${Math.round(devam.ornek_ilerleme * 100)}%"><span></span></span></a><span class="vd-ornek vd-ornek--koyu">${ui('fa-flask')} İlerleme: prototip örneği</span>` : ''}
     </div>
    </div>
   </div>
  </div>
 </section>`;

    const kilit = s.pro ? `<aside class="vd-kilit" aria-label="Pro serisi">
   <span class="vd-kilit__ikon">${ui('fa-lock')}</span>
   <div class="vd-kilit__metin"><b>Bu seri Gastro Pro üyelerine açık</b><p>Bölüm başlıkları, süreleri ve yazılı tarifler herkese açık; bölümleri izlemek için Gastro Pro üyeliği gerekir. Bir bölüme tıklayınca izleme sayfasında kilit ekranı açılır.</p></div>
   <a class="btn btn-primary" href="${PRO}">${ui('fa-crown')} Pro'ya Yükselt</a>
  </aside>` : '';
    const sponsor = s.sponsor_yuvasi ? `<aside class="vd-sponsor" aria-label="Sponsor alanı (prototip örneği)">
   <span class="vd-sponsor__logo" aria-hidden="true">${ui('fa-handshake')}</span>
   <span class="vd-sponsor__metin"><b>Sponsor alanı</b> Bu seri bir mutfak aleti markasıyla ortak yayınlanabilir; marka adı, logo ve ürün bağlantısı bu yuvada ve her bölümün altında görünür.</span>
   <span class="vd-ornek">${ui('fa-flask')} Prototip örneği</span>
  </aside>` : '';

    const liste = dikey
      ? `<div class="vd-kisa-izgara">${bol.map((k) => K.kisaKarti(k, o)).join('')}
     <a class="vd-kisa-son" href="${esc(ilkHref)}"><span class="vd-kisa-son__ikon">${ui('fa-bolt')}</span><b>${esc(s.ritim)}</b><span>Tam ekranda yukarı kaydırarak bir videodan ötekine geç.</span><span class="vd-kisa-son__bag">Tam ekranda izle ${ui('fa-arrow-right')}</span></a>
    </div>`
      : `<ol class="vd-bolum-liste">${bol.map((v) => `<li>${K.bolumKarti(v, o)}</li>`).join('')}</ol>`;

    const digerleri = seriler.filter((x) => x.slug !== s.slug);
    const diger = `<section class="vd-alan" aria-labelledby="vd-diger-h">
  <div class="wrap vd-ray vd-ray--seri" data-vd-ray>
   <div class="sec-head">
    <div><span class="eyebrow">${ui('fa-layer-group')} Keşfetmeye devam</span><h2 id="vd-diger-h">Diğer seriler</h2></div>
    <div class="sec-tools"><a class="see-all" href="video-seriler.html">Tüm seriler ${ui('fa-arrow-right')}</a><div class="row-nav"><button type="button" data-vd-ray-onceki aria-label="Önceki seriler">${ui('fa-chevron-left')}</button><button type="button" data-vd-ray-sonraki aria-label="Sonraki seriler">${ui('fa-chevron-right')}</button></div></div>
   </div>
   <div class="row-track" data-vd-ray-iz>${digerleri.map((x) => K.seriAfisi(x, o)).join('')}</div>
  </div>
 </section>`;

    const main = `<!-- donör: Gastro kabuğu = yerel Gastro tarif sayfası (src/donor/kabuk.html); kırıntı .rd-crumb, başlık .sec-head/.eyebrow, ray .row-track/.row-nav, düğme .btn — portal-*.css · tarif-detay.css · hub ajanı -->
<div class="vd-seri-sayfa${dikey ? ' vd-seri-sayfa--dikey' : ''}">
 ${hero}
 <section class="vd-alan" aria-labelledby="vd-bolumler-h">
  <div class="wrap">
   <div class="sec-head">
    <div><span class="eyebrow">${ui(dikey ? 'fa-mobile-screen' : 'fa-list-ol')} ${dikey ? 'Kısa videolar' : 'Bölümler'}</span><h2 id="vd-bolumler-h">${dikey ? `${bol.length} kısa video` : `${bol.length} bölüm, baştan sona`}</h2>
    <p class="lead">${dikey ? 'Her biri 15–45 saniye: dokun, tam ekranda izle; yukarı kaydırınca sıradaki gelir.' : 'Bölümler sırayla birbirinin üstüne kurulur; her bölümün yazılı tarifi ve malzemeleri izleme sayfasında.'}</p></div>
   </div>
   ${kilit}${sponsor}
   ${liste}
  </div>
 </section>
 ${diger}
</div>`;

    return {
      dosya: `video-seri-${s.slug}.html`,
      baslik: `${s.ad} — Video Mutfağı · Dada Gastro (prototip)`,
      aciklama: `${s.ad}: ${s.vaat}`,
      main,
      css: ['seri'],
      js: [],
      altMenu: dikey ? 'kisa' : 'seriler',
      govdeSinifi: 'vd-govde',
      gorsel: sahne ? sahne.src : '',
    };
  });
}
