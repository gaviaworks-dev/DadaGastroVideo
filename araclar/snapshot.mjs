// Kaynak transferi (Health snapshot.mjs'in Video uyarlaması): YEREL Gastro'nun (http://127.0.0.1:8960, kod = canlı) sunucu
// HTML'ini çeker, referans verdiği her varlığı (css/js/font/görsel; CSS içindeki url()/@import dahil) varlik/gastro/ altına
// aynı alt yolla indirir, yolları göreliye çevirir, token/oturum/izleme/kullanıcı eylemi kalıntılarını SİLER ve
// src/donor/<ad>.html yazar. Markup yeniden yazılmaz; yalnız yol çevirisi ve temizlik. dadagastro.com'a istek ATILMAZ.
//
// Görsel yedeği: 8960 bir görsel için 200 vermezse (yerel ağaçta medya yok) dosya yerel kopyalardan alınır:
//   /varliklar/media/*  → gastro-mysql/public/varliklar/media/*
//   /storage/*          → gastro-video/storage/app/public/* · DadaGastro/public/varliklar/storage/* · Health prototipinin
//                         varlik/gastro/storage/* (canlı Gastro'nun eski kopyası; salt okuma)
//
// Kullanım: node araclar/snapshot.mjs            (veri/katalog.json varsa katalogdaki tarif donörleri de çekilir)
import { mkdir, writeFile, readFile, access, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { kabukTemizle, tokenTaramasi } from './temizle.mjs';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const KAYNAK = process.env.KAYNAK || 'http://127.0.0.1:8960';
const CANLI = 'https://dadagastro.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) DadaGastroVideoPrototip/1.0';
const VARLIK = 'varlik/gastro';
const DM = path.join(os.homedir(), 'Developer/Revenge Projects/DadaMentor');
// İçerik hattının yayına çıkan kapakları (yeni "pilot" tarifler gastro-mysql kopyasında henüz yok): <ad>-kapak.webp → yayin/ klasörü
const YAYIN_KAPAK = await (async () => {
  const dizin = new Map();
  for (const hat of ['gastro-icerik-ekim-sonu', 'gastro-icerik-kasim-20261031', 'gastro-icerik-kasim']) {
    const k = path.join(DM, hat, 'tasks');
    try { for (const f of await readdir(k, { recursive: true })) if (/\/yayin\/[^/]+-kapak\.webp$/.test('/' + f)) dizin.set(path.basename(f), path.join(k, f)); } catch { /* hat yok */ }
  }
  return dizin;
})();
const YEDEK = [
  [/^varliklar\/media\//, (y) => [path.join(DM, 'gastro-mysql/public', y), path.join(DM, 'DadaGastro/public', y), YAYIN_KAPAK.get(path.basename(y))].filter(Boolean)],
  [/^varliklar\/storage\//, (y) => [path.join(DM, 'DadaGastro/public', y), path.join(os.homedir(), 'Developer/Projects/dadasaglik-prototip/varlik/gastro', y)]],
  [/^storage\//, (y) => [path.join(DM, 'gastro-video/storage/app/public', y.slice(8)), path.join(DM, 'DadaGastro/public/varliklar', y),
    path.join(os.homedir(), 'Developer/Projects/dadasaglik-prototip/varlik/gastro', y)]],
  [/./, (y) => [path.join(DM, 'gastro-mysql/public', y)]],
];
// Gastro'nun kendi CSS'inde adı geçen ama Gastro'da da OLMAYAN yedek font biçimleri: tarayıcı woff2'yi seçtiği için hiç istemez.
// varlik-kapisi.mjs gerçek isteği ölçer (404 = 0); bu liste yalnız snapshot çıkış kodunu bunlar yüzünden kırmızı yapmamak için.
const BILINEN_EKSIK = /^varliklar\/fontawesome\/webfonts\/(fa-[a-z0-9-]+\.ttf|fa-v4compatibility\.woff2)$/;

/* ---------- Katalog: hangi tarif ve seri sayfalarının prototipte karşılığı var ---------- */
async function katalogOku() {
  try { return JSON.parse(await readFile(path.join(KOK, 'veri/katalog.json'), 'utf8')); } catch { return null; }
}
export function katalogTarifleri(K) {
  if (!K) return [];
  const s = new Set();
  for (const v of [...(K.videolar || []), ...(K.kisalar || [])]) if (v && v.tarif) s.add(v.tarif);
  return [...s];
}
export function katalogSerileri(K) { return K ? (K.seriler || []).map((x) => x.slug).filter(Boolean) : []; }

const KATALOG = await katalogOku();
const TARIFLER = katalogTarifleri(KATALOG);
const SERILER = katalogSerileri(KATALOG);

// donör adı → yerel yol
export const DONORLER = {
  ana: '/',
  kabuk: '/tarif/kuymak-karadeniz-usulu-misir-unlu-kahvaltilik',
  ...Object.fromEntries(TARIFLER.map((s) => [`tarif-${s}`, `/tarif/${s}`])),
};

// Prototip içinde karşılığı olan sayfa yolları (geri kalan her iç bağ → https://dadagastro.com/...)
const ICERDE = {
  '/': 'index.html',
  '/video-mutfagi': 'video-mutfagi.html',
  '/video-mutfagi/seriler': 'video-seriler.html',
  ...Object.fromEntries(SERILER.map((s) => [`/video-mutfagi/seri/${s}`, `video-seri-${s}.html`])),
  ...Object.fromEntries(TARIFLER.map((s) => [`/tarif/${s}`, `tarif-${s}.html`])),
};

const VARLIK_UZANTI = /\.(css|js|mjs|webp|png|jpe?g|avif|gif|svg|ico|woff2?|ttf|otf|eot|json|webmanifest|mp4|webm)$/i;
const indirilen = new Map(); // yol → durum (200 | 'yedek:<kaynak>' | hata kodu)
const kuyrukCss = [];

const temizYol = (u) => u.split('#')[0].split('?')[0].replace(/^\/+/, '');
const varlikMi = (yol) => VARLIK_UZANTI.test(yol.split('#')[0].split('?')[0]);
const var_ = async (p) => { try { await access(p); return true; } catch { return false; } };

/** ham href/src → yerel kaynakta mutlak yol ('/x/y?q#h') ya da null (dış/özel şema) */
function kaynakYolu(ham, tabanYol = '/') {
  if (!ham) return null;
  const v = ham.trim().replace(/&amp;/g, '&');
  if (/^(data:|mailto:|tel:|javascript:|#|about:|blob:)/i.test(v)) return null;
  try {
    const u = new URL(v, KAYNAK + tabanYol);
    if (u.origin !== new URL(KAYNAK).origin && u.origin !== CANLI && u.origin !== 'https://www.dadagastro.com') return null;
    return u.pathname + u.search + u.hash;
  } catch { return null; }
}

async function indir(yol) {
  const temiz = temizYol(yol);
  if (!temiz || indirilen.has(temiz)) return;
  indirilen.set(temiz, 'bekliyor');
  const hedef = path.join(KOK, VARLIK, decodeURIComponent(temiz));
  if (await var_(hedef)) { indirilen.set(temiz, 200); if (temiz.endsWith('.css')) kuyrukCss.push(temiz); return; }
  const yanit = await fetch(KAYNAK + '/' + temiz, { headers: { 'User-Agent': UA } }).catch(() => null);
  if (yanit && yanit.ok) {
    await mkdir(path.dirname(hedef), { recursive: true });
    await writeFile(hedef, Buffer.from(await yanit.arrayBuffer()));
    indirilen.set(temiz, 200);
    if (temiz.endsWith('.css')) kuyrukCss.push(temiz);
    return;
  }
  for (const [re, adaylar] of YEDEK) if (re.test(temiz)) for (const a of adaylar(decodeURIComponent(temiz))) {
    if (await var_(a)) { await mkdir(path.dirname(hedef), { recursive: true }); await copyFile(a, hedef); indirilen.set(temiz, 'yedek:' + a.replace(os.homedir(), '~')); return; }
  }
  indirilen.set(temiz, yanit ? yanit.status : 'ağ hatası');
  console.warn('  ✗', indirilen.get(temiz), temiz);
}

// CSS içindeki url() ve @import'ları indir; yolları CSS dosyasının konumuna göre göreliye çevir
async function cssIsle(temiz) {
  const dosya = path.join(KOK, VARLIK, decodeURIComponent(temiz));
  let css = await readFile(dosya, 'utf8');
  const tabanYol = '/' + temiz;
  const bulunan = new Set();
  const cevir = (ham) => {
    const cy = kaynakYolu(ham, tabanYol);
    if (!cy || !varlikMi(cy)) return ham;
    bulunan.add(cy);
    const ek = (cy.match(/#.*$/) || [''])[0];
    return path.relative(path.dirname(temiz), temizYol(cy)).split(path.sep).join('/') + ek;
  };
  css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (t, q, u) => `url(${q}${cevir(u)}${q})`);
  css = css.replace(/@import\s+(['"])([^'"]+)\1/g, (t, q, u) => `@import ${q}${cevir(u)}${q}`);
  await writeFile(dosya, css);
  for (const b of bulunan) await indir(b);
}

function htmlTemizle(html) {
  return html
    .replace(/<meta name="robots"[^>]*>\s*/g, '')
    .replace(/<base href="[^"]*">\s*/g, '')
    .replace(/<head>/, '<head>\n<meta name="robots" content="noindex, nofollow">');
}

function htmlYollari(html, tabanYol) {
  const varliklar = new Set();
  const sayfaBagi = (cy) => {
    const h = (cy.match(/#.*$/) || [''])[0]; const yq = cy.slice(0, cy.length - h.length);
    const [p, q] = yq.split('?');
    const pn = p.length > 1 ? p.replace(/\/+$/, '') : p;
    if (ICERDE[pn] && !q) return ICERDE[pn] + h;
    if (pn === '/' && !q && h) return 'index.html' + h;
    return CANLI + cy;
  };
  const cevirDeger = (ham, nitelik) => {
    const cy = kaynakYolu(ham, tabanYol);
    if (!cy) return ham;
    if (varlikMi(cy)) { varliklar.add(cy); return `${VARLIK}/${temizYol(cy)}`; }
    if (['href', 'action', 'onclick', 'data-href', 'data-url', 'data-uc'].includes(nitelik)) return sayfaBagi(cy);
    return ham;
  };
  html = html.replace(/\s(href|src|action|poster|data-src|data-bg|data-href|data-url|data-uc|content)="([^"]*)"/g, (t, n, v) => {
    if (n === 'content') { // yalnız mutlak yerel adres taşıyan meta içerikleri (og:image vb.) — düz metin içerikler dokunulmaz
      if (!/^(https?:)?\/\/(127\.0\.0\.1|localhost)/.test(v)) return t;
      const cy = kaynakYolu(v, tabanYol); return ` ${n}="${cy ? (varlikMi(cy) ? (varliklar.add(cy), `${VARLIK}/${temizYol(cy)}`) : CANLI + cy) : v}"`;
    }
    return ` ${n}="${cevirDeger(v, n)}"`;
  });
  html = html.replace(/\s(srcset|imagesrcset)="([^"]*)"/g, (t, n, v) => ` ${n}="` + v.split(',').map((p) => { const [u, w] = p.trim().split(/\s+/); return [cevirDeger(u, 'src'), w].filter(Boolean).join(' '); }).join(', ') + '"');
  // satır içi stil url()'leri (hem "..." hem &quot;...&quot;)
  html = html.replace(/url\((&quot;|['"]?)([^'")&]+)\1\)/g, (t, q, u) => `url(${q}${cevirDeger(u, 'src')}${q})`);
  html = html.replace(/location\.href='([^']+)'/g, (t, u) => `location.href='${cevirDeger(u, 'onclick')}'`);
  // JSON içine kaçışla gömülü mutlak yerel adresler (data-gallery="[&quot;http:\/\/127.0.0.1:8960\/varliklar\/media\/1651.webp&quot;]")
  html = html.replace(/https?:\\\/\\\/(?:127\.0\.0\.1|localhost):89\d\d((?:\\\/[^"&\\\s]*)*)/g, (t, yol) => {
    const y = yol.replace(/\\\//g, '/') || '/';
    if (varlikMi(y)) { varliklar.add(y); return `${VARLIK}/${temizYol(y)}`.replace(/\//g, '\\/'); }
    return (CANLI + y).replace(/\//g, '\\/');
  });
  // URL kodlu köken (paylaşım uçlarının `u=` parametresi, YouTube gömme `origin=`) → canlı site kökeni (paylaşılan adres gerçek tarif olsun)
  html = html.replace(/http%3A%2F%2F(?:127\.0\.0\.1|localhost)%3A89\d\d/gi, 'https%3A%2F%2Fdadagastro.com');
  return { html, varliklar };
}

async function main() {
  await mkdir(path.join(KOK, 'src/donor'), { recursive: true });
  if (!KATALOG) console.log('· veri/katalog.json yok → yalnız ana + kabuk donörü (katalog gelince yeniden koş)');
  for (const [ad, yol] of Object.entries(DONORLER)) {
    const yanit = await fetch(KAYNAK + yol, { headers: { 'User-Agent': UA } });
    if (!yanit.ok) throw new Error(`${ad}: ${yanit.status} (${KAYNAK}${yol})`);
    const tarif = ad.startsWith('tarif-');
    let html = kabukTemizle(htmlTemizle(await yanit.text()), { tarif });
    const r = htmlYollari(html, yol);
    const kalan = tokenTaramasi(r.html, { tarif });
    if (kalan.length) {
      for (const m of [...r.html.matchAll(/.{0,120}(\/\/(127\.0\.0\.1|localhost):89\d\d|name="_token"|eyJpdiI6|kayit\/toggle|takip-et).{0,60}/g)].slice(0, 6)) console.error('   ', m[0].replace(/\s+/g, ' '));
      throw new Error(`${ad}: temizlik sonrası kalan: ${kalan.join(', ')}`);
    }
    const basa = `<!-- donör: ${KAYNAK}${yol} (yerel Gastro, kod = canlı · canlı adresi ${CANLI}${yol}) · alındı: ${new Date().toISOString().slice(0, 10)} · araclar/snapshot.mjs -->\n`;
    await writeFile(path.join(KOK, 'src/donor', `${ad}.html`), basa + r.html);
    console.log('donör', ad.padEnd(40), String(r.varliklar.size).padStart(3), 'varlık');
    for (const v of r.varliklar) await indir(v);
  }
  while (kuyrukCss.length) await cssIsle(kuyrukCss.shift());
  const yedek = [...indirilen].filter(([, d]) => String(d).startsWith('yedek:'));
  const hataliHam = [...indirilen].filter(([, d]) => d !== 200 && !String(d).startsWith('yedek:'));
  const bilinen = hataliHam.filter(([y]) => BILINEN_EKSIK.test(y)); const hatali = hataliHam.filter(([y]) => !BILINEN_EKSIK.test(y));
  if (bilinen.length) console.log(`   bilinen eksik (Gastro'da da yok, tarayıcı istemez): ${bilinen.map(([y]) => path.basename(y)).join(', ')}`);
  console.log(`varlık: ${indirilen.size} · yerel yedekten: ${yedek.length} · hatalı: ${hatali.length}`);
  const yk = {}; for (const [, d] of yedek) { const k = d.slice(6).replace(/\/(varliklar|storage|tasks)\/.*$/, '/$1/…'); yk[k] = (yk[k] || 0) + 1; }
  for (const [k, n] of Object.entries(yk)) console.log(`   yedek ${String(n).padStart(3)} ← ${k}`);
  hatali.forEach(([y, d]) => console.log('   ✗', d, y));
  await writeFile(path.join(KOK, 'src/donor/varliklar.json'), JSON.stringify(Object.fromEntries(indirilen), null, 1));
  if (hatali.length) process.exitCode = 2;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
