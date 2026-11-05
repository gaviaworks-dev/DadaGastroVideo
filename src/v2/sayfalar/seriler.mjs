// V2 · Seriler: v2/video-seriler.html (hub ajanı). Dokümanın Modül 02 seri tablosu: 6 seri.
// İskelet (kabuk): donör /bugun-ne-pisirsem `.bnp-top` banner (kırıntı · eyebrow · h1 + .accent · .lead · .bnp-stats) + `.bnp-body` panel.
// Panel: reklam üst · Gastro bölümü (`section.sec > .sec-head`) + seri kartları (Gastro `.r-card`, kart.mjs seriAfisi) `.grid-4` 3'lü · reklam alt.
// donör: Gastro ana sayfa render DOM (http://127.0.0.1:8960/) `.sec-head`, `.grid-4`, `.r-card` — portal-*.css · kart-standart.css.
import * as K from '../kart.mjs';
import { reklamSlotu } from '../reklam.mjs';
import { suzgecDuzeni, szVeri, szKod, secenekler } from '../suzgec.mjs'; // Patron revizesi K1–K3: Gastro /tarifler süzgeci

export default async function (o) {
  const ui = (ad) => `<i class="fa-solid ${ad}" aria-hidden="true"></i>`;
  const { seriler, videolar, kisalar } = o.KATALOG;
  // K3 · Seriler süzgeci: kategori (seri konsepti; konseptsiz seriler formatından) · mutfak (bölüm tariflerinin mutfağı) · şef · zorluk ·
  // süre (bölüm tarifinin hazırlık süresi) · sıralama. Seri, en az bir bölümü zorluk/süre/mutfak koşulunu sağlıyorsa eşleşir.
  // "En yeni" sıralaması YOK: katalogda yayın tarihi yok (sahte tarih basılmaz).
  const KATEGORI_AD = { 'akilli-ekipman-test': 'Ekipman', '30-saniyede-tat': 'Kısa Video' };
  const ZORLUK_SIRA = ['kolay', 'orta', 'ileri'];
  const SURE_SIRA = ['15-alti', '15-30', '30-ustu'];
  const sureAd = Object.fromEntries((o.KATALOG.sure_suzgecleri || []).map((x) => [x.kod, x.ad]));
  const veriler = seriler.map((s, i) => {
    const bol = K.seriBolumleri(s.slug, o);
    const tarifler = bol.map((v) => (v.tarif && o.TARIF[v.tarif]) || null).filter(Boolean);
    const kat = s.konsept || KATEGORI_AD[s.slug] || 'Diğer';
    return {
      s, i,
      kategori: [szKod(kat)], katAd: kat,
      mutfak: [...new Set(tarifler.map((t) => t.mutfak).filter(Boolean))].map((m) => [szKod(m), m]),
      sef: [s.sef],
      zorluk: [...new Set(tarifler.map((t) => szKod(K.zorlukUc(t.zorluk))).filter(Boolean))],
      sure: [...new Set(bol.map((v) => o.sureKodu(v)))],
      bolum: bol.length,
    };
  });
  const ad = (alan) => Object.fromEntries(veriler.flatMap((x) => (alan === 'mutfak' ? x.mutfak : [])));
  const duz = veriler.map((x) => ({ kategori: x.kategori, mutfak: x.mutfak.map((m) => m[0]), sef: x.sef, zorluk: x.zorluk, sure: x.sure }));
  const gruplar = [
    { kod: 'kategori', ad: 'Kategori', ikon: 'fa-layer-group', secenekler: secenekler(duz, 'kategori', Object.fromEntries(veriler.map((x) => [x.kategori[0], x.katAd])), { sira: veriler.map((x) => x.kategori[0]) }) },
    { kod: 'mutfak', ad: 'Mutfak', ikon: 'fa-earth-americas', secenekler: secenekler(duz, 'mutfak', ad('mutfak')) },
    { kod: 'sef', ad: 'Şef', ikon: 'fa-user', secenekler: secenekler(duz, 'sef', Object.fromEntries(seriler.map((s) => [s.sef, o.SEF[s.sef] ? o.SEF[s.sef].ad : s.sef]))) },
    { kod: 'zorluk', ad: 'Zorluk', ikon: 'fa-gauge-simple', secenekler: secenekler(duz, 'zorluk', { kolay: 'Kolay', orta: 'Orta', ileri: 'İleri' }, { sira: ZORLUK_SIRA, tum: ZORLUK_SIRA }) },
    { kod: 'sure', ad: 'Süre', ikon: 'fa-clock', secenekler: secenekler(duz, 'sure', sureAd, { sira: SURE_SIRA, tum: SURE_SIRA }) },
  ];
  const siralar = [
    { kod: 'onerilen', ad: 'Önerilen', ikon: 'fa-wand-magic-sparkles' },
    { kod: 'bolum-sayisi', ad: 'Bölüm sayısı', ikon: 'fa-film', alan: 'bolum', yon: 'azalan' },
    { kod: 'ada-gore', ad: 'Ada göre', ikon: 'fa-arrow-down-a-z', alan: 'ad', tur: 'metin' },
  ];
  const kart = (x) => K.seriAfisi(x.s, o, { baslikSeviye: 'h3', sz: szVeri(duz[x.i], { bolum: x.bolum, ad: x.s.ad }, x.i) });
  const liste = `<div class="lst-grid vd-seriler-izgara" id="lstGrid" data-sz-liste>${veriler.map(kart).join('')}</div>`;

  const main = `<!-- V2 · hub ajanı · donör: Gastro ana sayfa http://127.0.0.1:8960/ (section.sec > .sec-head · .r-card) + süzgeç http://127.0.0.1:8960/tarifler (.lst-layout · .lst-side · .sort-dd · .lst-grid) -->
<div class="vd-seriler-sayfa vd-v2">
 ${reklamSlotu('ust', o, { sayfa: 'seriler' })}
 <section class="sec" aria-labelledby="vd-sr-liste">
  <div class="sec-head">
   <div><span class="eyebrow">${ui('fa-layer-group')} Seri listesi</span><h2 id="vd-sr-liste">Bir konu seç, bölüm bölüm ilerle</h2>
   <p class="lead">Kategoriye, mutfağa, şefe, zorluğa ve süreye göre daralt; her serinin formatı, ritmi ve sunan şefi kartında.</p></div>
   <div class="sec-tools"><a class="see-all" href="video-mutfagi.html">Bütün videolar ${ui('fa-arrow-right')}</a></div>
  </div>
  ${suzgecDuzeni({ dosya: 'video-seriler.html', birim: 'seri', toplam: seriler.length, gruplar, siralar, liste, bos: { baslik: 'Bu süzgeçlere uyan seri yok', metin: 'Bir seçimi kaldırmayı ya da süzgeçleri temizlemeyi dene.', dugme: 'Süzgeçleri temizle' } })}
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
    css: ['seriler', 'suzgec'],
    js: ['suzgec'],
    suzgec: true,
    govdeSinifi: 'vd-govde',
  }];
}
