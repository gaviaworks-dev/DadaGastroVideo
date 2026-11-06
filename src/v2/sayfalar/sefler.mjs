// Video Mutfağı V2 · Şefler dizini (izle ajanı) → v2/video-sefler.html  (Patron revizesi 5 Kas, K3/K4)
// İskelet: bnp banner + beyaz panel (kabuk iskelet.mjs). Sayaçlar GERÇEK: video şefi sayısı, toplam video (uzun + kısa), şeflerin
// Dada Gastro'daki toplam yazılı tarif sayısı.
// Panel: donör http://127.0.0.1:8960/sefler (JS koşmuş DOM) — `section.sef-sec > .wrap > .sec-head` (eyebrow "Dizin", h2, lead,
// `form.sec-tools.sef-search[role=search]` "İsme göre ara...") + `#sefGrid.sef-grid > article.sef-card` (src/v2/sef-kart.mjs 'dizin').
// Donörün satır içi `style="margin-bottom:32px"`ı sefler.css'te sınıfla verilir (satır içi stil yasağı).
// Süzgeç: hub'ın ortak bileşeni (src/v2/suzgec.mjs, donör /tarifler `.sheet` + `#sortDd`): mutfak (şefin video tariflerinin
// mutfakları) · uzmanlık (Gastro unvan/kademe) · sıralama (Ada göre / Video sayısı / Tarif sayısı). Kartlar süzgeç verisini
// data-* özniteliklerinde taşır; "İsme göre ara" aynı süzgecin metin alanıdır (sefler.js).
import { sefKarti } from '../sef-kart.mjs';
import { reklamSlotu } from '../reklam.mjs';
import { suzgecDuzeni, szVeri, secenekler, szKod } from '../suzgec.mjs';

const DONOR = '<!-- Video Mutfağı V2 Şefler · donör: http://127.0.0.1:8960/sefler (.sef-sec .sec-head + form.sef-search + #sefGrid .sef-card) · /bugun-ne-pisirsem (banner + panel) · /tarifler (süzgeç, hub suzgec.mjs) -->';

/** Video şefleri: katalogdaki serilerin sunucuları (sıra: katalog sırası). */
export function videoSefleri(o) {
  return [...new Set(o.KATALOG.seriler.map((s) => s.sef))].filter((k) => o.SEF[k]);
}
/** Şefin video verisi: seriler, video sayısı (uzun + kısa), video tariflerinin mutfakları. */
export function sefVideoVerisi(k, o) {
  const seriler = o.KATALOG.seriler.filter((s) => s.sef === k);
  const videolar = [...o.KATALOG.videolar, ...o.KATALOG.kisalar].filter((v) => seriler.some((s) => s.slug === v.seri));
  const mutfaklar = [...new Set(videolar.map((v) => o.videoTarifi(v)?.mutfak).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
  return { seriler, videolar, mutfaklar };
}

export default async (o) => {
  const kler = videoSefleri(o);
  // Doğal sıra = "Ada göre" (varsayılan sıralama; sunucu da aynı sırayla basar → açılışta yeniden dizme yok)
  const veri = kler.map((k) => ({ k, sef: o.SEF[k], ...sefVideoVerisi(k, o) })).sort((a, b) => a.sef.ad.localeCompare(b.sef.ad, 'tr'));
  const toplamVideo = veri.reduce((t, x) => t + x.videolar.length, 0);
  const toplamTarif = veri.reduce((t, x) => t + Number(x.sef.tarif_sayisi || 0), 0);
  // süzgeç verisi: mutfak = şefin video tariflerinin mutfakları · uzmanlık = Gastro unvan/kademe
  const duz = veri.map((x) => ({ mutfak: x.mutfaklar.map(szKod), uzmanlik: [szKod(x.sef.unvan)] }));
  const mutfakAd = Object.fromEntries(veri.flatMap((x) => x.mutfaklar.map((m) => [szKod(m), m])));
  const uzmanlikAd = Object.fromEntries(veri.map((x) => [szKod(x.sef.unvan), x.sef.unvan]));
  const kartlarDizi = veri.map((x, i) => sefKarti(x.k, o, {
    tur: 'dizin',
    veri: { 'vd-sef': x.k, ad: x.sef.ad },
    sz: szVeri(duz[i], { ad: x.sef.ad, video: x.videolar.length, tarif: Number(x.sef.tarif_sayisi || 0) }, i),
  }));
  // SF-N2 sponsorlu şef kartı: 3. kartın ardında (modül kuralı; süzülmüş ızgarada yerini reklam.js yönetir)
  const kartlar = [...kartlarDizi.slice(0, 3), reklamSlotu('native', o, { sayfa: 'sefler' }), ...kartlarDizi.slice(3)].join('\n');
  const izgara = `<div class="sef-grid vd-sefler__izgara" id="sefGrid" data-sz-liste>
${kartlar}
</div>`;
  const gruplar = [
    { kod: 'mutfak', ad: 'Mutfak', ikon: 'fa-earth-europe', secenekler: secenekler(duz, 'mutfak', mutfakAd) },
    { kod: 'uzmanlik', ad: 'Uzmanlık', ikon: 'fa-award', secenekler: secenekler(duz, 'uzmanlik', uzmanlikAd) },
  ];
  const siralar = [
    { kod: 'ada-gore', ad: 'Ada göre', ikon: 'fa-arrow-down-a-z' },
    { kod: 'video-sayisi', ad: 'Video sayısı', ikon: 'fa-film', alan: 'video', yon: 'azalan' },
    { kod: 'tarif-sayisi', ad: 'Tarif sayısı', ikon: 'fa-book-open', alan: 'tarif', yon: 'azalan' },
  ];
  const duzen = suzgecDuzeni({ dosya: 'video-sefler.html', birim: 'şef', toplam: veri.length, gruplar, siralar, liste: izgara,
    bos: { baslik: 'Bu seçime uyan video şefi yok', metin: 'Seçimlerinden birini kaldırmayı ya da süzgeçleri temizlemeyi dene.', dugme: 'Süzgeçleri temizle' } });

  const main = `${DONOR}
<div class="vd-sefler" data-vd-sefler>
 ${reklamSlotu('ust', o, { sayfa: 'sefler' })}
 <section class="sef-sec vd-sefler__sec">
  <div class="sec-head vd-sefler__bas">
   <div>
    <span class="eyebrow"><i class="fa-solid fa-user-group" aria-hidden="true"></i> Dizin</span>
    <h2>Video Mutfağı şefleri</h2>
    <p class="lead">İsme göre ara; bir şefe tıkla, videolarını, serilerini ve yazılı tariflerini keşfet.</p>
   </div>
   <form class="sec-tools sef-search" role="search" data-vd-sef-ara onsubmit="return false">
    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
    <input type="search" name="q" value="" placeholder="İsme göre ara..." aria-label="Şef adına göre ara" autocomplete="off">
   </form>
  </div>
  <div class="vd-zebra-sicak vd-bant">${duzen}</div>
 </section>
 ${reklamSlotu('alt', o, { sayfa: 'sefler' })}
</div>`;

  return [{
    dosya: 'video-sefler.html',
    baslik: 'Şefler | Video Mutfağı — Dada Gastro (prototip)',
    aciklama: `Dada Gastro Video Mutfağı şefleri: ${kler.length} şef, ${toplamVideo} video. Mutfağa ve uzmanlığa göre süz, ada, video ya da tarif sayısına göre sırala.`,
    main,
    css: ['suzgec', 'sefler'],
    js: ['suzgec', 'sefler'],
    govdeSinifi: 'pg-video-sefler',
    aktif: 'sefler',
    suzgec: true, // build: Gastro /tarifler süzgeç CSS'i
    iskelet: {
      kirinti: [{ ad: 'Video Mutfağı', href: 'video-mutfagi.html' }, { ad: 'Şefler' }],
      eyebrow: { ikon: 'fa-user-tie', metin: 'Video Mutfağı şefleri' },
      baslik: 'Videonun ustalarını keşfet',
      vurgu: 'ustalarını',
      aciklama: 'Seri sunan şefleri tek yerde bul: mutfağa ve uzmanlığa göre süz, videolarını ve Dada Gastro\'daki yazılı tariflerini gez.',
      sayaclar: [{ deger: kler.length, etiket: 'Video şefi' }, { deger: toplamVideo, etiket: 'Video' }, { deger: toplamTarif, etiket: 'Yazılı tarif' }],
    },
  }];
};
