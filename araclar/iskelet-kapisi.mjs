// V2 iskelet paritesi: V2 video sayfalarının banner + panel iskeleti (src/v2/iskelet.mjs) = Gastro donörü 8960 /bugun-ne-pisirsem, 1440 ve 390.
// Metin farklı olduğundan yükseklik ve mutlak y ölçülmez; BOYUT ve EBEVEYNE GÖRE KONUM ölçülür (tolerans 4 px):
//   · section.bnp-top: x, genişlik · .wrap: x, genişlik, banner'ın üstünden uzaklığı (header payı)
//   · nav.rd-crumb: .wrap'a göre x/y, genişlik · .bnp-head .eyebrow ve h1: .wrap'a göre x
//   · .bnp-stats: .wrap'a göre SAĞ kenar, sol çizgi kalınlığı + sol iç boşluk (1440), 390'da x ve genişlik (tam satır)
//     — sütun genişliği ve x'i 1440'ta sayı/etiket metnine bağlı (donör "6.352 / Denenmiş tarif", Video "26 / Video"), sütun sağa yaslı:
//     geometri sağ kenar + çizgi/boşlukla sorulur. Ölçülen genişlik farkı ayrıca raporlanır (kırmızı sayılmaz).
//   · .bnp-stats .st: yükseklik (genişlik metne bağlı, raporlanır)
//   · section.bnp-body: üst köşe yarıçapı, banner'a binme payı (margin-top), üst iç boşluk, .wrap yatay iç boşluğu
// Kullanım: node araclar/iskelet-kapisi.mjs [v2 sayfası …]    TABAN (vars. http://localhost:8795/DadaGastroVideo/v2/) · DONOR (vars. http://127.0.0.1:8960)
//           BOZ=1 → V2 sayfasına h1 +20px kaydırma ve panel köşesi 0 enjekte edilir; kapı kırmızı vermeli (çıkış 1).
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TABAN = process.env.TABAN || 'http://localhost:8795/DadaGastroVideo/v2/';
const DONOR = (process.env.DONOR || 'http://127.0.0.1:8960') + '/bugun-ne-pisirsem';
const TOL = 4;
const BOZ = !!process.env.BOZ;
const varsayilan = () => readdirSync(path.join(KOK, 'v2')).filter((f) => f.endsWith('.html') && readFileSync(path.join(KOK, 'v2', f), 'utf8').includes('class="bnp-top'))
  .sort().filter((f, i, d) => /^(video-mutfagi|video-seriler)\.html$/.test(f) || d.findIndex((x) => x.split('-').slice(0, 2).join('-') === f.split('-').slice(0, 2).join('-')) === i);
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : varsayilan();

function olc() {
  const kutu = (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, sag: b.right }; };
  const top = document.querySelector('section.bnp-top'); if (!top) return null;
  const wrap = top.querySelector(':scope > .wrap'); const W = kutu(wrap); const T = kutu(top);
  const q = (s) => top.querySelector(s);
  const st = q('.bnp-stats'); const sc = st && getComputedStyle(st);
  const body = document.querySelector('section.bnp-body'); const bc = getComputedStyle(body); const bw = getComputedStyle(body.querySelector(':scope > .wrap'));
  const rel = (e) => { const k = kutu(e); return { x: k.x - W.x, y: k.y - W.y, w: k.w, sag: W.sag - k.sag }; };
  return {
    'bölüm x': T.x, 'bölüm genişlik': T.w, '.wrap x': W.x, '.wrap genişlik': W.w, '.wrap üst pay': W.y - T.y,
    'kırıntı x': rel(q('nav.rd-crumb')).x, 'kırıntı y': rel(q('nav.rd-crumb')).y, 'kırıntı genişlik': rel(q('nav.rd-crumb')).w,
    'eyebrow x': rel(q('.bnp-head .eyebrow')).x, 'h1 x': rel(q('.bnp-head h1')).x,
    'sayaç sağ pay': st ? rel(st).sag : null, 'sayaç sol çizgi': st ? parseFloat(sc.borderLeftWidth) : null, 'sayaç sol boşluk': st ? parseFloat(sc.paddingLeft) : null,
    ...(innerWidth < 700 && st ? { 'sayaç x (390)': rel(st).x, 'sayaç genişlik (390)': rel(st).w } : {}),
    'sayaç .st yükseklik': st ? Math.max(...[...st.querySelectorAll('.st')].map((e) => e.getBoundingClientRect().height)) : null,
    'panel köşe': parseFloat(bc.borderTopLeftRadius), 'panel binme': parseFloat(bc.marginTop), 'panel üst boşluk': parseFloat(bc.paddingTop),
    'panel .wrap sol': parseFloat(bw.paddingLeft), 'panel .wrap sağ': parseFloat(bw.paddingRight),
    _bilgi: st ? { 'sayaç genişlik': kutu(st).w, '.st genişlikleri': [...st.querySelectorAll('.st')].map((e) => Math.round(e.getBoundingClientRect().width)) } : {},
  };
}

const b = await chromium.launch();
let kirmizi = 0, olcum = 0;
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const ac = async (u, boz) => { const p = await ctx.newPage(); await p.goto(u, { waitUntil: 'load' }); if (boz) await p.addStyleTag({ content: '.bnp-head h1{margin-left:20px!important}section.bnp-body{border-radius:0!important}' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400); const r = await p.evaluate(olc); await p.close(); return r; };
  const D = await ac(DONOR, false);
  if (!D) { console.error('donörde section.bnp-top yok'); process.exit(2); }
  for (const s of SAYFALAR) {
    const P = await ac(TABAN + s, BOZ); olcum++;
    if (!P) { kirmizi++; console.log(`✗ ${w} ${s}: iskelet yok (section.bnp-top)`); continue; }
    const sapma = [];
    for (const [k, v] of Object.entries(D)) { if (k === '_bilgi' || v === null) continue; if (P[k] === null || Math.abs(P[k] - v) > TOL) sapma.push(`${k}: donör ${Math.round(v)} ≠ V2 ${P[k] === null ? 'yok' : Math.round(P[k])}`); }
    if (sapma.length) kirmizi++;
    console.log(`${sapma.length ? '✗' : '✓'} ${w} ${s.padEnd(58)} ${Object.keys(D).length - 1} ölçü · bilgi: sayaç genişliği donör ${Math.round(D._bilgi['sayaç genişlik'])} / V2 ${Math.round(P._bilgi['sayaç genişlik'] || 0)} (metne bağlı)${sapma.length ? '\n    ' + sapma.join('\n    ') : ''}`);
  }
  await ctx.close();
}
await b.close();
if (BOZ) { console.log(kirmizi ? `\nBOZ sınaması: ${kirmizi}/${olcum} kırmızı → kapı kırmızı verebiliyor ✓` : '\nBOZ sınaması: KAPI KÖR ✗'); process.exit(kirmizi ? 1 : 3); }
console.log(kirmizi ? `\nİSKELET PARİTESİ KIRMIZI (${kirmizi}/${olcum})` : `\nİSKELET PARİTESİ YEŞİL: ${olcum} ölçüm (sayfa × 1440/390), banner + panel donörle ${TOL}px içinde`);
process.exit(kirmizi ? 1 : 0);
