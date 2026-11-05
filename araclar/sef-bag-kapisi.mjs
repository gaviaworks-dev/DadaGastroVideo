// Şef bağ kapısı (Patron revizesi K5, V2): "şefle ilgili hiçbir bağ ana sayfaya atmaz".
// 1) STATİK — bütün v2/*.html'de şefle ilgili her bağ:
//      · .sef-card / .chef-card içindeki (ya da kendisi bağ olan) her <a>
//      · metninde bir şefin adı geçen <a> (veri/sefler.json'daki bütün şefler: video şefleri + katalog tariflerinin şefleri)
//      · metni "Şefler" olan <a> (açılır menü, çekmece, "Tümünü gör" vb.)
//      · şef sayfalarının kırıntısı: video-sef-*.html'de "Şefler" halkası video-sefler.html'e gitmeli (Video Mutfağı › Şefler › Ad)
//    Hedef (sorgu atılır) izinli kümede olmalı: video-sef-<k>.html · video-sefler.html · https://dadagastro.com/sefler/<k>.
//    index.html ve video-mutfagi.html (#… dahil) açıkça yasak; başka her hedef de kırmızı.
//    MUAF — DAR (lead onayı 6 Kas, "bilinen kırmızı, kütüğe yaz" kalıbı): YALNIZ reklam yuvasının (`[data-vd-reklam]`, <template> dahil)
//    İÇİNDE olan VE `rel` değeri `sponsored` içeren <a>. Sponsorlu şef kartı marka sitesine gider (Gastro modülü partials/kart/sef:
//    $sponsor->tiklamaAdresi()). Muaf bağlar tek tek basılır, kırmızı sayılmaz. Reklam dışındaki bir şef bağı aynı hedefe giderse KIRMIZI.
// 2) GERÇEK TIKLAMA örneklemi (force yok, scrollIntoView + elementFromPoint isabeti; varılan adres ölçülür):
//      1440 açılır menü "Şefler" · 390 çekmece Video › Şefler · video-sefler.html'de ilk .sef-card · şef sayfasında kırıntı "Şefler" ·
//      v2/index.html'de ilk .chef-card (dadagastro.com'a giden istek yakalanır, dışarı çıkılmaz).
// Kullanım: node araclar/sef-bag-kapisi.mjs     TABAN (vars. http://localhost:8795/DadaGastroVideo/v2/)
//           BOZ=1 → statik: kusurlu sınama sayfası (kart → index.html, "Şefler" → video-mutfagi.html#sefler, şef adı → index.html);
//                   tıklama: menüdeki Şefler bağı sayfa açılmadan video-mutfagi.html#sefler'e çevrilir. İkisi de kırmızı vermeli.
import { chromium } from 'playwright';
import { readFile, readdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIZIN = path.join(KOK, 'v2');
const TABAN = process.env.TABAN || 'http://localhost:8795/DadaGastroVideo/v2/';
const BOZ = !!process.env.BOZ;
const BOZUK = '_kapi-bozuk-sef.html';
const IZINLI = [/^video-sef-[a-z0-9-]+\.html$/, /^video-sefler\.html$/, /^https:\/\/dadagastro\.com\/sefler(\/[^/?#]+)?$/];   // Gastro'nun kendi şef dizini/profili
const YASAK = [/^index\.html$/, /^video-mutfagi\.html$/, /^$/];
const SEF = JSON.parse(await readFile(path.join(KOK, 'veri/sefler.json'), 'utf8')).sefler;
const ADLAR = [...new Set(Object.values(SEF).map((s) => s.ad).filter((a) => a && a.length > 4))];
const metin = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
const hedefi = (href) => href.replace(/&amp;/g, '&').split('#')[0].split('?')[0];

/* ---------- 1) statik ---------- */
if (BOZ) await writeFile(path.join(DIZIN, BOZUK), `<!doctype html><html><body>
<article class="sef-card" onclick="location.href='index.html'"><b>Kart</b></article>
<a href="video-mutfagi.html#sefler">Şefler</a>
<a href="index.html">${ADLAR[0]}</a>
<article class="sef-card" data-native-sponsor><a class="sef-follow" href="https://www.tat.com.tr/" rel="sponsored nofollow">İncele</a></article>
<div data-vd-reklam="SF-N2"><template><article class="sef-card" data-native-sponsor><a class="sef-follow" href="https://www.tat.com.tr/" rel="sponsored nofollow">İncele</a></article></template></div></body></html>`);
const sorun = []; let sayi = 0; const muaflar = []; const tur = {};
for (const f of (await readdir(DIZIN)).filter((x) => x.endsWith('.html') && (BOZ ? x === BOZUK : !x.startsWith('_'))).sort()) {
  const h = (await readFile(path.join(DIZIN, f), 'utf8')).replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const bagSet = new Map(); // konum → [href, neden]
  // reklam yuvaları (dengeli kapanışa kadar): muafiyetin birinci koşulu
  const reklamAraligi = [];
  for (const m of h.matchAll(/<([a-z]+)\b[^>]*\sdata-vd-reklam="[^"]*"[^>]*>/g)) {
    let d = 0; const re = new RegExp(`<${m[1]}\\b|</${m[1]}\\s*>`, 'g'); re.lastIndex = m.index;
    for (let x; (x = re.exec(h));) { d += x[0][1] === '/' ? -1 : 1; if (!d) { reklamAraligi.push([m.index, x.index]); break; } }
  }
  const sponsorlu = new Set();   // rel~="sponsored" taşıyan <a> konumları (ikinci koşul)
  // a) kart içi bağlar: .sef-card / .chef-card öğesinin kapanışına kadar
  for (const m of h.matchAll(/<([a-z]+)\b[^>]*class="[^"]*\b(sef-card|chef-card)\b[^"]*"[^>]*>/g)) {
    const ad = m[1]; let d = 0, son = m.index; const re = new RegExp(`<${ad}\\b|</${ad}\\s*>`, 'g'); re.lastIndex = m.index;
    for (let x; (x = re.exec(h));) { d += x[0][1] === '/' ? -1 : 1; if (!d) { son = x.index; break; } }
    const parca = h.slice(m.index, son);
    if (ad === 'a') { const hr = (m[0].match(/\shref="([^"]*)"/) || [])[1]; if (hr !== undefined) bagSet.set(m.index, [hr, m[2]]); }
    // Gastro kanonu kartı bağ değil tıklanır kap olarak basar: onclick="location.href='…'" (ana sayfa .chef-card, /sefler .sef-card)
    for (const o of parca.matchAll(/onclick="location\.href='([^']*)'"/g)) bagSet.set(m.index + o.index, [o[1], m[2] + ' (onclick)']);
    for (const a of parca.matchAll(/<a\b[^>]*\shref="([^"]*)"[^>]*>/g)) { bagSet.set(m.index + a.index, [a[1], m[2]]); if (/\srel="[^"]*\bsponsored\b/.test(a[0])) sponsorlu.add(m.index + a.index); }
  }
  // b) metni şef adı ya da "Şefler" olan bağlar
  for (const a of h.matchAll(/<a\b([^>]*)\shref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g)) {
    const t = metin(a[4]);
    if (/\srel="[^"]*\bsponsored\b/.test(a[1] + a[3])) sponsorlu.add(a.index);
    if (/^şefler\b/i.test(t) || /(^|\s)şefler$/i.test(t)) bagSet.set(a.index, [a[2], '"Şefler" metni']);
    else if (ADLAR.some((n) => t.includes(n))) bagSet.set(a.index, [a[2], 'şef adı']);
  }
  for (const [konum, [href, neden]] of bagSet) {
    if (sponsorlu.has(konum) && reklamAraligi.some(([a, z]) => konum >= a && konum < z)) { muaflar.push(`${f}: ${neden} → ${href}`); continue; }
    sayi++; tur[neden] = (tur[neden] || 0) + 1;
    const hd = hedefi(href);
    if (YASAK.some((re) => re.test(hd))) { sorun.push(`${f}: ${neden} → ${href} (YASAK: ana sayfa / hub)`); continue; }
    if (!IZINLI.some((re) => re.test(hd))) sorun.push(`${f}: ${neden} → ${href} (izinli hedef değil)`);
  }
  // c) şef sayfası kırıntısı
  if (/^video-sef-/.test(f)) {
    const nav = (h.match(/<nav class="rd-crumb"[\s\S]*?<\/nav>/) || [''])[0];
    if (!/href="video-sefler\.html(\?[^"]*)?">\s*Şefler\s*</.test(nav)) sorun.push(`${f}: kırıntıda "Şefler" → video-sefler.html halkası yok`);
  }
}
if (BOZ) await rm(path.join(DIZIN, BOZUK), { force: true });
console.log(`STATİK: ${sayi} şef bağı (${Object.entries(tur).map(([k, v]) => `${k} ${v}`).join(' · ')}) · sorun ${sorun.length}`);
console.log(`MUAF (reklam yuvası içi + rel=sponsored; kırmızı sayılmaz): ${muaflar.length}`); for (const x of muaflar) console.log('  ◦ ' + x);
for (const x of sorun.slice(0, 15)) console.log('  ✗ ' + x); if (sorun.length > 15) console.log(`  … +${sorun.length - 15}`);

/* ---------- 2) gerçek tıklama ---------- */
const b = await chromium.launch();
const tik = [];
async function tikla(p, loc, ad, bekle) {
  const a = loc.first();
  if (!(await a.count())) { tik.push([ad, 'ölçülmedi (öğe yok)', false]); return; }
  await a.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(250);
  const isabet = await a.evaluate((n) => { const r = n.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!e && (e === n || n.contains(e)); });
  if (!isabet) { tik.push([ad, 'isabet yok', false]); return; }
  let dis = null; await p.route(/^https:\/\/dadagastro\.com\//, (r) => { dis = r.request().url(); r.abort(); });
  await a.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(800);
  const vardi = dis || p.url().replace(TABAN, '');
  const hd = hedefi(vardi);
  const ok = IZINLI.some((re) => re.test(hd)) && (!bekle || bekle.test(hd));
  tik.push([ad, vardi, ok]);
}
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  if (BOZ) await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => document.querySelectorAll('a[href^="video-sefler.html"]').forEach((a) => a.setAttribute('href', 'video-mutfagi.html#sefler'))));
  const p = await ctx.newPage();
  await p.goto(TABAN + 'video-mutfagi.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  if (w >= 1025) { await p.hover('.nav-item:has(> a[href^="video-mutfagi.html"])'); await p.waitForTimeout(400); await tikla(p, p.locator('.nav-item .dropdown a:has-text("Şefler")').filter({ visible: true }), `${w} açılır menü Şefler`, /^video-sefler\.html$/); }
  else { await p.click('#hamburger'); await p.waitForTimeout(500); await p.locator('.d-item.d-has-sub:has(a.d-link[href^="video-mutfagi.html"]) .d-toggle').click(); await p.waitForTimeout(400); await tikla(p, p.locator('.d-sub a:has-text("Şefler")').filter({ visible: true }), `${w} çekmece Video › Şefler`, /^video-sefler\.html$/); }
  if (!BOZ) {
    await p.goto(TABAN + 'video-sefler.html', { waitUntil: 'load' }).catch(() => {}); await p.waitForTimeout(500);
    await tikla(p, p.locator('.sef-card').filter({ visible: true }), `${w} video-sefler.html ilk şef kartı`, /^video-sef-/);
    await p.goto(TABAN + 'video-sef-berkan-gunes.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
    await tikla(p, p.locator('nav.rd-crumb a:has-text("Şefler")'), `${w} şef sayfası kırıntı Şefler`, /^video-sefler\.html$/);
    await p.goto(TABAN + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
    await tikla(p, p.locator('.chef-card').filter({ visible: true }), `${w} ana sayfa şef kartı (Gastro)`, null);
  }
  await ctx.close();
}
await b.close();
let tKirmizi = 0;
for (const [ad, vardi, ok] of tik) { if (!ok) tKirmizi++; console.log(`  ${ok ? '✓' : '✗'} TIKLAMA ${ad} → ${vardi}`); }
const kirmizi = sorun.length + tKirmizi;
if (BOZ) {
  const disKirmizi = sorun.some((x) => x.includes('tat.com.tr'));
  console.log(`\nBOZ: reklam kabı DIŞINDAKİ sponsorlu şef bağı (tat.com.tr) ${disKirmizi ? 'KIRMIZI ✓' : 'kırmızı DEĞİL ✗'} · kap içindeki muaf ${muaflar.length}`);
  const ok = sorun.length >= 4 && tKirmizi && disKirmizi && muaflar.length === 1;
  console.log(ok ? `BOZ sınaması: statik ${sorun.length} + tıklama ${tKirmizi} kırmızı → kapı kırmızı verebiliyor ✓` : 'BOZ sınaması: KAPI KÖR ✗'); process.exit(ok ? 1 : 3);
}
console.log(kirmizi ? `\nŞEF BAĞ KAPISI KIRMIZI (statik ${sorun.length} · tıklama ${tKirmizi})` : `\nŞEF BAĞ KAPISI YEŞİL: ${sayi} statik bağ + ${tik.length} gerçek tıklama, hiçbiri ana sayfaya / hub'a gitmiyor`);
process.exit(kirmizi ? 1 : 0);
