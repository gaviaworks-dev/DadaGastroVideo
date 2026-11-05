// Kırmızı kanıtı: taşıma kipinden önce (Pages 0c03611) reklamlı gezinti tariften dönünce düşüyordu → 1440/390 reklamlı 2 kırmızı.
// Gerçek tıklamayla gezinti (force yok, isabet denetimli): 1440 + 390, reklamsız + reklamlı
// index → Video Mutfağı → izle → yazılı tarif → izle → alt menü Seriler → seri → şef → alt menü 30 Saniyede Tat
import { chromium } from 'playwright';
const K = process.env.TABAN || 'http://localhost:8790/DadaGastroVideo/';
// V2 (TABAN …/v2/, kabuk ekledi): alt menü (nav.vd-ust) yok → Seriler / 30 Saniyede Tat header'daki "Video Mutfağı" açılır menüsünden
// (1440: üzerine gel + .dropdown bağı; 390: çekmece → Video alt menüsü aç → .d-sub bağı); reklam anahtarı banner yuvasında.
const V2 = /\/v2\/$/.test(K);
async function menuGit(p, w, href, ad) {
  if (w < 500) {
    await p.click('#hamburger'); await p.waitForTimeout(500);
    await p.locator('.d-item.d-has-sub:has(a.d-link[href^="video-mutfagi.html"]) .d-toggle').click(); await p.waitForTimeout(400);
    return tikla(p, p.locator(`.d-sub a[href^="${href}"]`).filter({ visible: true }), ad);
  }
  await p.hover('.nav-item:has(> a[href^="video-mutfagi.html"])'); await p.waitForTimeout(400);
  return tikla(p, p.locator(`.nav-item .dropdown a[href^="${href}"]`).filter({ visible: true }), ad);
}
const b = await chromium.launch(); let kirmizi = 0;
async function tikla(p, loc, ad) {
  const a = loc.first(); await a.scrollIntoViewIfNeeded();
  const isabet = await a.evaluate((n) => { n.scrollIntoView({ block: 'center' }); const r = n.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return n === e || n.contains(e); });
  if (!isabet) { kirmizi++; console.log('  ✗ isabet yok:', ad); }
  await Promise.all([p.waitForLoadState('load'), a.click()]); await p.waitForTimeout(500);
  return p.url().split('/').pop();
}
for (const w of [1440, 390]) for (const reklam of [false, true]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 500 ? 900 : 844 } });
  const hata = []; p.on('pageerror', (e) => hata.push(e.message));
  const kotu = []; p.on('response', (r) => { if (r.status() >= 400) kotu.push(r.status() + ' ' + r.url()); });
  await p.goto(K + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
  const yol = ['index'];
  if (w < 500) { await p.click('#hamburger'); await p.waitForTimeout(600); yol.push(await tikla(p, p.locator('a.d-link[href^="video-mutfagi.html"]'), 'çekmece Video')); }
  // V2: üst bağ Gastro kanonunda açılır menüyü açar (donörde "Mutfak Sırları" da gezmez, ölçüldü) → hub'a menüdeki "Keşfet"ten
  else yol.push(V2 ? await menuGit(p, w, 'video-mutfagi.html', 'Video menüsü Keşfet') : await tikla(p, p.locator('header a[href^="video-mutfagi.html"]').filter({ visible: true }), 'header Video'));
  if (reklam) { // index'te reklam katmanı yok; hub'da açıp devam
    await tikla(p, p.locator(V2 ? '[data-vd-v2-arac] [data-vd-reklam-anahtari]' : 'nav.vd-ust [data-vd-reklam-anahtari]').filter({ visible: true }), 'Reklamlı görünüm düğmesi');
    yol.push('[anahtar→' + p.url().split('/').pop() + ']');
  }
  yol.push(await tikla(p, p.locator('#tum-videolar a[href^="video-izle-"]').filter({ visible: true }), 'izle kartı'));
  yol.push(await tikla(p, p.locator('main a[href^="tarif-"]').filter({ visible: true }), 'yazılı tarif'));
  yol.push(await tikla(p, p.locator('main a[href^="video-izle-"]').filter({ visible: true }), 'tariften videoya'));
  yol.push(V2 ? await menuGit(p, w, 'video-seriler.html', 'Video menüsü Seriler') : await tikla(p, p.locator('nav.vd-ust a[href^="video-seriler.html"]').filter({ visible: true }), 'alt menü Seriler'));
  yol.push(await tikla(p, p.locator('main a[href^="video-seri-"]').filter({ visible: true }), 'seri kartı'));
  yol.push(await tikla(p, p.locator('main a[href^="video-sef-"]').filter({ visible: true }), 'şef'));
  yol.push(V2 ? await menuGit(p, w, 'video-kisa.html', 'Video menüsü 30 sn') : await tikla(p, p.locator('nav.vd-ust a[href^="video-kisa.html"], nav.vd-ust a:has-text("30 Saniyede Tat")').filter({ visible: true }), 'alt menü 30 sn'));
  const reklamKaldi = await p.evaluate(() => document.documentElement.classList.contains('vd-reklamli'));

  if (reklam) { await p.goto(K + 'index.html?reklam=1', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const h = await p.evaluate(() => [...document.querySelectorAll('a[href^="video-mutfagi.html"]')].every((a) => a.getAttribute('href').includes('reklam=1')));
    yol.push('[index?reklam=1 → Video bağları reklam=1: ' + h + ']'); if (!h) kirmizi++; }
  const iyi = hata.length === 0 && kotu.length === 0 && reklamKaldi === reklam;
  if (!iyi) kirmizi++;
  console.log(iyi ? '✓' : '✗', w, reklam ? 'reklamlı' : 'reklamsız', yol.join(' → '), '· JS', hata.length, '· 4xx', kotu.length, '· reklamlı kaldı', reklamKaldi, kotu.slice(0, 2).join(' '));
  await p.close();
}
await b.close(); console.log('kırmızı', kirmizi); process.exit(kirmizi ? 1 : 0);
