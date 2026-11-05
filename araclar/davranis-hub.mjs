// Davranış kapısı — hub (video-mutfagi.html) · hub ajanı.
// Gerçek tıklama (force yok): öğe scrollIntoView ile ortalanır, elementFromPoint isabeti öğenin kendisi/içi olmalı, sonra fare tıklar.
// Görünürlük checkVisibility({checkOpacity, checkVisibilityCSS}).
// Ölçülenler (1440 ve 390):
//  1 süzgeç: çip → adres ?konsept= yazılır · ızgarada görünen kart sayısı katalogdan hesaplananla aynı · hepsi o konseptte · sayı metni
//  2 süzgeç birleşimi boş sonuç → boş durum görünür (cümleyle aranır) · "Süzgeçleri temizle" → adres temiz, 26 kart
//  3 adresten açılış ?konsept=fit-tarifler&sure=15-30 → çipler basılı, sayı katalogla aynı
//  4 yapışkanlık: aşağı kaydırınca bar ekranın üstünde (top = --vd-bar-alt), isabet barın kendisi
//  5 ray: "sonraki" oku → iz kayar, "önceki" etkinleşir
//  6 kaydet: kartın yer imi → aria-pressed=true, aynı slug'lı bütün düğmeler, bildirim cümlesi görünür
//  7 kaydırdıkça yükleme: ilk 12 kart · dibe inince 26 · "Hepsi bu kadar" görünür · son satır tam (kart + kutu yayılımı sütunun katı)
//  6b (V2) şef takibi: Gastro şef kartı "+ Takip Et" → aria-pressed + "Takip Ediliyor" + bildirim, sayfa değişmez
//  8 depo: localStorage/sessionStorage boş
// Kullanım: node araclar/davranis-hub.mjs   (TABAN=http://localhost:8796/DadaGastroVideo/  GENISLIK=1440,390)
//           BOZ=1 → süzgeç adres yazmaz, IntersectionObserver yok, bar yapışmaz, kaydet tıklaması yutulur (kırmızı vermeli)
import { chromium } from 'playwright';
import * as O from '../src/video/ortak.mjs';

const TABAN = process.env.TABAN || 'http://localhost:8796/DadaGastroVideo/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const BOZ = !!process.env.BOZ;
const V2 = /\/v2\/$/.test(TABAN) || !!process.env.V2;
const konseptKodu = (ad) => String(ad || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// beklenen sayılar katalogdan (sayfadan bağımsız)
const V = O.KATALOG.videolar;
const seriK = (v) => konseptKodu(O.SERI[v.seri]?.konsept || '');
const beklenen = (k, s) => V.filter((v) => (!k || (k === 'fit-tarifler' ? v.fit : seriK(v) === k)) && (!s || O.sureKodu(v) === s)).length;

let kirmizi = 0, yesil = 0;
const sonuc = (ok, w, ad, ayrinti = '') => { if (ok) yesil++; else kirmizi++; console.log(`${ok ? '✓' : '✗'} [${w}] ${ad}${ayrinti ? ' — ' + ayrinti : ''}`); };

async function gercekTikla(p, secici, ad) {
  const el = typeof secici === 'string' ? p.locator(secici).first() : secici;
  const h = await el.elementHandle();
  if (!h) throw new Error(`öğe yok: ${ad}`);
  await h.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }));
  await p.waitForTimeout(250);
  const isabet = await h.evaluate((e) => { const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); return { x, y, ok: !!t && (t === e || e.contains(t)), ust: t ? t.className || t.tagName : null }; });
  if (!isabet.ok) throw new Error(`tıklama isabet etmiyor (${ad}): üstte ${isabet.ust}`);
  await p.mouse.click(isabet.x, isabet.y);
  await p.waitForTimeout(350);
}
const gorunenKart = (p) => p.$$eval('[data-vd-izgara] [data-vd-video]', (k) => k.filter((e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).map((e) => ({ k: e.dataset.konsept, s: e.dataset.sure, f: e.dataset.fit })));
const cumleGorunur = (p, cumle) => p.evaluate((c) => [...document.querySelectorAll('h3, p, span, b, div')].some((e) => e.childElementCount === 0 && e.textContent.trim().includes(c) && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })), cumle);

const t = await chromium.launch();
for (const w of GENISLIK) {
  const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  if (BOZ) await ctx.addInitScript(() => {
    history.replaceState = function () {};
    delete window.IntersectionObserver;
    document.addEventListener('click', (e) => { if (e.target.closest('[data-vd-kaydet], [data-vd-takip]')) e.stopImmediatePropagation(); }, true);
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.vd-suzgec{position:static!important}'; document.head.appendChild(s); });
  });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  try {
    await p.goto(TABAN + 'video-mutfagi.html', { waitUntil: 'load' });
    await p.waitForTimeout(300);

    // 7a ilk yük
    const ilk = await p.$$eval('[data-vd-izgara] [data-vd-video]', (k) => k.length);
    sonuc(ilk === 12, w, 'ilk sayfa 12 kart (sunucu render)', `${ilk}`);

    // 1 süzgeç: Restoran Sırları
    await gercekTikla(p, '[data-vd-konsept="restoran-sirlari"]', 'Restoran Sırları çipi');
    let url = new URL(p.url());
    sonuc(url.searchParams.get('konsept') === 'restoran-sirlari', w, 'çip adrese ?konsept= yazar', url.search);
    let g = await gorunenKart(p);
    const b1 = beklenen('restoran-sirlari', null);
    sonuc(g.length === b1 && g.every((x) => x.k === 'restoran-sirlari'), w, 'ızgara konsepte süzülür', `görünen ${g.length} · beklenen ${b1}`);
    const sayiMetni = await p.$eval('[data-vd-tum-alt]', (e) => e.textContent);
    sonuc(sayiMetni.startsWith(`${b1} video`), w, 'sonuç sayısı metni', sayiMetni);

    // 2 boş sonuç: + < 15 Dk
    await gercekTikla(p, '[data-vd-sure="15-alti"]', '< 15 Dk çipi');
    url = new URL(p.url());
    const b2 = beklenen('restoran-sirlari', '15-alti');
    g = await gorunenKart(p);
    sonuc(url.searchParams.get('sure') === '15-alti' && g.length === b2, w, 'süre süzgeci adres + sayı', `${url.search} · ${g.length}/${b2}`);
    if (b2 === 0) sonuc(await cumleGorunur(p, 'Bu süzgeçlere uyan video yok'), w, 'boş durum cümlesi görünür');
    await gercekTikla(p, '[data-vd-bos] [data-vd-temizle]', 'Süzgeçleri temizle');
    url = new URL(p.url());
    g = await gorunenKart(p);
    sonuc(!url.search && g.length === V.length, w, 'temizle → adres temiz, bütün videolar', `${url.search || '(boş)'} · ${g.length}`);

    // 3 adresten açılış
    await p.goto(TABAN + 'video-mutfagi.html?konsept=fit-tarifler&sure=15-30', { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const basili = await p.$$eval('[aria-pressed="true"].vd-cip', (c) => c.map((e) => e.dataset.vdKonsept || e.dataset.vdSure));
    g = await gorunenKart(p);
    const b3 = beklenen('fit-tarifler', '15-30');
    sonuc(basili.includes('fit-tarifler') && basili.includes('15-30') && g.length === b3 && g.every((x) => x.f === '1' && x.s === '15-30'), w, 'adresten açılış süzer', `basılı ${basili} · ${g.length}/${b3}`);

    // 4 yapışkanlık
    await p.goto(TABAN + 'video-mutfagi.html', { waitUntil: 'load' });
    await p.evaluate(() => scrollTo(0, document.querySelector('#seriler, .vd-seri-ray').offsetTop + 400));
    await p.waitForTimeout(400);
    const yap = await p.evaluate(() => {
      const bar = document.querySelector('[data-vd-cipbar], .vd-suzgec'); const r = bar.getBoundingClientRect();
      const ust = parseFloat(getComputedStyle(bar).top) || 0;
      const t = document.elementFromPoint(r.left + 40, r.top + r.height / 2);
      return { top: r.top, ust, gor: bar.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), isabet: !!t && bar.contains(t) };
    });
    sonuc(yap.gor && Math.abs(yap.top - yap.ust) <= 1 && yap.isabet, w, 'süzgeç barı kaydırınca üstte yapışık', `top ${yap.top.toFixed(1)} · beklenen ${yap.ust} · isabet ${yap.isabet}`);

    // 5 ray
    const iz = p.locator('#kisa [data-vd-ray-iz]');
    const once = await iz.evaluate((e) => e.scrollLeft);
    if (w >= 641) {
      await gercekTikla(p, '#kisa [data-vd-ray-sonraki]', 'kısa ray sonraki');
      await p.waitForTimeout(400);
      const sonra = await iz.evaluate((e) => e.scrollLeft);
      const geri = await p.$eval('#kisa [data-vd-ray-onceki]', (b) => !b.disabled);
      sonuc(sonra > once + 50 && geri, w, 'ray oku kaydırır', `${once} → ${sonra}`);
    } else {
      await iz.evaluate((e) => e.scrollBy({ left: 300 }));
      await p.waitForTimeout(300);
      const sonra = await iz.evaluate((e) => e.scrollLeft);
      sonuc(sonra > once + 50, w, 'ray dokunmatik kaydırılır (oklar gizli)', `${once} → ${sonra}`);
    }

    // 6 kaydet
    const kart = p.locator('[data-vd-izgara] [data-vd-video]').first();
    const slug = await kart.getAttribute('data-vd-video');
    await gercekTikla(p, kart.locator('[data-vd-kaydet]'), 'kart yer imi');
    const durum = await p.$$eval(`[data-vd-kaydet="${slug}"]`, (b) => b.map((x) => x.getAttribute('aria-pressed')));
    sonuc(durum.length > 0 && durum.every((x) => x === 'true'), w, 'kaydet → aria-pressed (aynı videonun bütün düğmeleri)', durum.join(','));
    sonuc(await cumleGorunur(p, 'Mutfak Defterine kaydedildi'), w, 'kaydet bildirimi görünür');

    // 6b şef takibi (V2: Gastro şef kartı "+ Takip Et" → VD.takip; V1'de bu düğme yok)
    if (V2) {
      const tk = p.locator('#sefler [data-vd-takip]').first();
      const k = await tk.getAttribute('data-vd-takip');
      const adres0 = p.url();
      await gercekTikla(p, tk, 'şef kartı Takip Et');
      const td = await p.$$eval(`[data-vd-takip="${k}"]`, (b) => b.map((x) => [x.getAttribute('aria-pressed'), x.textContent.trim()]));
      sonuc(td.length > 0 && td.every(([a, m]) => a === 'true' && /Takip Ediliyor/i.test(m)), w, 'Takip Et → aria-pressed + "Takip Ediliyor"', JSON.stringify(td));
      sonuc(p.url() === adres0 && (await cumleGorunur(p, 'takip ediliyor')), w, 'takip bildirimi görünür, sayfa değişmedi');
    }

    // 7b kaydırdıkça yükleme
    for (let i = 0; i < 12; i++) { await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(250); }
    const son = await p.evaluate(() => {
      const iz = document.querySelector('[data-vd-izgara]'); const n = iz.querySelectorAll('[data-vd-video]').length;
      const kutu = iz.querySelector('[data-vd-son]'); const sut = getComputedStyle(iz).gridTemplateColumns.split(' ').length;
      const span = Number(kutu.getAttribute('data-span') || 0);
      return { n, sut, span, gor: kutu.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), kalan: document.querySelector('template[data-vd-devam]').content.children.length };
    });
    sonuc(son.n === V.length && son.kalan === 0, w, 'kaydırdıkça bütün videolar yüklenir', `${son.n}/${V.length}`);
    sonuc(son.gor && (await cumleGorunur(p, 'Hepsi bu kadar')) && (son.n + son.span) % son.sut === 0, w, '"Hepsi bu kadar" son satırı tamamlar', `${son.n} kart + ${son.span} yayılım · ${son.sut} sütun`);

    // 8 depo
    const depo = await p.evaluate(() => localStorage.length + sessionStorage.length);
    sonuc(depo === 0, w, 'tarayıcı deposuna yazılmadı', String(depo));
    sonuc(!hatalar.length, w, 'JS hatası yok', hatalar.join(' | '));
  } catch (e) {
    sonuc(false, w, 'kapı yarıda kaldı', e.message.split('\n')[0]);
  }
  await ctx.close();
}
await t.close();
console.log(`\n${yesil} yeşil · ${kirmizi} kırmızı${BOZ ? ' (BOZ=1: kırmızı BEKLENİR)' : ''}`);
process.exit(kirmizi ? 1 : 0);
