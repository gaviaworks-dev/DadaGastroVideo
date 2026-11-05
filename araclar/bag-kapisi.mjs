// Bağ kapısı (statik): depodaki her HTML'in her bağı ve kaynağı çözülür.
//   · iç bağ/kaynak (href, src, srcset, poster, data-src, action, satır içi url(), onclick location.href) → depoda VAR olan dosya
//     (?sorgu atılır; #parça varsa hedef dosyada o id bulunmalı)
//   · dış bağ yalnız izinli kökenler: https://dadagastro.com · https://gaviaworks-dev.github.io  (+ data:, mailto:, tel:)
//   · href="#" (boş parça) ve javascript: bağı = 0
//   · prototip CSS'lerindeki url() (varlik/video/**, varlik/gastro/**) de çözülür; Gastro'nun kendi CSS'inde adı geçen ama Gastro'da da
//     olmayan yedek font biçimleri (FA .ttf / v4compatibility) bilinen eksik olarak ayrı sayılır (tarayıcı istemez; varlik-kapisi ölçer).
// Kullanım: node araclar/bag-kapisi.mjs            BOZ=1 → beş bilinçli kusurlu sınama sayfası; beşini de yakalamalı (çıkış 1).
import { readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// V2=1 → v2/*.html taranır (iç bağlar v2 içinde ya da ../varlik paylaşımlı varlıklara çözülür), CSS'ler varlik/v2 + varlik/gastro.
const V2 = !!process.env.V2;
const DIZIN = V2 ? path.join(KOK, 'v2') : KOK;
const IZINLI = [/^https:\/\/dadagastro\.com(\/|$)/, /^https:\/\/gaviaworks-dev\.github\.io(\/|$)/];
// Gastro donörünün kendi dış bağları (yalnız <a href>; kaynak/iframe DEĞİL): resmî sosyal hesaplar, kardeş markalar, uygulama mağazaları,
// tarif paylaşım uçları ve altbilgi imzası. Donörden aynen gelir; tıklanınca gerçek bir yere gider (boşa düşmez).
const DONOR_DIS = [/^https:\/\/(www\.)?(instagram\.com|facebook\.com|x\.com|twitter\.com|pinterest\.com|wa\.me|t\.me)\//, /^https:\/\/(dadafit\.com\.tr|dadadiet\.com|dadagourmet\.com|gaviaworks\.com)(\/|$)/, /^https:\/\/apps\.apple\.com\//, /^https:\/\/play\.google\.com\//];
let donorDis = 0;
// Reklam veren hedefleri (REVİZE 1 madde 7): full-stack reklam modülünün render edilmiş verisindeki (src/video/reklam-donor.json, panel kaydı)
// tıklama adresleri. Yalnız <a href> ve yalnız bu listedekiler; ayrı sayılır.
const REKLAM_HEDEF = await (async () => { try { const h = await readFile(path.join(KOK, V2 ? 'src/v2/reklam-donor.json' : 'src/video/reklam-donor.json'), 'utf8'); return new Set([...h.matchAll(/https?:\/\/[^"\\\s]+/g)].map((m) => m[0].replace(/&amp;/g, '&'))); } catch { return new Set(); } })();
let reklamDis = 0;
const BILINEN_EKSIK = /varlik\/gastro\/varliklar\/fontawesome\/webfonts\/(fa-[a-z0-9-]+\.ttf|fa-v4compatibility\.(woff2|ttf))$/;
const BOZ = !!process.env.BOZ;
const BOZUK = '_kapi-bozuk-bag.html';
if (BOZ) await writeFile(path.join(DIZIN, BOZUK), `<!doctype html><html><head><title>bozuk</title></head><body>
<a href="#">boş parça</a> <a href="javascript:void(0)">js bağı</a> <a href="video-yok-boyle-bir-sayfa.html">eksik dosya</a>
<a href="https://ornek-izinsiz.example.com/x">izinsiz dış</a> <a href="index.html#boyle-bir-id-yok">eksik parça</a></body></html>`);

const idOnbellek = new Map();
async function idler(dosya) {
  if (!idOnbellek.has(dosya)) { const h = await readFile(dosya, 'utf8').catch(() => ''); idOnbellek.set(dosya, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); }
  return idOnbellek.get(dosya);
}
const sorunlar = []; let bag = 0, bilinen = 0; const turler = new Set();
const kaydet = (tur, dosya, deger) => { sorunlar.push([tur, dosya, deger]); turler.add(tur); };

async function coz(kaynakDosya, ham, nitelik) {
  const v = ham.trim().replace(/&amp;/g, '&');
  if (!v) return;
  bag++;
  if (/^javascript:/i.test(v)) return kaydet('javascript: bağı', kaynakDosya, v);
  if (v === '#') return kaydet('boş # bağı', kaynakDosya, v);
  if (/^(data:|mailto:|tel:|blob:)/i.test(v)) return;
  if (/^(https?:)?\/\//i.test(v)) {
    if (IZINLI.some((re) => re.test(v))) return;
    if (nitelik === 'a-href' && DONOR_DIS.some((re) => re.test(v))) { donorDis++; return; }
    if (nitelik === 'a-href' && REKLAM_HEDEF.has(v)) { reklamDis++; return; }
    return kaydet('izinsiz dış bağ/kaynak', kaynakDosya, v.slice(0, 100));
  }
  if (v.startsWith('/')) return kaydet('kök-mutlak yol (Pages alt yolunda kırılır)', kaynakDosya, v);
  const [yolSorgu, parca] = v.split('#'); const yol = decodeURIComponent(yolSorgu.split('?')[0]);
  const hedef = yol ? path.resolve(path.dirname(kaynakDosya), yol) : kaynakDosya;
  if (!hedef.startsWith(KOK)) return kaydet('depo dışı yol', kaynakDosya, v);
  if (yol && !existsSync(hedef)) { if (BILINEN_EKSIK.test(hedef)) { bilinen++; return; } return kaydet('eksik dosya', kaynakDosya, v); }
  if (parca && hedef.endsWith('.html') && nitelik !== 'css' && !(await idler(hedef)).has(decodeURIComponent(parca))) kaydet('eksik #parça', kaynakDosya, v);
}

const htmller = (await readdir(DIZIN)).filter((f) => f.endsWith('.html') && (BOZ ? f === BOZUK : !f.startsWith('_'))).sort();
for (const f of htmller) {
  const dosya = path.join(DIZIN, f);
  const h = (await readFile(dosya, 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
  const govde = h.replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, ''); // satır içi betik metni bağ değildir
  for (const m of govde.matchAll(/<(?:a|link|script|img|source|video|audio|iframe|form|input|use|image)\b[^>]*>/gi)) {
    const et = m[0];
    for (const n of et.matchAll(/\s(href|src|poster|data-src|action|xlink:href)="([^"]*)"/g)) {
      if (n[1] === 'href' && /^<link\b/i.test(et) && /rel="(preconnect|dns-prefetch)"/.test(et)) continue;
      await coz(dosya, n[2], n[1] === 'href' && /^<a\b/i.test(et) ? 'a-href' : n[1]);
    }
    for (const n of et.matchAll(/\s(?:srcset|imagesrcset)="([^"]*)"/g)) for (const p of n[1].split(',')) await coz(dosya, p.trim().split(/\s+/)[0], 'srcset');
  }
  for (const m of govde.matchAll(/url\((?:&quot;|['"])?([^'")&]+)(?:&quot;|['"])?\)/g)) await coz(dosya, m[1], 'url');
  for (const m of govde.matchAll(/location\.href='([^']+)'/g)) await coz(dosya, m[1], 'onclick');
}
// prototip CSS'leri
if (!BOZ) {
  const cssler = [];
  for (const k of V2 ? ['varlik/v2', 'varlik/gastro'] : ['varlik/video', 'varlik/gastro']) for (const f of await readdir(path.join(KOK, k), { recursive: true })) if (f.endsWith('.css')) cssler.push(path.join(KOK, k, f));
  for (const c of cssler) {
    const css = (await readFile(c, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, ''); // yorumdaki url() bağ değildir
    for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) { if (/^(data:|#|%23)/i.test(m[2])) continue; /* %23 = kaçışlı # (data: SVG içindeki filtre başvurusu) */ await coz(c, m[2], 'css'); }
  }
}
if (BOZ) await rm(path.join(DIZIN, BOZUK), { force: true });

const grup = {};
for (const [tur, dosya, deger] of sorunlar) (grup[tur] ||= []).push(`${path.relative(KOK, dosya)} → ${deger}`);
for (const [tur, l] of Object.entries(grup)) { console.log(`✗ ${tur}: ${l.length}`); for (const x of l.slice(0, 8)) console.log('    ' + x); if (l.length > 8) console.log(`    … +${l.length - 8}`); }
console.log(`\n${htmller.length} HTML · ${bag} bağ/kaynak · sorun ${sorunlar.length} · bilinen eksik font biçimi ${bilinen} · Gastro donörünün kendi dış bağı ${donorDis} · reklam veren hedefi ${reklamDis}`);
if (BOZ) {
  const beklenen = ['boş # bağı', 'javascript: bağı', 'eksik dosya', 'izinsiz dış bağ/kaynak', 'eksik #parça'];
  const y = beklenen.filter((t) => turler.has(t));
  console.log(`BOZ sınaması: ${y.length}/${beklenen.length} kusur yakalandı → ${y.length === beklenen.length ? 'kapı kırmızı verebiliyor ✓' : 'KAPI KÖR ✗ (' + beklenen.filter((t) => !turler.has(t)).join(', ') + ')'}`);
  process.exit(y.length === beklenen.length ? 1 : 3);
}
process.exit(sorunlar.length ? 1 : 0);
