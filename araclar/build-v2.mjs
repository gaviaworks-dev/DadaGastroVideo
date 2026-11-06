// Derleme V2: src/donor/*.html (yerel Gastro'nun sunucu HTML'i) + src/v2/sayfalar/*.mjs → v2/*.html (V1 kökteki sayfalara DOKUNMAZ).
// V1 araclar/build.mjs'in V2 hâli (sözleşme: tasks/video-briefler/v2-ortak.md):
//   · Kabuk = V1 ile aynı donörler (src/donor/kabuk.html, ana.html, tarif-*.html); "Video Mutfağı" üst menü öğesi Gastro'nun
//     `.nav-item > a + .dropdown` kalıbıyla açılır menü (donörün "Mutfak Sırları" öğesi: ikon + başlık + <small> açıklama, .nav-div ayraç);
//     çekmecede Gastro'nun `.d-item.d-has-sub` kalıbı. V1'in `nav.vd-ust` alt menüsü YOK.
//   · Sayfa modülü `iskelet` verirse: Gastro "Ne Pişirsem?" koyu banner + beyaz radiuslu panel (src/v2/iskelet.mjs; donör
//     src/donor/v2/bnp.html); başlık banner üstünde koyu-hero hâlinde (donör: `header.header.kabuk-basi.at-top.tepede[data-hero]`,
//     `body.has-dark-hero`). `iskelet: null` → yalnız `main` (kısa video tam ekran).
//   · Footer'ın hemen üstünde "Prototip sürümü: V1 · V2" satırı (V1 bağı ../<aynı dosya>).
//   · Çıktıda `varlik/` → `../varlik/` (Gastro, tarif kapakları, reklam kreatifleri V1 ile paylaşılır; V2 css/js varlik/v2/).
//
// Kullanım: node araclar/build-v2.mjs [modül …]   (modül adı verilirse yalnız o sayfa modülleri; index + tarif hep üretilir)
//           BOS_MODUL=1 → boş sınama modülü (iskeletli + iskeletsiz) v2/video-sinama*.html üretir
import { readFile, writeFile, readdir, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import * as ortak0 from '../src/v2/ortak.mjs';
import { iskelet } from '../src/v2/iskelet.mjs';
import { kabukTemizle, tokenTaramasi } from './temizle.mjs';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CIKTI = path.join(KOK, 'v2');
const oku = (p) => readFile(path.join(KOK, p), 'utf8');
const varMi = async (p) => { try { await access(path.join(KOK, p)); return true; } catch { return false; } };
const SURUM = process.env.SURUM || Date.now().toString(36);
const kart = (await varMi('src/v2/kart.mjs')) ? await import(`../src/v2/kart.mjs?v=${SURUM}`) : {};
const reklam = (await varMi('src/v2/reklam.mjs')) ? await import(`../src/v2/reklam.mjs?v=${SURUM}`) : {};
export const ortak = { ...ortak0, ...kart, iskelet };
const { esc, KATALOG, TARIF, SERI, VIDEO } = ortak0;

function zorunlu(html, eski, yeni, etiket) {
  const sayi = typeof eski === 'string' ? html.split(eski).length - 1 : (html.match(eski) || []).length;
  if (sayi < 1) throw new Error(`Ekleme noktası bulunamadı: ${etiket}`);
  return html.replace(eski, yeni);
}
const uyarilar = new Set(); const uyar = (m) => uyarilar.add(m);
const yorum = (donor, not) => `<!-- Dada Gastro Video Mutfağı prototipi V2 · ${not} · donör: ${donor} (yerel Gastro http://127.0.0.1:8960, sunucu HTML'i; src/donor/) · araclar/build-v2.mjs ile üretildi, elle düzenlenmez -->\n`;
/** `bas` konumunda açılan öğenin kapanış etiketinin bittiği konum (aynı adlı iç içe etiketler sayılır). */
function ogeSonu(html, bas) {
  const ad = /^<([a-z0-9]+)/i.exec(html.slice(bas))[1];
  const re = new RegExp(`<${ad}\\b|</${ad}\\s*>`, 'gi'); re.lastIndex = bas;
  let d = 0, x;
  while ((x = re.exec(html))) { d += x[0][1] === '/' ? -1 : 1; if (d === 0) return x.index + x[0].length; }
  throw new Error('kapanış bulunamadı: ' + ad);
}

/* ---------- Mega menü: haftanın serisi mini önizlemesi (V1 D.1b, aynen) ---------- */
function megaOnizleme() {
  const v = ortak0.vitrinVideosu('Haftanın Serisi') || ortak0.vitrinVideosu();
  if (!v) throw new Error('katalogda vitrin videosu yok (mega önizleme)');
  const s = SERI[v.seri]; const p = ortak0.videoPosteri(v);
  if (!p) throw new Error(`vitrin videosunun posteri yok: ${v.slug}`);
  const sure = ortak0.sureMetni(v.sure_sn);
  return `<a class="mega-find mf-video vd-mega" href="${ortak0.videoAdresi(v)}" aria-label="${esc(`Haftanın serisi: ${s.ad}, Bölüm ${v.bolum}: ${v.baslik} (${sure}) — izle`)}">`
    + `<span class="vd-mega__poster" aria-hidden="true"><img src="${p.k640}" alt="" width="640" height="360" loading="lazy" decoding="async"><span class="vd-mega__oynat">${ortak0.ui('play')}</span><span class="vd-mega__sure">${sure}</span></span>`
    + `<span class="mf-body vd-mega__govde"><span class="vd-mega__etiket">${ortak0.ui('fire')} Haftanın serisi</span><b>${esc(s.ad)}</b><small>Bölüm ${v.bolum} · ${esc(v.baslik)}</small></span>`
    + `</a>`;
}
const MEGA_ESKI = /<a class="mega-find mf-video"[^>]*>[\s\S]*?<\/a>/;

/* ---------- Header: "Video Mutfağı" açılır menüsü (Gastro .nav-item > a + .dropdown; donör "Mutfak Sırları") ---------- */
// Sayılar gerçek katalog sayıları (izlenme/puan yok). Şefler bağı V1'deki gibi hub'ın şefler bölümü.
const ALT = () => {
  const uzun = (KATALOG.videolar || []).length, kisa = (KATALOG.kisalar || []).length, seri = (KATALOG.seriler || []).length;
  const sef = new Set((KATALOG.seriler || []).map((s) => s.sef).filter(Boolean)).size;
  return [
    ['kesfet', 'Keşfet', 'video-mutfagi.html', 'compass', `${uzun} video, haftanın serisi`],
    ['seriler', 'Seriler', 'video-seriler.html', 'layer-group', `${seri} seri, bölüm bölüm`],
    ['kisa', '30 Saniyede Tat', 'video-kisa.html', 'bolt', `${kisa} kısa video`],
    // Patron revizesi K4: Şefler → ayrı sayfa video-sefler.html (önceden hub#sefler — patronun "ana sayfaya atıyor" dediği bağ)
    ['sefler', 'Şefler', 'video-sefler.html', 'user-tie', `${sef} video şefi`],
  ];
};
const MODUL_AKTIF = { hub: 'kesfet', seriler: 'seriler', seri: 'seriler', kisa: 'kisa', sef: 'sefler', sefler: 'sefler', izle: '' };
// Patron revizesi K1: Gastro tarif listesi süzgeci (`.lst-layout > aside.lst-side` sheet + `.lst-bar` sayı/sıralama + boş durum) CSS'i.
// Tanımlayan dosyalar ölçüldü (donör 8960 /tarifler <head>, donördeki sırayla): tarif-liste.css (.lst-layout/.lst-side/.sheet-*/.btn-filter/
// .sort-dd/.lst-sum/.lst-empty/.fct*/.cbx/.sheet-overlay) · dm-p4-f.css (.sheet-body/.sheet-foot/.fil-*, yapışkan panel) · revize/p1/tarifler.css
// (.fct*/.sheet-*). Sayfa modülü `suzgec: true` verirse head'e eklenir.
// kanon/bilesenler.css BİLEREK YOK (hub ölçtü, 6 Kas): global sıfırlama taşıyor, V2 hub'da 1440'ta 1447 öğenin kutusunu değiştiriyor;
// tanımladığı süzgeç sınıfları (.lst-side/.sheet-overlay) tarif-liste.css'te de var. Boş durum (.bos-durum) hub'ın suzgec.css'inde "eklendi:".
const SUZGEC_CSS = ['varliklar/reference/tarif-liste/tarif-liste.css', 'varliklar/reference/shared/dm-p4-f.css', 'revize/p1/tarifler.css'];
const HEADER_VIDEO = /<div class="nav-item">\s*<a href="video-mutfagi\.html" class="">Video Mutfağı <span class="soon">VİDEO<\/span><\/a>\s*<\/div>/;
const CEKMECE_VIDEO = /<div class="d-item"><a class="d-link" href="video-mutfagi\.html"><i class="fa-solid fa-circle-play"><\/i> Video Mutfağı <span class="soon">VİDEO<\/span><\/a><\/div>/;
function videoMenusu(html, aktif, videoSayfasiMi) {
  const cur = (k) => (k === aktif ? ' class="active" aria-current="page"' : '');
  const ust = `<div class="nav-item">
            <a href="video-mutfagi.html" class="${videoSayfasiMi ? 'active' : ''}"><i class="fa-solid fa-circle-play vd-nav-ikon" aria-hidden="true"></i>Video Mutfağı <span class="soon">VİDEO</span>
                                                        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                                                </a>
                                                <div class="dropdown">
${ALT().map(([k, ad, href, ik, alt]) => `                                                                <a href="${href}"${cur(k)}><i class="fa-solid fa-${ik}" aria-hidden="true"></i> <span>${esc(ad)}<small>${esc(alt)}</small></span></a>`).join('\n                                                                        <div class="nav-div"></div>\n')}
                                                                                                    </div>
                                        </div>`;
  const cek = `<div class="d-item d-has-sub">
      <div class="d-row">
        <a class="d-link" href="video-mutfagi.html"><i class="fa-solid fa-circle-play"></i> Video Mutfağı <span class="soon">VİDEO</span></a>
        <button class="d-toggle" type="button" aria-expanded="false" aria-label="Video Mutfağı alt menüsü"><i class="fa-solid fa-chevron-down"></i></button>
      </div>
      <div class="d-sub">
${ALT().map(([k, ad, href, ik]) => `        <a href="${href}"${cur(k)}><i class="fa-solid fa-${ik}" aria-hidden="true"></i> <span>${esc(ad)}</span></a>`).join('\n')}
      </div>
    </div>`;
  html = zorunlu(html, HEADER_VIDEO, ust, 'header Video Mutfağı öğesi');
  return zorunlu(html, CEKMECE_VIDEO, cek, 'çekmece Video Mutfağı öğesi');
}

/* ---------- V1 / V2 geçişi (footer'ın hemen üstü: main'in sonu) ---------- */
// Gastro'nun küçük metin sınıfı `.muted` (tokens CSS) + `.wrap`; ortalama ve boyut kabuk.css `.vd-v2-surum`.
// V1'de karşılığı olmayan sayfada (yalnız sınama modülü) V1 bağ değil düz metin olur: tıklayınca boşa düşen bağ yok.
const surumSatiri = (dosya) => `<div class="wrap vd-v2-surum"><p class="muted">Prototip sürümü: ${existsSync(path.join(KOK, dosya)) ? `<a href="../${dosya}">V1</a>` : '<span>V1</span>'} · <b aria-current="page">V2</b></p></div>`;
function surumEkle(html, dosya) {
  return zorunlu(html, /<\/main>(?![\s\S]*<\/main>)/, `${surumSatiri(dosya)}\n</main>`, 'sürüm satırı (</main>)');
}

/* ---------- Ortak eklemeler ---------- */
function markaYazimi(html) {
  return html.replace(/DadaGastro(?![a-z.\/])/g, 'Dada Gastro').replace(/>Dada<\/(b|strong)>Gastro/g, '>Dada</$1> Gastro');
}
// V1 REVİZE 1 kırpıcı: Gastro donör kartlarının başlığına `data-vd-kirp="2"` (video.js kırpar; metin/sınıf değişmez)
const kartBaslikKirp = (html) => html.replace(/(<div class="r-body">\s*<h4)(?![^>]*data-vd-kirp)/g, '$1 data-vd-kirp="2"');
/** Çıktı v2/ altında: kök göreli `varlik/` yolları `../varlik/` olur (nitelik, url(), JSON kaçışlı biçim). */
function yollariCevir(html) {
  return html
    .replace(/(["'(=,\s]|&quot;)varlik\//g, '$1../varlik/')
    .replace(/(["'(]|&quot;)varlik\\\//g, '$1..\\/varlik\\/');
}

async function kabukEkle(html, { css = [], js = [], video = false, videoTaban = video, videoJs = videoTaban, reklamTasima = false, iskeletli = false, suzgec = false } = {}) {
  html = markaYazimi(html);
  if (videoJs) html = kartBaslikKirp(html);
  html = zorunlu(html, MEGA_ESKI, megaOnizleme(), 'mega menü .mf-video');
  zorunlu(html, /<a class="mf-video-tumu" href="video-mutfagi\.html"/, '', 'mega menü hub bağı (video-mutfagi.html)');
  const cssEk = [];
  // Gastro şef kartları (izle sef-kart.mjs: /sefler `.sef-card`, ana sayfa `.chef-card`) — tanımlayan dosyalar kabuk donörünün head'inde yok;
  // her V2 video sayfasına /sefler donöründeki sırayla (sefler.css → sef-imza.css; ana sayfanın sef-avatar.css + sef-satiri.css'i imzadan önce).
  if (video) cssEk.push(...['varliklar/reference/sefler/sefler.css', 'gastro/sef-avatar.css', 'gastro/sef-satiri.css', 'gastro/sef-imza.css']
    .filter((f) => !html.includes(`varlik/gastro/${f}"`)).map((f) => `<link rel="stylesheet" href="varlik/gastro/${f}">`));
  // Banner iskeleti: Gastro "Ne Pişirsem?" sayfa CSS'i (bnp-top/bnp-head/bnp-stats/bnp-body tanımları; donörün <head>'indeki dosya)
  if (suzgec) cssEk.push(...SUZGEC_CSS.filter((f) => !html.includes(`varlik/gastro/${f}"`)).map((f) => `<link rel="stylesheet" href="varlik/gastro/${f}">`));
  if (iskeletli) cssEk.push('<link rel="stylesheet" href="varlik/gastro/varliklar/reference/bugun-ne-pisirsem/bugun-ne-pisirsem.css">', `<link rel="stylesheet" href="varlik/v2/banner.css?v=${SURUM}">`);
  cssEk.push(`<link rel="stylesheet" href="varlik/v2/kabuk.css?v=${SURUM}">`);
  const jsEk = [`<script src="varlik/v2/kabuk.js?v=${SURUM}" defer></script>`];
  if (videoTaban && (await varMi('varlik/v2/video.css'))) cssEk.push(`<link rel="stylesheet" href="varlik/v2/video.css?v=${SURUM}">`);
  if (videoJs && (await varMi('varlik/v2/video.js'))) jsEk.push(`<script src="varlik/v2/video.js?v=${SURUM}" defer></script>`);
  if (video) {
    for (const c of css) { const y = `varlik/v2/css/${c}.css`; if (!(await varMi(y))) { uyar(`css yok (atlandı): ${y}`); continue; } cssEk.push(`<link rel="stylesheet" href="${y}?v=${SURUM}">`); }
    for (const j of js) { const y = `varlik/v2/js/${j}.js`; if (!(await varMi(y))) { uyar(`js yok (atlandı): ${y}`); continue; } jsEk.push(`<script src="${y}?v=${SURUM}" defer></script>`); }
  }
  if (reklamTasima && (await varMi('varlik/v2/js/reklam.js'))) jsEk.push(`<script src="varlik/v2/js/reklam.js?v=${SURUM}" defer></script>`);
  html = zorunlu(html, '</head>', `${cssEk.join('\n')}\n</head>`, 'head');
  html = zorunlu(html, /<\/body>(?![\s\S]*<\/body>)/, `${jsEk.join('\n')}\n</body>`, 'body');
  html = zorunlu(html, /<head>/, `<head>\n${['Gilroy-Medium', 'Gilroy-ExtraBold'].map((f) => `<link rel="preload" href="varlik/gastro/varliklar/fonts/gilroy/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')}\n<link rel="preload" href="varlik/gastro/varliklar/fontawesome/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>`, 'font preload');
  return html;
}

function basliklar(html, baslik, aciklama, { dosya = '', gorsel = '', tur = 'website', site = 'Dada Gastro Video Mutfağı (prototip V2)' } = {}) {
  html = html.replace(/<meta (property|name)="(og:[^"]*|twitter:[^"]*|description|keywords)"[^>]*>\s*/g, '').replace(/<link rel="canonical"[^>]*>\s*/g, '');
  const kok = ortak0.YAYIN.replace(/v2\/$/, '');
  return zorunlu(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<link rel="canonical" href="${ortak0.YAYIN}${dosya}">
<meta property="og:site_name" content="${esc(site)}">
<meta property="og:locale" content="tr_TR">
<meta property="og:type" content="${tur}">
<meta property="og:url" content="${ortak0.YAYIN}${dosya}">
<meta property="og:title" content="${esc(baslik)}">
<meta property="og:description" content="${esc(aciklama)}">${gorsel ? `\n<meta property="og:image" content="${kok}${gorsel}">` : ''}
<meta name="twitter:card" content="summary_large_image">`, 'title');
}

/* ---------- Video sayfası: kabuk donörü (tarif detayı) + (iskelet) + <main> ---------- */
const KABUK_HAM = kabukTemizle(await oku('src/donor/kabuk.html'));
async function videoSayfasi(s, modul) {
  const { dosya, baslik, aciklama, main, css = [], js = [], govdeSinifi = '', gorsel = '' } = s;
  const isk = s.iskelet || null;
  const aktif = s.aktif ?? s.altMenu ?? MODUL_AKTIF[modul] ?? '';
  let html = KABUK_HAM;
  const a = html.indexOf('<main'); const ac = html.indexOf('>', a) + 1; const b = html.lastIndexOf('</main>');
  if (a < 0 || b < ac) throw new Error('kabuk donöründe <main> yok');
  let govde = isk ? iskelet(isk, main) : main;
  if (isk && typeof reklam.reklamAnahtari === 'function') govde = govde.replace('<div class="vd-v2-arac" data-vd-v2-arac></div>', `<div class="vd-v2-arac" data-vd-v2-arac>${reklam.reklamAnahtari({ yer: 'banner' })}</div>`);
  html = html.slice(0, ac) + `\n<div class="vd-sayfa vd-v2${isk ? ' vd-v2--iskelet' : ''}">\n${govde}\n</div>\n` + html.slice(b);
  html = zorunlu(html, /<body([^>]*) class="([^"]*)"/, (t, n, c) => `<body${n} class="pg-video pg-video-v2 ${govdeSinifi} ${c.replace('pg-tarif-detay', '')}${isk ? ' has-dark-hero' : ''}"`.replace(/\s+"/, '"').replace(/class="\s+/, 'class="').replace(/ {2,}/g, ' '), 'body class');
  if (isk) {
    // Koyu banner üstünde Gastro başlığının koyu-hero hâli (donör /bugun-ne-pisirsem: header.at-top.tepede[data-hero], body[data-fit-hero-kind=liste])
    html = zorunlu(html, '<header class="header kabuk-basi">', '<header class="header kabuk-basi at-top tepede" data-hero="1">', 'header koyu-hero hâli');
    html = html.replace(/data-fit-hero-kind="detay"/, 'data-fit-hero-kind="liste"');
  }
  html = videoMenusu(html, aktif, true);
  html = surumEkle(html, dosya.split('?')[0]);
  html = basliklar(html, baslik, aciklama, { dosya, gorsel, tur: /^video-izle-/.test(dosya) ? 'video.other' : 'website' });
  const katman = typeof reklam.reklamKatmani === 'function' ? reklam.reklamKatmani(ortak, { sayfa: modul }) : '';
  if (katman) html = zorunlu(html, /<\/body>(?![\s\S]*<\/body>)/, `${katman}\n</body>`, 'reklam katmanı (</body> öncesi)');
  return yorum(`http://127.0.0.1:8960/tarif/kuymak-karadeniz-usulu-misir-unlu-kahvaltilik (kabuk: tarif detayı)${isk ? ' + http://127.0.0.1:8960/bugun-ne-pisirsem (banner + panel, src/donor/v2/bnp.html)' : ''}`, `Video sayfası · modül ${modul}`)
    + await kabukEkle(html, { css: [...css, 'reklam'], js: [...js, 'reklam'], video: true, iskeletli: !!isk, suzgec: !!s.suzgec });
}

/* ---------- index.html ---------- */
export function anaSayfaVideolari() {
  const ilk = (slug) => (KATALOG.videolar || []).filter((v) => v.seri === slug).sort((a, b) => a.bolum - b.bolum)[0];
  const sec = [ortak0.vitrinVideosu('Haftanın Serisi'), ...(KATALOG.seriler || []).filter((x) => x.format === '16:9').map((x) => ilk(x.slug)), ortak0.vitrinVideosu('Mevsimin Tarifi')];
  const g = []; for (const v of sec) if (v && !g.some((x) => x.slug === v.slug)) g.push(VIDEO[v.slug]);
  return g.slice(0, 6);
}
async function anaSayfaVideoBolumu(html) {
  const m = /<div class="vid-grid row-track drag-scroll" id="vidTrack">/.exec(html);
  if (!m) throw new Error('Ekleme noktası bulunamadı: ana sayfa video bölümü #vidTrack');
  if (typeof ortak.videoKarti !== 'function') { uyar('src/v2/kart.mjs videoKarti yok → ana sayfa video kartları donörde kaldı'); return html; }
  const son = ogeSonu(html, m.index);
  const kartlar = anaSayfaVideolari().map((v) => ortak.videoKarti(v, ortak, { boyut: 'ray', baslikSeviye: 'h4', ilerleme: false })).join('\n');
  return html.slice(0, m.index) + m[0] + '\n' + kartlar + '\n</div>' + html.slice(son);
}
async function indexSayfasi() {
  let html = kabukTemizle(await oku('src/donor/ana.html'));
  html = await anaSayfaVideoBolumu(html);
  html = videoMenusu(html, '', false);
  html = surumEkle(html, 'index.html');
  html = basliklar(html, 'Dada Gastro ana sayfası · Video Mutfağı (prototip V2)', 'Dada Gastro ana sayfasının prototip kopyası (V2): üst menüde açılır Video Mutfağı menüsü, Tarifler mega menüsünde haftanın serisi önizlemesi ve ana sayfa video bölümü.', { dosya: 'index.html', site: 'Dada Gastro (prototip V2)' });
  return yorum('http://127.0.0.1:8960/', 'ana sayfa: Video açılır menüsü + mega önizleme + video bölümü kartları') + await kabukEkle(html, { videoTaban: true, reklamTasima: true });
}

/* ---------- tarif-<slug>.html: tarif köprüsü (V1 D.2a, aynen) ---------- */
function tarifVideolari(slug) {
  const uzun = (KATALOG.videolar || []).filter((v) => v.tarif === slug);
  const kisa = (KATALOG.kisalar || []).filter((v) => v.tarif === slug);
  return [...uzun.map((v) => VIDEO[v.slug]), ...kisa.map((v) => VIDEO[v.slug])];
}
function tarifKoprusu(slug) {
  const [v] = tarifVideolari(slug); if (!v) return '';
  const s = SERI[v.seri]; const p = ortak0.videoPosteri(v); const sure = ortak0.sureMetni(v.sure_sn);
  return `<a class="mega-find vd-tarif-kopru" href="${ortak0.videoAdresi(v)}" data-vd-tarif-kopru="${esc(v.slug)}">`
    + `<span class="vd-tarif-kopru__poster" aria-hidden="true">${p ? `<img src="${p.k640}" alt="" width="640" height="360" loading="lazy" decoding="async">` : ''}<span class="vd-tarif-kopru__oynat">${ortak0.ui('play')}</span><span class="vd-tarif-kopru__sure">${sure}</span></span>`
    + `<span class="mf-body"><b>Bu Tarifin Videosunu İzle (${sure})</b><span class="vd-tarif-kopru__ad" data-vd-kirp="2">${esc(v.baslik)}</span><small>${esc(s ? s.ad : '')}${v.tur === 'kisa' ? ' · Kısa video' : ` · Bölüm ${v.bolum}`}</small></span>`
    + `${ortak0.ui('arrow-right', 'mf-arr')}</a>`;
}
// 3 Kas karar 6: tarif sayfasının serbest video_url "Tarif videosu" bölümü çıkarılır (yerini köprü kartı alır)
let tarifMedyaCikan = 0;
function tarifMedyaCikar(html, slug) {
  for (;;) {
    const m = /<section class="gastro-tarif-medya"[^>]*>/.exec(html); if (!m) return html;
    html = html.slice(0, m.index) + html.slice(ogeSonu(html, m.index)); tarifMedyaCikan++; uyar(`"Tarif videosu" bölümü çıkarıldı: tarif-${slug}.html`);
  }
}
async function tarifSayfasi(slug) {
  let html = tarifMedyaCikar(kabukTemizle(await oku(`src/donor/tarif-${slug}.html`), { tarif: true }), slug);
  const kart = tarifKoprusu(slug);
  if (kart) {
    const m = /<div class="rd-head">\s*<div class="art-hmeta">/.exec(html);
    if (!m) throw new Error(`Ekleme noktası bulunamadı: tarif köprüsü (${slug}) .rd-head > .art-hmeta`);
    const son = ogeSonu(html, m.index + m[0].lastIndexOf('<div'));
    html = html.slice(0, son) + `\n                ${kart}` + html.slice(son);
  }
  html = videoMenusu(html, '', false);
  html = surumEkle(html, `tarif-${slug}.html`);
  const t = TARIF[slug];
  html = basliklar(html, `${t.baslik} · Dada Gastro (prototip V2)`, `${t.baslik} tarifinin prototip kopyası; "Bu Tarifin Videosunu İzle" kartıyla Video Mutfağı'na bağlanır.`, { dosya: `tarif-${slug}.html`, gorsel: t.kapak1600, site: 'Dada Gastro (prototip V2)' });
  return yorum(`http://127.0.0.1:8960/tarif/${slug}`, '"Bu Tarifin Videosunu İzle" kartı + Video açılır menüsü') + await kabukEkle(html, { videoJs: !!kart, reklamTasima: true });
}

/* ---------- Derle ---------- */
const istenen = process.argv.slice(2);
const cikti = [];
cikti.push(['index.html', await indexSayfasi()]);
for (const slug of Object.keys(TARIF).filter((s) => TARIF[s].sayfa).sort()) {
  if (!(await varMi(`src/donor/tarif-${slug}.html`))) throw new Error(`tarif donörü yok: src/donor/tarif-${slug}.html`);
  cikti.push([`tarif-${slug}.html`, await tarifSayfasi(slug)]);
}
const modulKlasoru = path.join(KOK, 'src/v2/sayfalar');
const moduller = (await readdir(modulKlasoru).catch(() => [])).filter((f) => f.endsWith('.mjs')).sort();
const kaynaklar = moduller.map((f) => [f.replace('.mjs', ''), path.join(modulKlasoru, f)]);
if (process.env.BOS_MODUL) kaynaklar.push(['sinama', null]);
const sahip = new Map();
for (const [ad, yol] of kaynaklar) {
  if (istenen.length && !istenen.includes(ad) && ad !== 'sinama') continue;
  const sayfalar = yol ? await (await import(`${yol}?v=${SURUM}`)).default(ortak) : [
    { dosya: 'video-sinama.html', baslik: 'Sözleşme sınaması V2', aciklama: 'Boş test modülü: iskeletli.', iskelet: { kirinti: [{ ad: 'Video Mutfağı', href: 'video-mutfagi.html' }, { ad: 'Sınama' }], eyebrow: { ikon: 'circle-play', metin: 'Video Mutfağı' }, baslik: 'Sözleşme sınaması', vurgu: 'sınaması', aciklama: 'Boş test modülü: banner + panel iskeleti.', sayaclar: [{ deger: (KATALOG.videolar || []).length, etiket: 'Video' }, { deger: (KATALOG.seriler || []).length, etiket: 'Seri' }] }, main: '<div data-vd-sinama><h2>Panel içeriği</h2><p>Boş test modülü.</p></div>', css: [], js: [], aktif: 'kesfet' },
    { dosya: 'video-sinama-yalin.html', baslik: 'Sözleşme sınaması V2 (iskeletsiz)', aciklama: 'Boş test modülü: iskeletsiz.', iskelet: null, main: '<section class="wrap" data-vd-sinama><h1>İskeletsiz</h1></section>', css: [], js: [], aktif: 'kisa' },
  ];
  for (const s of sayfalar) {
    if (!s.dosya || !s.main) throw new Error(`${ad}: dosya/main eksik`);
    if (sahip.has(s.dosya)) throw new Error(`${s.dosya}: iki modül aynı dosyayı üretiyor (${sahip.get(s.dosya)}, ${ad})`);
    if (/^(index|tarif-)/.test(s.dosya)) throw new Error(`${ad}: ${s.dosya} kabuk ajanının dosyası`);
    if (s.altMenu !== undefined && s.iskelet === undefined) uyar(`${ad}: sayfa hâlâ V1 'altMenu' alanını taşıyor, 'iskelet' yok (${s.dosya}) — açılır menü etkin öğesi altMenu'den alındı`);
    sahip.set(s.dosya, ad);
    cikti.push([s.dosya, await videoSayfasi(s, ad)]);
  }
}
await mkdir(CIKTI, { recursive: true });
// Banner görselleri: her tarif kapağı (1600) için `[data-vd-banner="<slug>"]` kuralı; url bu dosyaya göre (varlik/v2/ → ../video/tarif/)
{
  const satir = Object.values(TARIF).filter((t) => t.kapak1600).sort((a, b) => a.slug.localeCompare(b.slug)).map((t) => `.vd-v2-banner[data-vd-banner="${t.slug}"] { --vd-banner: url("../video/tarif/${t.slug}-1600.webp"); }`);
  await writeFile(path.join(KOK, 'varlik/v2/banner.css'), `/* araclar/build-v2.mjs üretir, elle düzenlenmez. V2 banner görseli (src/v2/iskelet.mjs data-vd-banner) → tarif kapağı 1600. */\n${satir.join('\n')}\n`);
}
let hata = 0;
for (const [ad, ham] of cikti) {
  const html = yollariCevir(ham);
  const kalan = tokenTaramasi(html, { tarif: /^tarif-/.test(ad) });
  if (kalan.length) { console.error(`✗ v2/${ad}: token taraması kırmızı → ${kalan.join(', ')}`); hata++; continue; }
  const kokGoreli = (html.replace(/<!--[\s\S]*?-->/g, '').match(/(?:href|src|poster)="varlik\//g) || []).length;
  if (kokGoreli) { console.error(`✗ v2/${ad}: çevrilmemiş kök göreli varlik/ yolu ${kokGoreli}`); hata++; continue; }
  await writeFile(path.join(CIKTI, ad.split('?')[0]), html);
  console.log('✓ v2/' + ad.padEnd(64), (html.length / 1024).toFixed(0) + ' KB');
}
for (const u of uyarilar) console.warn('·', u);
console.log(`tarif sayfalarından çıkarılan "Tarif videosu" bölümü (section.gastro-tarif-medya): ${tarifMedyaCikan}`);
if (hata) process.exit(1);
