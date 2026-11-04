// Video Mutfağı · şef kanalı (izle ajanı) → video-sef-<kullanıcı adı, nokta→tire>.html (6 seri sunucusu)
// Kabuk = Gastro tarif detayı (build). Kırıntı .rd-crumb, bölüm başı .sec-head/.eyebrow, kartlar hub'ın kart.mjs'i (videoKarti,
// kisaKarti, bolumKarti, seriAfisi), tarif kartı Gastro .r-card (.r-media-wrap > .r-media · .r-body > h4 · .r-facts).
// Sekmeler (tablist) Gastro'da karşılığı olmadığı için yeni (vd-kanal__sekme). Takipçi / izlenme sayısı YOK.
import * as kart from '../kart.mjs';
import { reklamSlotu } from '../reklam.mjs';
import { sefTanitimi } from './izle.mjs';

const DONOR = '<!-- Video Mutfağı şef kanalı · donör: Gastro tarif detayı kabuğu (yerel 8960 render) + .rd-crumb/.sec-head/.r-card kalıpları · sekmeler yeni (vd-kanal) -->';

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
    uzun.length && { id: 'videolar', ad: 'Videolar', ikon: 'fa-circle-play', govde: videolarPaneli(uzun, o) },
    { id: 'seriler', ad: 'Seriler', ikon: 'fa-layer-group', govde: serilerPaneli(seriler, o) },
    kisa.length && { id: 'kisa-videolar', ad: 'Kısa videolar', ikon: 'fa-bolt', govde: kisaPaneli(kisa, o) },
    { id: 'tarifler', ad: 'Yazılı tarifleri', ikon: 'fa-book-open', govde: tariflerPaneli(sef, tarifler, o) },
  ].filter(Boolean);
  const vitrin = uzun[uzun.length - 1] || null;
  const videoSayisi = uzun.length + kisa.length;

  const main = `${DONOR}
<div class="vd-kanal" data-vd-kanal>
 <section class="vd-kanal__bas" data-rk-hero="">
  <div class="wrap">
   <nav class="rd-crumb vd-kanal__kirinti" aria-label="Sayfa yolu">
    <a href="video-mutfagi.html"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i> Video Mutfağı</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    <a href="video-mutfagi.html#sefler">Şefler</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    <b>${esc(sef.ad)}</b>
   </nav>
   <div class="vd-kanal__kunye${vitrin ? '' : kisa.length ? ' vd-kanal__kunye--kisa' : ' vd-kanal__kunye--tek'}">
    <div class="vd-kanal__kim">
     <span class="vd-kanal__av">${sef.avatar ? `<img src="${esc(sef.avatar)}" alt="${esc(sef.ad)}" width="144" height="144" decoding="async">` : `<span aria-hidden="true">${esc(sef.bas_harf)}</span>`}</span>
     <div class="vd-kanal__metin">
      <span class="eyebrow"><i class="fa-solid fa-video" aria-hidden="true"></i> Video Mutfağı şefi</span>
      <h1 class="vd-kanal__ad">${esc(sef.ad)}</h1>
      <p class="vd-kanal__unvan">${esc(sef.unvan || '')}${sef.mutfak ? ` · ${esc(sef.mutfak)}` : ''}</p>
      <ul class="vd-kanal__sayilar">
       <li><b>${Number(sef.tarif_sayisi || 0).toLocaleString('tr-TR')}</b> yazılı tarif</li>
       <li><b>${videoSayisi}</b> video</li>
       <li><b>${seriler.length}</b> seri</li>
      </ul>
      <p class="vd-kanal__tanitim"><span class="vd-ornek"><i class="fa-solid fa-flask" aria-hidden="true"></i> Prototip örneği</span> ${esc(sefTanitimi(sef, seriler))}</p>
      <div class="vd-kanal__aksiyon">
       <button class="btn btn-primary vd-kanal__takip" type="button" data-vd-takip="${esc(k)}" data-ad="${esc(sef.ad)}" aria-pressed="false"><i class="fa-solid fa-user-plus" aria-hidden="true"></i><span>Takip Et</span></button>
       <a class="btn btn-ghost vd-kanal__profil" href="${esc(sef.gastro_profil || o.sefGastroAdresi(k))}">Dada Gastro profili <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
      </div>
     </div>
    </div>
    ${vitrin ? `<div class="vd-kanal__vitrin"><span class="vd-kanal__vitrin-bas"><i class="fa-solid fa-film" aria-hidden="true"></i> Son bölüm</span>${kart.videoKarti(vitrin, o, { boyut: 'izgara', baslikSeviye: 'h2', sefGoster: false, oncelik: true })}</div>` : kisa.length ? `<div class="vd-kanal__vitrin vd-kanal__vitrin--kisa"><span class="vd-kanal__vitrin-bas"><i class="fa-solid fa-bolt" aria-hidden="true"></i> Son kısa video</span>${kart.kisaKarti(kisa[kisa.length - 1], o, { oncelik: true })}</div>` : ''}
   </div>
  </div>
 </section>
 ${reklamSlotu('ust', o, { sayfa: 'sef' })}

 <div class="wrap vd-kanal__govde">
  <div class="vd-kanal__sekmeler" role="tablist" aria-label="${esc(sef.ad)} kanalı">
   ${sekmeler.map((s, i) => `<button class="vd-kanal__sekme" type="button" role="tab" id="sekme-${s.id}" aria-controls="panel-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-vd-sekme="${s.id}"><i class="fa-solid ${s.ikon}" aria-hidden="true"></i>${esc(s.ad)}</button>`).join('')}
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
    css: ['sef'],
    js: ['sef'],
    govdeSinifi: 'pg-video-sef',
    altMenu: 'sefler',
    gorsel: sef.avatar || (vitrin && o.videoPosteri(vitrin)?.k1600) || undefined,
  };
}

function videolarPaneli(uzun, o) {
  // 5 bölüm: ilki büyük (2×2) + dört küçük → iki tam satır; diğer sayılarda yarım satır bırakmayan sütun sayısı
  const one = uzun.length === 5;
  return `<div class="sec-head vd-kanal__panel-bas"><div><h2>Videolar</h2><p class="lead">${uzun.length} bölüm · seri sırasıyla</p></div></div>
   <div class="${one ? 'vd-izgara vd-kanal__izgara--one' : izgaraSinifi(uzun.length)}">${uzun.map((v) => kart.videoKarti(v, o, { boyut: 'izgara', baslikSeviye: 'h3', sefGoster: false })).join('')}</div>`;
}

function serilerPaneli(seriler, o) {
  return `<div class="sec-head vd-kanal__panel-bas"><div><h2>Seriler</h2><p class="lead">Şefin Video Mutfağı'nda sunduğu ${seriler.length > 1 ? 'seriler' : 'seri'}</p></div></div>
   ${seriler.map((s) => {
     const bol = kart.seriBolumleri(s.slug, o);
     const uzunMu = s.format !== '9:16';
     return `<div class="vd-kanal__seri">
      <div class="vd-kanal__seri-afis">${kart.seriAfisi(s, o, { boyut: 'kart', baslikSeviye: 'h3' })}</div>
      <div class="vd-kanal__seri-liste">
       <h3 class="vd-kanal__seri-bas">${bol.length} ${uzunMu ? 'bölüm' : 'kısa video'}</h3>
       ${uzunMu
         ? bol.map((v) => kart.bolumKarti(v, o, { baslikSeviye: 'h4', ozet: false })).join('')
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
