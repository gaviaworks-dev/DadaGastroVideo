// Varlık kapısı (Health varlik-kapisi.mjs'in Video uyarlaması): her sayfa 1440 ve 390'da açılır.
// Ölçülenler: prototip kökeninden 4xx/5xx yanıt (404 = 0) · dış kökene istek (izinli liste dışı = 0) · JS hatası (pageerror + console.error)
// · yatay taşma (scrollWidth − innerWidth > 0) · kırık görsel (yüklenmiş ama naturalWidth 0, görünür).
// Sayfa sonuna dek gerçek tekerlek kaydırması yapılır (tembel görseller ve kaydırınca yüklenen içerik ölçüme girsin).
//
// Kullanım: node araclar/varlik-kapisi.mjs [sayfa.html …]     TABAN=… (vars. http://localhost:8795/DadaGastroVideo/) · GENISLIK=1440,390
//           BOZ=1 → bilerek bozulmuş sınama sayfası (eksik CSS, kırık görsel, JS hatası, taşan kutu) üretip YALNIZ onu ölçer;
//                   kapı dört kusurun dördünü de kırmızı göstermelidir (çıkış kodu 1). Sınama dosyası ölçümden sonra silinir.
import { chromium } from 'playwright';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TABAN = process.env.TABAN || 'http://localhost:8795/DadaGastroVideo/';
const KOKEN = new URL(TABAN).origin;
const IZINLI_DIS = [/^https:\/\/dadagastro\.com\//, /^https:\/\/gaviaworks-dev\.github\.io\//, /^data:/, /^blob:/];
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const BOZ = !!process.env.BOZ;
const BOZUK = '_kapi-bozuk-varlik.html';

let SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(KOK).filter((f) => f.endsWith('.html') && !f.startsWith('_')).sort().map((f) => (f === 'video-kisa.html' ? 'video-kisa.html?v=' + kisaIlk() : f));
function kisaIlk() { try { return JSON.parse(readFileSync(path.join(KOK, 'veri/katalog.json'), 'utf8')).kisalar[0].slug; } catch { return ''; } }

if (BOZ) {
  // Gerçek bir sayfanın kopyası + dört bilinçli kusur
  let h = await readFile(path.join(KOK, 'index.html'), 'utf8');
  h = h.replace('</head>', '<link rel="stylesheet" href="varlik/yok/kapi-bozuk.css">\n</head>')
    .replace('</body>', '<img src="varlik/video/tarif/_bozuk.webp" alt="bozuk" width="40" height="40"><div class="vd-kapi-tasma"></div><script>window.__yok.cagir()</script>\n</body>')
    .replace('</head>', '<link rel="stylesheet" href="data:text/css,.vd-kapi-tasma%7Bwidth:2400px;height:4px%7D">\n</head>');
  await writeFile(path.join(KOK, BOZUK), h);
  SAYFALAR = [BOZUK];
}

await mkdir(path.join(KOK, 'rapor/kapi'), { recursive: true });
const tarayici = await chromium.launch();
let hata = 0, olcum = 0; const kusurTurleri = new Set();
for (const w of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
  for (const s of SAYFALAR) {
    const sayfa = await bag.newPage();
    const kotu = [], jsHata = [], dis = [];
    sayfa.on('response', (r) => { if (r.url().startsWith(KOKEN) && r.status() >= 400) kotu.push(r.status() + ' ' + r.url().replace(TABAN, '')); });
    sayfa.on('request', (r) => { const u = r.url(); if (!u.startsWith(KOKEN) && !IZINLI_DIS.some((re) => re.test(u))) dis.push(u.slice(0, 90)); });
    sayfa.on('pageerror', (e) => jsHata.push(e.message));
    sayfa.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsHata.push('console: ' + m.text()); });
    await sayfa.goto(TABAN + s, { waitUntil: 'load' });
    await sayfa.waitForTimeout(400);
    const boy = await sayfa.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < boy; y += 700) { await sayfa.mouse.wheel(0, 700); await sayfa.waitForTimeout(60); }
    await sayfa.waitForTimeout(500);
    await sayfa.evaluate(() => scrollTo(0, 0)); await sayfa.waitForTimeout(400);
    const r = await sayfa.evaluate(() => {
      const kirik = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src') && i.getBoundingClientRect().width > 0 && getComputedStyle(i).display !== 'none').map((i) => i.getAttribute('src'));
      // Yatay taşma: Gastro body'si overflow-x:clip taşır → scrollWidth KÖRDÜR (taşan içerik kesilir, kaydırma çıkmaz).
      // Bu yüzden öğe öğe bakılır: görünür, ekranın sağ/sol kenarını KISMEN aşan öğe (tamamen ekran dışı off-canvas çekmece sayılmaz),
      // kendisini kırpan/kaydıran bir ata (overflow-x ≠ visible; html/body hariç) içinde değilse taşmadır.
      const kirpanAta = (e) => { for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== 'visible') return true; } return false; };
      const tasan = [];
      for (const e of document.body.querySelectorAll('*')) {
        const b = e.getBoundingClientRect(); if (b.width === 0 || b.height === 0) continue;
        const kismen = (b.right > innerWidth + 1 && b.left < innerWidth - 1) || (b.left < -1 && b.right > 1);
        if (!kismen || !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || kirpanAta(e)) continue;
        if (getComputedStyle(e).position === 'fixed' && (b.left >= innerWidth - 60)) continue; // kenara park etmiş sabit çekmece/sekme
        tasan.push((e.tagName.toLowerCase() + '.' + (typeof e.className === 'string' ? e.className.trim().split(/\s+/).join('.') : '')).slice(0, 50) + ` sağ=${Math.round(b.right)}`);
        if (tasan.length > 5) break;
      }
      return { yatay: Math.max(document.documentElement.scrollWidth - innerWidth, 0), tasan, kirik };
    });
    const ad = s.replace(/\.html.*$/, '').replace(/[^a-z0-9-]/gi, '_');
    await sayfa.screenshot({ path: path.join(KOK, `rapor/kapi/${ad}-${w}.png`) });
    const sorun = [];
    if (kotu.length) { sorun.push(`404:${kotu.length} (${kotu.slice(0, 3).join(', ')})`); kusurTurleri.add('404'); }
    if (dis.length) { sorun.push(`izinsiz dış istek:${dis.length} (${dis.slice(0, 2).join(', ')})`); kusurTurleri.add('dis'); }
    if (jsHata.length) { sorun.push(`JS:${jsHata.length} (${jsHata[0].slice(0, 100)})`); kusurTurleri.add('js'); }
    if (r.yatay > 0 || r.tasan.length) { sorun.push(`yatay taşma ${r.yatay}px · taşan öğe ${r.tasan.length} (${r.tasan.slice(0, 2).join(', ')})`); kusurTurleri.add('tasma'); }
    if (r.kirik.length) { sorun.push(`kırık görsel ${r.kirik.length} (${r.kirik.slice(0, 2).join(', ')})`); kusurTurleri.add('kirik'); }
    olcum++; if (sorun.length) hata++;
    console.log(`${sorun.length ? '✗' : '✓'} ${String(w).padEnd(4)} ${s}${sorun.length ? '  ' + sorun.join(' · ') : ''}`);
    await sayfa.close();
  }
  await bag.close();
}
await tarayici.close();
if (BOZ) {
  await rm(path.join(KOK, BOZUK), { force: true });
  const beklenen = ['404', 'js', 'tasma', 'kirik'];
  const yakalanan = beklenen.filter((k) => kusurTurleri.has(k));
  console.log(`\nBOZ sınaması: ${yakalanan.length}/${beklenen.length} kusur yakalandı (${yakalanan.join(', ')})${yakalanan.length === beklenen.length ? ' → kapı kırmızı verebiliyor ✓' : ' → KAPI KÖR ✗'}`);
  process.exit(yakalanan.length === beklenen.length ? 1 : 3);
}
console.log(`\n${olcum - hata}/${olcum} ölçüm yeşil (sayfa × genişlik ${GENISLIK.join('/')})`);
process.exit(hata ? 1 : 0);
