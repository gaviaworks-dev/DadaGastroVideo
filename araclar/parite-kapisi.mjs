// Parite kapısı: prototip kabuğu (üst bant + header + footer) = yerel Gastro donörü, 1440 ve 390'da 4px içinde.
// Çiftler: index.html ↔ 8960 '/' · tarif-kuymak… ↔ 8960 '/tarif/kuymak…' (+ istenirse başka tarif: PARITE_TARIF=<slug>).
// Yöntem: her bölgede (.topbar, header.header, footer.footer) GÖRÜNÜR (checkVisibility) her öğe DOM sırasıyla alınır; imza
// (etiket + sınıf) dizileri aynı olmalı; her öğe için boyut (w,h) + bölgeye göre konum (x, y − bölge üstü) 4px içinde olmalı.
// Mutlak y kullanılmaz (footer'ın sayfadaki yeri içerik boyuna bağlı); bölge kutusunun kendi boyutu ve x'i de ölçülür.
// Görsel/yazı yüklenmesi beklenir (load + fonts.ready); hareket kapalı (reducedMotion).
// Kullanım: node araclar/parite-kapisi.mjs     TABAN=… (vars. http://localhost:8795/DadaGastroVideo/) · DONOR=… (vars. http://127.0.0.1:8960)
//           BOZ=1 → index'in kopyasında logo 20px kaydırılır, footer bir sütun daraltılır; kapı kırmızı vermeli (çıkış 1).
import { chromium } from 'playwright';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TABAN = process.env.TABAN || 'http://localhost:8795/DadaGastroVideo/';
const DONOR = process.env.DONOR || 'http://127.0.0.1:8960';
const TOL = 4;
const BOZ = !!process.env.BOZ;
const BOZUK = '_kapi-bozuk-parite.html';
const TARIF = process.env.PARITE_TARIF || 'kuymak-karadeniz-usulu-misir-unlu-kahvaltilik';
let CIFTLER = [['index.html', '/'], [`tarif-${TARIF}.html`, `/tarif/${TARIF}`]];
if (BOZ) {
  const h = (await readFile(path.join(KOK, 'index.html'), 'utf8')).replace('</head>', '<link rel="stylesheet" href="data:text/css,header.header%20.brand%7Bmargin-left:20px%7Dfooter.footer%20h4%7Bletter-spacing:3px%7D">\n</head>');
  await writeFile(path.join(KOK, BOZUK), h);
  CIFTLER = [[BOZUK, '/']];
}
const BOLGE = ['.topbar', 'header.header', 'footer.footer'];

async function olc(ctx, url) {
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const r = await p.evaluate((BOLGE) => BOLGE.map((sec) => {
    const k = document.querySelector(sec); if (!k) return { sec, yok: true };
    const kb = k.getBoundingClientRect();
    const gor = (e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0;
    const ogeler = [...k.querySelectorAll('*')].filter((e) => !e.closest('.mega, .dropdown, svg') && gor(e)).map((e) => {
      const b = e.getBoundingClientRect();
      return { imza: e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).sort().join('.') : ''), x: b.x, y: b.y - kb.y, w: b.width, h: b.height, metin: (e.childElementCount ? '' : e.textContent.trim().slice(0, 24)) };
    });
    return { sec, kutu: { x: kb.x, w: kb.width, h: kb.height }, ogeler };
  }), BOLGE);
  await p.close();
  return r;
}

const b = await chromium.launch();
let kirmizi = 0;
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  for (const [yerel, donor] of CIFTLER) {
    const [P, D] = [await olc(ctx, TABAN + yerel), await olc(ctx, DONOR + donor)];
    for (let i = 0; i < BOLGE.length; i++) {
      const p = P[i], d = D[i]; const sapma = [];
      if (p.yok || d.yok) { if (p.yok !== d.yok) sapma.push(`bölge ${p.yok ? 'prototipte' : 'donörde'} yok`); }
      else {
        for (const o of ['x', 'w', 'h']) if (Math.abs(p.kutu[o] - d.kutu[o]) > TOL) sapma.push(`kutu ${o}: donör ${d.kutu[o].toFixed(1)} ≠ prototip ${p.kutu[o].toFixed(1)}`);
        const ip = p.ogeler.map((x) => x.imza), id = d.ogeler.map((x) => x.imza);
        if (ip.join('|') !== id.join('|')) {
          const j = ip.findIndex((x, k) => x !== id[k]);
          sapma.push(`öğe dizisi farklı (${id.length} ↔ ${ip.length}); ilk fark #${j}: donör ${id[j]} ≠ prototip ${ip[j]}`);
        } else {
          let n = 0;
          p.ogeler.forEach((x, k) => { const y = d.ogeler[k]; const f = ['x', 'y', 'w', 'h'].filter((o) => Math.abs(x[o] - y[o]) > TOL); if (f.length) { n++; if (n <= 4) sapma.push(`${x.imza}${x.metin ? ` "${x.metin}"` : ''}: ${f.map((o) => `${o} ${y[o].toFixed(0)}→${x[o].toFixed(0)}`).join(' ')}`); } });
          if (n > 4) sapma.push(`… +${n - 4} öğe`);
        }
      }
      if (sapma.length) kirmizi++;
      console.log(`${sapma.length ? '✗' : '✓'} ${w} ${yerel.padEnd(56)} ${BOLGE[i].padEnd(14)} ${p.ogeler ? p.ogeler.length + ' öğe' : ''}${sapma.length ? '\n    ' + sapma.join('\n    ') : ''}`);
    }
  }
  await ctx.close();
}
await b.close();
if (BOZ) { await rm(path.join(KOK, BOZUK), { force: true }); console.log(kirmizi ? `\nBOZ sınaması: ${kirmizi} bölge kırmızı → kapı kırmızı verebiliyor ✓` : '\nBOZ sınaması: KAPI KÖR ✗'); process.exit(kirmizi ? 1 : 3); }
console.log(kirmizi ? `\nPARİTE KAPISI KIRMIZI (${kirmizi} bölge)` : `\nPARİTE KAPISI YEŞİL: üst bant + header + footer donörle ${TOL}px içinde (1440/390)`);
process.exit(kirmizi ? 1 : 0);
