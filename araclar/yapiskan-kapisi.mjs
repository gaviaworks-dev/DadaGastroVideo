// Yapışkan kabuk kapısı (Health R3 davranışı): Video sayfasında
//   1) başta: Gastro header görünür, Video alt menüsü (.vd-ust) header'ın hemen altında
//   2) gerçek tekerlekle aşağı: YALNIZ header.header gizlenir (ekran dışı), üst siyah bant (.topbar, 1440) yerinde kalır,
//      .vd-ust bandın hemen altına (390'da en üste) yapışır; --vd-bar-alt = .vd-ust alt kenarı (±1px)
//   3) yukarı: header geri gelir, .vd-ust yine header'ın altında
//   4) reduced-motion: header'ın transition'ı yok (anında)
// Görünürlük checkVisibility + elementFromPoint isabetiyle (header'ın ortasına tıklayan nokta header'a mı düşüyor).
// Kullanım: node araclar/yapiskan-kapisi.mjs [sayfa.html]   (vars. video-mutfagi.html)
//           BOZ=1 → kabuk.js yüklenmeden (istek engellenir) ölçülür; header aşağı kayınca gizlenmediği için kırmızı vermeli.
import { chromium } from 'playwright';
const TABAN = process.env.TABAN || 'http://localhost:8795/DadaGastroVideo/';
const SAYFA = process.argv[2] || 'video-mutfagi.html';
const BOZ = !!process.env.BOZ;
const b = await chromium.launch();
let kirmizi = 0;
// ---------- V2 (V2=1 ya da TABAN …/v2/): alt menü YOK; Gastro header'ı kanonundaki gibi sabit kalır ----------
// Ölçülen: .vd-ust yok · başta ve aşağı kaydırınca header görünür ve en üstte (checkVisibility + elementFromPoint isabeti) ·
// --vd-bar-alt = header'ın alt kenarı (±1, sayfa yapışkan barları buna yapışır) · koyu banner'lı sayfada başta header saydam (koyu-hero
// hâli), kaydırınca header'ın arkası koyu bandın dışına çıkınca Gastro betiği kendi hâline geçirir (yalnız raporlanır).
// BOZ=1 → header'a translateY(-200px) eklenir; kapı kırmızı vermeli.
if (process.env.V2 || /\/v2\/$/.test(TABAN)) {
  const T2 = /\/v2\/$/.test(TABAN) ? TABAN : TABAN + 'v2/';
  for (const [w, rm] of [[1440, 'no-preference'], [390, 'no-preference'], [1440, 'reduce']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: rm });
    const p = await ctx.newPage();
    await p.goto(T2 + SAYFA, { waitUntil: 'load' }); await p.waitForTimeout(700);
    if (BOZ) await p.addStyleTag({ content: 'header.header{transform:translateY(-200px)!important}' });
    const durum = () => p.evaluate(() => {
      const h = document.querySelector('header.header'); const r = h.getBoundingClientRect();
      const n = document.elementFromPoint(innerWidth / 2, Math.max(1, r.top + r.height / 2));
      const prob = document.createElement('div'); prob.style.cssText = 'position:fixed;top:var(--vd-bar-alt);height:0'; document.body.appendChild(prob); const alt = prob.getBoundingClientRect().top; prob.remove();
      return { ust: Math.round(r.top), altKenar: Math.round(r.bottom), gorunur: h.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && r.bottom > 1 && !!(n && n.closest('header.header')),
        vdUst: !!document.querySelector('.vd-ust'), barAlt: Math.round(alt), zemin: getComputedStyle(h).backgroundColor, sinif: h.className };
    });
    const d0 = await durum();
    for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 250); await p.waitForTimeout(60); }
    await p.waitForTimeout(600);
    const d1 = await durum();
    const sorun = [];
    if (d0.vdUst) sorun.push('V1 alt menüsü (.vd-ust) V2 sayfasında var');
    for (const [ad, d] of [['başta', d0], ['aşağıda', d1]]) {
      if (!d.gorunur) sorun.push(`${ad} header görünmüyor (${d.ust}…${d.altKenar})`);
      if (Math.abs(d.barAlt - d.altKenar) > 1) sorun.push(`${ad} --vd-bar-alt (${d.barAlt}) ≠ header alt kenarı (${d.altKenar})`);
    }
    if (sorun.length) kirmizi++;
    console.log(`${sorun.length ? '✗' : '✓'} ${w}${rm === 'reduce' ? ' reduced-motion' : ''} v2/${SAYFA}  başta: header ${d0.ust}–${d0.altKenar} zemin ${d0.zemin} · aşağıda: header ${d1.ust}–${d1.altKenar} zemin ${d1.zemin} · --vd-bar-alt ${d1.barAlt}${sorun.length ? '\n    ' + sorun.join('\n    ') : ''}`);
    await ctx.close();
  }
  await b.close();
  if (BOZ) { console.log(kirmizi ? `BOZ sınaması: ${kirmizi} durum kırmızı → kapı kırmızı verebiliyor ✓` : 'BOZ sınaması: KAPI KÖR ✗'); process.exit(kirmizi ? 1 : 3); }
  process.exit(kirmizi ? 1 : 0);
}
for (const [w, rm] of [[1440, 'no-preference'], [390, 'no-preference'], [1440, 'reduce']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: rm });
  const p = await ctx.newPage();
  if (BOZ) await p.route('**/kabuk.js*', (r) => r.abort());
  await p.goto(TABAN + SAYFA, { waitUntil: 'load' }); await p.waitForTimeout(700);
  const durum = () => p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const h = r('header.header'), t = r('.topbar'), u = r('.vd-ust');
    const hEl = document.querySelector('header.header');
    const ortaX = innerWidth / 2, ortaY = h ? h.top + h.height / 2 : -1;
    const nokta = ortaY > 0 && ortaY < innerHeight ? document.elementFromPoint(ortaX, ortaY) : null;
    const isabet = !!(nokta && nokta.closest('header.header'));
    const prob = document.createElement('div'); prob.style.cssText = 'position:fixed;top:var(--vd-bar-alt);height:0'; document.body.appendChild(prob); const altPx = prob.getBoundingClientRect().top; prob.remove();
    return { hUst: h && Math.round(h.top), hAlt: h && Math.round(h.bottom), headerGorunur: hEl.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && h.bottom > 1 && isabet,
      bantAlt: t && t.height ? Math.round(t.bottom) : 0, ustUst: u && Math.round(u.top), ustAlt: u && Math.round(u.bottom), altPx: Math.round(altPx), gecis: getComputedStyle(hEl).transitionDuration };
  });
  const sorun = [];
  const d0 = await durum();
  if (!d0.headerGorunur) sorun.push('başta header görünmüyor');
  if (Math.abs(d0.ustUst - d0.hAlt) > 1) sorun.push(`başta alt menü header altında değil (menü ${d0.ustUst} · header alt ${d0.hAlt})`);
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 250); await p.waitForTimeout(60); }
  await p.waitForTimeout(600);
  const d1 = await durum();
  if (d1.headerGorunur) sorun.push(`aşağı kayınca header gizlenmedi (header ${d1.hUst}…${d1.hAlt})`);
  if (Math.abs(d1.ustUst - d1.bantAlt) > 1) sorun.push(`aşağıda alt menü bandın altına yapışmadı (menü ${d1.ustUst} · bant alt ${d1.bantAlt})`);
  if (Math.abs(d1.altPx - d1.ustAlt) > 1) sorun.push(`--vd-bar-alt (${d1.altPx}) ≠ alt menü alt kenarı (${d1.ustAlt})`);
  for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(60); }
  await p.waitForTimeout(600);
  const d2 = await durum();
  if (!d2.headerGorunur) sorun.push('yukarı kayınca header geri gelmedi');
  if (Math.abs(d2.ustUst - d2.hAlt) > 1) sorun.push(`yukarıda alt menü header altında değil (menü ${d2.ustUst} · header alt ${d2.hAlt})`);
  if (rm === 'reduce' && d2.gecis !== '0s') sorun.push(`reduced-motion'da geçiş var (${d2.gecis})`);
  if (sorun.length) kirmizi++;
  console.log(`${sorun.length ? '✗' : '✓'} ${w}${rm === 'reduce' ? ' reduced-motion' : ''} ${SAYFA}  başta: header ${d0.hUst}–${d0.hAlt}, menü ${d0.ustUst}–${d0.ustAlt} · aşağı: header ${d1.hUst}–${d1.hAlt}, bant ${d1.bantAlt}, menü ${d1.ustUst}–${d1.ustAlt}, --vd-bar-alt ${d1.altPx} · yukarı: header ${d2.hUst}–${d2.hAlt}, menü ${d2.ustUst}${sorun.length ? '\n    ' + sorun.join('\n    ') : ''}`);
  await ctx.close();
}
await b.close();
if (BOZ) { console.log(kirmizi ? `BOZ sınaması: ${kirmizi} durum kırmızı → kapı kırmızı verebiliyor ✓` : 'BOZ sınaması: KAPI KÖR ✗'); process.exit(kirmizi ? 1 : 3); }
process.exit(kirmizi ? 1 : 0);
