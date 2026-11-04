// Seriler: video-seriler.html (hub ajanı). Dokümanın Modül 02 seri tablosunun görsel hâli: 6 seri afişi
// (kolaj kapak, format 16:9/9:16, süre aralığı, vaat, bölüm sayısı, ritim, sunucu şef, ilk iki bölüm = "zorunlu örnek başlıklar").
// İşaretleme tabanı Gastro: .rd-crumb, .eyebrow, .sec-head; afiş kartı kart.mjs seriAfisi.
import * as K from '../kart.mjs';

export default async function (o) {
  const { esc } = o;
  const ui = (ad) => `<i class="fa-solid ${ad}" aria-hidden="true"></i>`;
  const { seriler, videolar, kisalar } = o.KATALOG;
  const uzun = seriler.filter((s) => s.format !== '9:16').length;
  const main = `<!-- donör: Gastro kabuğu = yerel Gastro tarif sayfası (src/donor/kabuk.html); kırıntı .rd-crumb, başlık .eyebrow — portal-*.css · tarif-detay.css · hub ajanı -->
<div class="vd-seriler-sayfa">
 <section class="vd-sade-hero" aria-labelledby="vd-sr-h1">
  <div class="wrap">
   <nav class="rd-crumb" aria-label="Sayfa yolu"><a href="index.html">${ui('fa-house')}</a>${ui('fa-chevron-right')}<a href="video-mutfagi.html">Video Mutfağı</a>${ui('fa-chevron-right')}<b>Seriler</b></nav>
   <div class="vd-sade-hero__ic">
    <div>
     <span class="eyebrow">${ui('fa-layer-group')} Video serileri</span>
     <h1 id="vd-sr-h1">Altı seri, her biri kendi ritminde</h1>
     <p>On dakikalık kurtarıcı menülerden restoran reçetelerine, yöresel kazanlardan 30 saniyelik fikirlere: her seri bir konuya odaklanır ve bölüm bölüm ilerler.</p>
    </div>
    <ul class="vd-sade-hero__sayilar">
     <li><b>${seriler.length}</b><span>seri</span></li>
     <li><b>${videolar.length}</b><span>bölüm · ${uzun} yatay seri</span></li>
     <li><b>${kisalar.length}</b><span>kısa video · 9:16</span></li>
    </ul>
   </div>
  </div>
 </section>
 <section class="vd-alan vd-alan--duz" aria-labelledby="vd-sr-liste">
  <div class="wrap">
   <h2 class="vd-gizli" id="vd-sr-liste">Seri listesi</h2>
   <div class="vd-izgara vd-izgara--3 vd-seriler-izgara">${seriler.map((s) => K.seriAfisi(s, o, { ornekler: 2 })).join('')}</div>
  </div>
 </section>
</div>`;
  return [{
    dosya: 'video-seriler.html',
    baslik: 'Video serileri — Video Mutfağı · Dada Gastro (prototip)',
    aciklama: '10 Dakikada Mutfak, Şefin El Kitabı, Restoran Sırları, Kazan Kaynayan Topraklar, 30 Saniyede Tat ve Akıllı Ekipman & Test: Dada Gastro Video Mutfağı serileri.',
    main,
    css: ['seriler'],
    js: [],
    altMenu: 'seriler',
    govdeSinifi: 'vd-govde',
  }];
}
