// Video Mutfağı · oynatıcı bileşeni (izle ajanı). Gastro'da karşılığı olmayan yeni bileşen → `vd-oyn` / `vd-panel` önekli.
// D1: gerçek video yok. Poster = tarif kapağı 1600px; oynat'a basınca simüle zaman çizgisi (gerçek saniye ilerler), posterde yavaş Ken Burns.
// Kullanım: oynatici(v, ortak, { kip: 'izle' | 'spotlight', kilitli?: bool, baslikSeviye?: 'h2'|'h3', alt?: html, oncelik?: bool })
//   `oncelik`: poster eager + fetchpriority=high (LCP; hub'da ilk görünen spotlight sekmesi). izle kipinde her zaman öncelikli.
//   `alt`: oynatıcının hemen altına (panelden önce) konan içerik — izle sayfasında bölüm damgaları; geniş ekranda panel ikisinin boyunca uzanır.
//   → `.vd-oyn-blok` (oynatıcı + senkron malzeme paneli; spotlight kipinde altında iki aksiyon).
// Davranış: varlik/video/js/oynatici.js (sayfada birden çok örnek; biri oynarken öbürleri durur). CSS: varlik/video/css/oynatici.css.
// Olaylar (oynatıcı kökünde, `[data-vd-oyn]`): vd:zaman {sn, bolum} · vd:bolum {bolum} · vd:durum {oynuyor} · vd:bitti.
// API: window.vdOynatici.al(el|seçici) → { oynat(), duraklat(), git(sn, {oynat}), sn(), bolum(), sure }.

const PRO_ADRES = 'https://dadagastro.com/pro';
const DOLAP_ADRES = 'https://dadagastro.com/dolapta-ne-var';

// Eşleme için sadeleştirme: Türkçe küçük harf, ı→i, ğ→g (yumuşama: sarımsak/sarımsağı, yoğurt/yoğurdu aynı köke iner)
const kucuk = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ğ/g, 'g');
/** Malzeme adından adım metninde aranacak kökler: tam ad → son kelime (baş isim) → son kelimenin iyelik/ünlü eki atılmış hâli. */
function kokler(ad) {
  const temiz = kucuk(ad).replace(/\([^)]*\)/g, ' ').replace(/[^a-zçöşü\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!temiz) return [];
  const out = [temiz];
  const kel = temiz.split(' ').filter((w) => w.length >= 3);
  const son = kel[kel.length - 1];
  if (son) {
    out.push(son);
    if (son.length > 4 && /[iuüaekptç]$/.test(son)) out.push(son.slice(0, -1));
    if (son.length > 5 && /(si|su|sü)$/.test(son)) out.push(son.slice(0, -2));
  }
  return [...new Set(out)];
}

/** Malzeme ↔ bölüm eşlemesi: malzeme adı adım metninde aranır (ilk geçtiği adım); o adımı kapsayan bölüme düşer. Bulunamayan ilk bölüme. */
export function malzemeBolumleri(v, ortak) {
  const t = v.tarif ? ortak.TARIF?.[v.tarif] : null;
  const bolumler = ortak.bolumler(v);
  if (!t) return { bolumler, malzemeler: [] };
  const adimlar = (t.adimlar || []).map((a) => kucuk(`${a.baslik || ''} ${a.metin || ''}`));
  // adım indeksi (0-tabanlı) → bölüm indeksi. ortak.bolumler: `adim` 1'den başlar (TARIF.adimlar[adim - 1]); "Malzemeler" girişinde null.
  const adimBolum = (ai) => {
    let son = 0;
    bolumler.forEach((b, i) => { if (typeof b.adim === 'number' && b.adim <= ai + 1) son = i; });
    return son;
  };
  const malzemeler = (t.malzemeler || []).map((m, i) => {
    const k = kokler(m.ad);
    let ai = adimlar.findIndex((a) => k.some((x) => a.includes(x)));
    const bulundu = ai >= 0;
    if (!bulundu) ai = 0;
    return { ...m, sira: i, adim: bulundu ? ai : null, bolum: bulundu ? adimBolum(ai) : 0 };
  });
  return { bolumler, malzemeler };
}

/** Bir adımın (0-tabanlı) bölümü: o adımı açan bölüm; yoksa adımı kapsayan son bölüm → { sn, baslik, i } */
export function adimBolumu(bolumler, ai) {
  let i = bolumler.findIndex((b) => b.adim === ai + 1);
  if (i < 0) { i = 0; bolumler.forEach((b, j) => { if (typeof b.adim === 'number' && b.adim <= ai + 1) i = j; }); }
  return { ...bolumler[i], i };
}

export function posterYolu(v, ortak, boy = 1600) {
  const t = (v.tarif && ortak.TARIF?.[v.tarif]) || (v.poster_tarif && ortak.TARIF?.[v.poster_tarif]) || null;
  if (!t) return null;
  return boy >= 1000 ? (t.kapak1600 || t.kapak640) : (t.kapak640 || t.kapak1600);
}

const miktarMetni = (m) => [m.miktar_metin ?? m.miktar, m.birim].filter((x) => x !== null && x !== undefined && String(x).trim() !== '').join(' ');

export function oynatici(v, ortak, { kip = 'izle', kilitli = false, baslikSeviye = 'h2', alt = '', oncelik = false } = {}) {
  const { esc } = ortak;
  const sure = Number(v.sure_sn) || 0;
  const seri = ortak.KATALOG?.seriler?.find((s) => s.slug === v.seri);
  const t = v.tarif ? ortak.TARIF?.[v.tarif] : null;
  const { bolumler, malzemeler } = malzemeBolumleri(v, ortak);
  const kimlik = `vdo-${v.slug}${kip === 'spotlight' ? '-sp' : ''}`;
  const poster = posterYolu(v, ortak, 1600);
  const bolumVeri = bolumler.map((b, i) => ({ sn: b.sn, baslik: b.baslik, son: i + 1 < bolumler.length ? bolumler[i + 1].sn : sure }));

  // Zaman çizgisi: her bölüm bir parça (YouTube bölüm parçaları gibi); genişlik bölüm süresiyle orantılı.
  const parcalar = bolumVeri.map((b, i) => {
    const g = sure ? ((b.son - b.sn) / sure) * 100 : 100 / bolumVeri.length;
    return `<span class="vd-oyn__parca" data-vd-parca="${i}" style="--g:${g.toFixed(3)}%"><span class="vd-oyn__parca-dolu"></span></span>`;
  }).join('');

  const posterHtml = poster
    ? `<img class="vd-oyn__poster" src="${esc(poster)}" alt="" width="1600" height="900" decoding="async"${kip === 'izle' || oncelik ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"'}>`
    : `<div class="vd-oyn__poster vd-oyn__poster--yazi" aria-hidden="true"><i class="fa-solid ${esc(seri?.ikon || 'fa-film')}"></i><span>${esc(v.baslik)}</span></div>`;

  const kilitHtml = kilitli ? `
   <div class="vd-oyn__kilit">
    <span class="vd-oyn__kilit-ikon"><i class="fa-solid fa-lock" aria-hidden="true"></i></span>
    <b>Bu bölüm Pro üyelere açık</b>
    <p>${esc(seri?.ad || 'Bu seri')} Gastro Pro üyeliğiyle izlenir. Bölüm başlıkları, yazılı tarif ve malzemeler herkese açık.</p>
    <a class="vd-oyn__kilit-bag" href="${PRO_ADRES}">Gastro Pro'yu incele <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
   </div>` : '';

  const kontroller = kilitli ? '' : `
   <button class="vd-oyn__buyuk" type="button" data-vd-oynat aria-label="Videoyu oynat"><i class="fa-solid fa-play" aria-hidden="true"></i></button>
   <div class="vd-oyn__alt">
    <div class="vd-oyn__iz" data-vd-iz role="slider" tabindex="0" aria-label="Zaman çizgisi" aria-valuemin="0" aria-valuemax="${sure}" aria-valuenow="0" aria-valuetext="${ortak.sureMetni(0)} / ${ortak.sureMetni(sure)}">
     <span class="vd-oyn__parcalar">${parcalar}</span>
     <span class="vd-oyn__tutamac" aria-hidden="true"></span>
     <span class="vd-oyn__onizle" data-vd-onizle hidden></span>
    </div>
    <div class="vd-oyn__cubuk">
     <button class="vd-oyn__dugme" type="button" data-vd-oynat aria-label="Oynat"><i class="fa-solid fa-play" aria-hidden="true"></i></button>
     <span class="vd-oyn__zaman"><span data-vd-simdi>${ortak.sureMetni(0)}</span><span class="vd-oyn__zaman-ayrac">/</span><span>${ortak.sureMetni(sure)}</span></span>
     <span class="vd-oyn__bolum-ad" data-vd-bolum-ad>${esc(bolumVeri[0]?.baslik || '')}</span>
     <button class="vd-oyn__dugme" type="button" data-vd-ses aria-pressed="false" aria-label="Ses: prototipte ses yok"><i class="fa-solid fa-volume-xmark" aria-hidden="true"></i></button>
     <button class="vd-oyn__dugme" type="button" data-vd-tamekran aria-label="Tam ekran"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>
    </div>
   </div>`;

  const oyn = `
  <div class="vd-oyn${kilitli ? ' vd-oyn--kilitli' : ''}" id="${kimlik}" data-vd-oyn data-slug="${esc(v.slug)}" data-sure="${sure}" data-bolumler="${esc(JSON.stringify(bolumVeri))}" role="region" aria-label="Video oynatıcı: ${esc(v.baslik)}">
   <div class="vd-oyn__sahne" data-vd-sahne>
    ${posterHtml}
    <span class="vd-oyn__perde" aria-hidden="true"></span>
    <span class="vd-oyn__temsili">Görüntü temsilîdir · prototip</span>
    <button class="vd-oyn__kaydet" type="button" data-vd-kaydet="${esc(v.slug)}" aria-pressed="false" aria-label="Mutfak Defterine kaydet"><i class="fa-regular fa-bookmark vd-oyn__kaydet-kapali" aria-hidden="true"></i><i class="fa-solid fa-bookmark vd-oyn__kaydet-acik" aria-hidden="true"></i><span class="vd-oyn__kaydet-kapali">Mutfak Defterine kaydet</span><span class="vd-oyn__kaydet-acik">Defterine kaydedildi</span></button>
    ${kilitHtml}${kontroller}
   </div>
  </div>`;

  return `<div class="vd-oyn-blok vd-oyn-blok--${kip}" data-vd-blok>
  ${oyn}
  ${alt ? `<div class="vd-oyn-blok__alt">${alt}</div>` : ''}
  ${panel(v, ortak, { t, bolumVeri, malzemeler, kilitli, baslikSeviye })}
  ${kip === 'spotlight' && t ? spotlightAksiyon(v, ortak, t, malzemeler) : ''}
 </div>`;
}

function panel(v, ortak, { t, bolumVeri, malzemeler, kilitli, baslikSeviye }) {
  const { esc } = ortak;
  const H = baslikSeviye;
  // Tarifsiz video → "Bu videodaki ekipman" (katalog `ekipman`), bölümlere sırayla dağıtılır
  if (!t) {
    const ek = v.ekipman || [];
    if (!ek.length) return '';
    const grup = bolumVeri.map((b, i) => ({ b, i, ogeler: ek.filter((_, j) => Math.min(bolumVeri.length - 1, Math.floor((j * bolumVeri.length) / ek.length)) === i) }));
    return `<aside class="vd-panel vd-panel--ekipman" data-vd-panel aria-label="Bu videodaki ekipman">
   <div class="vd-panel__bas">
    <${H} class="vd-panel__baslik"><i class="fa-solid fa-kitchen-set" aria-hidden="true"></i> Bu videodaki ekipman</${H}>
    <p class="vd-panel__alt">Video ilerledikçe sırası gelen ekipman öne çıkar</p>
   </div>
   <div class="vd-panel__liste" data-vd-mz-liste>
    ${grup.filter((g) => g.ogeler.length).map((g) => `<section class="vd-panel__grup" data-vd-grup="${g.i}">
     <button class="vd-panel__grup-bas" type="button" data-vd-git="${g.b.sn}"><span class="vd-panel__damga">${ortak.sureMetni(g.b.sn)}</span><span>${esc(g.b.baslik)}</span></button>
     <ul>${g.ogeler.map((e) => `<li class="vd-mz vd-mz--ekipman"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span class="vd-mz__ad">${esc(e)}</span></li>`).join('')}</ul>
    </section>`).join('')}
   </div>
  </aside>`;
  }

  const gruplar = bolumVeri.map((b, i) => ({ b, i, ogeler: malzemeler.filter((m) => m.bolum === i) })).filter((g) => g.ogeler.length);
  const satir = (m) => {
    const mid = m.malzeme_id ? ` data-malzeme-id="${esc(m.malzeme_id)}"` : '';
    const kimlik = `vdmz-${v.slug}-${m.sira}`;
    return `<li class="vd-mz" data-vd-mz${mid}>
      <input class="vd-mz__kutu" type="checkbox" id="${kimlik}" data-vd-dolap>
      <label class="vd-mz__etiket" for="${kimlik}"><span class="vd-mz__isaret" aria-hidden="true"><i class="fa-solid fa-check"></i></span><span class="vd-mz__metin">${miktarMetni(m) ? `<b class="vd-mz__miktar">${esc(miktarMetni(m))}</b> ` : ''}<span class="vd-mz__ad">${esc(m.ad)}</span>${m.aciklama ? `<small>${esc(m.aciklama)}</small>` : ''}</span><span class="vd-mz__var">Dolabımda var</span></label>
     </li>`;
  };
  return `<aside class="vd-panel" data-vd-panel aria-label="Videodaki malzemeler"${kilitli ? ' data-vd-kilitli' : ''}>
   <div class="vd-panel__bas">
    <${H} class="vd-panel__baslik"><i class="fa-solid fa-basket-shopping" aria-hidden="true"></i> Malzemeler</${H}>
    <p class="vd-panel__alt">${kilitli ? 'Yazılı tarifteki malzemeler' : 'Video ilerledikçe sırası gelen malzeme açılır'}${t.porsiyon ? ` · ${esc(t.porsiyon)} ${esc(t.porsiyon_birimi || 'kişilik')}` : ''}</p>
   </div>
   <div class="vd-panel__liste" data-vd-mz-liste>
    ${gruplar.map((g) => `<section class="vd-panel__grup" data-vd-grup="${g.i}">
     <button class="vd-panel__grup-bas" type="button" data-vd-git="${g.b.sn}"${kilitli ? ' disabled' : ''}><span class="vd-panel__damga">${ortak.sureMetni(g.b.sn)}</span><span>${esc(g.b.baslik)}</span></button>
     <ul>${g.ogeler.map(satir).join('')}</ul>
    </section>`).join('')}
   </div>
   <div class="vd-panel__ayak">
    <p class="vd-panel__ipucu" data-vd-ipucu>Dolabında olanları işaretle; eksikler listene gider.</p>
    <button class="vd-panel__eksik" type="button" data-vd-eksik><i class="fa-solid fa-cart-plus" aria-hidden="true"></i><span data-vd-eksik-yazi>Eksikleri Alışveriş Listesine Ekle</span><span class="vd-panel__sayi" data-vd-eksik-sayi>${malzemeler.length}</span></button>
    <a class="vd-panel__dolap" data-vd-dolap-bag data-taban="${DOLAP_ADRES}" href="${DOLAP_ADRES}"><i class="fa-solid fa-kitchen-set" aria-hidden="true"></i><span data-vd-dolap-yazi>Dolabımdakilerle tarif bul</span><i class="fa-solid fa-arrow-up-right-from-square vd-panel__dis" aria-hidden="true"></i></a>
   </div>
  </aside>`;
}

function spotlightAksiyon(v, ortak, t, malzemeler) {
  const { esc } = ortak;
  return `<div class="vd-oyn-blok__aksiyon">
   <a class="vd-aksiyon vd-aksiyon--birincil" href="${esc(ortak.tarifAdresi(v.tarif))}#adimlar"><i class="fa-solid fa-list-ol" aria-hidden="true"></i>Tarifin Yazılı Adımlarına Git</a>
   <button class="vd-aksiyon" type="button" data-vd-tum-liste="${malzemeler.length}" aria-pressed="false"><i class="fa-solid fa-cart-plus" aria-hidden="true"></i><span data-vd-tum-liste-yazi>Malzemeleri Listeme Kaydet</span></button>
  </div>`;
}
