// Davranış kapısı — izle ajanı (izleme sayfası, oynatıcı, senkron panel, pişirme modu, kısa video görüntüleyici, şef kanalı).
// Gerçek tıklama (force YOK): önce scrollIntoView, sonra elementFromPoint isabeti; isabet yoksa "ölçülmedi" (kırmızı sayılır).
// Görünürlük checkVisibility({checkOpacity, checkVisibilityCSS}) ile. Mesajlar kullanıcının okuduğu cümleyle aranır.
//
// Kullanım:  TABAN=http://localhost:8797/DadaVideo/ node araclar/davranis-izle.mjs
//            BOZ=<ad> … → bilerek bozulmuş girdi (kapının kırmızı verdiğinin kanıtı); BOZ=liste → bozma adlarını yazar.
//   Bozmalar ağdan gelen yanıtı değiştirir (page.route), diskteki dosyaya dokunmaz.
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ortak = await import(path.join(KOK, 'src/video/ortak.mjs'));

const TABAN = process.env.TABAN || 'http://localhost:8797/DadaVideo/';
const BOZ = process.env.BOZ || '';
const IZLE = 'video-izle-tek-tavada-klasik-menemen.html';
const V = ortak.VIDEO['tek-tavada-klasik-menemen'];
const KISA_ILK = ortak.KATALOG.kisalar[0].slug, KISA_IKI = ortak.KATALOG.kisalar[1].slug, KISA_UC = ortak.KATALOG.kisalar[2].slug;

/* bozmalar: [dosya deseni, eski, yeni] — eski bulunamazsa bozma geçersizdir ve kapı durur */
const BOZMALAR = {
  zaman: [/js\/oynatici\.js/, 'sn = Math.min(sure, sn + (simdi - son) / 1000);', 'sn = Math.min(sure, sn);'],
  damga: [/js\/izle\.js/, "oyn.git(Number(d.getAttribute('data-sn')), { oynat: true });", 'void 0;'],
  panel: [/js\/oynatici\.js/, "var durum = i < etkinBolum ? 'acik' : (i === etkinBolum ? 'simdi' : 'bekliyor');", "var durum = 'bekliyor';"],
  eksik: [/js\/oynatici\.js/, 'var eksikler = function () { return kutular.filter(function (k) { return !k.checked; }); };', 'var eksikler = function () { return kutular; };'],
  wake: [/js\/pisirme\.js/, "navigator.wakeLock.request('screen')", "Promise.reject(new Error('boz'))"],
  adim: [/js\/pisirme\.js/, "goster(i + 1);\n  });", "void 0;\n  });"],
  kisa: [/js\/kisa\.js/, "try { history.replaceState(history.state, '', u); } catch (_) { /* file:// vb. */ }", 'void u;'],
  sekme: [/js\/sef\.js/, 'if (p) p.hidden = !on;', 'void p;'],
  jsonld: [/video-izle-tek-tavada-klasik-menemen\.html/, '"@type":"Clip"', '"@type":"Clip","_":1}],"x":[{'],
};
if (BOZ === 'liste') { console.log(Object.keys(BOZMALAR).join(' ')); process.exit(0); }
if (BOZ && !BOZMALAR[BOZ]) { console.error('bilinmeyen bozma: ' + BOZ); process.exit(2); }

const sonuc = [];
const kayit = (ad, gecti, ayrinti = '') => { sonuc.push({ ad, gecti }); console.log(`${gecti ? '✅' : '🔴'} ${ad}${ayrinti ? ' — ' + ayrinti : ''}`); };

const tarayici = await chromium.launch();
async function sayfaAc(adres, { gen = 1440, yuk = 900, mobil = false } = {}) {
  const ctx = await tarayici.newContext({ viewport: { width: gen, height: yuk }, isMobile: mobil, hasTouch: mobil });
  // Wake Lock çağrı kaydı: tarayıcının gerçek API'si sarılır (headless'ta yoksa sahte kilit döner) — çağrı sayısı ölçülür
  await ctx.addInitScript(() => {
    window.__wake = [];
    const gercek = navigator.wakeLock && navigator.wakeLock.request ? navigator.wakeLock.request.bind(navigator.wakeLock) : null;
    const sahte = () => { const t = new EventTarget(); t.released = false; t.type = 'screen'; t.release = () => { t.released = true; t.dispatchEvent(new Event('release')); return Promise.resolve(); }; return t; };
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: (tur) => { window.__wake.push(tur); return (gercek ? gercek(tur) : Promise.resolve(sahte())).catch(() => sahte()); } } });
  });
  const p = await ctx.newPage();
  p.__hatalar = [];
  p.on('pageerror', (e) => p.__hatalar.push(e.message));
  if (BOZ) {
    const [desen, eski, yeni] = BOZMALAR[BOZ];
    await p.route((u) => desen.test(u.pathname), async (r) => {
      const y = await r.fetch(); let govde = await y.text();
      if (!govde.includes(eski)) throw new Error(`bozma ${BOZ}: hedef dize yok (bozma bayat)`);
      govde = govde.replace(eski, yeni);
      await r.fulfill({ response: y, body: govde });
    });
  }
  await p.goto(TABAN + adres, { waitUntil: 'load' });
  await p.waitForTimeout(300);
  return p;
}
/** Gerçek tıklama: görünür mü → ortala → elementFromPoint isabeti → force'suz click. İsabet yoksa false. */
async function tikla(p, sec, { i = 0 } = {}) {
  const loc = p.locator(sec).nth(i);
  const bilgi = await loc.evaluate((el) => {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); // Gastro html{scroll-behavior:smooth}: anlık kaydır, yoksa ölçüm kaydırma bitmeden alınır
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const h = document.elementFromPoint(x, y);
    return { gorunur: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), etkin: !el.disabled, isabet: !!h && (h === el || el.contains(h)), ust: h ? (h.className || h.tagName) + '' : 'null' };
  });
  if (!bilgi.gorunur || !bilgi.isabet || !bilgi.etkin) { console.log(`   ⚠ tıklama inmedi: ${sec}[${i}] görünür=${bilgi.gorunur} etkin=${bilgi.etkin} isabet=${bilgi.isabet} üstte=${bilgi.ust}`); return false; }
  await loc.click();
  return true;
}
const gorunur = (p, sec) => p.locator(sec).first().evaluate((el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).catch(() => false);
const metin = (p, sec) => p.locator(sec).first().textContent().then((t) => (t || '').trim());
const bildirimVar = (p, cumle) => p.evaluate((c) => [...document.querySelectorAll('.ke-toast, .dm-toast')].some((t) => t.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && t.textContent.includes(c)), cumle);

/* ---------- 1 · İzleme sayfası: oynatıcı, damgalar, panel, dolap, JSON-LD ---------- */
for (const [gen, yuk, mobil] of [[1440, 900, false], [390, 844, true]]) {
  const et = `@${gen}`;
  const p = await sayfaAc(IZLE, { gen, yuk, mobil });
  const bolumler = ortak.bolumler(V);
  // oynat → zaman ilerler (ekrandaki metin)
  const once = await metin(p, '[data-vd-simdi]');
  const indi = await tikla(p, '.vd-oyn__buyuk');
  await p.waitForTimeout(2300);
  const sonra = await metin(p, '[data-vd-simdi]');
  kayit(`oynat → zaman ilerler ${et}`, indi && once === '00:00' && sonra >= '00:02', `${once} → ${sonra}`);
  await tikla(p, '.vd-oyn__dugme[data-vd-oynat]'); // duraklat
  // panel başlangıçta: 2. bölümün grubu bekliyor
  const hedef = 2; const hedefSn = bolumler[hedef].sn;
  const grupDurum = (i) => p.evaluate((i) => { const g = document.querySelector(`[data-vd-grup="${i}"]`); return g ? g.className : 'yok'; }, i);
  const onceGrup = await grupDurum(hedef);
  // damga → zaman o saniye + etkin damga
  const dIndi = await tikla(p, '[data-vd-damga]', { i: hedef });
  await p.waitForTimeout(250);
  const t2 = await metin(p, '[data-vd-simdi]');
  const etkin = await p.locator('[data-vd-damga][aria-current="true"]').getAttribute('data-vd-damga').catch(() => null);
  const beklenen = ortak.sureMetni(hedefSn);
  kayit(`bölüm damgası → oynatıcı o saniyeye atlar ${et}`, dIndi && t2 >= beklenen && t2 <= ortak.sureMetni(hedefSn + 2) && etkin === String(hedef), `beklenen ${beklenen}, ekranda ${t2}, etkin damga ${etkin}`);
  const sonraGrup = await grupDurum(hedef);
  const ileriGrup = await grupDurum(bolumler.length - 1);
  kayit(`senkron panel ilerledikçe açılır ${et}`, /is-bekliyor/.test(onceGrup) && /is-(simdi|acik)/.test(sonraGrup) && !/is-bekliyor/.test(sonraGrup) && /is-bekliyor|yok/.test(ileriGrup), `grup ${hedef}: "${onceGrup.replace('vd-panel__grup', '').trim()}" → "${sonraGrup.replace('vd-panel__grup', '').trim()}"; son grup "${ileriGrup.replace('vd-panel__grup', '').trim()}"`);
  // Dolabımda Var (3 malzeme) → eksik sayısı ve bildirim
  await p.evaluate(() => { const o = window.vdOynatici.al(document.querySelector('[data-vd-oyn]')); o.duraklat(); }); // panel listesi kaymasın
  const toplam = await p.locator('[data-vd-mz]').count();
  let isaret = 0;
  for (let i = 0; i < 3; i++) if (await tikla(p, '[data-vd-mz] .vd-mz__etiket', { i })) isaret++;
  const sayi = Number(await metin(p, '[data-vd-eksik-sayi]'));
  const href = await p.locator('[data-vd-dolap-bag]').getAttribute('href');
  const idSay = (href.match(/malzeme%5B%5D=\d+/g) || []).length;
  const eIndi = await tikla(p, '[data-vd-eksik]');
  await p.waitForTimeout(200);
  const cumle = `${toplam - 3} eksik malzeme listene eklendi`;
  const bildirim = await bildirimVar(p, cumle);
  kayit(`Dolabımda Var + eksikleri ekle sayısı doğru ${et}`, isaret === 3 && sayi === toplam - 3 && eIndi && bildirim && idSay === 3 && href.startsWith('https://dadagastro.com/dolapta-ne-var'), `toplam ${toplam}, işaretli ${isaret}, düğme sayısı ${sayi}, bildirim "${cumle}" ${bildirim ? 'görüldü' : 'YOK'}, dolap bağında ${idSay} malzeme_id`);
  // pişirme modu: açılır, Wake Lock istenir, büyük düğmeler adımı değiştirir
  const n = ortak.TARIF[V.tarif].adimlar.length;
  const pIndi = await tikla(p, '[data-vd-pisirme-ac]');
  await p.waitForTimeout(250);
  const acik = await gorunur(p, '[data-vd-pisirme]');
  const wake = await p.evaluate(() => window.__wake.slice());
  const wakeYazi = await metin(p, '[data-vd-wake-yazi]');
  const s1 = await metin(p, '[data-vd-pis-sayac]');
  const yukseklik = await p.locator('[data-vd-pis-sonraki]').evaluate((el) => el.getBoundingClientRect().height);
  await tikla(p, '[data-vd-pis-sonraki]');
  const s2 = await metin(p, '[data-vd-pis-sayac]');
  const adim2 = await gorunur(p, '[data-vd-pis-adim="1"]');
  await tikla(p, '[data-vd-pis-onceki]');
  const s3 = await metin(p, '[data-vd-pis-sayac]');
  await p.keyboard.press('ArrowRight');
  const s4 = await metin(p, '[data-vd-pis-sayac]');
  kayit(`pişirme modu açılır + Wake Lock istenir ${et}`, pIndi && acik && wake.length === 1 && wake[0] === 'screen' && wakeYazi === 'Ekran açık kalacak', `açık ${acik}, wakeLock.request çağrıları ${JSON.stringify(wake)}, durum "${wakeYazi}"`);
  kayit(`pişirme modu büyük düğmeler adımı değiştirir ${et}`, s1 === `1 / ${n}` && s2 === `2 / ${n}` && adim2 && s3 === `1 / ${n}` && s4 === `2 / ${n}` && yukseklik >= 64, `${s1} → Sonraki ${s2} → Önceki ${s3} → ok tuşu ${s4}; düğme yüksekliği ${yukseklik}px`);
  await tikla(p, '[data-vd-pisirme-kapat]');
  // JSON-LD
  const ld = await p.evaluate(() => { try { return { ok: true, v: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent) }; } catch (e) { return { ok: false, e: e.message }; } });
  const damgaSay = await p.locator('[data-vd-damga]').count();
  kayit(`JSON-LD geçerli + hasPart = bölüm sayısı ${et}`, ld.ok && ld.v['@type'] === 'VideoObject' && ld.v.hasPart?.length === bolumler.length && damgaSay === bolumler.length && ld.v.duration === ortak.sureIso(V.sure_sn), ld.ok ? `hasPart ${ld.v.hasPart.length}, bölüm ${bolumler.length}, damga ${damgaSay}, duration ${ld.v.duration}` : ld.e);
  kayit(`JS hatası 0 (izle) ${et}`, p.__hatalar.length === 0, p.__hatalar.join(' | '));
  await p.context().close();
}

/* ---------- 2 · #t=<sn> açılışı ---------- */
{
  const p = await sayfaAc(IZLE + '#t=100');
  const t = await metin(p, '[data-vd-simdi]');
  kayit('#t=100 açılışta oynatıcıyı 01:40\'a getirir', t === '01:40', `ekranda ${t}`);
  await p.context().close();
}

/* ---------- 3 · Kısa video görüntüleyici ---------- */
for (const [gen, yuk, mobil] of [[1440, 900, false], [390, 844, true]]) {
  const p = await sayfaAc(`video-kisa.html?v=${KISA_ILK}`, { gen, yuk, mobil });
  await p.waitForTimeout(400);
  const s0 = await metin(p, '[data-vd-dikey-sira]');
  await p.mouse.move(gen / 2, yuk / 2);
  await p.mouse.wheel(0, 400);
  await p.waitForTimeout(900);
  const u1 = new URL(p.url()).searchParams.get('v');
  const s1 = await metin(p, '[data-vd-dikey-sira]');
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(900);
  const u2 = new URL(p.url()).searchParams.get('v');
  const ust = await p.evaluate(() => { const e = document.querySelector('.vd-dikey__oge.is-etkin'); const r = e.getBoundingClientRect(); return Math.round(r.top); });
  kayit(`kısa video: kaydırma sonrakine geçer + adres güncellenir @${gen}`, s0 === '1 / 9' && u1 === KISA_IKI && s1 === '2 / 9' && u2 === KISA_UC && Math.abs(ust) <= 2, `${s0} → tekerlek ${s1} (?v=${u1}) → ↓ ?v=${u2}; etkin öğe üstü ${ust}px`);
  kayit(`JS hatası 0 (kısa) @${gen}`, p.__hatalar.length === 0, p.__hatalar.join(' | '));
  await p.context().close();
}

/* ---------- 4 · Şef kanalı sekmeleri ---------- */
for (const [gen, yuk, mobil] of [[1440, 900, false], [390, 844, true]]) {
  const p = await sayfaAc('video-sef-berkan-gunes.html', { gen, yuk, mobil });
  const sekmeler = await p.locator('[role="tab"]').count();
  const ilkPanel = await p.locator('[role="tab"]').first().getAttribute('aria-controls');
  const ikinci = await p.locator('[role="tab"]').nth(1).getAttribute('aria-controls');
  const indi = await tikla(p, '[role="tab"]', { i: 1 });
  const secili = await p.locator('[role="tab"]').nth(1).getAttribute('aria-selected');
  const pGor = await gorunur(p, '#' + ikinci);
  const p1Gor = await gorunur(p, '#' + ilkPanel);
  await p.keyboard.press('ArrowRight');
  const ucuncu = await p.locator('[role="tab"]').nth(2 % sekmeler).getAttribute('aria-selected');
  kayit(`şef sekmeleri değişir @${gen}`, indi && secili === 'true' && pGor && !p1Gor && ucuncu === 'true', `${sekmeler} sekme; 2. sekme seçili ${secili}, paneli görünür ${pGor}, 1. panel görünür ${p1Gor}; → tuşu 3. sekme ${ucuncu}`);
  await p.context().close();
}

await tarayici.close();
const kirmizi = sonuc.filter((s) => !s.gecti).length;
console.log(`\n${BOZ ? `[BOZ=${BOZ}] ` : ''}${sonuc.length} ölçüm · ${kirmizi} kırmızı`);
process.exit(kirmizi ? 1 : 0);
