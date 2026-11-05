// Reklam kapısı · V2 (reklam ajanı; V1'in araclar/reklam-kapisi.mjs kopyası + V2 denetimleri: anahtar koyu banner'da "Prototip" ibaresiyle,
// açılışta (hero'lar görünürken) yan kart / alt bar yok, yan kartın üstü başlık altının 24 px aşağısında).
// Reklam kapısı (reklam ajanı). Her video sayfa tipi × 1440/390 × (reklamsız, ?reklam=1):
//   reklamsız : görünür reklam 0 (modül sınıfı taşıyan görünür öğe yok), bütün [data-vd-reklam] gizli ve boş, modül CSS'i yüklenmemiş
//   reklamlı  : sayfa tipinin tanımlı her yuvası görünür ve dolu; içindeki görseller 200 + çizilmiş; "Sponsorlu" ve "prototip örneği" metni görünür;
//               1440'ta side çifti içerik kolonunun dışında, 390'da yok; alt sabit bar mobilde .bottom-nav'ın üstünde
//   ikisinde de: yatay taşma 0 · JS hatası 0 · 4xx/5xx 0 · localStorage/sessionStorage boş
//   örtme      : sabit reklam öğeleri h1'i ve oynatıcıyı örtmez (elementFromPoint, açılışta); sayfa sonunda son içerik alt barın altında kalmaz
//   anahtar    : force'suz, isabeti doğrulanmış tıklama → adres ?reklam=1 olur / kalkar; iç bağlar (*.html) parametreyi taşır / bırakır
// Kullanım: TABAN=http://localhost:8798/DadaGastroVideo/v2/ node araclar/reklam-kapisi-v2.mjs [--sinama] [tip…]
//   --sinama : reklam ajanının geçici rk-sinama-<tip>.html sayfaları (entegrasyondan önce)
//   BOZ=gorunur|depo|bag|gorsel|ortu|anahtar|kesme|eslik|kisaadres|hero|kirinti|yanust|wrap → bilerek bozulmuş düzenek; kapı KIRMIZI vermeli
import { chromium } from 'playwright';

const TABAN = process.env.TABAN || 'http://localhost:8798/DadaGastroVideo/v2/';
const BOZ = process.env.BOZ || '';
const arg = process.argv.slice(2);
const SINAMA = arg.includes('--sinama');
const GERCEK = {
  hub: 'video-mutfagi.html', seriler: 'video-seriler.html', seri: 'video-seri-akilli-ekipman-test.html',
  izle: 'video-izle-airfryer-kullanirken-yapilan-5-kritik-hata.html', sef: 'video-sef-polat-abadan.html', kisa: 'video-kisa.html',
  sefler: 'video-sefler.html',
};
// sayfa tipi → tanımlı yuvalar (tasks/reklam-durum.md yerleşim planı)
const BEKLENEN = {
  hub: ['VD-B1', 'VD-N1', 'VD-B1-END', 'SERI-SPONSOR', 'STD'],
  seriler: ['VS-B1', 'VS-B1-END', 'SERI-SPONSOR', 'STD'],
  seri: ['VD-S1', 'VD-S1-END', 'SERI-SPONSOR', 'STD'],
  izle: ['VD-S1', 'VD-S1-END', 'TD-ESLIK', 'SERI-SPONSOR', 'STD'],
  sef: ['SF-P1', 'SF-P1-END', 'STD'],
  kisa: ['VD-N1'],
  sefler: ['SF-L1', 'SF-N2', 'SF-L1-END', 'STD'], // modülün şef dizini planı (sef-liste)
};
const tipler = arg.filter((a) => !a.startsWith('--'));
const SECIM = (tipler.length ? tipler : Object.keys(BEKLENEN));
const sayfaAdi = (t) => (SINAMA ? `rk-sinama-${t}.html` : GERCEK[t]);

let kirmizi = 0, yesil = 0;
const sonuc = (tamam, et) => { if (tamam) yesil++; else { kirmizi++; console.log(`  🔴 ${et}`); } };
const bekle = (p, ms) => p.waitForTimeout(ms);

async function sayfaAc(b, t, gen, sorgu) {
  const p = await b.newPage({ viewport: { width: gen, height: 900 } });
  const hata = [], kotu = [], reklamYanit = [];
  p.on('pageerror', (e) => hata.push(e.message));
  p.on('response', (r) => { const u = r.url(); if (r.status() >= 400) kotu.push(`${r.status()} ${u.replace(TABAN, '')}`); if (/varlik\/(video|gastro)\/reklam\//.test(u)) reklamYanit.push([r.status(), u.replace(TABAN, '')]); });
  if (BOZ === 'gorunur' || BOZ === 'bag' || BOZ === 'depo' || BOZ === 'kesme' || BOZ === 'hero') {
    await p.route('**/varlik/v2/js/reklam.js*', async (rt) => {
      const yan = await rt.fetch(); let js = await yan.text();
      if (BOZ === 'gorunur') js = js.replace('kaplar().forEach((k) => { k.hidden = true; });', 'kaplar().forEach(doldur);');
      if (BOZ === 'bag') js = js.replace('baglariCevir(d, true);\n', '\n');
      if (BOZ === 'hero') js = js.replace('const heroGecti = hb === null ||', 'const heroGecti = true ||');
      if (BOZ === 'kesme') js = js.replace('w.VD.kirp(kok || d);', '');
      if (BOZ === 'depo') js = js.replace("const PARAM = 'reklam';", "const PARAM = 'reklam'; try { localStorage.setItem('vd-reklam', '1'); } catch {}");
      await rt.fulfill({ response: yan, body: js });
    });
  }
  if (BOZ === 'kisaadres') await p.route('**/varlik/v2/js/kisa.js*', async (rt) => { const yan = await rt.fetch(); const js = (await yan.text()).replace(/function kisaAdresi\(slug\) \{/, "function kisaAdresi(slug) { return 'video-kisa.html?v=' + encodeURIComponent(slug);"); await rt.fulfill({ response: yan, body: js }); });
  if (BOZ === 'gorsel') await p.route('**/varlik/video/reklam/*-urun.webp', (rt) => rt.fulfill({ status: 404, body: '' }));
  await p.goto(TABAN + sayfaAdi(t) + sorgu, { waitUntil: 'load' });
  await bekle(p, 900);
  if (BOZ === 'wrap') await p.addStyleTag({ content: '.wrap .vd-reklam > .rk-yayilim-alan.wrap{padding-inline:32px!important}' });
  if (BOZ === 'kirinti') await p.addStyleTag({ content: '.rd-crumb{padding-right:0!important}' });
  if (BOZ === 'yanust') await p.addStyleTag({ content: '[data-rk-side-pair] .rk-std-side{top:60px!important}' });
  if (BOZ === 'eslik') await p.addStyleTag({ content: '.vd-reklam .ing-row.rk-malzeme.eslik-kart{grid-template-rows:30px auto auto!important}' });
  if (BOZ === 'ortu') await p.addStyleTag({ content: '.rk-std-altbar{top:40vh!important;bottom:auto!important}' });
  return { p, hata, kotu, reklamYanit };
}

// --- sayfa içi ölçümler ---
const OLC = {
  gorunurReklam: () => {
    const g = (n) => n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const moduller = [...document.querySelectorAll('.rk-slot, .rk-std, .rk-native-hap, [data-rk-slot], .rk-yayilim-alan, [data-rk-standart]')].filter(g).length;
    const kaplar = [...document.querySelectorAll('[data-vd-reklam]')];
    return { moduller, kap: kaplar.length, gorunurKap: kaplar.filter(g).length, dolu: kaplar.filter((k) => k.querySelector(':scope > template') && k.querySelector(':scope > :not(template)')).length, css: document.querySelectorAll('link[data-vd-reklam-css]').length };
  },
  tasma: () => document.documentElement.scrollWidth - window.innerWidth,
  depo: () => { try { return localStorage.length + sessionStorage.length; } catch { return -1; } },
};

async function yuvaDenetle(p, kod) {
  // kabı görünür kıl (tembel görseller), sonra ölç
  return p.evaluate(async (kod) => {
    const g = (n) => !!n && n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const kaplar = [...document.querySelectorAll(`[data-vd-reklam="${kod}"]`)];
    if (!kaplar.length) return { yok: true };
    const s = [];
    for (const k of kaplar) {
      if (k.closest('[data-katman][hidden], [role="dialog"][hidden]')) { s.push({ dolu: true, std: true, katman: true }); continue; } // kapalı katman (hub'daki kısa video katmanı): ölçülmedi
      const ic = k.querySelector(':scope > :not(template)');
      const hedef = (getComputedStyle(k).display === 'contents' ? ic : k);
      if (!ic) { s.push({ dolu: false }); continue; }
      if (kod === 'STD') { s.push({ dolu: true, std: true }); continue; }
      // gizli sekmedeki yuva (ör. hub spotlight "Sponsorlu Şef" sekmesi): sekmesini açıp ölç
      const panel = k.closest('[role="tabpanel"][hidden]');
      if (panel) { const sekme = document.querySelector(`[role="tab"][aria-controls="${panel.id}"]`); if (sekme) { sekme.click(); await new Promise((r) => setTimeout(r, 400)); } }
      // eşlik kartı kaydırılan panel listesinin sonunda
      const liste = k.closest('.vd-panel__liste'); if (liste) { liste.scrollTop = liste.scrollHeight; }
      hedef.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 450));
      const imgs = [...k.querySelectorAll('img')].filter(g);
      for (const i of imgs) { if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 3000); }); }
      const kotuImg = imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src'));
      const bg = [...k.querySelectorAll('.eslik-kart-gorsel, .eslik-kart-logo')].map((n) => getComputedStyle(n).backgroundImage);
      const metinGorunur = (re) => { const w = document.createTreeWalker(k, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (re.test(n.textContent) && g(n.parentElement)) return true; return false; };
      let cakisma = [];
      if (k.querySelector('.eslik-kart')) { // eşlik kartı: "Sponsorlu" hapı ürün adına / sepete / logoya binmemeli
        const R = (s2) => { const e = k.querySelector(s2); return e && g(e) ? e.getBoundingClientRect() : null; };
        const kes = (a, c) => a && c && a.left < c.right - 0.5 && c.left < a.right - 0.5 && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5;
        const et = R('.rk-etiket'), ad = R('.eslik-kart-ad'), sep = R('.ing-add'), logo = R('.eslik-kart-logo');
        if (kes(et, ad)) cakisma.push('etiket↔ürün adı'); if (kes(et, sep)) cakisma.push('etiket↔sepet'); if (kes(logo, sep)) cakisma.push('logo↔sepet'); if (kes(logo, ad)) cakisma.push('logo↔ürün adı');
      }
      const kutu = hedef.getBoundingClientRect();
      s.push({ dolu: true, gorunur: g(hedef) && kutu.width > 0 && kutu.height > 0, img: imgs.length, kotuImg, bgYok: bg.filter((x) => x === 'none').length, sponsorlu: metinGorunur(/Sponsorlu/), ornek: metinGorunur(/prototip örneği/i), cakisma });
    }
    return { s };
  }, kod);
}

async function standartDenetle(p, gen) {
  // side: hero geçilmiş, altbilgi görünmez bir konuma kaydır
  const r = await p.evaluate(async (gen) => {
    const g = (n) => !!n && n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const h = document.documentElement.scrollHeight;
    // ölçüm konumu: en alttaki hero başlık çizgisini 60 px geçmiş, (perde) altbilgi henüz görünmüyor — sabit %42 kısa sayfada altbilgiye düşüyordu
    const basAlt = () => { let u = 0; document.querySelectorAll('header.header, .topbar').forEach((n) => { const r = n.getBoundingClientRect(); if (r.height && r.top < 200 && r.bottom > 0) u = Math.max(u, r.bottom); }); return u; };
    const heroAbs = Math.max(0, ...[...document.querySelectorAll('main [data-rk-hero]')].map((n) => n.getBoundingClientRect().bottom + scrollY));
    window.scrollTo({ top: heroAbs ? Math.round(heroAbs - basAlt() + 60) : Math.round(h * 0.42), behavior: 'instant' }); await new Promise((r) => setTimeout(r, 700));
    const mainAlt = document.querySelector('main').getBoundingClientRect().bottom;
    if (mainAlt < innerHeight) return { olcülmedi: `içerik ${Math.round(mainAlt)} px'te bitiyor (altbilgi görünür)` };
    const yanlar = [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-side')].filter(g).map((n) => n.getBoundingClientRect());
    let sol = innerWidth, sag = 0;
    document.querySelectorAll('main .wrap, main > .container').forEach((n) => { const r = n.getBoundingClientRect(), s = getComputedStyle(n); if (r.width > 600) { sol = Math.min(sol, r.left + parseFloat(s.paddingLeft)); sag = Math.max(sag, r.right - parseFloat(s.paddingRight)); } });
    const icerikte = yanlar.filter((r) => r.right > sol && r.left < sag).length;
    const bar = document.querySelector('[data-vd-reklam="STD"] .rk-std-altbar'); const br = bar && bar.getBoundingClientRect();
    const nav = document.querySelector('.bottom-nav'); const navUst = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : Infinity;
    let ust = 0; document.querySelectorAll('header.header, .topbar').forEach((n) => { const r = n.getBoundingClientRect(); if (r.height && r.top < 200 && r.bottom > 0) ust = Math.max(ust, r.bottom); });
    const yanUst = yanlar.map((r) => Math.round(r.top - ust));
    const etiket = [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-etiket')].filter(g).map((n) => n.textContent);
    return { yan: yanlar.length, yanUst, icerikte, bar: g(bar), barAlt: br ? br.bottom : 0, navUst, barTasma: br ? (br.left < 0 || br.right > innerWidth) : false, etiket };
  }, gen);
  return r;
}

async function ortmeDenetle(p) {
  return p.evaluate(async () => {
    const rk = (n) => !!n && !!n.closest('[data-vd-reklam], .rk-std');
    const sonuc = [];
    window.scrollTo({ top: 0, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 600));
    const hedefler = [...document.querySelectorAll('main h1, main .vd-oyn, main [data-vd-oyn]')].filter((n) => !rk(n) && n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
    for (const n of hedefler) {
      const r = n.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) continue; // açılışta ekranda olanlar
      // görünen kısmın ızgarası (yalnız merkez yetmez: şerit kenardan girer)
      const ust = Math.max(r.top, 0) + 4, alt = Math.min(r.bottom, innerHeight) - 4, sol = r.left + 4, sag = r.right - 4;
      const nokta = []; for (const fx of [0, 0.5, 1]) for (let y = ust; y <= alt; y += 24) nokta.push([sol + (sag - sol) * fx, y]); // 24 px adım: en ince sabit öğe (alt bar 64 px) kaçmaz
      for (const [x, y] of nokta) { const e = document.elementFromPoint(x, y); if (rk(e)) { sonuc.push(`${n.tagName.toLowerCase()}.${(n.className || '').toString().split(' ')[0]} @${Math.round(x)},${Math.round(y)} ← ${e.className}`); break; } }
    }
    // sayfa sonu: içerik (main'in son öğesi) alt barın altında kalmaz
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 600));
    const bar = document.querySelector('[data-vd-reklam="STD"] .rk-std-altbar:not([hidden])');
    if (bar) { const main = document.querySelector('main'); const alt = main.getBoundingClientRect().bottom; const ust = bar.getBoundingClientRect().top; const ftr = document.querySelector('footer.footer, body > footer'); const fAlt = ftr ? ftr.getBoundingClientRect().bottom : alt; if (Math.max(alt, fAlt) > ust + 1 && Math.max(alt, fAlt) <= innerHeight + 1) sonuc.push(`sayfa sonu: içerik/altbilgi alt kenarı ${Math.round(Math.max(alt, fAlt))} > alt bar üstü ${Math.round(ust)}`); }
    return sonuc;
  });
}

async function anahtarDenetle(p) {
  const tikla = async () => {
    // sayfada birden çok anahtar olabilir (alt menü + kısa video görüntüleyicisinin üst satırı): isabet edilebilen ilki tıklanır
    const hepsi = p.locator('[data-vd-reklam-anahtari]'); let b = null;
    for (let i = 0; i < await hepsi.count(); i++) {
      const a = hepsi.nth(i);
      await a.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' })); await bekle(p, 250);
      const isabet = await a.evaluate((n) => { const r = n.getBoundingClientRect(); if (!r.width) return false; const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && (e === n || n.contains(e)); });
      if (isabet) { b = a; break; }
    }
    if (!b) return false;
    if (BOZ === 'anahtar') await p.evaluate(() => { const b = document.querySelector('[data-vd-reklam-anahtari]'); b.replaceWith(b.cloneNode(true)); document.querySelector('[data-vd-reklam-anahtari]').addEventListener('click', (e) => e.stopImmediatePropagation(), true); });
    await b.click(); await bekle(p, 900); return true;
  };
  const baglar = () => p.evaluate(() => { const ic = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).concat([...document.querySelectorAll('[onclick*="location.href="]')].flatMap((n) => [...n.getAttribute('onclick').matchAll(/location\.href=['"]([^'"]+)['"]/g)].map((m) => m[1]))).filter((h) => !/^(?:[a-z]+:|\/\/|#)/i.test(h) && /^[^?#]*\.html(?:[?#]|$)/.test(h)); return { n: ic.length, param: ic.filter((h) => /[?&]reklam=1(?:&|#|$)/.test(h)).length }; });
  const r = {};
  r.anahtarVar = await p.locator('[data-vd-reklam-anahtari]').count();
  if (!r.anahtarVar) return r;
  r.isabet1 = await tikla(); r.adres1 = new URL(p.url()).searchParams.get('reklam'); r.bag1 = await baglar();
  r.kap1 = await p.evaluate(() => [...document.querySelectorAll('[data-vd-reklam]')].filter((k) => !k.hidden).length);
  r.basili1 = await p.locator('[data-vd-reklam-anahtari]').first().getAttribute('aria-pressed');
  r.isabet2 = await tikla(); r.adres2 = new URL(p.url()).searchParams.get('reklam'); r.bag2 = await baglar();
  r.kap2 = await p.evaluate(() => [...document.querySelectorAll('[data-vd-reklam]')].filter((k) => !k.hidden).length);
  return r;
}


// ---------- K6 süzgeç senaryoları (hub'ın Gastro süzgeci: [data-vd-suzgec] · input[data-sz-secenek] · .fct-row .ft · [data-sz-temizle] · [data-sz-ac]/[data-sz-kapat]) ----------
// Akış içi yuva (VD-N1 · SF-N2 · kısa akış öğesi): görünür organik ([data-sz-oge]) ≥ 3 → 3.'nün ardı · 1–2 → sonuncunun ardı · 0 → gizli.
// Tıklamalar force'suz, scrollIntoView + elementFromPoint isabetiyle (kısayol yok: seçenek kullanıcının tıkladığı etiketten seçilir).
async function isabetliTikla(p, loc) {
  let ok = false; // çekmece kayarak açılır (geçiş): isabet 3 denemeye kadar beklenir
  for (let i = 0; i < 3 && !ok; i++) {
    await loc.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' })); await bekle(p, 250);
    ok = await loc.evaluate((n) => { const r = n.getBoundingClientRect(); if (!r.width) return false; const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && (e === n || n.contains(e) || e.contains(n) || !!e.closest('label')?.contains(n)); });
  }
  if (!ok) return false; await loc.click(); await bekle(p, 450); return true;
}
async function secenekTikla(p, ad, deger) {
  const ft = p.locator(`input[data-sz-secenek][name="${ad}"][value="${deger}"]`).locator('xpath=ancestor::label[1]').locator('.ft').first();
  if (await isabetliTikla(p, ft)) return true;
  // 390: kapalı çekmece ekran dışında ama "görünür" sayılır — isabet yoksa çekmeceyi aç (kullanıcının düğmesiyle), gerekirse akordeon grubunu
  const ac = p.locator('[data-sz-ac]').filter({ visible: true }).first(); if (await ac.count()) await isabetliTikla(p, ac);
  await bekle(p, 300);
  if (await isabetliTikla(p, ft)) return true;
  const ak = p.locator(`input[data-sz-secenek][name="${ad}"]`).first().locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," fct ")][1]').locator('[data-sz-akordeon]').first();
  if (await ak.count()) await isabetliTikla(p, ak);
  return isabetliTikla(p, ft);
}
async function temizle(p) { const t = p.locator('[data-sz-temizle]').filter({ visible: true }).first(); if (await t.count()) return isabetliTikla(p, t); return false; }
async function cekmeceKapat(p) { const k = p.locator('[data-sz-kapat]').filter({ visible: true }).first(); if (await k.count()) await isabetliTikla(p, k); }
const yuvaYeri = (p, kod) => p.evaluate((kod) => { const k = [...document.querySelectorAll(`[data-vd-reklam="${kod}"]`)].find((x) => !x.closest('[data-katman][hidden]')); if (!k) return null;
  const org = [...k.parentElement.querySelectorAll(':scope > [data-sz-oge]')].filter((n) => !n.hidden && n.getClientRects().length);
  const ic = k.querySelector(':scope > :not(template)'); const ilk = ic && (getComputedStyle(k).display === 'contents' ? ic : k);
  // ekrandaki sayılar: "N … bulundu" (Gastro .lst-sum) · kısa görüntüleyici sayacı "n / N" — reklam öğesi sayılmamalı
  const sum = document.querySelector('[data-vd-suzgec] .lst-sum, #lstSum'); const sayac = k.closest('[data-vd-dikey]')?.querySelector('[data-vd-dikey-sira]'); // yalnız yuva kısa akıştaysa (hub'daki kapalı katmanın sayacı değil)
  const sayi = sum && sum.checkVisibility() ? parseInt((sum.textContent.match(/\d+/) || [])[0], 10) : null;
  const n = sayac ? parseInt((sayac.textContent.split('/')[1] || '').trim(), 10) : null;
  return { sira: org.filter((n) => n.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING).length, gorunen: org.length, gizli: !ilk || !ilk.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), sayi, n }; }, kod);
async function suzgecDenetle(p, t, gen, et) {
  const kod = t === 'sefler' ? 'SF-N2' : 'VD-N1';
  if (!(await p.locator('[data-vd-suzgec] input[data-sz-secenek]').count())) { console.log(`  ⚪ ${et}: süzgeç yok — senaryo ÖLÇÜLMEDİ`); return; }
  const secenekler = await p.$$eval('[data-vd-suzgec] input[data-sz-secenek]', (l) => l.map((i) => [i.name, i.value]));
  const dogru = (y) => y && (y.gorunen === 0 ? y.gizli : !y.gizli && y.sira === Math.min(3, y.gorunen));
  const goruldu = new Set();
  for (const [ad, deger] of secenekler) { // tek seçenek: ≥3 ve 1–2 durumlarını bul
    if (goruldu.has('cok') && goruldu.has('az')) break;
    if (!(await secenekTikla(p, ad, deger))) { sonuc(false, `${et}: süzgeç seçeneği ${ad}=${deger} tıklaması isabet etmedi`); return; }
    const y = await yuvaYeri(p, kod); const durum = y.gorunen >= 3 ? 'cok' : y.gorunen > 0 ? 'az' : 'sifir';
    if (y.sayi !== null && !Number.isNaN(y.sayi)) sonuc(y.sayi === y.gorunen, `${et}: süzgeç ${ad}=${deger} → "bulundu" sayısı ${y.sayi}, görünür kart ${y.gorunen} (reklam sayılmamalı)`);
    if (y.n !== null && !Number.isNaN(y.n) && y.gorunen > 0) sonuc(y.n === y.gorunen, `${et}: süzgeç ${ad}=${deger} → kısa sayacı N=${y.n}, görünür öğe ${y.gorunen} (reklam sayılmamalı)`);
    if (!goruldu.has(durum)) { goruldu.add(durum); sonuc(dogru(y), `${et}: süzgeç ${ad}=${deger} → görünür ${y.gorunen}, ${kod} ${y.gizli ? 'gizli' : `${y.sira}. öğeden sonra`} (beklenen ${y.gorunen ? `${Math.min(3, y.gorunen)}.'den sonra` : 'gizli'})`); }
    if (!new URL(p.url()).search.includes(`${ad}=`)) sonuc(false, `${et}: süzgeç adresi yazmadı (${ad})`);
    await temizle(p); await cekmeceKapat(p);
  }
  if (!goruldu.has('sifir')) { // 0 sonuç: farklı gruplardan iki seçenek (gruplar arası VE)
    const gruplar = [...new Set(secenekler.map(([a]) => a))];
    let deneme = 0;
    dis: for (const [a1, d1] of secenekler) for (const [a2, d2] of secenekler) {
      if (a1 >= a2 || !gruplar.includes(a2)) continue;
      if (++deneme > 14) break dis;
      await secenekTikla(p, a1, d1); await secenekTikla(p, a2, d2);
      const y = await yuvaYeri(p, kod);
      if (y.gorunen === 0) { goruldu.add('sifir'); sonuc(dogru(y), `${et}: süzgeç ${a1}=${d1}+${a2}=${d2} → 0 sonuç, ${kod} ${y.gizli ? 'gizli' : 'GÖRÜNÜR'}`); await temizle(p); await cekmeceKapat(p); break dis; }
      await temizle(p); await cekmeceKapat(p);
    }
  }
  for (const d of ['cok', 'az', 'sifir']) if (!goruldu.has(d)) console.log(`  ⚪ ${et}: süzgeçte "${{ cok: '≥3 sonuç', az: '1–2 sonuç', sifir: '0 sonuç' }[d]}" durumu bulunamadı — ÖLÇÜLMEDİ`);
  const son = await yuvaYeri(p, kod); sonuc(dogru(son) && son.sira === Math.min(3, son.gorunen), `${et}: temizleyince ${kod} ${son.sira}. öğeden sonra (görünür ${son.gorunen})`);
  if (son.n !== null && !Number.isNaN(son.n)) sonuc(son.n === son.gorunen, `${et}: süzgeçsiz kısa sayacı N=${son.n}, öğe ${son.gorunen} (reklam sayılmamalı)`);
  // 390 çekmecesi açıkken sabit reklam yok, kapanınca geri
  if (gen < 600 && t !== 'kisa') {
    await p.evaluate(() => { const g = document.querySelector('[data-vd-suzgec]'); window.scrollTo({ top: g.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); }); await bekle(p, 700);
    const sabit = () => p.evaluate(() => [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-side, [data-vd-reklam="STD"] .rk-std-altbar')].filter((n) => n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).length);
    const once = await sabit();
    const ac = p.locator('[data-sz-ac]').filter({ visible: true }).first();
    if (once === 0 || !(await ac.count())) { console.log(`  ⚪ ${et}: çekmece öncesi alt bar görünmüyor (${once}) — çekmece senaryosu ÖLÇÜLMEDİ`); return; }
    await isabetliTikla(p, ac); await bekle(p, 400);
    const acik = await sabit(); sonuc(acik === 0, `${et}: süzgeç çekmecesi açıkken ${acik} sabit reklam öğesi görünür`);
    await cekmeceKapat(p); await bekle(p, 600);
    const kapali = await sabit(); sonuc(kapali > 0, `${et}: çekmece kapanınca alt bar geri gelmedi`);
  }
}

const b = await chromium.launch();
console.log(`reklam kapısı V2 · ${TABAN} · ${SINAMA ? 'sınama sayfaları' : 'gerçek sayfalar'}${BOZ ? ` · BOZ=${BOZ}` : ''}`);
for (const t of SECIM) {
  for (const gen of [1440, 390]) {
    // ---- reklamsız ----
    {
      const { p, hata, kotu } = await sayfaAc(b, t, gen, '');
      const et = `${t} ${gen} reklamsız`;
      const g = await p.evaluate(OLC.gorunurReklam);
      sonuc(g.moduller === 0, `${et}: görünür reklam öğesi ${g.moduller}`);
      sonuc(g.kap > 0, `${et}: [data-vd-reklam] kabı yok (entegrasyon?)`);
      sonuc(g.gorunurKap === 0 && g.dolu === 0, `${et}: görünür kap ${g.gorunurKap}, dolu kap ${g.dolu}`);
      sonuc(g.css === 0, `${et}: modül CSS'i yüklü (${g.css})`);
      sonuc((await p.evaluate(OLC.tasma)) <= 0, `${et}: yatay taşma`);
      if (t !== 'kisa') { // V2: anahtar koyu banner'da (kırıntı satırının sağı), "Prototip" ibaresi görünür
        const an = await p.evaluate(() => { const g = (n) => !!n && n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
          const b = [...document.querySelectorAll('[data-vd-reklam-anahtari]')].find(g); if (!b) return { yok: true };
          const ban = b.closest('main [data-rk-hero]'); const kr = ban && ban.querySelector('.rd-crumb'); const r = b.getBoundingClientRect();
          // kırıntının kutusu satır boyu uzanır: içerik kenarı = çocuklarının en sağı (anahtar onlarla çakışmamalı)
          const ic = kr ? [...kr.querySelectorAll('*')].map((n) => n.getBoundingClientRect()).filter((x) => x.width && x.height) : [];
          const k = ic.length ? { top: Math.min(...ic.map((x) => x.top)), bottom: Math.max(...ic.map((x) => x.bottom)), right: Math.max(...ic.map((x) => x.right)) } : null;
          const ek = b.querySelector('.vd-anahtar__ek, .vd-rk-anahtar__ek');
          return { banner: !!ban, ayniSatir: !!k && r.top < k.bottom && k.top < r.bottom, sagda: !!k && r.left >= k.right, prototip: g(ek) && /Prototip/.test(ek.textContent), tasma: r.right > innerWidth || r.left < 0 }; });
        sonuc(!an.yok && an.banner, `${et}: anahtar koyu banner'da değil`);
        sonuc(an.ayniSatir && an.sagda && !an.tasma, `${et}: anahtar kırıntı satırının sağında değil ya da taşıyor (aynı satır ${an.ayniSatir}, sağda ${an.sagda})`);
        sonuc(an.prototip, `${et}: anahtarda "Prototip" ibaresi görünmüyor`);
      }
      const a = await anahtarDenetle(p);
      if (t === 'kisa' && a.anahtarVar && !a.isabet1) console.log(`  ⚪ ${et}: anahtar tam ekran görüntüleyicinin altında — tıklama ÖLÇÜLMEDİ (sayfa ?reklam=1 bağıyla açılır)`);
      else {
        sonuc(a.anahtarVar > 0, `${et}: anahtar yok`);
        if (a.anahtarVar) {
          sonuc(a.isabet1 && a.isabet2, `${et}: anahtar tıklaması isabet etmedi`);
          sonuc(a.adres1 === '1' && a.basili1 === 'true' && a.kap1 > 0, `${et}: açınca adres=${a.adres1} aria-pressed=${a.basili1} görünür kap=${a.kap1}`);
          sonuc(a.bag1 && a.bag1.n > 0 && a.bag1.param === a.bag1.n, `${et}: açıkken iç bağlar parametre taşımıyor (${a.bag1?.param}/${a.bag1?.n})`);
          sonuc(a.adres2 === null && a.kap2 === 0 && a.bag2.param === 0, `${et}: kapatınca adres=${a.adres2} görünür kap=${a.kap2} parametreli bağ=${a.bag2?.param}`);
        }
      }
      sonuc((await p.evaluate(OLC.depo)) === 0, `${et}: tarayıcı deposu boş değil`);
      sonuc(hata.length === 0, `${et}: JS hatası ${hata.slice(0, 2).join(' | ')}`);
      sonuc(kotu.length === 0, `${et}: 4xx/5xx ${kotu.slice(0, 3).join(' | ')}`);
      await p.close();
    }
    // ---- reklamlı ----
    {
      const { p, hata, kotu, reklamYanit } = await sayfaAc(b, t, gen, '?reklam=1');
      const et = `${t} ${gen} reklamlı`;
      await bekle(p, 600);
      // R18: şerit panelin içerik kolonuyla aynı kenarlarda (iç içe .wrap çift boşluğu yok)
      const hiza = await p.evaluate(() => [...document.querySelectorAll('[data-vd-reklam] > .rk-yayilim-alan')].map((a) => { const ic = a.parentElement.closest('.wrap'); if (!ic) return null;
        const s = a.querySelector('.rk-slot, .rk-video-slot').getBoundingClientRect(), r = ic.getBoundingClientRect(), cs = getComputedStyle(ic);
        return [Math.round(s.left - (r.left + parseFloat(cs.paddingLeft))), Math.round(r.right - parseFloat(cs.paddingRight) - s.right)]; }).filter(Boolean));
      sonuc(hiza.every(([l, rr]) => Math.abs(l) <= 1 && Math.abs(rr) <= 1), `${et}: şerit içerik kolonundan sapıyor (sol/sağ ${hiza.map((x) => x.join('/')).join(' · ')})`);
      // akış içi yuva süzgeçsiz listede 3. organik öğenin ardında (modül kuralı)
      for (const kod of ['VD-N1', 'SF-N2']) if (BEKLENEN[t].includes(kod)) {
        const yer = await p.evaluate((kod) => { const k = [...document.querySelectorAll(`[data-vd-reklam="${kod}"]`)].find((x) => !x.closest('[data-katman][hidden]')); if (!k) return null;
          const org = [...k.parentElement.children].filter((n) => !n.matches('[data-vd-reklam], template, script') && !n.hidden && n.getClientRects().length);
          return { sira: org.filter((n) => n.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING).length, toplam: org.length, gizli: k.hasAttribute('data-vd-suzgec-gizli') }; }, kod);
        if (yer) sonuc(!yer.gizli && yer.sira === Math.min(3, yer.toplam), `${et}: ${kod} ${yer.sira}. öğeden sonra (beklenen ${Math.min(3, yer.toplam)}; görünür ${yer.toplam}${yer.gizli ? ', gizli' : ''})`);
      }
      if (BEKLENEN[t].includes('STD')) { // R15 V2: açılışta (banner + spotlight/sahne görünürken) yan kart ve alt bar yok
        const acilis = await p.evaluate(async () => { window.scrollTo({ top: 0, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 500));
          return [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-side, [data-vd-reklam="STD"] .rk-std-altbar')].filter((n) => n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).length; });
        sonuc(acilis === 0, `${et}: açılışta hero görünürken ${acilis} sabit reklam öğesi görünür`);
        // oynatıcı ekrandayken de (sayfa banner'ı geçmiş, oynatıcı sahnesi görünür) yan kart / alt bar yok — sahne de hero'dur (R15)
        const oyn = await p.evaluate(async () => { const o = [...document.querySelectorAll('main .vd-oyn')].find((n) => n.checkVisibility() && n.getBoundingClientRect().height > 100);
          if (!o) return null; window.scrollTo({ top: Math.max(0, o.getBoundingClientRect().top + scrollY - 160), behavior: 'instant' }); await new Promise((r) => setTimeout(r, 600));
          return { n: [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-side, [data-vd-reklam="STD"] .rk-std-altbar')].filter((x) => x.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).length, hero: !!o.closest('[data-rk-hero]') }; });
        if (oyn) sonuc(oyn.n === 0 && oyn.hero, `${et}: oynatıcı ekrandayken ${oyn.n} sabit reklam öğesi görünür (oynatıcı hero içinde: ${oyn.hero})`);
      }
      for (const kod of BEKLENEN[t]) {
        const y = await yuvaDenetle(p, kod);
        if (y.yok) { sonuc(false, `${et}: ${kod} yok`); continue; }
        y.s.forEach((x, i) => {
          const e = `${et}: ${kod}${y.s.length > 1 ? `#${i + 1}` : ''}`;
          sonuc(x.dolu, `${e} boş`);
          if (x.katman) console.log(`  ⚪ ${e}: kapalı katmanda (hub'daki kısa video katmanı) — görünürlük ÖLÇÜLMEDİ, sayfasında (kisa) ölçülür`);
          if (x.std || !x.dolu) return;
          sonuc(x.gorunur, `${e} görünmüyor`);
          sonuc(x.kotuImg.length === 0 && x.bgYok === 0, `${e} kırık görsel ${x.kotuImg.join(', ')}${x.bgYok ? ` · zemin görseli yok ${x.bgYok}` : ''}`);
          sonuc(x.sponsorlu, `${e} "Sponsorlu" görünmüyor`);
          sonuc(x.ornek, `${e} "prototip örneği" görünmüyor`);
          sonuc(!x.cakisma || x.cakisma.length === 0, `${e} üst üste binme: ${(x.cakisma || []).join(', ')}`);
        });
      }
      if (BEKLENEN[t].includes('STD')) {
        const s = await standartDenetle(p, gen);
        if (s.olcülmedi) { console.log(`  ⚪ ${et}: standart katman ÖLÇÜLMEDİ — ${s.olcülmedi}`); } else {
        if (gen >= 1280) { sonuc(s.yan === 2, `${et}: side çifti görünür değil (${s.yan})`); sonuc(s.icerikte === 0, `${et}: side içerik kolonunun üstünde (${s.icerikte})`); sonuc(s.yanUst.every((x) => x >= 23 && x <= 25), `${et}: yan kart üstü başlık altından ${s.yanUst.join('/')} px (24 beklenir)`); }
        else sonuc(s.yan === 0, `${et}: 390'da side görünür (${s.yan})`);
        sonuc(s.bar && !s.barTasma, `${et}: alt sabit bar görünür değil ya da taşıyor`);
        sonuc(s.barAlt <= s.navUst - 11, `${et}: alt bar .bottom-nav'la çakışıyor (bar alt ${Math.round(s.barAlt)} · nav üst ${Math.round(s.navUst)})`);
        sonuc(s.etiket.some((x) => /Sponsorlu/.test(x)), `${et}: standart katmanda "Sponsorlu" yok`);
        }
      } else {
        const s = await p.evaluate(() => [...document.querySelectorAll('.rk-std')].filter((n) => n.checkVisibility()).length);
        sonuc(s === 0, `${et}: tam ekran sayfada standart katman görünür (${s})`);
      }
      const ib = await p.evaluate(() => { const ic = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).concat([...document.querySelectorAll('[onclick*="location.href="]')].flatMap((n) => [...n.getAttribute('onclick').matchAll(/location\.href=['"]([^'"]+)['"]/g)].map((m) => m[1]))).filter((h) => !/^(?:[a-z]+:|\/\/|#)/i.test(h) && /^[^?#]*\.html(?:[?#]|$)/.test(h)); return [ic.filter((h) => /[?&]reklam=1(?:&|#|$)/.test(h)).length, ic.length]; });
      sonuc(ib[1] > 0 && ib[0] === ib[1], `${et}: iç bağlar parametre taşımıyor (${ib[0]}/${ib[1]})`);
      // kısa video adresleri reklam=1'i korur: kısa sayfada öğe değişince (replaceState) · hub'da katman açılınca (pushState) ve kapanınca
      if (t === 'kisa') {
        const once = new URL(p.url()).searchParams.get('v');
        await p.keyboard.press('ArrowDown'); await bekle(p, 900);
        const u = new URL(p.url());
        sonuc(u.searchParams.get('reklam') === '1' && u.searchParams.get('v') && u.searchParams.get('v') !== once, `${et}: öğe değişince adres ${u.search} (reklam=1 düştü ya da v değişmedi)`);
      }
      if (t === 'hub') {
        const bag = p.locator('a[data-vd-kisa]').first();
        await bag.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' })); await bekle(p, 300);
        const isabet = await bag.evaluate((n) => { const r = n.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && (e === n || n.contains(e)); });
        if (!isabet) sonuc(false, `${et}: kısa kart tıklaması isabet etmedi`);
        else {
          await bag.click(); await bekle(p, 900);
          const u1 = new URL(p.url());
          sonuc(/video-kisa\.html$/.test(u1.pathname) && u1.searchParams.get('v') && u1.searchParams.get('reklam') === '1', `${et}: kısa katman açılınca adres ${u1.pathname.split('/').pop()}${u1.search} (reklam=1 yok)`);
          const kapat = p.locator('[data-vd-dikey][data-katman] [data-vd-dikey-kapat]').first();
          await kapat.click(); await bekle(p, 900);
          const u2 = new URL(p.url());
          sonuc(/video-mutfagi\.html$/.test(u2.pathname) && u2.searchParams.get('reklam') === '1' && !u2.searchParams.get('v'), `${et}: katman kapanınca adres ${u2.pathname.split('/').pop()}${u2.search}`);
        }
      }
      if (['hub', 'sefler', 'kisa'].includes(t)) await suzgecDenetle(p, t, gen, et);
      // kelime ortasından kesme yok: reklam yuvalarında CSS'in (ellipsis / line-clamp) metin sakladığı görünür öğe kalmamalı
      const kesik = await p.evaluate(async () => {
        const out = [];
        const tara = () => document.querySelectorAll('[data-vd-reklam] *').forEach((el) => {
          if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || !el.getClientRects().length) return;
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) return;
          const cs = getComputedStyle(el); const clamp = parseInt(cs.webkitLineClamp, 10) > 0;
          if ((cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) || (clamp && el.scrollHeight > el.clientHeight + 1)) out.push(`${el.className || el.tagName} "${el.textContent.trim().slice(0, 40)}"`);
        });
        tara(); window.scrollTo({ top: Math.round(document.documentElement.scrollHeight * 0.42), behavior: 'instant' }); await new Promise((r) => setTimeout(r, 600)); tara();
        return [...new Set(out)];
      });
      sonuc(kesik.length === 0, `${et}: CSS kesmesi (kelime ortası) → ${kesik.slice(0, 3).join(' | ')}`);
      const o = await ortmeDenetle(p);
      sonuc(o.length === 0, `${et}: örtme → ${o.slice(0, 3).join(' | ')}`);
      sonuc((await p.evaluate(OLC.tasma)) <= 0, `${et}: yatay taşma ${await p.evaluate(OLC.tasma)}`);
      // 206: tarayıcı videoyu parça parça (Range) ister; GitHub Pages buna 206 Partial Content döner (başarı). Yerel sunucu Range bilmez → 200.
      const tamam = ([s, u]) => s === 200 || (s === 206 && /\.(mp4|webm)(\?|$)/.test(u));
      sonuc(reklamYanit.length > 0 && reklamYanit.every(tamam), `${et}: reklam varlığı 200/206 değil ${reklamYanit.filter((x) => !tamam(x)).slice(0, 3).map((x) => x.join(' ')).join(' | ')}`);
      sonuc((await p.evaluate(OLC.depo)) === 0, `${et}: tarayıcı deposu boş değil`);
      sonuc(hata.length === 0, `${et}: JS hatası ${hata.slice(0, 2).join(' | ')}`);
      sonuc(kotu.length === 0, `${et}: 4xx/5xx ${kotu.slice(0, 3).join(' | ')}`);
      await p.close();
    }
  }
}
await b.close();
console.log(`\n${kirmizi ? '🔴' : '✅'} reklam kapısı V2: yeşil ${yesil} · kırmızı ${kirmizi}`);
process.exit(kirmizi ? 1 : 0);
