// Dada Gastro Video Mutfağı prototipi — ortak veri ve yardımcılar (kabuk ajanı; sözleşme: tasks/video-briefler/p-ortak.md).
// Sayfa modülleri bunları build'in verdiği `o` nesnesinden alır (o.esc, o.KATALOG, o.TARIF …); doğrudan import da serbest.
//
// Veri kaynakları (hepsi depoda, derleme anında okunur):
//   veri/katalog.json  (lead)  seriler · videolar (uzun, 16:9) · kisalar (9:16) · konseptler · sure_suzgecleri
//   veri/tarifler.json (kabuk) araclar/veri-hazirla.py — gastro_v2_video salt okuma
//   veri/sefler.json   (kabuk) aynı betik
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const jsonOku = (p, yedek) => { try { return JSON.parse(readFileSync(path.join(KOK, p), 'utf8')); } catch { return yedek; } };
export const var_ = (p) => existsSync(path.join(KOK, p));

export const MARKA = 'Dada Gastro Video Mutfağı';
export const GASTRO = 'https://dadagastro.com';
export const YAYIN = 'https://gaviaworks-dev.github.io/DadaVideo/';
/** Örnek etkileşimlerin görünür etiketi (sahte veri yasak; örnek olduğu yazılır). */
export const PROTOTIP_ORNEGI = 'Prototip örneği';
export const TEMSILI = 'Görüntü temsilîdir · prototip';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Font Awesome solid ikon (Gastro kabuğu all.min.css'i yükler). ui('play') · ui('fa-play') · ui('play', 'vd-x') */
export const ui = (ikon, sinif = '') => `<i class="fa-solid fa-${String(ikon).replace(/^fa-(solid )?/, '').replace(/^fa-/, '')}${sinif ? ' ' + sinif : ''}" aria-hidden="true"></i>`;

/** 252 → "04:12" · 3725 → "1:02:05" */
export function sureMetni(sn) {
  const t = Math.max(0, Math.round(Number(sn) || 0));
  const s = Math.floor(t / 3600), d = Math.floor((t % 3600) / 60), n = t % 60;
  const iki = (x) => String(x).padStart(2, '0');
  return s ? `${s}:${iki(d)}:${iki(n)}` : `${iki(d)}:${iki(n)}`;
}
/** 252 → "PT4M12S" (VideoObject duration) */
export const sureIso = (sn) => { const t = Math.round(Number(sn) || 0); const d = Math.floor(t / 60), n = t % 60; return `PT${d ? d + 'M' : ''}${n || !d ? n + 'S' : ''}`; };
/** 252 → "4 dk" (yaklaşık; ekran okuyucu ve meta için) */
export const sureDkMetni = (sn) => `${Math.max(1, Math.round((Number(sn) || 0) / 60))} dk`;

/* ---------- Veri ---------- */
export const KATALOG = jsonOku('veri/katalog.json', { seriler: [], videolar: [], kisalar: [], konseptler: [], sure_suzgecleri: [] });
export const TARIF = jsonOku('veri/tarifler.json', { tarifler: {} }).tarifler;
export const SEF = jsonOku('veri/sefler.json', { sefler: {} }).sefler;
/** seri slug → seri */
export const SERI = Object.fromEntries((KATALOG.seriler || []).map((s) => [s.slug, s]));
/** video slug → video (uzun ve kısa birlikte; `tur` alanı eklenir: 'uzun' | 'kisa') */
export const VIDEO = Object.fromEntries([
  ...(KATALOG.videolar || []).map((v) => [v.slug, { ...v, tur: 'uzun' }]),
  ...(KATALOG.kisalar || []).map((v) => [v.slug, { ...v, tur: 'kisa' }]),
]);
const kisaMi = (v) => (typeof v === 'string' ? VIDEO[v]?.tur === 'kisa' : v?.tur === 'kisa' || (KATALOG.kisalar || []).some((k) => k.slug === v?.slug));
const slugOf = (x) => (typeof x === 'string' ? x : x?.slug);

/* ---------- Adresler (prototip dosyaları; karşılığı olmayan her şey dadagastro.com) ---------- */
/** uzun → video-izle-<slug>.html · kısa → video-kisa.html?v=<slug> */
export const videoAdresi = (v) => (kisaMi(v) ? `video-kisa.html?v=${encodeURIComponent(slugOf(v))}` : `video-izle-${slugOf(v)}.html`);
export const seriAdresi = (s) => `video-seri-${slugOf(s)}.html`;
/** şef kullanıcı adı → video-sef-<kullanıcı adı, noktalar tireye>.html (berkan.gunes → video-sef-berkan-gunes.html) */
export const sefDosyaAdi = (k) => `video-sef-${String(k).replace(/\./g, '-')}.html`;
export const sefAdresi = (k) => sefDosyaAdi(typeof k === 'string' ? k : k?.kullanici_adi);
/** Şefin Gastro profili (prototipte sayfası yok) */
export const sefGastroAdresi = (k) => `${GASTRO}/sefler/${encodeURIComponent(k)}`;
/** Katalogdaki (sayfası üretilen) tarif → tarif-<slug>.html · diğerleri → dadagastro.com/tarif/<slug> */
export const tarifAdresi = (slug) => (TARIF[slug]?.sayfa ? `tarif-${slug}.html` : `${GASTRO}/tarif/${slug}`);

/* ---------- Video türetimleri ---------- */
export const videoSerisi = (v) => SERI[(typeof v === 'string' ? VIDEO[v] : v)?.seri] || null;
export const videoTarifi = (v) => { const x = typeof v === 'string' ? VIDEO[v] : v; return (x?.tarif && TARIF[x.tarif]) || null; };
/** Videonun şefi = serinin şefi (katalog kararı); yoksa bağlı tarifin şefi. */
export const videoSefi = (v) => { const x = typeof v === 'string' ? VIDEO[v] : v; const k = videoSerisi(x)?.sef || videoTarifi(x)?.sef; return (k && SEF[k]) || null; };
/** Poster: bağlı tarifin kapağı, tarifsiz videoda katalogdaki poster_tarif. → { k640, k1600, alt } | null */
export function videoPosteri(v) {
  const x = typeof v === 'string' ? VIDEO[v] : v; if (!x) return null;
  const t = TARIF[x.tarif] || TARIF[x.poster_tarif]; if (!t) return null;
  return { k640: t.kapak640, k1600: t.kapak1600, alt: x.baslik };
}
/** Vitrin videosu: vitrin === ad (ör. 'Haftanın Serisi'); ad verilmezse ilk vitrinli video. */
export const vitrinVideosu = (ad) => Object.values(VIDEO).find((v) => (ad ? v.vitrin === ad : !!v.vitrin)) || null;

/**
 * Bölüm damgaları → [{ sn, baslik, adim }]
 *  · katalogda `bolumler: [[sn, "başlık"], …]` verilmişse olduğu gibi (adim: null)
 *  · yoksa bağlı tarifin adımlarından türetilir: 0'da "Malzemeler" (adim: null), sonra her adım süresiyle orantılı
 *    (sure_dk yoksa 2 dk sayılır; ağırlık 1–15 dk arasına kırpılır ki tek uzun bekleme adımı videoyu yutmasın).
 *    `adim` = tarif adımının numarası (1'den başlar) → TARIF[slug].adimlar[adim - 1].
 *  · tarif de yoksa tek bölüm [{ sn: 0, baslik: video başlığı, adim: null }].
 */
export function bolumler(v) {
  const x = typeof v === 'string' ? VIDEO[v] : v;
  if (!x) return [];
  if (Array.isArray(x.bolumler) && x.bolumler.length) return x.bolumler.map((b) => (Array.isArray(b) ? { sn: b[0], baslik: b[1], adim: null } : { adim: null, ...b }));
  const t = videoTarifi(x); const toplam = Math.max(1, Number(x.sure_sn) || 0);
  if (!t || !t.adimlar?.length) return [{ sn: 0, baslik: x.baslik, adim: null }];
  const giris = Math.round(Math.min(Math.max(toplam * 0.08, 4), 45));
  const agirlik = t.adimlar.map((a) => Math.min(15, Math.max(1, Number(a.sure_dk) || 2)));
  const top = agirlik.reduce((s, a) => s + a, 0);
  const kalan = toplam - giris - Math.min(20, Math.round(toplam * 0.05)); // sonda kısa kapanış payı
  const sonuc = [{ sn: 0, baslik: 'Malzemeler', adim: null }];
  let imlec = giris;
  t.adimlar.forEach((a, i) => {
    sonuc.push({ sn: Math.round(imlec), baslik: a.baslik || `Adım ${i + 1}`, adim: i + 1 });
    imlec += (kalan * agirlik[i]) / top;
  });
  // kesin artan ve videonun içinde
  for (let i = 1; i < sonuc.length; i++) if (sonuc[i].sn <= sonuc[i - 1].sn) sonuc[i].sn = sonuc[i - 1].sn + 1;
  return sonuc.filter((b) => b.sn < toplam);
}

/** Tarif süresi (hazırlık + pişirme) dk; tarifsiz videoda video süresi (katalog notu, 3 Kas karar 7). */
export const sureDk = (v) => { const x = typeof v === 'string' ? VIDEO[v] : v; const t = videoTarifi(x); const dk = t ? (t.hazirlik_dk || 0) + (t.pisirme_dk || 0) : 0; return dk || Math.max(1, Math.round((x?.sure_sn || 0) / 60)); };
/** Süre süzgeci kodu: 15-alti | 15-30 | 30-ustu */
export const sureKodu = (v) => { const d = sureDk(v); return d < 15 ? '15-alti' : d <= 30 ? '15-30' : '30-ustu'; };
