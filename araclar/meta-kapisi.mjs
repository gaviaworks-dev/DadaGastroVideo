// Kart meta kapısı (V2 · Beyar madde 4) · hub ajanı.
// Ölçülen (1440 ve 390 · reklamsız ve ?reklam=1):
//  M1 her görünür video kartının meta satırı (.vd-kart .r-facts) TEK satır: bütün öğeler aynı satır kutusunda (üst kenarları ±2 px),
//     satır yüksekliği en yüksek öğenin 1,5 katını geçmez; taşan satır yatay kaydırılabilir (scrollWidth > clientWidth ise overflow-x auto/scroll).
//  M2 aynı ızgara/ray satırındaki kartlar EŞİT yükseklikte (kap: .grid-4 · .row-track · .feat-side · .vd-izgara; satır = aynı üst kenar ±2 px).
// Kullanım: node araclar/meta-kapisi.mjs   (TABAN=http://localhost:8796/DadaGastroVideo/v2/ · GENISLIK=1440,390 · SAYFA=video-mutfagi,…)
//           BOZ=1 → meta satırı sarmaya zorlanır (flex-wrap: wrap) ve kaplar kartları germez (align-items: start) — kırmızı vermeli
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TABAN = process.env.TABAN || 'http://localhost:8796/DadaGastroVideo/v2/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SUZ = (process.env.SAYFA || 'video-mutfagi,video-seri').split(',').filter(Boolean);
const BOZ = !!process.env.BOZ;
const SAYFALAR = readdirSync(path.join(KOK, 'v2')).filter((f) => /^video-.*\.html$/.test(f)).sort().filter((f) => SUZ.some((x) => f.includes(x)));

function olc() {
  const gor = (e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getClientRects().length > 0;
  const ad = (k) => (k.querySelector(':is(h3,h4)')?.textContent || '').trim().slice(0, 40);
  const sorun = [];
  const kartlar = [...document.querySelectorAll('.vd-kart')].filter(gor);
  let meta = 0;
  for (const k of kartlar) {
    const f = k.querySelector('.r-body > .r-facts');
    if (!f || !gor(f)) continue;
    meta++;
    const cocuk = [...f.children].filter((c) => c.getClientRects().length);
    if (!cocuk.length) continue;
    const ust = cocuk.map((c) => c.getBoundingClientRect().top);
    const yuk = Math.max(...cocuk.map((c) => c.getBoundingClientRect().height));
    const fr = f.getBoundingClientRect();
    if (Math.max(...ust) - Math.min(...ust) > 2 || fr.height > yuk * 1.5 + 1) sorun.push(`M1 meta iki satır (${Math.round(fr.height)} px, öğe ${Math.round(yuk)} px): «${ad(k)}»`);
    const ox = getComputedStyle(f).overflowX;
    if (f.scrollWidth > f.clientWidth + 1 && !/auto|scroll/.test(ox)) sorun.push(`M1 meta taşıyor ama kaydırılamıyor (overflow-x ${ox}): «${ad(k)}»`);
  }
  // M2 eşit yükseklik: aynı kap + aynı satır
  const gruplar = new Map();
  for (const k of [...document.querySelectorAll('.vd-kart, .vd-reklam .r-card')].filter(gor)) {
    const kap = k.parentElement.closest('.grid-4, .row-track, .feat-side, .vd-izgara') || k.parentElement;
    const r = k.getBoundingClientRect();
    const anahtar = kap;
    if (!gruplar.has(anahtar)) gruplar.set(anahtar, []);
    gruplar.get(anahtar).push({ k, ust: r.top + scrollY, h: r.height });
  }
  let grupSay = 0;
  for (const [kap, liste] of gruplar) {
    const satirlar = [];
    for (const x of liste) { const s = satirlar.find((y) => Math.abs(y.ust - x.ust) <= 2); if (s) s.l.push(x); else satirlar.push({ ust: x.ust, l: [x] }); }
    for (const s of satirlar) {
      if (s.l.length < 2) continue;
      grupSay++;
      const h = s.l.map((x) => x.h); const fark = Math.max(...h) - Math.min(...h);
      if (fark > 1) sorun.push(`M2 eşit değil (${Math.round(Math.min(...h))}–${Math.round(Math.max(...h))} px) .${String(kap.className).split(' ').slice(0, 2).join('.')}: «${ad(s.l[h.indexOf(Math.max(...h))].k)}»`);
    }
  }
  return { sorun, kart: kartlar.length, meta, grupSay };
}

const t = await chromium.launch();
let kirmizi = 0, kartTop = 0, metaTop = 0, satirTop = 0;
for (const w of GENISLIK) {
  for (const reklam of [false, true]) {
    const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
    if (BOZ) await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.vd-kart .r-body > .r-facts{flex-wrap:wrap!important;overflow:visible!important} .grid-4,.row-track,.feat-side{align-items:start!important}'; document.head.appendChild(s); }));
    const p = await ctx.newPage();
    for (const s of SAYFALAR) {
      try {
        await p.goto(TABAN + s + (reklam ? '?reklam=1' : ''), { waitUntil: 'load', timeout: 30000 });
        await p.evaluate(() => document.fonts && document.fonts.ready);
        // arşivin hepsi yüklensin (kaydırdıkça yükleme)
        for (let i = 0; i < 8; i++) { await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150); }
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
        const r = await p.evaluate(olc);
        kartTop += r.kart; metaTop += r.meta; satirTop += r.grupSay;
        const et = `[${w}${reklam ? ' reklamlı' : ''}] ${s}`;
        if (r.sorun.length) { kirmizi += r.sorun.length; const tur = {}; r.sorun.forEach((x) => { tur[x.slice(0, 2)] = (tur[x.slice(0, 2)] || 0) + 1; }); console.log(`✗ ${et} — ${r.sorun.length} sorun (${Object.entries(tur).map(([k, v]) => k + '×' + v).join(' ')}; kart ${r.kart})`); r.sorun.slice(0, 5).forEach((x) => console.log('    ' + x)); if (r.sorun.length > 5) console.log(`    … +${r.sorun.length - 5}`); }
        else if (process.env.AYRINTI) console.log(`✓ ${et} — kart ${r.kart} · meta ${r.meta} · karşılaştırılan satır ${r.grupSay}`);
      } catch (e) { kirmizi++; console.log(`✗ [${w}] ${s} — açılamadı: ${e.message.split('\n')[0]}`); }
    }
    await ctx.close();
  }
}
await t.close();
console.log(`\n${SAYFALAR.length} sayfa × ${GENISLIK.length} genişlik × 2 (reklamsız/reklamlı) · kart ${kartTop} · meta satırı ${metaTop} · karşılaştırılan satır ${satirTop} · ${kirmizi} kırmızı${BOZ ? ' (BOZ=1: kırmızı BEKLENİR)' : ''}`);
process.exit(kirmizi ? 1 : 0);
