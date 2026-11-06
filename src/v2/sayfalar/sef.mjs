// Video Mutfağı V2 · şef kanalı (izle ajanı) → v2/video-sef-<kullanıcı adı, nokta→tire>.html (6 seri sunucusu)
// İskelet: /bugun-ne-pisirsem banner (kırıntı, eyebrow, ad, unvan/seri satırı, GERÇEK sayaçlar: video · seri · yazılı tarif) + beyaz panel.
// Panel: Gastro şef kartı (sef-kart.mjs 'dizin' = /sefler .sef-card) + tanıtım (prototip örneği) · sekmeler Gastro'nun bnp sekme
// kalıbı (`.bnp-tabwrap > .pf-tabs[role=tablist] > button.dt(.active) + .cnt` — donör /bugun-ne-pisirsem ve /sefler/<k> profil
// sekmeleri aynı .pf-tabs/.dt) · kartlar hub'ın kart.mjs'i · tarif kartı Gastro .r-card. Takipçi / izlenme sayısı YOK.
// Karar (önerimle): Gastro'nun /sefler/<k> profil sayfası (pf-top kapak bandı + pf-head + pf-stats) iskelet olarak ALINMADI —
// V2 sözleşmesi bütün video sayfalarına bnp banner + panel iskeletini veriyor; profilin parçalarından sekme kalıbı (.pf-tabs/.dt/.cnt)
// ve şef kartı alındı. Profil sayaçlarındaki takipçi/puan alanları zaten basılamaz.
import * as kart from '../kart.mjs';
import { reklamSlotu } from '../reklam.mjs';
import { sefTanitimi } from './izle.mjs';
import { sefKarti as gastroSefKarti } from '../sef-kart.mjs';
import { suzgecDuzeni, szVeri, secenekler } from '../suzgec.mjs';

const DONOR = '<!-- Video Mutfağı V2 şef kanalı · donör: http://127.0.0.1:8960/bugun-ne-pisirsem (banner + panel + .pf-tabs/.dt) · /sefler (.sef-card) · / (.r-card) -->';

/** Izgara sütun sayısı: son satır yarım kalmasın (n 4'e bölünüyorsa 4, 3'e bölünüyorsa 3, yoksa 2 sütun). */
const izgaraSinifi = (n) => (n % 4 === 0 ? 'vd-izgara' : n % 3 === 0 ? 'vd-izgara vd-izgara--3' : 'vd-izgara vd-kanal__izgara--2');
/** Tam satır veren en büyük adet (≤ n): 4'ün ya da 3'ün katı; 1–2 olduğu gibi. */
const tamSatir = (n) => { if (n <= 2) return n; for (let m = n; m >= 3; m--) if (m % 4 === 0 || m % 3 === 0) return m; return n; };
/** Türkçe tamlayan eki: "Berkan Güneş'in" · "Polat Abadan'ın" · "Ece Özdenak'ın" */
export function tamlayan(ad) {
  const s = String(ad).trim(); const ses = s.toLocaleLowerCase('tr-TR').match(/[aeıioöuü]/g) || ['e'];
  const son = ses[ses.length - 1]; const ek = { a: 'ın', ı: 'ın', e: 'in', i: 'in', o: 'un', u: 'un', ö: 'ün', ü: 'ün' }[son];
  return `${s}'${/[aeıioöuü]$/i.test(s) ? 'n' : ''}${ek}`;
}

export default async (o) => {
  const k = [...new Set(o.KATALOG.seriler.map((s) => s.sef))].filter((x) => o.SEF[x]);
  return k.map((x) => sayfa(x, o));
};

function sayfa(k, o) {
  const { esc } = o;
  const sef = o.SEF[k];
  const seriler = o.KATALOG.seriler.filter((s) => s.sef === k);
  const uzun = o.KATALOG.videolar.filter((v) => seriler.some((s) => s.slug === v.seri)).sort((a, b) => (a.seri === b.seri ? a.bolum - b.bolum : 0));
  const kisa = o.KATALOG.kisalar.filter((v) => seriler.some((s) => s.slug === v.seri));
  const tarifler = tarifListesi(sef, o);
  const sekmeler = [
    uzun.length && { id: 'videolar', ad: 'Videolar', ikon: 'fa-circle-play', sayi: uzun.length, govde: videolarPaneli(uzun, o, k) },
    { id: 'seriler', ad: 'Seriler', ikon: 'fa-layer-group', sayi: seriler.length, govde: serilerPaneli(seriler, o) },
    kisa.length && { id: 'kisa-videolar', ad: 'Kısa videolar', ikon: 'fa-bolt', sayi: kisa.length, govde: kisaPaneli(kisa, o) },
    { id: 'tarifler', ad: 'Yazılı tarifleri', ikon: 'fa-book-open', sayi: Number(sef.tarif_sayisi || 0).toLocaleString('tr-TR'), govde: tariflerPaneli(sef, tarifler, o) },
  ].filter(Boolean);
  const vitrin = uzun[uzun.length - 1] || null;
  const videoSayisi = uzun.length + kisa.length;

  const unvanSatiri = [sef.unvan, sef.mutfak].filter(Boolean).join(' · ');
  const main = `${DONOR}
<div class="vd-kanal" data-vd-kanal>
 <div class="vd-kanal__ust">
  <div class="vd-kanal__kart">${gastroSefKarti(k, o, { tur: 'dizin' })}</div>
  <div class="vd-kanal__metin">
   <span class="eyebrow"><i class="fa-solid fa-user-tie" aria-hidden="true"></i> Şef hakkında</span>
   <p class="vd-kanal__tanitim"><span class="vd-ornek"><i class="fa-solid fa-flask" aria-hidden="true"></i> Prototip örneği</span> ${esc(sefTanitimi(sef, seriler))}</p>
   <div class="vd-kanal__aksiyon">
    <a class="btn btn-ghost vd-kanal__profil" href="${esc(sef.gastro_profil || o.sefGastroAdresi(k))}">Dada Gastro profili <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
   </div>
  </div>
 </div>
 ${reklamSlotu('ust', o, { sayfa: 'sef' })}
 <div class="vd-kanal__govde vd-zebra-sicak vd-bant">
  <div class="bnp-tabwrap vd-kanal__sekmeler">
   <div class="pf-tabs" role="tablist" aria-label="${esc(sef.ad)} kanalı">
    ${sekmeler.map((s, i) => `<button class="dt${i === 0 ? ' active' : ''}" type="button" role="tab" id="sekme-${s.id}" aria-controls="panel-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-vd-sekme="${s.id}"><i class="fa-solid ${s.ikon}" aria-hidden="true"></i> ${esc(s.ad)}${s.sayi !== undefined ? ` <span class="cnt">${s.sayi}</span>` : ''}</button>`).join('\n    ')}
   </div>
  </div>
  ${sekmeler.map((s, i) => `<section class="vd-kanal__panel" role="tabpanel" id="panel-${s.id}" aria-labelledby="sekme-${s.id}" tabindex="0"${i ? ' hidden' : ''}>${s.govde}</section>`).join('\n  ')}
 </div>
 ${reklamSlotu('alt', o, { sayfa: 'sef' })}
</div>`;

  return {
    dosya: o.sefDosyaAdi(k),
    baslik: `${sef.ad} — şef kanalı | Video Mutfağı — Dada Gastro (prototip)`,
    aciklama: `${sef.ad} (${sef.unvan || 'şef'}) Video Mutfağı kanalı: ${seriler.map((s) => s.ad).join(', ')} serisi, videoları ve Dada Gastro'daki yazılı tarifleri.`,
    main,
    css: ['suzgec', 'sef'],
    js: ['suzgec', 'sef'],
    govdeSinifi: 'pg-video-sef',
    suzgec: true, // Videolar sekmesi süzgeci (Gastro /tarifler süzgeç CSS'i)
    iskelet: {
      kirinti: [{ ad: 'Video Mutfağı', href: 'video-mutfagi.html' }, { ad: 'Şefler', href: 'video-sefler.html' }, { ad: sef.ad }],
      eyebrow: { ikon: 'fa-video', metin: 'Video Mutfağı şefi' },
      baslik: sef.ad,
      aciklama: `${unvanSatiri ? unvanSatiri + '. ' : ''}Video Mutfağı'nda ${seriler.map((x) => x.ad).join(' ve ')} ${seriler.length > 1 ? 'serilerini' : 'serisini'} sunuyor.`,
      // GERÇEK sayılar: katalogdaki video (uzun + kısa) ve seri sayısı, şefin Dada Gastro'daki yazılı tarif sayısı
      sayaclar: [{ deger: videoSayisi, etiket: 'Video' }, { deger: seriler.length, etiket: 'Seri' }, { deger: Number(sef.tarif_sayisi || 0), etiket: 'Yazılı tarif' }],
      gorsel: (vitrin && o.videoPosteri(vitrin)?.k1600) || (kisa.length && o.videoPosteri(kisa[kisa.length - 1])?.k1600) || undefined,
    },
    gorsel: sef.avatar || (vitrin && o.videoPosteri(vitrin)?.k1600) || undefined,
  };
}

function videolarPaneli(uzun, o, k) {
  // Patron revizesi K3: Videolar sekmesi Gastro /tarifler süzgeciyle (hub suzgec.mjs): seri (yalnız şef birden çok seri sunuyorsa —
  // tek seçenekli grup yalan yüzey olur; bugün altı şefin her biri tek seri sunuyor → gizli) · süre (tarif süresi; tarifsizde video) ·
  // sıralama (Seri sırası / Kısadan uzuna / Uzundan kısaya / Ada göre). Liste Gastro .lst-grid (kart boyları eşit).
  const seriler = [...new Set(uzun.map((v) => v.seri))];
  const SURE_SIRA = ['15-alti', '15-30', '30-ustu'];
  const sureAd = Object.fromEntries((o.KATALOG.sure_suzgecleri || []).map((x) => [x.kod, x.ad]));
  const seriAd = Object.fromEntries(seriler.map((x) => [x, o.SERI[x]?.ad || x]));
  const duz = uzun.map((v) => ({ sure: [o.sureKodu(v)], ...(seriler.length > 1 ? { seri: [v.seri] } : {}) }));
  const gruplar = [
    ...(seriler.length > 1 ? [{ kod: 'seri', ad: 'Seri', ikon: 'fa-film', secenekler: secenekler(duz, 'seri', seriAd, { sira: seriler }) }] : []),
    { kod: 'sure', ad: 'Süre', ikon: 'fa-clock', secenekler: secenekler(duz, 'sure', sureAd, { sira: SURE_SIRA, tum: SURE_SIRA }) }, // sabit grup: 0 sayılı seçenek de basılır (donör /tarifler gibi)
  ];
  const siralar = [
    { kod: 'seri-sirasi', ad: 'Seri sırası', ikon: 'fa-list-ol' },
    { kod: 'kisadan-uzuna', ad: 'Kısadan uzuna', ikon: 'fa-arrow-up-short-wide', alan: 'sure', yon: 'artan' },
    { kod: 'uzundan-kisaya', ad: 'Uzundan kısaya', ikon: 'fa-arrow-down-wide-short', alan: 'sure', yon: 'azalan' },
    { kod: 'ada-gore', ad: 'Ada göre', ikon: 'fa-arrow-down-a-z', alan: 'ad', tur: 'metin' },
  ];
  const liste = `<div class="lst-grid" data-sz-liste>${uzun.map((v, i) => kart.videoKarti(v, o, { boyut: 'izgara', baslikSeviye: 'h3', sefGoster: false, sz: szVeri(duz[i], { sure: v.sure_sn, ad: v.baslik }, i) })).join('')}</div>`;
  return suzgecDuzeni({ dosya: `${o.sefDosyaAdi(k)}`, birim: 'video', toplam: uzun.length, gruplar, siralar, liste, id: 'sef-videolar',
    bos: { baslik: 'Bu süreye uyan video yok', metin: 'Süre seçimini kaldır ya da süzgeçleri temizle.', dugme: 'Süzgeçleri temizle' } });
}

function serilerPaneli(seriler, o) {
  return `<div class="sec-head vd-kanal__panel-bas"><div><h2>Seriler</h2><p class="lead">Şefin Video Mutfağı'nda sunduğu ${seriler.length > 1 ? 'seriler' : 'seri'}</p></div></div>
   ${seriler.map((s) => {
     const bol = kart.seriBolumleri(s.slug, o);
     const uzunMu = s.format !== '9:16';
     return `<div class="vd-kanal__seri">
      <div class="vd-kanal__seri-afis">${kart.seriAfisi(s, o, { baslikSeviye: 'h3' })}</div>
      <div class="vd-kanal__seri-liste">
       <h3 class="vd-kanal__seri-bas">${bol.length} ${uzunMu ? 'bölüm' : 'kısa video'}</h3>
       ${uzunMu
         ? `<div class="feat-side vd-bolum-liste">${bol.map((v) => kart.bolumKarti(v, o, { baslikSeviye: 'h4', ozet: false })).join('')}</div>`
         : `<ol class="vd-kanal__kisa-liste">${bol.map((v) => `<li><a href="${o.esc(o.videoAdresi(v))}"><span>${String(v.bolum).padStart(2, '0')}</span><b>${o.esc(v.baslik)}</b><small>${v.sure_sn} sn</small></a></li>`).join('')}</ol>`}
      </div>
     </div>`;
   }).join('')}`;
}

function kisaPaneli(kisa, o) {
  const { esc } = o;
  return `<div class="vd-ray vd-ray--kisa" data-vd-ray>
    <div class="sec-head vd-kanal__panel-bas"><div><h2>Kısa videolar</h2><p class="lead">15–45 saniyelik dikey videolar; açınca yukarı kaydırarak sıradakine geç.</p></div>
     <div class="sec-tools"><a class="see-all" href="${esc(o.videoAdresi(kisa[0]))}">Tam ekran izle <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a><div class="row-nav"><button type="button" data-vd-ray-onceki aria-label="Önceki kısa videolar"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button><button type="button" data-vd-ray-sonraki aria-label="Sonraki kısa videolar"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div></div>
    </div>
    <div class="row-track" data-vd-ray-iz>${kisa.map((k) => kart.kisaKarti(k, o)).join('')}</div>
   </div>`;
}

/** Şefin yazılı tarifleri: prototipte sayfası olanlar (SEF.tarifler) + örnek gerçek tarifler (SEF.ornek_tarifler, Gastro bağı). */
function tarifListesi(sef, o) {
  const liste = [];
  for (const slug of sef.tarifler || []) {
    const t = o.TARIF[slug]; if (!t) continue;
    liste.push({ slug, baslik: t.baslik, kapak640: t.kapak640, sure_dk: (t.hazirlik_dk || 0) + (t.pisirme_dk || 0), zorluk: t.zorluk, mutfak: t.mutfak });
  }
  for (const t of sef.ornek_tarifler || []) if (!liste.some((x) => x.slug === t.slug)) liste.push(t);
  return liste;
}
function tariflerPaneli(sef, tarifler, o) {
  const { esc } = o;
  const profil = esc(sef.gastro_profil || o.sefGastroAdresi(sef.kullanici_adi));
  const goster = tarifler.slice(0, tamSatir(tarifler.length));
  const kartHtml = (t) => {
    const href = esc(o.tarifAdresi(t.slug));
    const z = kart.zorlukUc(t.zorluk) || t.zorluk;
    return `<article class="r-card vd-kanal__tarif">
     <div class="r-media-wrap"><div class="r-media">
      ${t.kapak640 ? `<img class="vd-kart__kapak" src="${esc(t.kapak640)}" alt="" width="640" height="427" loading="lazy" decoding="async">` : ''}
      ${t.mutfak ? `<span class="r-chip">${esc(t.mutfak)}</span>` : ''}
     </div></div>
     <div class="r-body">
      <h3 data-vd-kirp="2"><a href="${href}" aria-label="${esc(t.baslik)}">${esc(t.baslik)}</a></h3>
      <div class="r-facts">${t.sure_dk ? `<span><i class="fa-solid fa-clock" aria-hidden="true"></i> <span class="rf-txt">${t.sure_dk} dk</span></span>` : ''}${z ? ` <span><i class="fa-solid fa-signal" aria-hidden="true"></i> <span class="rf-txt">${esc(z)}</span></span>` : ''}</div>
     </div>
    </article>`;
  };
  return `<div class="sec-head vd-kanal__panel-bas"><div><h2>Yazılı tarifleri</h2><p class="lead">${esc(tamlayan(sef.ad))} Dada Gastro'daki ${Number(sef.tarif_sayisi || 0).toLocaleString('tr-TR')} yazılı tarifinden ${goster.length ? 'örnekler' : 'tamamı profilinde'}.</p></div>
    <div class="sec-tools"><a class="see-all" href="${profil}">Tümünü Dada Gastro'da gör <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></div></div>
   ${goster.length ? `<div class="${izgaraSinifi(goster.length)}">${goster.map(kartHtml).join('')}</div>` : `<div class="vd-kanal__bos"><i class="fa-solid fa-book-open" aria-hidden="true"></i><p>${esc(tamlayan(sef.ad))} ${Number(sef.tarif_sayisi || 0).toLocaleString('tr-TR')} yazılı tarifi Dada Gastro profilinde.</p><a class="btn btn-primary" href="${profil}">Tariflerini gör <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></div>`}`;
}
