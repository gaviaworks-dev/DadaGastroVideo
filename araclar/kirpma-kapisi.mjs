// Kırpma kapısı (Revize 1, 5 Kas) · hub ajanı.
// Kökteki bütün sayfalar (72), 1440 ve 390. Ölçülenler:
//  K1 her [data-vd-kirp="N"]: görünen metin ≤ N satır (metin düğümlerinin satır kutuları sayılır — line-clamp'in gizlediği satırlar
//     da sayılır, yani CSS kesmesi yakalanır) · kutudan yatay/dikey taşmıyor.
//  K2 görünen metin ya tam metin ya da tam metnin KELİME SINIRINDAKİ öneki + "…" (tam metin: title / bağın aria-label'ı / .vd-gizli).
//  K3 kartların içinde hiçbir öğe yatay taşmıyor (scrollWidth ≤ clientWidth + 1; kaydırma kabı hariç) ve CSS ile kesilmiyor
//     (text-overflow: ellipsis ya da -webkit-line-clamp gerçekten metin saklıyorsa kırmızı).
//  K4 kart başlığı olup data-vd-kirp taşımayan öğe yok (başlık seçicileri sayılır, sayıları basılır).
// Kullanım: node araclar/kirpma-kapisi.mjs   (TABAN=http://localhost:8796/DadaGastroVideo/ · GENISLIK=1440,390 · SAYFA=video-mutfagi,…)
//           BOZ=1 → video kartı başlıklarından data-vd-kirp silinir + bir başlığa CSS ellipsis (kırmızı vermeli)
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// V2=1 (ya da TABAN …/v2/) → v2/*.html (kabuk ajanı ekledi, V2 sözleşmesi)
const V2 = !!process.env.V2 || /\/v2\/$/.test(process.env.TABAN || '');
const DIZIN = V2 ? path.join(KOK, 'v2') : KOK;
const TABAN = process.env.TABAN || (V2 ? 'http://localhost:8796/DadaGastroVideo/v2/' : 'http://localhost:8796/DadaGastroVideo/');
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SUZ = (process.env.SAYFA || '').split(',').filter(Boolean);
const BOZ = !!process.env.BOZ;
const SAYFALAR = readdirSync(DIZIN).filter((f) => f.endsWith('.html')).sort().filter((f) => !SUZ.length || SUZ.some((x) => f.includes(x)));

// Kart kapları ve kart başlığı seçicileri (Gastro kartı + video bileşenleri). Yeni bileşen eklenince buraya yazılır.
const KART = '.r-card, .vd-kart, .vd-kisa, .vd-bolum, .vd-seri-afis, .vd-sef-kart, [class*="-kart"]:not(html):not(body)';
const BASLIK = ['.r-card .r-body :is(h2,h3,h4)', '.vd-kisa__baslik', '.vd-bolum__baslik', '.vd-seri-afis__ad', '.vd-sef-kart__ad', '[class*="-kart"] :is(h2,h3,h4)'];

function olc({ KART, BASLIK }) {
  const gor = (e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getClientRects().length > 0;
  const metinDugumleri = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('.vd-gizli, [hidden]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) }); const a = []; while (w.nextNode()) if (w.currentNode.nodeValue.trim()) a.push(w.currentNode); return a; };
  const satirlar = (el) => { const ust = []; for (const n of metinDugumleri(el)) { const r = document.createRange(); r.selectNodeContents(n); for (const k of r.getClientRects()) if (k.width > 0.5 && !ust.some((u) => Math.abs(u - k.top) < k.height / 2)) ust.push(k.top); } return ust.length; };
  const kim = (e) => { const k = e.closest(KART); return `${e.tagName.toLowerCase()}.${(e.className || '').toString().split(' ')[0]}${k ? ' ⊂ .' + (k.className || '').toString().split(' ').slice(0, 2).join('.') : ''}`; };
  const sorun = [];
  const kirp = [...document.querySelectorAll('[data-vd-kirp]')].filter(gor);
  let kisaldi = 0;
  for (const el of kirp) {
    const n = parseInt(el.getAttribute('data-vd-kirp'), 10) || 1;
    const gorunen = metinDugumleri(el).map((x) => x.nodeValue).join('').replace(/\s+/g, ' ').trim();
    const a = el.querySelector('a[aria-label], button[aria-label]');
    const gizli = el.querySelector('.vd-gizli');
    const tam = (el.getAttribute('title') || (a && a.getAttribute('aria-label')) || (gizli && gizli.textContent) || gorunen).replace(/\s+/g, ' ').trim();
    const s = satirlar(el);
    if (s > n) sorun.push(`K1 ${s}>${n} satır: ${kim(el)} «${gorunen.slice(0, 50)}»`);
    if (el.scrollWidth > el.clientWidth + 1) sorun.push(`K1 yatay taşma ${el.scrollWidth}>${el.clientWidth}: ${kim(el)}`);
    if (gorunen !== tam) {
      kisaldi++;
      const onek = gorunen.endsWith('…') ? gorunen.slice(0, -1).trimEnd() : null;
      const sinir = onek !== null && tam.startsWith(onek) && onek.length > 0 && /^[\s·:;,.\-–—|/!?]/.test(tam.slice(onek.length));
      if (!sinir) sorun.push(`K2 kelime sınırı değil: ${kim(el)} «${gorunen}» / «${tam}»`);
    }
  }
  // K3 kart içi taşma / CSS kesmesi
  const kartlar = [...document.querySelectorAll(KART)].filter(gor);
  const goruldu = new Set();
  for (const k of kartlar) for (const e of [k, ...k.querySelectorAll('*')]) {
    if (goruldu.has(e) || !gor(e)) continue; goruldu.add(e);
    const cs = getComputedStyle(e);
    if (['IMG', 'SVG', 'svg', 'VIDEO', 'PICTURE', 'I'].includes(e.tagName) || e.classList.contains('vd-gizli')) continue;
    if (e.clientWidth <= 1 && e.clientHeight <= 1) continue; // ekran okuyucuya özel gizli metin (Gastro .rf-uzun · clip-path inset(50%))
    const kaydirma = /auto|scroll/.test(cs.overflowX);
    if (!kaydirma && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && cs.display !== 'inline' && metinDugumleri(e).length) {
      if (!e.hasAttribute('data-vd-kirp') && cs.overflowX !== 'visible') sorun.push(`K3 yatay taşma/kesme ${e.scrollWidth}>${e.clientWidth}: ${kim(e)} «${e.textContent.trim().slice(0, 40)}»`);
    }
    if (cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) sorun.push(`K3 CSS ellipsis kesiyor: ${kim(e)} «${e.textContent.trim().slice(0, 40)}»`);
    const lc = cs.webkitLineClamp || cs.getPropertyValue('-webkit-line-clamp');
    if (lc && lc !== 'none' && satirlar(e) > Number(lc)) sorun.push(`K3 line-clamp ${lc} metin saklıyor (${satirlar(e)} satır): ${kim(e)}`);
  }
  // K4 başlık sayımı
  const sayim = {};
  for (const sec of BASLIK) {
    const b = [...document.querySelectorAll(sec)].filter(gor);
    sayim[sec] = b.length;
    for (const e of b) if (!e.closest('[data-vd-kirp]') && !e.querySelector('[data-vd-kirp]')) sorun.push(`K4 data-vd-kirp yok: ${kim(e)} «${e.textContent.trim().slice(0, 40)}»`);
  }
  return { sorun: [...new Set(sorun)], kirp: kirp.length, kisaldi, sayim };
}

const t = await chromium.launch();
let kirmizi = 0, toplamKirp = 0, toplamKisa = 0;
const sayimTop = {};
for (const w of GENISLIK) {
  const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  if (BOZ) await ctx.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return;
      document.querySelectorAll('.vd-kart .r-body [data-vd-kirp]').forEach((e) => e.removeAttribute('data-vd-kirp'));
      const s = document.createElement('style'); s.textContent = '.vd-kart .r-body :is(h3,h4){display:block!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;-webkit-line-clamp:none}'; document.head.appendChild(s);
    });
  });
  const kuyruk = [...SAYFALAR];
  const isci = async () => {
    const p = await ctx.newPage();
    while (kuyruk.length) {
      const s = kuyruk.shift();
      try {
        await p.goto(TABAN + s, { waitUntil: 'load', timeout: 30000 });
        await p.evaluate(() => document.fonts && document.fonts.ready);
        await p.waitForTimeout(300);
        const r = await p.evaluate(olc, { KART, BASLIK });
        toplamKirp += r.kirp; toplamKisa += r.kisaldi;
        for (const [k, v] of Object.entries(r.sayim)) sayimTop[k] = (sayimTop[k] || 0) + v;
        if (r.sorun.length) { kirmizi += r.sorun.length; const tur = {}; r.sorun.forEach((x) => { tur[x.slice(0, 2)] = (tur[x.slice(0, 2)] || 0) + 1; }); console.log(`✗ [${w}] ${s} — ${r.sorun.length} sorun (${Object.entries(tur).map(([k, v]) => k + '×' + v).join(' ')})`); r.sorun.slice(0, 6).forEach((x) => console.log('    ' + x)); if (r.sorun.length > 6) console.log(`    … +${r.sorun.length - 6}`); }
        else if (process.env.AYRINTI) console.log(`✓ [${w}] ${s} — kırpılan ${r.kirp} (kısalan ${r.kisaldi})`);
      } catch (e) { kirmizi++; console.log(`✗ [${w}] ${s} — açılamadı: ${e.message.split('\n')[0]}`); }
    }
    await p.close();
  };
  await Promise.all([isci(), isci(), isci(), isci()]);
  await ctx.close();
}
await t.close();
console.log('\nBaşlık seçicileri (görünen öğe, iki genişlik toplamı):');
for (const [k, v] of Object.entries(sayimTop)) console.log(`  ${String(v).padStart(5)}  ${k}`);
console.log(`\n${SAYFALAR.length} sayfa × ${GENISLIK.length} genişlik · [data-vd-kirp] ${toplamKirp} (kısalan ${toplamKisa}) · ${kirmizi} kırmızı${BOZ ? ' (BOZ=1: kırmızı BEKLENİR)' : ''}`);
process.exit(kirmizi ? 1 : 0);
