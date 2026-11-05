// Süzgeç kapısı (V2 · Patron revizesi K7) · hub ajanı.
// Ortak liste süzgecini (src/v2/suzgec.mjs + varlik/v2/js/suzgec.js) taşıyan her sayfa × 1440/390 × reklamsız/reklamlı.
// Gerçek tıklama (force yok): öğe scrollIntoView(instant, center) + elementFromPoint isabeti. Görünürlük checkVisibility.
//  S1 seçim → "N … bulundu" sayısı ve görünür liste öğesi sayısı değişir, ikisi seçeneğin sayısına eşit; adres ?<grup>=<değer> yazılır
//  S2 sayfa yenilenince seçim geri gelir (kutu işaretli, sayı aynı)
//  S3 boş durum: 0 sayılı seçenek adres sorgusuyla ya da tıklamayla sonuçsuz birleşim → Gastro .bos-durum görünür, sayı 0, Temizle başa döner.
//     Veri gereği kurulamayan sayfalar S3_KUTUK'ta (gerekçe + karar); kütük dışı kurulamama KIRMIZI.
//  S4 Temizle → bütün öğeler görünür, adres temiz
//  S5 390: "Filtrele" düğmesi çekmeceyi alttan açar (.lst-side.open, alt kenar ekranın altında, görünür), × kapatır
//  S6 sıralama: Sıralama menüsünden varsayılan dışı bir seçenek → görünür öğelerin sırası değişir, adres ?sirala= yazılır
//  S7 tarayıcı deposu boş · JS hatası yok
//  P  parite (lead 5 Kas; kanon/bilesenler.css yüklenmediği için görünüm donörle ölçülür): 8960 /tarifler'e karşı, 4 px + computed
//     (font-size · font-weight · color · background · border-radius): .lst-side (1440 kenar çubuğu / 390 açık çekmece: genişlik, dolgu,
//     köşe, alt kenara yapışık), .sheet-head/.sheet-foot yüksekliği, akordeon başlığı .fct-head, seçenek satırı .fct-row (yükseklik,
//     dolgu, .cbx konumu, .fcnt sağ payı), sayı satırı .lst-sum, .sort-btn (aynı metinse genişlik de) + açık menünün ilk seçeneği
//     (donörde <a>, bizde <button> — kutu aynı kalmalı), 390'da .btn-filter, boş durum .bos-durum (donör /tarifler?q=<sonuçsuz>).
//     Yalnız Gastro .lst-layout düzenli sayfalarda (kısa video görüntüleyicinin çekmecesi tam ekran, karşılığı yok).
//     DONOR=http://127.0.0.1:8960 (yoksa P ⚪). BOZ=parite → .fct-row dolgusu ve .lst-sum boyu bozulur (kırmızı vermeli).
// Kullanım: node araclar/suzgec-kapisi.mjs  (TABAN=http://localhost:8796/DadaGastroVideo/v2/ · GENISLIK=1440,390 · SAYFA=video-seriler,…)
//           BOZ=1 → adres yazılmaz (replaceState boş), çekmece açılmaz (CSS) — kırmızı vermeli
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TABAN = process.env.TABAN || 'http://localhost:8796/DadaGastroVideo/v2/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SUZ = (process.env.SAYFA || '').split(',').filter(Boolean);
const BOZ = process.env.BOZ || '';
const DONOR = process.env.DONOR || 'http://127.0.0.1:8960';
const REKLAM = (process.env.REKLAM || '0,1').split(',').map((x) => x === '1');
// süzgeç taşıyan sayfalar: derlenmiş v2/*.html içinde data-vd-suzgec geçenler (izle'nin sayfaları da kendiliğinden girer)
const SAYFALAR = readdirSync(path.join(KOK, 'v2')).filter((f) => /^video-.*\.html$/.test(f)).sort()
  .filter((f) => readFileSync(path.join(KOK, 'v2', f), 'utf8').includes('data-vd-suzgec='))
  .filter((f) => !SUZ.length || SUZ.some((x) => f.includes(x)));

let kirmizi = 0, yesil = 0, olcmedi = 0;
// Kütük (CLAUDE.md "bilinen kırmızı yeni kırmızıyı yutar" kalıbı): S3'ün veri gereği ölçülemediği, KARARA BAĞLANMIŞ sayfalar.
// Kütükteki sayfa ⚪ basılır (gerekçesiyle) ve çıkış kodunu etkilemez. Sayfada 0 sayılı seçenek ya da sonuçsuz birleşim
// oluşursa (katalog değişirse) S3 kendiliğinden ölçülür — kütük yalnız "ölçülemedi" durumunu karşılar, kırmızıyı yutmaz.
// Kütükte OLMAYAN bir sayfada S3 ölçülemezse KIRMIZI sayılır (yeni, karara bağlanmamış durum).
const S3_KUTUK = {
  'video-seri-akilli-ekipman-test.html': 'veri gereği oluşamaz: tek grup (süre), üç seçeneğin üçü dolu (1·2·2) — lead kararı 5 Kas',
  'video-seri-30-saniyede-tat.html': 'veri gereği oluşamaz: tek grup (süre), üç seçeneğin üçü dolu (4·4·1) — lead kararı 5 Kas',
  'video-sef-polat-abadan.html': 'veri gereği oluşamaz: tek grup (süre), üç seçeneğin üçü dolu (1·2·2; Akıllı Ekipman serisi) — lead kararı 5 Kas',
};
const sonuc = (ok, et, ad, ek = '') => { if (ok) yesil++; else kirmizi++; if (!ok || process.env.AYRINTI) console.log(`${ok ? '✓' : '✗'} ${et} ${ad}${ek ? ' — ' + ek : ''}`); };

async function tikla(p, el, ad) {
  const h = typeof el === 'string' ? await p.$(el) : el;
  if (!h) throw new Error(`öğe yok: ${ad}`);
  await h.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }));
  await p.waitForTimeout(150);
  const r = await h.evaluate((e) => { const b = e.getBoundingClientRect(); const x = b.left + Math.min(b.width / 2, 40), y = b.top + b.height / 2; const t = document.elementFromPoint(x, y); return { x, y, ok: !!t && (t === e || e.contains(t)), ust: t ? (t.className || t.tagName) + '' : 'null' }; });
  if (!r.ok) throw new Error(`tıklama isabet etmiyor (${ad}): üstte ${r.ust}`);
  await p.mouse.click(r.x, r.y);
  await p.waitForTimeout(250);
}
const OLC = () => {
  const kok = document.querySelector('[data-vd-suzgec]');
  const og = [...kok.querySelectorAll('[data-sz-oge]')];
  const gor = og.filter((e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
  const sayi = (kok.querySelector('[data-sz-sayi]')?.textContent || '').trim();
  return { toplam: og.length, gorunen: gor.length, sira: gor.map((e) => e.getAttribute('data-sz-dizin')).join(','), sayi: parseInt(sayi.replace(/\./g, ''), 10), sayiMetin: sayi,
    bos: !!kok.querySelector('[data-sz-bos]')?.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), arama: location.search };
};


// Parite ölçümü (sayfa içinde): seçici → { kutu, computed } ; açık menü/çekmece durumu çağıran ayarlar
const PARITE_OLC = () => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); const c = getComputedStyle(e); return { w: b.width, h: b.height, x: b.left, y: b.top, r: b.right, bt: b.bottom, fs: parseFloat(c.fontSize), fw: c.fontWeight, renk: c.color, zemin: c.backgroundColor, kose: c.borderTopLeftRadius, kenar: c.borderTopWidth + ' ' + c.borderTopStyle, pt: parseFloat(c.paddingTop), pr: parseFloat(c.paddingRight), pb: parseFloat(c.paddingBottom), pl: parseFloat(c.paddingLeft), ls: c.letterSpacing, metin: (e.textContent || '').replace(/\s+/g, ' ').trim() }; };
  const gor = (e) => e && e.getClientRects().length && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  const side = document.querySelector('.lst-side');
  // seçenek satırı: düz satır (donörün Kategori satırları küçük görsel, Mutfak satırları bayrak taşır) → Süre grubunun ilk satırı
  const satir = [...side.querySelectorAll('.fct[data-group="sure"] .fct-row'), ...side.querySelectorAll('.fct.open .fct-row')].find(gor);
  const m = { side: r(side), head: gor(side.querySelector('.sheet-head')) ? r(side.querySelector('.sheet-head')) : null, foot: gor(side.querySelector('.sheet-foot')) ? r(side.querySelector('.sheet-foot')) : null,
    fctHead: r(side.querySelector('.fct .fct-head')), row: r(satir), cbx: r(satir && satir.querySelector('.cbx')), fcnt: r(satir && satir.querySelector('.fcnt')),
    sum: r(document.querySelector('.lst-sum')), sumB: r(document.querySelector('.lst-sum b')), sortBtn: r(document.querySelector('.sort-btn')),
    btnFilter: gor(document.querySelector('.btn-filter')) ? r(document.querySelector('.btn-filter')) : null, ih: innerHeight };
  return m;
};
const MENU_OLC = () => { const i = document.querySelector('.sort-menu').querySelector('a, button'); const b = i.getBoundingClientRect(); const c = getComputedStyle(i); return { w: b.width, h: b.height, fs: parseFloat(c.fontSize), fw: c.fontWeight, renk: c.color, zemin: c.backgroundColor, kose: c.borderTopLeftRadius, pt: parseFloat(c.paddingTop), pl: parseFloat(c.paddingLeft), gap: c.gap }; };
const BOS_OLC = () => { const k = document.querySelector('.bos-durum'); const r = (e) => { const b = e.getBoundingClientRect(); const c = getComputedStyle(e); return { h: b.height, fs: parseFloat(c.fontSize), fw: c.fontWeight, renk: c.color, zemin: c.backgroundColor, kose: c.borderTopLeftRadius, pt: parseFloat(c.paddingTop), pl: parseFloat(c.paddingLeft), mb: parseFloat(c.marginBottom), ls: c.letterSpacing, mw: c.maxWidth, gap: c.gap }; }; return { kap: r(k), h3: r(k.querySelector('h3')), p: r(k.querySelector('p')), dugme: r(k.querySelector('.dugme')) }; };
const donorOnbellek = new Map();
async function donorOlc(t, w) {
  if (donorOnbellek.has(w)) return donorOnbellek.get(w);
  const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); let v = null;
  try {
    await p.goto(DONOR + '/tarifler', { waitUntil: 'load', timeout: 45000 });
    await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(400);
    if (w < 1025) { await p.evaluate(() => document.querySelector('#btnFilter').click()); await p.waitForTimeout(600); }
    const ana = await p.evaluate(PARITE_OLC);
    if (w < 1025) { await p.evaluate(() => document.querySelector('#sheetClose').click()); await p.waitForTimeout(500); }
    await p.evaluate(() => document.querySelector('#sortBtn').click()); await p.waitForTimeout(300);
    const menu = await p.evaluate(MENU_OLC);
    await p.goto(DONOR + '/tarifler?q=qqzzxxyyww', { waitUntil: 'load', timeout: 45000 }); await p.waitForTimeout(300);
    const bos = await p.evaluate(BOS_OLC);
    v = { ana, menu, bos };
  } catch (e) { v = null; }
  await ctx.close(); donorOnbellek.set(w, v); return v;
}
function karsilastir(ad, d, b, alanlar, et, notlar) {
  if (!d || !b) { if (d && !b) notlar.push(`${ad}: bizde yok`); return; }
  for (const a of alanlar) {
    const x = d[a], y = b[a];
    if (typeof x === 'number') { const tol = a === 'fs' ? 0.5 : 4; if (Math.abs(x - y) > tol) notlar.push(`${ad}.${a} ${Math.round(y * 10) / 10} ≠ donör ${Math.round(x * 10) / 10}`); }
    else if (x !== y) notlar.push(`${ad}.${a} «${y}» ≠ donör «${x}»`);
  }
}

const t = await chromium.launch();
for (const w of GENISLIK) for (const reklam of REKLAM) {
  const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  if (BOZ === 'parite') await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.fct-row{padding:2px 0!important}.lst-sum{font-size:20px!important}'; document.head.appendChild(s); }));
  else if (BOZ) await ctx.addInitScript(() => {
    history.replaceState = function () {};
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.lst-side.open{transform:translateY(110%)!important}'; document.head.appendChild(s); });
  });
  for (const s of SAYFALAR) {
    const et = `[${w}${reklam ? ' reklamlı' : ''}] ${s}`;
    const p = await ctx.newPage();
    const hata = []; p.on('pageerror', (e) => hata.push(e.message));
    const adres = TABAN + s + (reklam ? '?reklam=1' : '');
    try {
      await p.goto(adres, { waitUntil: 'load', timeout: 30000 });
      await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(300);
      // sonsuz yüklemeli liste: sayım tam listeye bakar → süzgeç seçilince tamamı yüklenir; başlangıç sayısı süzgecin kendi toplamı
      const ilk = await p.evaluate(OLC);
      const mobil = w < 1025;
      // çekmece duruma göre açılır (izle isteği): "Filtrele/Süzgeç" düğmesi görünür ve .lst-side kapalı → aç (kısa video görüntüleyicide 1440'ta da)
      const cekmeceGerek = () => p.evaluate(() => { const k = document.querySelector('[data-vd-suzgec]'); const b = k.querySelector('[data-sz-ac]'); const s = k.querySelector('.lst-side'); return !!b && b.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !s.classList.contains('open'); });
      let cekmeceKullanildi = false;
      // çekmece geçişi (transform transition) bitene kadar bekle: konum iki ardışık ölçümde aynı olmalı (yük altında 400 ms yetmiyordu)
      const durulsun = () => p.waitForFunction(() => { const s = document.querySelector('[data-vd-suzgec] .lst-side'); const y = Math.round(s.getBoundingClientRect().top); const ok = s.__vdSonY === y; s.__vdSonY = y; return ok; }, null, { polling: 100, timeout: 3000 }).catch(() => {});
      const cekmeceAc = async () => {
        if (!(await cekmeceGerek())) return;
        cekmeceKullanildi = true;
        await tikla(p, '[data-vd-suzgec] [data-sz-ac]', 'Filtrele');
        await p.waitForTimeout(150); await durulsun();
        const c = await p.evaluate(() => { const s = document.querySelector('[data-vd-suzgec] .lst-side'); const r = s.getBoundingClientRect(); return { acik: s.classList.contains('open'), gor: s.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), alt: Math.round(r.bottom), ust: Math.round(r.top), h: innerHeight }; });
        sonuc(c.acik && c.gor && c.ust >= 0 && c.ust < c.h && Math.abs(c.alt - c.h) <= 2, et, 'S5 çekmece alttan açılır', JSON.stringify(c));
      };
      const cekmeceKapat = async () => {
        const acik = await p.evaluate(() => document.querySelector('[data-vd-suzgec] .lst-side').classList.contains('open'));
        if (!acik) return;
        await tikla(p, '[data-vd-suzgec] .lst-side [data-sz-kapat]', '×');
        await p.waitForTimeout(150); await durulsun();
        const c = await p.evaluate(() => { const s = document.querySelector('[data-vd-suzgec] .lst-side'); const r = s.getBoundingClientRect(); return { acik: s.classList.contains('open'), ust: Math.round(r.top), h: innerHeight, kilit: document.body.classList.contains('bn-lock') }; });
        sonuc(!c.acik && c.ust >= c.h - 1 && !c.kilit, et, 'S5 çekmece kapanır', JSON.stringify(c));
      };
      // P parite (yalnız Gastro .lst-layout düzeni; reklamsız kipte)
      const duzen = await p.evaluate(() => document.querySelector('[data-vd-suzgec]').classList.contains('lst-layout'));
      if (duzen && !reklam) {
        const d = await donorOlc(t, w);
        if (!d) { olcmedi++; console.log(`⚪ ${et} P donör (${DONOR}/tarifler) açılamadı — parite ÖLÇÜLMEDİ`); }
        else {
          if (mobil) await cekmeceAc();
          await p.mouse.move(1, 1); await p.waitForTimeout(300); // :hover durumunu ölçmeyelim (donör JS tıklamasıyla ölçülür)
          const b = await p.evaluate(PARITE_OLC);
          if (mobil) await cekmeceKapat();
          const n = [];
          karsilastir('lst-side', d.ana.side, b.side, mobil ? ['w', 'pt', 'pr', 'pl', 'kose', 'zemin', 'kenar', 'bt'] : ['w', 'pt', 'pr', 'pl', 'kose', 'zemin', 'kenar'], et, n);
          karsilastir('sheet-head', d.ana.head, b.head, ['h', 'fs', 'fw'], et, n);
          karsilastir('sheet-foot', d.ana.foot, b.foot, ['h'], et, n);
          karsilastir('fct-head', d.ana.fctHead, b.fctHead, ['h', 'fs', 'fw', 'renk', 'pt', 'pb'], et, n);
          karsilastir('fct-row', d.ana.row, b.row, ['h', 'pt', 'pb', 'pl', 'fs', 'fw'], et, n);
          const cbxD = d.ana.cbx && { ...d.ana.cbx, dx: d.ana.cbx.x - d.ana.row.x }, cbxB = b.cbx && { ...b.cbx, dx: b.cbx.x - b.row.x };
          karsilastir('cbx', cbxD, cbxB, ['w', 'h', 'dx', 'kose', 'zemin'], et, n);
          const fcD = d.ana.fcnt && { ...d.ana.fcnt, sag: d.ana.row.r - d.ana.fcnt.r }, fcB = b.fcnt && { ...b.fcnt, sag: b.row.r - b.fcnt.r };
          karsilastir('fcnt', fcD, fcB, ['sag', 'fs', 'fw', 'renk'], et, n);
          karsilastir('lst-sum', d.ana.sum, b.sum, ['h', 'fs', 'fw', 'renk'], et, n);
          karsilastir('lst-sum b', d.ana.sumB, b.sumB, ['fs', 'fw', 'renk'], et, n);
          const ayniMetin = d.ana.sortBtn && b.sortBtn && d.ana.sortBtn.metin === b.sortBtn.metin;
          karsilastir('sort-btn', d.ana.sortBtn, b.sortBtn, [...(ayniMetin ? ['w'] : []), 'h', 'pt', 'pl', 'fs', 'fw', 'renk', 'zemin', 'kose', 'kenar'], et, n);
          if (mobil) {
            karsilastir('btn-filter', d.ana.btnFilter, b.btnFilter, ['w', 'h', 'fs', 'fw', 'renk', 'zemin', 'kose'], et, n);
            if (b.side && Math.abs(b.side.bt - b.ih) > 2) n.push(`çekmece alt kenarı ${Math.round(b.side.bt)} ≠ ekran ${b.ih}`);
          }
          // açık sıralama menüsünün ilk seçeneği: donör <a>, bizde <button> — kutu aynı olmalı
          if (b.sortBtn) {
            await tikla(p, '[data-vd-suzgec] .sort-btn', 'Sıralama (parite)');
            const m = await p.evaluate(MENU_OLC);
            await p.keyboard.press('Escape'); await p.waitForTimeout(150);
            karsilastir('sort-menu öğesi', d.menu, m, ['h', 'pt', 'pl', 'fs', 'fw', 'renk', 'kose', 'gap'], et, n);
          }
          sonuc(!n.length, et, 'P süzgeç paritesi (/tarifler, 4 px + computed)', n.slice(0, 8).join(' · '));
        }
      }
      let bosOlculdu = false;
      const bosParite = async () => {
        if (bosOlculdu || !duzen || reklam) return; bosOlculdu = true;
        const d = await donorOlc(t, w); if (!d) return;
        const n = []; const b = await p.evaluate(BOS_OLC);
        karsilastir('bos-durum', d.bos.kap, b.kap, ['pt', 'pl', 'zemin'], et, n); karsilastir('bos h3', d.bos.h3, b.h3, ['h', 'fs', 'fw', 'renk', 'mb', 'ls'], et, n);
        karsilastir('bos p', d.bos.p, b.p, ['fs', 'fw', 'renk', 'mb', 'mw'], et, n); karsilastir('bos düğme', d.bos.dugme, b.dugme, ['h', 'pt', 'pl', 'fs', 'fw', 'renk', 'zemin', 'kose', 'gap'], et, n);
        sonuc(!n.length, et, 'P boş durum paritesi (/tarifler?q=<sonuçsuz>)', n.slice(0, 8).join(' · '));
      };
      // S3a boş durum adres sorgusuyla: başlangıçta sayısı 0 olan bir seçenek (donör de 0 sayılı seçeneği normal satır olarak gösterir)
      let s3 = false;
      const sifir = await p.evaluate(() => { const k = document.querySelector('[data-vd-suzgec]'); for (const i of k.querySelectorAll('input[data-sz-secenek]')) { if (parseInt(i.parentNode.querySelector('.fcnt').textContent.replace(/\./g, ''), 10) === 0) return { grup: i.name, deger: i.value }; } return null; });
      if (sifir) {
        const u = new URL(adres); u.searchParams.set(sifir.grup, sifir.deger);
        await p.goto(u.toString(), { waitUntil: 'load' }); await p.waitForTimeout(400);
        const c = await p.evaluate(OLC);
        const bosMetin = await p.evaluate(() => { const b = document.querySelector('[data-vd-suzgec] [data-sz-bos]'); return b && b.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) ? b.querySelector('h3').textContent.trim() : ''; });
        sonuc(c.gorunen === 0 && c.sayi === 0 && c.bos && !!bosMetin, et, 'S3 boş durum (adres sorgusu, 0 sayılı seçenek)', `?${sifir.grup}=${sifir.deger} · görünen ${c.gorunen} · «${bosMetin}»`);
        await bosParite();
        s3 = true;
        // boş durumdan Temizle (lead: adresle kurulan boş durumda sayı 0 → Temizle başa döner)
        if (c.bos) {
          await tikla(p, '[data-vd-suzgec] [data-sz-bos] [data-sz-temizle]', 'boş durum Temizle');
          const z = await p.evaluate(OLC); const q = new URLSearchParams(z.arama); q.delete('reklam'); q.delete('v');
          sonuc(z.sayi === z.toplam && !z.bos && !q.toString(), et, 'S3 boş durumdan Temizle başa döner', `${z.sayi}/${z.toplam} · «${z.arama}»`);
        }
        await p.goto(adres, { waitUntil: 'load' }); await p.waitForTimeout(300);
      }
      // S1: sonucu değiştiren bir seçenek (0 < sayı < görünen)
      const aday = await p.evaluate(() => {
        const kok = document.querySelector('[data-vd-suzgec]');
        for (const inp of kok.querySelectorAll('input[data-sz-secenek]')) {
          const n = parseInt(inp.parentNode.querySelector('.fcnt').textContent.replace(/\./g, ''), 10);
          const toplam = kok.querySelectorAll('[data-sz-oge]').length;
          if (n > 0 && n < toplam) return { grup: inp.name, deger: inp.value, n };
        }
        return null;
      });
      if (!aday) { olcmedi++; console.log(`⚪ ${et} S1 değiştiren seçenek yok — ÖLÇÜLMEDİ`); }
      else {
        await cekmeceAc();
        const satir = await p.$(`[data-vd-suzgec] input[name="${aday.grup}"][value="${aday.deger}"]`);
        await tikla(p, await satir.evaluateHandle((i) => i.closest('.fct-row').querySelector('.ft')), `seçenek ${aday.grup}=${aday.deger}`);
        await cekmeceKapat();
        const a = await p.evaluate(OLC);
        sonuc(a.gorunen === aday.n && a.sayi === aday.n && a.gorunen !== ilk.gorunen, et, 'S1 seçim → sayı ve görünür öğe', `${ilk.gorunen} → ${a.gorunen} (seçenek ${aday.n}, metin «${a.sayiMetin}»)`);
        sonuc(new URLSearchParams(a.arama).get(aday.grup) === aday.deger, et, 'S1 adres sorgusu', a.arama || '(boş)');
        // S2 yenile
        await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(400);
        const b = await p.evaluate((x) => ({ ...(() => { const kok = document.querySelector('[data-vd-suzgec]'); return { isaret: !!kok.querySelector(`input[name="${x.grup}"][value="${x.deger}"]`)?.checked }; })() }), aday);
        const b2 = await p.evaluate(OLC);
        sonuc(b.isaret && b2.gorunen === aday.n, et, 'S2 yenileyince seçim geri gelir', `işaret ${b.isaret} · ${b2.gorunen}`);
        // S3 boş durum: mevcut seçimle birleşince 0 veren öteki grup seçeneği
        const bosAday = await p.evaluate((x) => {
          const kok = document.querySelector('[data-vd-suzgec]');
          const og = [...kok.querySelectorAll('[data-sz-oge]')];
          for (const inp of kok.querySelectorAll('input[data-sz-secenek]')) {
            if (inp.name === x.grup) continue;
            const n = og.filter((e) => (e.getAttribute('data-sz-' + x.grup) || '').split(' ').includes(x.deger) && (e.getAttribute('data-sz-' + inp.name) || '').split(' ').includes(inp.value)).length;
            if (n === 0) return { grup: inp.name, deger: inp.value };
          }
          return null;
        }, aday);
        if (!bosAday && !s3) {
          if (S3_KUTUK[s]) { olcmedi++; console.log(`⚪ ${et} S3 boş durum — ${S3_KUTUK[s]} (kütük; çıkış kodunu etkilemez)`); }
          else sonuc(false, et, 'S3 boş durum kurulamadı', 'sonuçsuz birleşim de 0 sayılı seçenek de yok ve sayfa kütükte değil — karara bağla ya da veriyi düzelt');
        }
        else if (bosAday) {
          await cekmeceAc();
          const i2 = await p.$(`[data-vd-suzgec] input[name="${bosAday.grup}"][value="${bosAday.deger}"]`);
          await i2.evaluate((i) => { const f = i.closest('.fct'); if (!f.classList.contains('open')) f.querySelector('.fct-head').click(); if (i.closest('.fct-row').classList.contains('xtra') && !f.classList.contains('more-open')) f.querySelector('.fct-more').click(); });
          await tikla(p, await i2.evaluateHandle((i) => i.closest('.fct-row').querySelector('.ft')), `seçenek ${bosAday.grup}=${bosAday.deger}`);
          await cekmeceKapat();
          const c = await p.evaluate(OLC);
          sonuc(c.gorunen === 0 && c.sayi === 0 && c.bos, et, 'S3 boş durum görünür', `görünen ${c.gorunen} · boş ${c.bos}`);
          if (c.bos) await bosParite();
        }
        // S4 temizle (boş durumdaysa onun düğmesi, değilse kenar çubuğu/çekmece "Temizle")
        const bosGor = (await p.evaluate(OLC)).bos;
        if (bosGor) await tikla(p, '[data-vd-suzgec] [data-sz-bos] [data-sz-temizle]', 'boş durum temizle');
        else { await cekmeceAc(); const acik = await p.evaluate(() => document.querySelector('[data-vd-suzgec] .lst-side').classList.contains('open')); await tikla(p, acik ? '[data-vd-suzgec] .sheet-head [data-sz-temizle]' : '[data-vd-suzgec] .sheet-foot [data-sz-temizle]', 'Temizle'); if (acik) await cekmeceKapat(); }
        const d = await p.evaluate(OLC);
        const kalanQ = new URLSearchParams(d.arama); kalanQ.delete('reklam'); kalanQ.delete('v'); // reklam kipi ve kısa videonun ekrandaki video parametresi süzgeç seçimi değil (izle isteği)
        const aramaTemiz = !kalanQ.toString();
        sonuc(d.gorunen === d.toplam && d.sayi === d.toplam && aramaTemiz, et, 'S4 Temizle başa döner', `${d.gorunen}/${d.toplam} · «${d.arama}»`);
      }
      // S6 sıralama
      const once = await p.evaluate(OLC);
      const siraVar = await p.$('[data-vd-suzgec] [data-sz-sira-kok]');
      if (!siraVar) { olcmedi++; console.log(`⚪ ${et} S6 sıralama yok`); }
      else {
        const secenekSay = await p.$$eval('[data-vd-suzgec] [data-sz-sira]', (b) => b.length);
        let degisti = false, son = once, kod = '';
        for (let i = 1; i < secenekSay && !degisti; i++) {
          await tikla(p, '[data-vd-suzgec] .sort-btn', 'Sıralama');
          const bh = (await p.$$('[data-vd-suzgec] [data-sz-sira]'))[i];
          kod = await bh.getAttribute('data-sz-sira');
          await tikla(p, bh, `sıralama ${kod}`);
          son = await p.evaluate(OLC);
          degisti = son.sira !== once.sira;
        }
        sonuc(degisti && new URLSearchParams(son.arama).get('sirala') === kod, et, 'S6 sıralama sırayı değiştirir', `${kod} · ${son.arama}`);
      }
      const depo = await p.evaluate(() => localStorage.length + sessionStorage.length);
      sonuc(depo === 0 && !hata.length, et, 'S7 depo boş · JS hatası yok', hata.join(' | '));
    } catch (e) { kirmizi++; console.log(`✗ ${et} kapı yarıda kaldı — ${e.message.split("\n")[0]}`); if (process.env.YIGIN) console.log(e.stack); }
    await p.close();
  }
  await ctx.close();
}
await t.close();
console.log(`\n${SAYFALAR.length} sayfa × ${GENISLIK.length} genişlik × ${REKLAM.length} kip · ${yesil} yeşil · ${kirmizi} kırmızı · ${olcmedi} ölçülmedi${BOZ ? ' (BOZ=1: kırmızı BEKLENİR)' : ''}`);
process.exit(kirmizi ? 1 : 0);
