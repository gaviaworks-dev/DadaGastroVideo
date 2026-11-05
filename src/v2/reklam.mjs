// Video Mutfağı prototipi · reklam yerleşimleri (reklam ajanı). Sözleşme ve yerleşim planı: tasks/reklam-durum.md
//
// İşaretleme YAZILMAZ: full-stack reklam modülünün (gastro-video · x-reklam.slot · x-reklam.standart · x-reklam.eslik-karti) GERÇEK render
// çıktısıdır — araclar/reklam-render.php → araclar/reklam-varlik.mjs → src/v2/reklam-donor.json (V1'in kopyası). Burada yalnız modülün sarmalayıcıları
// (x-reklam.yayilim'in `.rk-yayilim-alan`ı, slot.blade'in videolu banner kabı, standart-katman'ın `[data-rk-standart]`ı) aynı biçimde kurulur.
//
// Göster/gizle: her yerleşim `<div class="vd-reklam" data-vd-reklam="<KOD>" hidden><template>…</template></div>`. Modül işaretlemesi
// <template> içinde durur → reklamsız görünümde DOM'a hiç girmez (modül CSS'inin `main:has(.rk-yayilim-alan)` gibi sayfa geneli kuralları
// tetiklenmez, yer kaplamaz). `?reklam=1` olunca varlik/video/js/reklam.js modül CSS'ini yükler, şablonu açar ve kabı gösterir.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const REKLAM = JSON.parse(readFileSync(path.join(KOK, 'src/v2/reklam-donor.json'), 'utf8')); // görsel yolları kök göreli (varlik/video/reklam/…, paylaşılan); build-v2 ../varlik/'e çevirir
const P = REKLAM.parcalar;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DONOR = `<!-- reklam · donör: full-stack reklam modülü render çıktısı (gastro-video ${REKLAM.kaynak}; araclar/reklam-render.php) · örnek markalar canlı demo kayıtlarından · prototip örneği -->`;

/** Sayfa tipi → modülün yayılım planı (config/reklam-yayilim.php). İzleme sayfası full-stack'te seri sayfasının bölüm görünümüdür (?bolum=) → video-seri planı. */
export const YAYILIM = {
  hub: { sayfa: 'video-liste', ust: 'VD-B1', alt: 'VD-B1-END', native: 'VD-N1', video: true },
  seriler: { sayfa: 'video-seriler', ust: 'VS-B1', alt: 'VS-B1-END' },
  seri: { sayfa: 'video-seri', ust: 'VD-S1', alt: 'VD-S1-END' },
  izle: { sayfa: 'video-seri', ust: 'VD-S1', alt: 'VD-S1-END', eslik: true },
  sef: { sayfa: 'sef-profil', ust: 'SF-P1', alt: 'SF-P1-END' },
  kisa: { sayfa: 'video-liste', native: 'VD-N1', standart: false },
  // V2 · patron revizesi (K6): video şefler dizini (video-sefler.html) = modülün şef dizini planı `sef-liste` (reklam-yayilim.php:19;
  // full-stack /sefler: sefler.blade.php:210 üst, :250 dizinde 3. karttan sonra sponsorlu şef kartı, :302 son). Kreatifler canlı demo:
  // SF-L1 Karaca 89 · SF-N2 Tat 108 · SF-L1-END Pınar 128. Standart katman: /sefler StandartReklamlar::uygunYol içinde.
  sefler: { sayfa: 'sef-liste', ust: 'SF-L1', alt: 'SF-L1-END', native: 'SF-N2' },
};
/** Seri sponsoru (VideoServisi::seriSponsoru → "Sponsorlu · <veren>"; yalnız etkin sponsor). Prototip örneği: Modül B "Akıllı Ekipman & Test"
 *  B2B sponsorluğa hazır yapı → canlı demodaki Tefal (Ingenio tencere/tava kreatifleri; airfryer, döküm/yapışmaz tava, düdüklü bölümleri). */
export const SERI_SPONSORU = { 'akilli-ekipman-test': { ad: 'Tefal', veren: 28 } };

const kap = (kod, ic, { tur = 'yerlesim', sayfa = '', etiket = '' } = {}) =>
  `<div class="vd-reklam vd-reklam--${tur}" data-vd-reklam="${esc(kod)}"${sayfa ? ` data-vd-reklam-sayfa="${esc(sayfa)}"` : ''}${etiket ? ` aria-label="${esc(etiket)}"` : ''} hidden><template>${ic}</template></div>`;

/** x-reklam.yayilim (tur slot|son) sarmalayıcısı — aynı sınıf ve öznitelikler. */
const yayilim = (plan, konum, ic) => `<div class="rk-yayilim-alan wrap rk-yayilim-bant" data-rk-yayilim="${plan.sayfa}" data-rk-konum="${konum}" aria-label="Sponsorlu içerik">\n${ic}\n</div>`;

/** Videolu banner (karar 151, VideoYerlesimi): ilk yayılım yuvasının yerine STD-VIDEO; yuvanın kendi kreatifi data-rk-review-static hidden içinde. */
const videoluBanner = (kod) => `<div class="rk-video-slot" data-rk-review-video data-rk-original-slot="${kod}" data-rk-video-format="serit">\n${P['video-STD-VIDEO']}\n</div>\n<div data-rk-review-static hidden>${P['serit-' + kod]}</div>`;

/**
 * Sayfa içi reklam yerleşimi.
 * @param {string} yer  'ust' | 'alt' | 'native' | 'eslik'   (sayfanın planındaki yuva)
 * @param {object} o    build'in ortak nesnesi (kullanılmıyor; sözleşme için)
 * @param {{sayfa: keyof YAYILIM}} secenek
 * @returns {string} HTML (reklamsız görünümde gizli ve boş)
 */
export function reklamSlotu(yer, o, { sayfa } = {}) {
  const plan = YAYILIM[sayfa];
  if (!plan) throw new Error(`reklamSlotu: bilinmeyen sayfa tipi "${sayfa}" (${Object.keys(YAYILIM).join(', ')})`);
  if (yer === 'ust' || yer === 'alt') {
    const kod = plan[yer]; if (!kod) throw new Error(`reklamSlotu: ${sayfa} planında "${yer}" yuvası yok`);
    const ic = yer === 'ust' && plan.video ? videoluBanner(kod) : P['serit-' + kod];
    return `${DONOR}\n${kap(kod, yayilim(plan, yer, ic), { sayfa })}`;
  }
  if (yer === 'native') {
    if (!plan.native) throw new Error(`reklamSlotu: ${sayfa} planında native yuva yok`);
    if (sayfa === 'kisa') return kap('VD-N1', kisaReklamOgesi(), { tur: 'kisa', sayfa });
    if (sayfa === 'sefler') return kap('SF-N2', P['sef-SF-N2'], { tur: 'kart', sayfa }); // Gastro .sef-card'ın sponsor dalı (partials/kart/sef)
    return kap('VD-N1', P['kart-VD-N1'], { tur: 'kart', sayfa });
  }
  if (yer === 'eslik') {
    if (!plan.eslik) throw new Error(`reklamSlotu: ${sayfa} planında eşlik kartı yok`);
    // parcalar/tarif-detay/malzemeler: malzeme listesinin EN ALTINDA kendi ul.ing-list[data-eslik-kutusu]'ı + li.ing-group başlığı
    const ic = `<ul class="ing-list" data-eslik-kutusu="">\n<li class="ing-group"><i class="fa-solid fa-circle-notch" aria-hidden="true"></i> Yanında ne iyi gider?</li>\n${P['eslik-TD-ESLIK']}\n</ul>`;
    return kap('TD-ESLIK', ic, { tur: 'eslik', sayfa });
  }
  throw new Error(`reklamSlotu: bilinmeyen yer "${yer}"`);
}

/** Kısa video akışında native öğe (VD-N1 kuralı: organik öğenin anatomisi, 3. öğeden sonra) — izle ajanının `vd-dikey__oge` kalıbı
 *  + modülün sponsorlu kart kimliği (partials/kart/video sponsor dalı: `data-native-sponsor`, `.rk-native-hap`, `x-reklam.native-kimlik`).
 *  Kreatif: STD-VIDEO (KRUPS videolu kreatif; sessiz, posterli — reklam-yogunluk.bicimler.video). */
export function kisaReklamOgesi() {
  const k = REKLAM.kayit[REKLAM.kreatifler['video-STD-VIDEO']];
  const v = P['video-STD-VIDEO'];
  const poster = /poster="([^"]+)"/.exec(v)[1]; const kaynak = /data-rk-src="([^"]+)"/.exec(v)[1]; const logo = /<span class="rk-std-logo">([\s\S]*?)<\/span>/.exec(v)[1];
  return `<article class="vd-dikey__oge rk-slot rk-renk-${k.renk.slice(1).toLowerCase()}" data-native-sponsor data-vd-dikey-oge="reklam" data-rk-slot="VD-N1" data-sure="30" aria-roledescription="sponsorlu kısa video" aria-label="Sponsorlu · ${esc(k.marka)}">
    <div class="vd-dikey__sahne" data-vd-dikey-sahne>
     <video class="vd-dikey__poster" poster="${poster}" preload="none" playsinline muted loop data-vd-rk-src="${kaynak}" aria-label="${esc(k.marka)} tanıtım filmi"></video>
     <span class="vd-dikey__perde" aria-hidden="true"></span>
     <span class="rk-native-hap">Sponsorlu<span class="vd-rk-not"><span class="vd-rk-not__ayrac"> · </span>prototip örneği</span></span>
     <div class="vd-dikey__bilgi">
      <h2 class="vd-dikey__baslik" data-vd-kirp="2" title="${esc(k.baslik)}">${esc(k.baslik)}</h2>
      <p class="vd-dikey__ozet">Kahve deneyimini keşfet.</p>
      <p class="vd-dikey__kim"><span class="rk-native-kimlik"><span class="rk-native-wordmark">${logo}</span><a class="rk-native-kesfet" href="${esc(k.hedef_url)}" target="_blank" rel="sponsored nofollow noopener"><span class="rk-native-prefix">Sponsorlu · </span>Keşfet <span class="rk-native-ok" aria-hidden="true">→</span></a></span></p>
     </div>
    </div>
   </article>`;
}

/** Seri sponsor etiketi — full-stack hub/seri: `<span class="rk-native-satir-sag vh-sponsor"><span class="rk-native-hap">Sponsorlu · X</span></span>`.
 *  Sponsoru olmayan seride ''. Reklamsız görünümde gizli (CSS: html:not(.vd-reklamli) [data-vd-reklam]). */
export function sponsorEtiketi(seri, { medya = false } = {}) {
  const sp = SERI_SPONSORU[typeof seri === 'string' ? seri : seri?.slug]; if (!sp) return '';
  const hap = `${esc(REKLAM.sponsor_kalibi.replace('%AD%', sp.ad))}<span class="vd-rk-not"><span class="vd-rk-not__ayrac"> · </span>prototip örneği</span>`;
  // medya: kart görselinin sağ üstünde (modülün varsayılan .rk-native-hap konumu — sponsorlu kartlardaki gibi; kartın boyu değişmez)
  if (medya) return `<span class="rk-native-hap vd-reklam vd-reklam--etiket-medya" data-vd-reklam="SERI-SPONSOR" hidden>${hap}</span>`;
  return `<span class="rk-native-satir-sag vh-sponsor vd-reklam vd-reklam--etiket" data-vd-reklam="SERI-SPONSOR" hidden><span class="rk-native-hap">${hap}</span></span>`;
}
export const seriSponsoru = (seri) => SERI_SPONSORU[typeof seri === 'string' ? seri : seri?.slug] || null;

/** Standart katman (StandartReklamlar · x-reklam.standart-katman): side çifti (≥1280 px; >1366'da iki yan) + alt sabit bar. Pop-up yok (karar R3).
 *  Sayfa başına bir kez, </main>'den sonra. Kısa video sayfasında basılmaz (tam ekran görüntüleyici = modülün pişirme modu kuralı). */
export function reklamKatmani(o, { sayfa } = {}) {
  if (YAYILIM[sayfa]?.standart === false) return '';
  const ic = `<div data-rk-standart data-rk-kilitli="0" data-rk-sayfa="0" data-rk-popup-izin="0" data-rk-popup-sayac="0">\n<div data-rk-side-pair>${P['side-STD-SIDE-LEFT']}${P['side-STD-SIDE']}</div>\n${P['altbar-STD-ALTBAR']}\n</div>`;
  return `${DONOR}\n${kap('STD', ic, { tur: 'katman', sayfa })}`;
}

/** "Reklamlı görünüm" anahtarı (prototip aracı). Durum adreste (?reklam=1), tarayıcıya yazılmaz.
 *  V2 (lead kararı): koyu banner'da kırıntı satırının sağında sade chip + "Prototip" ibaresi → reklamAnahtari({ yer: 'banner' }).
 *  Kısa video görüntüleyicisinin üst satırında V1'deki gibi → reklamAnahtari(). Görünüm Gastro .chip; banner'da Gastro'nun koyu zemin
 *  chip'i (portal CSS `.hero-v .chip` değerleri, varlik/v2/css/reklam.css). */
export function reklamAnahtari({ yer = '' } = {}) {
  const banner = yer === 'banner';
  return `<button class="chip vd-rk-anahtar${banner ? ' vd-rk-anahtar--banner' : ''}" type="button" aria-pressed="false" data-vd-reklam-anahtari title="Reklam yerleşimlerini göster / gizle (prototip aracı)"><i class="fa-solid fa-rectangle-ad" aria-hidden="true"></i><span class="vd-rk-anahtar__metin">Reklamlı görünüm</span>${banner ? '<span class="vd-rk-anahtar__ek">Prototip</span>' : ''}</button>`;
}
