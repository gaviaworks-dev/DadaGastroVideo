// V2 · Seriler: v2/video-seriler.html (hub ajanı). Dokümanın Modül 02 seri tablosu: 6 seri.
// İskelet (kabuk): donör /bugun-ne-pisirsem `.bnp-top` banner (kırıntı · eyebrow · h1 + .accent · .lead · .bnp-stats) + `.bnp-body` panel.
// Panel: reklam üst · Gastro bölümü (`section.sec > .sec-head`) + seri kartları (Gastro `.r-card`, kart.mjs seriAfisi) `.grid-4` 3'lü · reklam alt.
// donör: Gastro ana sayfa render DOM (http://127.0.0.1:8960/) `.sec-head`, `.grid-4`, `.r-card` — portal-*.css · kart-standart.css.
import * as K from '../kart.mjs';
import { reklamSlotu } from '../reklam.mjs';

export default async function (o) {
  const ui = (ad) => `<i class="fa-solid ${ad}" aria-hidden="true"></i>`;
  const { seriler, videolar, kisalar } = o.KATALOG;
  const main = `<!-- V2 · hub ajanı · donör: Gastro ana sayfa http://127.0.0.1:8960/ (section.sec > .sec-head · .grid-4 · .r-card) -->
<div class="vd-seriler-sayfa vd-v2">
 ${reklamSlotu('ust', o, { sayfa: 'seriler' })}
 <section class="sec" aria-labelledby="vd-sr-liste">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-layer-group')} Seri listesi</span><h2 id="vd-sr-liste">Bir konu seç, bölüm bölüm ilerle</h2>
   <p class="lead">Her serinin formatı, bölüm süresi, yayın ritmi ve sunan şefi kartında.</p></div>
   <div class="sec-tools"><a class="see-all" href="video-mutfagi.html">Bütün videolar ${ui('fa-arrow-right')}</a></div>
  </div>
  <div class="grid-4 vd-izgara-3 vd-seriler-izgara">${seriler.map((s) => K.seriAfisi(s, o, { baslikSeviye: 'h3' })).join('')}</div>
 </section>
 ${reklamSlotu('alt', o, { sayfa: 'seriler' })}
</div>`;
  return [{
    dosya: 'video-seriler.html',
    baslik: 'Video serileri — Video Mutfağı · Dada Gastro (prototip)',
    aciklama: '10 Dakikada Mutfak, Şefin El Kitabı, Restoran Sırları, Kazan Kaynayan Topraklar, 30 Saniyede Tat ve Akıllı Ekipman & Test: Dada Gastro Video Mutfağı serileri.',
    iskelet: {
      kirinti: [{ ad: 'Video Mutfağı', href: 'video-mutfagi.html' }, { ad: 'Seriler' }],
      eyebrow: { ikon: 'fa-layer-group', metin: 'Video serileri' },
      baslik: 'Altı seri, her biri kendi ritminde',
      vurgu: 'kendi ritminde',
      aciklama: 'On dakikalık kurtarıcı menülerden restoran reçetelerine, yöresel kazanlardan 30 saniyelik fikirlere: her seri bir konuya odaklanır ve bölüm bölüm ilerler.',
      sayaclar: [{ deger: String(seriler.length), etiket: 'Seri' }, { deger: String(videolar.length), etiket: 'Bölüm' }, { deger: String(kisalar.length), etiket: 'Kısa video' }],
    },
    aktif: 'seriler',
    main,
    css: ['seriler'],
    js: [],
    govdeSinifi: 'vd-govde',
  }];
}
