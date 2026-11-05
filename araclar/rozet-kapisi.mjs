// Header + çekmece "VİDEO" rozeti reklamsız ve reklamlı görünümde kırmızı mı (#BA3413)
import { chromium } from 'playwright';
const T = process.env.TABAN || 'http://localhost:8790/DadaGastroVideo/'; const b = await chromium.launch(); let kirmizi = 0;
const sayfalar = ['video-mutfagi.html','video-seriler.html','video-seri-kazan-kaynayan-topraklar.html','video-izle-karadeniz-yaylalarindan-hakiki-kuymak.html','video-sef-berkan-gunes.html','video-kisa.html','index.html'];
for (const w of [1440, 390]) { const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const s of sayfalar) for (const q of ['', '?reklam=1']) {
    await p.goto(T + s + q, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const r = await p.evaluate(() => [...document.querySelectorAll('a[href^="video-mutfagi.html"] > .soon')].map(e => getComputedStyle(e).backgroundColor));
    const iyi = r.length > 0 && r.every(c => c === 'rgb(186, 52, 19)');
    if (!iyi) kirmizi++; console.log(iyi ? '✓' : '✗', w, s + q, r.length, [...new Set(r)].join(' '));
  } await p.close(); }
await b.close(); console.log('kırmızı', kirmizi); process.exit(kirmizi ? 1 : 0);
