// Derleme: src/donor/*.html (yerel Gastro'nun sunucu HTML'i, araclar/snapshot.mjs) + Video sayfa modülleri → kökte statik HTML.
// Health build.mjs'in Video uyarlaması.
//   · index.html            = ana donörü + kabuk eklemeleri (mega menü video önizlemesi, ana sayfa video bölümü)
//   · tarif-<slug>.html      = tarif donörü + "Bu Tarifin Videosunu İzle (mm:ss)" köprü kartı (D.2a)
//   · video sayfaları        = `kabuk` donörünün (tarif detayı) kabuğu; <main> içi sayfa modülünden
//     (src/video/sayfalar/<ad>.mjs → [{ dosya, baslik, aciklama, main, css, js, govdeSinifi, altMenu, gorsel }])
// Markup yeniden yazılmaz: donörün kabuğu (üst bant, header, mega menü, çekmece, footer) aynen kalır; eklemeler zorunlu
// ekleme noktalarına yapılır (nokta bulunamazsa derleme DURUR).
//
// Kullanım: node araclar/build.mjs [modül …]     (modül adı verilirse yalnız o sayfa modülleri; index + tarif hep üretilir)
//           BOS_MODUL=1 node araclar/build.mjs  → sözleşme sınaması: boş test modülüyle video-sinama.html üretir
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import * as ortak0 from '../src/video/ortak.mjs';
import { kabukTemizle, tokenTaramasi } from './temizle.mjs';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const oku = (p) => readFile(path.join(KOK, p), 'utf8');
const varMi = async (p) => { try { await access(path.join(KOK, p)); return true; } catch { return false; } };
const SURUM = process.env.SURUM || Date.now().toString(36);
const kart = (await varMi('src/video/kart.mjs')) ? await import(`../src/video/kart.mjs?v=${SURUM}`) : {};
export const ortak = { ...ortak0, ...kart };
const { esc, KATALOG, TARIF, SERI, VIDEO } = ortak0;

function zorunlu(html, eski, yeni, etiket) {
  const sayi = typeof eski === 'string' ? html.split(eski).length - 1 : (html.match(eski) || []).length;
  if (sayi < 1) throw new Error(`Ekleme noktası bulunamadı: ${etiket}`);
  return html.replace(eski, yeni);
}
const uyarilar = new Set(); const uyar = (m) => uyarilar.add(m);
const yorum = (donor, not) => `<!-- Dada Gastro Video Mutfağı prototipi · ${not} · donör: ${donor} (yerel Gastro http://127.0.0.1:8960, sunucu HTML'i; src/donor/) · araclar/build.mjs ile üretildi, elle düzenlenmez -->\n`;

/* ---------- Mega menü: haftanın serisi canlı mini önizlemesi (D.1b) ----------
   Donörün `.mega-feat` sütunundaki `a.mega-find.mf-video` satırı (full-stack P0-7) AYNI YERDE yeniden tasarlanır: Gastro'nun kendi
   `.mega-find` kutusu (portal CSS) korunur, 38px ikon kutusunun yerine 16:9 mini poster (yavaş Ken Burns; reduced-motion'da durağan).
   Altındaki `a.mf-video-tumu` (hub bağı) donörden aynen gelir. Tüm sayfalarda aynı blok. */
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

/* ---------- Kabuk eklemeleri (tüm sayfalar) ---------- */
function markaYazimi(html) {
  return html.replace(/DadaGastro(?![a-z.\/])/g, 'Dada Gastro').replace(/>Dada<\/(b|strong)>Gastro/g, '>Dada</$1> Gastro');
}
// REVİZE 1 kırpıcı (hub isteği, 5 Kas): Gastro donör kartlarının (.r-card .r-body > h4) başlığına `data-vd-kirp="2"` niteliği eklenir;
// video.js kelime sınırında 2 satır + "…" kırpar (Gastro'nun line-clamp'i kelime ortasında kesiyordu). Metin ve sınıflar değişmez.
function kartBaslikKirp(html) {
  let n = 0;
  html = html.replace(/(<div class="r-body">\s*<h4)(?![^>]*data-vd-kirp)/g, (t, a) => { n++; return `${a} data-vd-kirp="2"`; });
  return html;
}
async function kabukEkle(html, { css = [], js = [], video = false, videoTaban = video, videoJs = videoTaban } = {}) {
  html = markaYazimi(html);
  if (videoJs) html = kartBaslikKirp(html);
  html = zorunlu(html, MEGA_ESKI, megaOnizleme(), 'mega menü .mf-video');
  zorunlu(html, /<a class="mf-video-tumu" href="video-mutfagi\.html"/, '', 'mega menü hub bağı (video-mutfagi.html)');
  const cssEk = [`<link rel="stylesheet" href="varlik/video/kabuk.css?v=${SURUM}">`];
  const jsEk = [`<script src="varlik/video/kabuk.js?v=${SURUM}" defer></script>`];
  if (videoTaban) { // video.css/js (hub ajanı: kart + ortak davranış) — video sayfaları ve video kartı taşıyan index
    if (await varMi('varlik/video/video.css')) cssEk.push(`<link rel="stylesheet" href="varlik/video/video.css?v=${SURUM}">`);
  }
  // video.js: video sayfaları, video kartı taşıyan index ve köprü kartı taşıyan tarif sayfaları ([data-vd-kirp] başlık kırpıcısı)
  if (videoJs && (await varMi('varlik/video/video.js'))) jsEk.push(`<script src="varlik/video/video.js?v=${SURUM}" defer></script>`);
  if (video) {
    for (const c of css) { const y = `varlik/video/css/${c}.css`; if (!(await varMi(y))) { uyar(`css yok (atlandı): ${y}`); continue; } cssEk.push(`<link rel="stylesheet" href="${y}?v=${SURUM}">`); }
    for (const j of js) { const y = `varlik/video/js/${j}.js`; if (!(await varMi(y))) { uyar(`js yok (atlandı): ${y}`); continue; } jsEk.push(`<script src="${y}?v=${SURUM}" defer></script>`); }
  }
  html = zorunlu(html, '</head>', `${cssEk.join('\n')}\n</head>`, 'head');
  html = zorunlu(html, /<\/body>(?![\s\S]*<\/body>)/, `${jsEk.join('\n')}\n</body>`, 'body');
  // Titreme önleme (Health): Gilroy + FA dosyaları <head> başında preload (Gastro tokens CSS'teki aynı dosyalar)
  html = zorunlu(html, /<head>/, `<head>\n${['Gilroy-Medium', 'Gilroy-ExtraBold'].map((f) => `<link rel="preload" href="varlik/gastro/varliklar/fonts/gilroy/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')}\n<link rel="preload" href="varlik/gastro/varliklar/fontawesome/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>`, 'font preload');
  return html;
}

function basliklar(html, baslik, aciklama, { dosya = '', gorsel = '', tur = 'website', site = 'Dada Gastro Video Mutfağı (prototip)' } = {}) {
  html = html.replace(/<meta (property|name)="(og:[^"]*|twitter:[^"]*|description|keywords)"[^>]*>\s*/g, '');
  return zorunlu(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<meta property="og:site_name" content="${esc(site)}">
<meta property="og:locale" content="tr_TR">
<meta property="og:type" content="${tur}">
<meta property="og:url" content="${ortak0.YAYIN}${dosya}">
<meta property="og:title" content="${esc(baslik)}">
<meta property="og:description" content="${esc(aciklama)}">${gorsel ? `\n<meta property="og:image" content="${ortak0.YAYIN}${gorsel}">` : ''}
<meta name="twitter:card" content="summary_large_image">`, 'title');
}

/* ---------- Video alt menüsü (Health altMenu kalıbı; vd- öneki) ---------- */
export const ALT_MENU = [['kesfet', 'Keşfet', 'video-mutfagi.html'], ['seriler', 'Seriler', 'video-seriler.html'], ['kisa', '30 Saniyede Tat', 'video-kisa.html'], ['sefler', 'Şefler', 'video-mutfagi.html#sefler']];
export function altMenu(aktif) {
  const bag = ALT_MENU.map(([k, ad, href]) => `<a href="${href}" data-vd-ust="${k}"${k === aktif ? ' aria-current="page"' : ''}>${esc(ad)}</a>`).join('');
  return `<nav class="vd-ust" aria-label="Video Mutfağı menüsü"><div class="wrap">`
    + `<a class="vd-ust__marka" href="video-mutfagi.html" tabindex="-1" aria-hidden="true">Video Mutfağı</a>`
    + `<div class="vd-ust__menu">${bag}</div>`
    + `</div></nav>`;
}

/* ---------- Video sayfası: kabuk donörü (tarif detayı) + <main> ---------- */
const KABUK_HAM = kabukTemizle(await oku('src/donor/kabuk.html'));
async function videoSayfasi({ dosya, baslik, aciklama, main, css = [], js = [], govdeSinifi = '', altMenu: aktif = '', gorsel = '' }, modul) {
  let html = KABUK_HAM;
  const a = html.indexOf('<main'); const ac = html.indexOf('>', a) + 1; const b = html.lastIndexOf('</main>');
  if (a < 0 || b < ac) throw new Error('kabuk donöründe <main> yok');
  html = html.slice(0, ac) + `\n<div class="vd-sayfa">\n${altMenu(aktif)}\n${main}\n</div>\n` + html.slice(b);
  html = zorunlu(html, /<body([^>]*) class="([^"]*)"/, (t, n, s) => `<body${n} class="pg-video ${govdeSinifi} ${s.replace('pg-tarif-detay', '')}"`.replace(/\s+"/, '"').replace(/class="\s+/, 'class="').replace(/ {2,}/g, ' '), 'body class');
  // REVİZE 1 (5 Kas): logo ve bağı donördeki gibi (index.html); alt marka rozeti yok
  html = basliklar(html, baslik, aciklama, { dosya, gorsel, tur: /^video-izle-/.test(dosya) ? 'video.other' : 'website' });
  return yorum('http://127.0.0.1:8960/tarif/kuymak-karadeniz-usulu-misir-unlu-kahvaltilik (kabuk: tarif detayı)', `Video sayfası · modül ${modul}`) + await kabukEkle(html, { css, js, video: true });
}

/* ---------- index.html ---------- */
async function indexSayfasi() {
  let html = kabukTemizle(await oku('src/donor/ana.html'));
  html = await anaSayfaVideoBolumu(html);
  html = basliklar(html, 'Dada Gastro ana sayfası · Video Mutfağı (prototip)', 'Dada Gastro ana sayfasının prototip kopyası: üst menüde Video Mutfağı, Tarifler mega menüsünde haftanın serisi önizlemesi ve ana sayfa video bölümü.', { dosya: 'index.html', site: 'Dada Gastro (prototip)' });
  return yorum('http://127.0.0.1:8960/', 'ana sayfa: mega menü video önizlemesi + video bölümü kartları') + await kabukEkle(html, { videoTaban: true });
}
// Ana sayfa "İzle & Pişir · En lezzetli videolar" bölümü (donör: section.sec.vids-sec): başlık, açıklama, "Tamamını Gör" bağı
// (→ video-mutfagi.html) ve Gastro'nun .row-nav ok düğmeleri (data-track="vidTrack", portal JS) AYNEN kalır; yalnız #vidTrack izindeki
// donör kartları (prototip artığı: boş kapak, "0" görüntülenme, hepsi hub'a giden onclick) prototip videolarıyla değişir —
// hub ajanının videoKarti()sı (Gastro .r-card), ray boyu; örnek izleme ilerlemesi ana sayfada basılmaz (etiketsiz örnek olmasın). Seçim: haftanın serisi + her uzun serinin ilk bölümü + mevsimin tarifi (6 kart).
export function anaSayfaVideolari() {
  const ilk = (slug) => (KATALOG.videolar || []).filter((v) => v.seri === slug).sort((a, b) => a.bolum - b.bolum)[0];
  const sec = [ortak0.vitrinVideosu('Haftanın Serisi'), ...(KATALOG.seriler || []).filter((x) => x.format === '16:9').map((x) => ilk(x.slug)), ortak0.vitrinVideosu('Mevsimin Tarifi')];
  const g = []; for (const v of sec) if (v && !g.some((x) => x.slug === v.slug)) g.push(VIDEO[v.slug]);
  return g.slice(0, 6);
}
async function anaSayfaVideoBolumu(html) {
  const m = /<div class="vid-grid row-track drag-scroll" id="vidTrack">/.exec(html);
  if (!m) throw new Error('Ekleme noktası bulunamadı: ana sayfa video bölümü #vidTrack');
  if (typeof ortak.videoKarti !== 'function') { uyar('kart.mjs videoKarti yok → ana sayfa video kartları donörde kaldı'); return html; }
  const son = ogeSonu(html, m.index);
  const kartlar = anaSayfaVideolari().map((v) => ortak.videoKarti(v, ortak, { boyut: 'ray', baslikSeviye: 'h4', ilerleme: false })).join('\n');
  return html.slice(0, m.index) + m[0] + '\n' + kartlar + '\n</div>' + html.slice(son);
}

/** `bas` konumunda açılan öğenin kapanış etiketinin bittiği konum (aynı adlı iç içe etiketler sayılır). */
function ogeSonu(html, bas) {
  const ad = /^<([a-z0-9]+)/i.exec(html.slice(bas))[1];
  const re = new RegExp(`<${ad}\\b|</${ad}\\s*>`, 'gi'); re.lastIndex = bas;
  let d = 0, x;
  while ((x = re.exec(html))) { d += x[0][1] === '/' ? -1 : 1; if (d === 0) return x.index + x[0].length; }
  throw new Error('kapanış bulunamadı: ' + ad);
}

/* ---------- tarif-<slug>.html: tarif köprüsü (D.2a) ---------- */
function tarifVideolari(slug) {
  const uzun = (KATALOG.videolar || []).filter((v) => v.tarif === slug);
  const kisa = (KATALOG.kisalar || []).filter((v) => v.tarif === slug);
  return [...uzun.map((v) => VIDEO[v.slug]), ...kisa.map((v) => VIDEO[v.slug])];
}
function tarifKoprusu(slug) {
  const [v] = tarifVideolari(slug); if (!v) return '';
  const s = SERI[v.seri]; const p = ortak0.videoPosteri(v); const sure = ortak0.sureMetni(v.sure_sn);
  // Gastro'nun kendi `.mega-find` satır kartı (portal CSS; tarif sayfasında yüklü) — full-stack P0-5 kartının yeri (.rd-head, yazar satırının altı)
  return `<a class="mega-find vd-tarif-kopru" href="${ortak0.videoAdresi(v)}" data-vd-tarif-kopru="${esc(v.slug)}">`
    + `<span class="vd-tarif-kopru__poster" aria-hidden="true">${p ? `<img src="${p.k640}" alt="" width="640" height="360" loading="lazy" decoding="async">` : ''}<span class="vd-tarif-kopru__oynat">${ortak0.ui('play')}</span><span class="vd-tarif-kopru__sure">${sure}</span></span>`
    + `<span class="mf-body"><b>Bu Tarifin Videosunu İzle (${sure})</b><span class="vd-tarif-kopru__ad" data-vd-kirp="2">${esc(v.baslik)}</span><small>${esc(s ? s.ad : '')}${v.tur === 'kisa' ? ' · Kısa video' : ` · Bölüm ${v.bolum}`}</small></span>`
    + `${ortak0.ui('arrow-right', 'mf-arr')}</a>`;
}
// 3 Kas karar 6 (lead onayı 4 Kas): tarif sayfası videoyu yalnız video_id bağından okur; serbest video_url gösterilmez, yerini D.2a köprü
// kartı alır. Donörde (dev DB'deki test video_url'si yüzünden) basılan "Tarif videosu" bölümü (section.gastro-tarif-medya, YouTube iframe)
// hangi tarif sayfasında varsa çıkarılır; sayısı derleme çıktısına yazılır.
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
    // .rd-head içindeki .art-hmeta bloğunun KAPANIŞINDAN sonra (iç içe <div>'ler sayılarak; full-stack video-karti.blade.php'nin yeri)
    const m = /<div class="rd-head">\s*<div class="art-hmeta">/.exec(html);
    if (!m) throw new Error(`Ekleme noktası bulunamadı: tarif köprüsü (${slug}) .rd-head > .art-hmeta`);
    const son = ogeSonu(html, m.index + m[0].lastIndexOf('<div'));
    html = html.slice(0, son) + `\n                ${kart}` + html.slice(son);
  }
  const t = TARIF[slug];
  html = basliklar(html, `${t.baslik} · Dada Gastro (prototip)`, `${t.baslik} tarifinin prototip kopyası; "Bu Tarifin Videosunu İzle" kartıyla Video Mutfağı'na bağlanır.`, { dosya: `tarif-${slug}.html`, gorsel: t.kapak1600, site: 'Dada Gastro (prototip)' });
  return yorum(`http://127.0.0.1:8960/tarif/${slug}`, 'yalnız "Bu Tarifin Videosunu İzle" kartı eklendi (D.2a)') + await kabukEkle(html, { videoJs: !!kart });
}

/* ---------- Derle ---------- */
const istenen = process.argv.slice(2);
const cikti = [];
cikti.push(['index.html', await indexSayfasi()]);
for (const slug of Object.keys(TARIF).filter((s) => TARIF[s].sayfa).sort()) {
  if (!(await varMi(`src/donor/tarif-${slug}.html`))) throw new Error(`tarif donörü yok: src/donor/tarif-${slug}.html (node araclar/snapshot.mjs)`);
  cikti.push([`tarif-${slug}.html`, await tarifSayfasi(slug)]);
}
const modulKlasoru = path.join(KOK, 'src/video/sayfalar');
const moduller = (await readdir(modulKlasoru).catch(() => [])).filter((f) => f.endsWith('.mjs')).sort();
const kaynaklar = moduller.map((f) => [f.replace('.mjs', ''), path.join(modulKlasoru, f)]);
if (process.env.BOS_MODUL) kaynaklar.push(['sinama', null]);
const sahip = new Map();
for (const [ad, yol] of kaynaklar) {
  if (istenen.length && !istenen.includes(ad) && ad !== 'sinama') continue;
  const sayfalar = yol ? await (await import(`${yol}?v=${SURUM}`)).default(ortak)
    : [{ dosya: 'video-sinama.html', baslik: 'Sözleşme sınaması · Video Mutfağı (prototip)', aciklama: 'Boş test modülü: kabuk + alt menü + build sözleşmesi.', main: '<section class="wrap" data-vd-sinama><h1>Sözleşme sınaması</h1><p>Boş test modülü.</p></section>', css: [], js: [], altMenu: 'kesfet' }];
  for (const s of sayfalar) {
    if (!s.dosya || !s.main) throw new Error(`${ad}: dosya/main eksik`);
    if (sahip.has(s.dosya)) throw new Error(`${s.dosya}: iki modül aynı dosyayı üretiyor (${sahip.get(s.dosya)}, ${ad})`);
    if (/^(index|tarif-)/.test(s.dosya)) throw new Error(`${ad}: ${s.dosya} kabuk ajanının dosyası`);
    sahip.set(s.dosya, ad);
    cikti.push([s.dosya, await videoSayfasi(s, ad)]);
  }
}
let hata = 0;
for (const [ad, html] of cikti) {
  const kalan = tokenTaramasi(html, { tarif: /^tarif-/.test(ad) });
  if (kalan.length) { console.error(`✗ ${ad}: token taraması kırmızı → ${kalan.join(', ')}`); hata++; continue; }
  await writeFile(path.join(KOK, ad), html);
  console.log('✓', ad.padEnd(64), (html.length / 1024).toFixed(0) + ' KB');
}
for (const u of uyarilar) console.warn('·', u);
console.log(`tarif sayfalarından çıkarılan "Tarif videosu" bölümü (section.gastro-tarif-medya): ${tarifMedyaCikan}`);
if (hata) process.exit(1);
