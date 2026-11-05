// "Başa dön" (#toTop) düğmesi reklamlı görünümde yan karta ya da alt bara örtülmüyor mu — hit-test, ≥1280 genişlikler + 390
// Kırmızı kanıtı: R16 öncesi Pages'te (a1c5a31) 1280/1366/1440/1920 kırmızı.
import { chromium } from 'playwright';
const T = process.env.TABAN || 'http://localhost:8790/DadaGastroVideo/';
const sayfalar = ['video-mutfagi.html', 'video-seriler.html', 'video-seri-kazan-kaynayan-topraklar.html', 'video-izle-karadeniz-yaylalarindan-hakiki-kuymak.html', 'video-sef-berkan-gunes.html'];
const b = await chromium.launch(); let kirmizi = 0, olculen = 0;
for (const w of [1280, 1366, 1440, 1920, 390]) { const p = await b.newPage({ viewport: { width: w, height: w > 500 ? 900 : 844 } });
  for (const s of sayfalar) {
    await p.goto(T + s + '?reklam=1', { waitUntil: 'load' });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (const oran of [0.35, 0.6]) {
      await p.evaluate(y => scrollTo(0, y), Math.round(H * oran)); await p.waitForTimeout(900);
      const r = await p.evaluate(() => {
        const t = document.getElementById('toTop'); if (!t || !t.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return null;
        const k = t.getBoundingClientRect(); const x = k.left + k.width / 2, y = k.top + k.height / 2; const e = document.elementFromPoint(x, y);
        const yan = [...document.querySelectorAll('.rk-std-side,.rk-std-altbar')].filter(n => !n.hidden && n.checkVisibility()).map(n => n.getBoundingClientRect()).some(q => q.left < k.right && q.right > k.left && q.top < k.bottom && q.bottom > k.top);
        return { isabet: t === e || t.contains(e), cakisma: yan, ust: e ? String(e.className).slice(0, 40) : null };
      });
      if (!r) continue; olculen++;
      const iyi = r.isabet && !r.cakisma; if (!iyi) kirmizi++;
      if (!iyi || process.env.AYRINTI) console.log(iyi ? '✓' : '✗', w, s, oran, JSON.stringify(r));
    }
  } await p.close(); }
await b.close(); console.log(`ölçülen ${olculen} · kırmızı ${kirmizi}`); process.exit(kirmizi || !olculen ? 1 : 0);
