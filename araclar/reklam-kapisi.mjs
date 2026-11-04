// Reklam kapısı (reklam ajanı). Her video sayfa tipi × 1440/390 × (reklamsız, ?reklam=1):
//   reklamsız : görünür reklam 0 (modül sınıfı taşıyan görünür öğe yok), bütün [data-vd-reklam] gizli ve boş, modül CSS'i yüklenmemiş
//   reklamlı  : sayfa tipinin tanımlı her yuvası görünür ve dolu; içindeki görseller 200 + çizilmiş; "Sponsorlu" ve "prototip örneği" metni görünür;
//               1440'ta side çifti içerik kolonunun dışında, 390'da yok; alt sabit bar mobilde .bottom-nav'ın üstünde
//   ikisinde de: yatay taşma 0 · JS hatası 0 · 4xx/5xx 0 · localStorage/sessionStorage boş
//   örtme      : sabit reklam öğeleri h1'i ve oynatıcıyı örtmez (elementFromPoint, açılışta); sayfa sonunda son içerik alt barın altında kalmaz
//   anahtar    : force'suz, isabeti doğrulanmış tıklama → adres ?reklam=1 olur / kalkar; iç bağlar (*.html) parametreyi taşır / bırakır
// Kullanım: TABAN=http://localhost:8798/DadaGastroVideo/ node araclar/reklam-kapisi.mjs [--sinama] [tip…]
//   --sinama : reklam ajanının geçici rk-sinama-<tip>.html sayfaları (entegrasyondan önce)
//   BOZ=gorunur|depo|bag|gorsel|ortu|anahtar → bilerek bozulmuş düzenek; kapı KIRMIZI vermeli
import { chromium } from 'playwright';

const TABAN = process.env.TABAN || 'http://localhost:8798/DadaGastroVideo/';
const BOZ = process.env.BOZ || '';
const arg = process.argv.slice(2);
const SINAMA = arg.includes('--sinama');
const GERCEK = {
  hub: 'video-mutfagi.html', seriler: 'video-seriler.html', seri: 'video-seri-akilli-ekipman-test.html',
  izle: 'video-izle-airfryer-kullanirken-yapilan-5-kritik-hata.html', sef: 'video-sef-polat-abadan.html', kisa: 'video-kisa.html',
};
// sayfa tipi → tanımlı yuvalar (tasks/reklam-durum.md yerleşim planı)
const BEKLENEN = {
  hub: ['VD-B1', 'VD-N1', 'VD-B1-END', 'SERI-SPONSOR', 'STD'],
  seriler: ['VS-B1', 'VS-B1-END', 'SERI-SPONSOR', 'STD'],
  seri: ['VD-S1', 'VD-S1-END', 'SERI-SPONSOR', 'STD'],
  izle: ['VD-S1', 'VD-S1-END', 'TD-ESLIK', 'SERI-SPONSOR', 'STD'],
  sef: ['SF-P1', 'SF-P1-END', 'STD'],
  kisa: ['VD-N1'],
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
  if (BOZ === 'gorunur' || BOZ === 'bag' || BOZ === 'depo') {
    await p.route('**/varlik/video/js/reklam.js*', async (rt) => {
      const yan = await rt.fetch(); let js = await yan.text();
      if (BOZ === 'gorunur') js = js.replace('kaplar().forEach((k) => { k.hidden = true; });', 'kaplar().forEach(doldur);');
      if (BOZ === 'bag') js = js.replace('baglariCevir(d, true);\n', '\n');
      if (BOZ === 'depo') js = js.replace("const PARAM = 'reklam';", "const PARAM = 'reklam'; try { localStorage.setItem('vd-reklam', '1'); } catch {}");
      await rt.fulfill({ response: yan, body: js });
    });
  }
  if (BOZ === 'gorsel') await p.route('**/varlik/video/reklam/*-urun.webp', (rt) => rt.fulfill({ status: 404, body: '' }));
  await p.goto(TABAN + sayfaAdi(t) + sorgu, { waitUntil: 'load' });
  await bekle(p, 900);
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
      const kutu = hedef.getBoundingClientRect();
      s.push({ dolu: true, gorunur: g(hedef) && kutu.width > 0 && kutu.height > 0, img: imgs.length, kotuImg, bgYok: bg.filter((x) => x === 'none').length, sponsorlu: metinGorunur(/Sponsorlu/), ornek: metinGorunur(/prototip örneği/i) });
    }
    return { s };
  }, kod);
}

async function standartDenetle(p, gen) {
  // side: hero geçilmiş, altbilgi görünmez bir konuma kaydır
  const r = await p.evaluate(async (gen) => {
    const g = (n) => !!n && n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const h = document.documentElement.scrollHeight;
    window.scrollTo({ top: Math.round(h * 0.42), behavior: 'instant' }); await new Promise((r) => setTimeout(r, 700));
    const yanlar = [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-side')].filter(g).map((n) => n.getBoundingClientRect());
    let sol = innerWidth, sag = 0;
    document.querySelectorAll('main .wrap, main > .container').forEach((n) => { const r = n.getBoundingClientRect(), s = getComputedStyle(n); if (r.width > 600) { sol = Math.min(sol, r.left + parseFloat(s.paddingLeft)); sag = Math.max(sag, r.right - parseFloat(s.paddingRight)); } });
    const icerikte = yanlar.filter((r) => r.right > sol && r.left < sag).length;
    const bar = document.querySelector('[data-vd-reklam="STD"] .rk-std-altbar'); const br = bar && bar.getBoundingClientRect();
    const nav = document.querySelector('.bottom-nav'); const navUst = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : Infinity;
    const etiket = [...document.querySelectorAll('[data-vd-reklam="STD"] .rk-std-etiket')].filter(g).map((n) => n.textContent);
    return { yan: yanlar.length, icerikte, bar: g(bar), barAlt: br ? br.bottom : 0, navUst, barTasma: br ? (br.left < 0 || br.right > innerWidth) : false, etiket };
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
    const b = p.locator('[data-vd-reklam-anahtari]').first();
    await b.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await bekle(p, 250);
    const isabet = await b.evaluate((n) => { const r = n.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && (e === n || n.contains(e)); });
    if (!isabet) return false;
    if (BOZ === 'anahtar') await p.evaluate(() => { const b = document.querySelector('[data-vd-reklam-anahtari]'); b.replaceWith(b.cloneNode(true)); document.querySelector('[data-vd-reklam-anahtari]').addEventListener('click', (e) => e.stopImmediatePropagation(), true); });
    await b.click(); await bekle(p, 900); return true;
  };
  const baglar = () => p.evaluate(() => { const ic = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !/^(?:[a-z]+:|\/\/|#)/i.test(h) && /^[^?#]*\.html(?:[?#]|$)/.test(h)); return { n: ic.length, param: ic.filter((h) => /[?&]reklam=1(?:&|#|$)/.test(h)).length }; });
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

const b = await chromium.launch();
console.log(`reklam kapısı · ${TABAN} · ${SINAMA ? 'sınama sayfaları' : 'gerçek sayfalar'}${BOZ ? ` · BOZ=${BOZ}` : ''}`);
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
      for (const kod of BEKLENEN[t]) {
        const y = await yuvaDenetle(p, kod);
        if (y.yok) { sonuc(false, `${et}: ${kod} yok`); continue; }
        y.s.forEach((x, i) => {
          const e = `${et}: ${kod}${y.s.length > 1 ? `#${i + 1}` : ''}`;
          sonuc(x.dolu, `${e} boş`);
          if (x.std || !x.dolu) return;
          sonuc(x.gorunur, `${e} görünmüyor`);
          sonuc(x.kotuImg.length === 0 && x.bgYok === 0, `${e} kırık görsel ${x.kotuImg.join(', ')}${x.bgYok ? ` · zemin görseli yok ${x.bgYok}` : ''}`);
          sonuc(x.sponsorlu, `${e} "Sponsorlu" görünmüyor`);
          sonuc(x.ornek, `${e} "prototip örneği" görünmüyor`);
        });
      }
      if (BEKLENEN[t].includes('STD')) {
        const s = await standartDenetle(p, gen);
        if (gen >= 1280) { sonuc(s.yan === 2, `${et}: side çifti görünür değil (${s.yan})`); sonuc(s.icerikte === 0, `${et}: side içerik kolonunun üstünde (${s.icerikte})`); }
        else sonuc(s.yan === 0, `${et}: 390'da side görünür (${s.yan})`);
        sonuc(s.bar && !s.barTasma, `${et}: alt sabit bar görünür değil ya da taşıyor`);
        sonuc(s.barAlt <= s.navUst - 11, `${et}: alt bar .bottom-nav'la çakışıyor (bar alt ${Math.round(s.barAlt)} · nav üst ${Math.round(s.navUst)})`);
        sonuc(s.etiket.some((x) => /Sponsorlu/.test(x)), `${et}: standart katmanda "Sponsorlu" yok`);
      } else {
        const s = await p.evaluate(() => [...document.querySelectorAll('.rk-std')].filter((n) => n.checkVisibility()).length);
        sonuc(s === 0, `${et}: tam ekran sayfada standart katman görünür (${s})`);
      }
      const ib = await p.evaluate(() => { const ic = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => !/^(?:[a-z]+:|\/\/|#)/i.test(h) && /^[^?#]*\.html(?:[?#]|$)/.test(h)); return [ic.filter((h) => /[?&]reklam=1(?:&|#|$)/.test(h)).length, ic.length]; });
      sonuc(ib[1] > 0 && ib[0] === ib[1], `${et}: iç bağlar parametre taşımıyor (${ib[0]}/${ib[1]})`);
      const o = await ortmeDenetle(p);
      sonuc(o.length === 0, `${et}: örtme → ${o.slice(0, 3).join(' | ')}`);
      sonuc((await p.evaluate(OLC.tasma)) <= 0, `${et}: yatay taşma ${await p.evaluate(OLC.tasma)}`);
      sonuc(reklamYanit.length > 0 && reklamYanit.every(([s]) => s === 200), `${et}: reklam varlığı 200 değil ${reklamYanit.filter(([s]) => s !== 200).slice(0, 3).map((x) => x.join(' ')).join(' | ')}`);
      sonuc((await p.evaluate(OLC.depo)) === 0, `${et}: tarayıcı deposu boş değil`);
      sonuc(hata.length === 0, `${et}: JS hatası ${hata.slice(0, 2).join(' | ')}`);
      sonuc(kotu.length === 0, `${et}: 4xx/5xx ${kotu.slice(0, 3).join(' | ')}`);
      await p.close();
    }
  }
}
await b.close();
console.log(`\n${kirmizi ? '🔴' : '✅'} reklam kapısı: yeşil ${yesil} · kırmızı ${kirmizi}`);
process.exit(kirmizi ? 1 : 0);
