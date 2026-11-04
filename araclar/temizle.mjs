// Kabuk temizliği (Health temizle.mjs'in Video uyarlaması) — yerel Gastro (8960) HTML'inden kopyalanan sayfalarda yalnız GÖRSEL kabuk kalır.
// snapshot.mjs (çekerken) ve build.mjs (derlerken) bunu uygular; CLI ile mevcut donörler yerinde temizlenir:
//   node araclar/temizle.mjs src/donor/*.html
// Silinenler: oturum/kimlik/CSRF/şifreli değerler, canlı sayfa meta'ları (og/twitter/article/canonical),
// kullanıcıya özel bloklar (hesap menüsü, bildirim zili), form ve gönderim yüzeyleri (Görüş Bildir,
// giriş kapısı, kaydet/liste formları, _token), tarif detayına özgü gizli paneller, çerez bandı, izleme.
import { readFile, writeFile } from 'node:fs/promises';

/** Açılış etiketi `bas` regex'iyle bulunan öğeyi, aynı adlı iç içe etiketleri sayarak kapanışına kadar siler. */
export function ogeSil(html, bas) {
  let guvenlik = 0;
  for (;;) {
    const m = bas.exec(html); bas.lastIndex = 0;
    if (!m || guvenlik++ > 200) return html;
    const ad = m[1].toLowerCase(); const i = m.index;
    const ac = new RegExp(`<${ad}\\b`, 'gi'), kap = new RegExp(`</${ad}\\s*>`, 'gi');
    let derinlik = 0, j = i;
    const tokenler = [];
    for (const x of html.slice(i).matchAll(new RegExp(`<${ad}\\b|</${ad}\\s*>`, 'gi'))) tokenler.push([x.index + i, x[0].startsWith('</') ? -1 : 1, x[0].length]);
    for (const [pos, d, uz] of tokenler) { derinlik += d; if (derinlik === 0) { j = pos + uz; break; } }
    if (j === i) return html; // kapanış yok → dokunma
    html = html.slice(0, i) + html.slice(j);
    void ac; void kap;
  }
}

const ID_SIL = ['rdActbar', 'rdSharePop', 'lightbox', 'cookmode', 'fbTab', 'fbOverlay', 'fbModal', 'cookieBanner', 'lgOverlay', 'lgGate', 'keToast', 'mentorPanel'];
const SINIF_SIL = ['fb-rail', 'head-bell', 'acct-item acct-wrap', 'drawer-acct', 'd-item d-acct-block'];
const BETIK_SIL = /<script[^>]*src="[^"]*(analitik|goruntulenme|gorus-gonder|gorus-girisleri|dm-gorus|dm-p4-depo|dm-p4-m|dm-p5-l|tarif-eylem|yol-koprusu|telefon-maskesi|sosyal-kayit-onayi|basari-bildirimi|kaydedilmemis|zil-sayaci|depo-kapisi)[^"]*"[^>]*><\/script>\s*/g;

// Tarif sayfası (tarif-<slug>.html) olarak yayınlanan donörde istemci tarafında çalışan paneller KORUNUR:
// pişirme modu (#cookmode), görsel önizleme (#lightbox), paylaşım menüsü (#rdSharePop). Kabuk olarak kullanılan donörde silinir.
export const TARIF_KORUNAN = ['cookmode', 'lightbox', 'rdSharePop'];
export function kabukTemizle(html, { tarif = false } = {}) {
  // 1 · head: kimlik, CSRF, şifreli değerler, canlı sayfa kimliği
  html = html
    .replace(/<meta name="(csrf-token|dada-kimlik|dada-kalkan|dada-goruntulenme|dada-yollar)"[^>]*>\s*/g, '')
    .replace(/<meta (property|name)="(og:[^"]*|twitter:[^"]*|article:[^"]*|fb:[^"]*)"[^>]*>\s*/g, '')
    .replace(/<link rel="(canonical|alternate|shortlink)"[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
    .replace(BETIK_SIL, '');
  // 2 · formlardaki token/oturum alanları ve kullanıcıya özel eylem formları
  html = html.replace(/<input type="hidden" name="_token"[^>]*>/g, '');
  for (const uc of ['mutfak-defterim/kayit/toggle', 'menulerim/alisveris', 'alisveris', '/gorus', '/giris', '/kayit', 'yorum', 'tepki', 'takip-et', 'bulten', 'degerlendir', 'ben-de-yaptim', 'eline-saglik', 'cerez']) {
    const re = new RegExp(`<(form)\\b[^>]*action="[^"]*${uc.replace(/[/.]/g, (c) => '\\' + c)}[^"]*"[^>]*>`, 'i');
    for (let n = 0; n < 400 && re.test(html); n++) html = ogeSil(html, new RegExp(re.source, 'i'));
  }
  // 3 · gövde: kullanıcıya özel ve gönderim yüzeyleri, tarif detayına özgü gizli paneller
  for (const id of ID_SIL.filter((x) => !(tarif && TARIF_KORUNAN.includes(x)))) html = ogeSil(html, new RegExp(`<([a-z]+)\\b[^>]*\\bid="${id}"`, 'i'));
  for (const s of SINIF_SIL) for (let n = 0; n < 20; n++) { const once = html; html = ogeSil(html, new RegExp(`<([a-z]+)\\b[^>]*\\bclass="[^"]*\\b${s}\\b[^"]*"`, 'i')); if (once === html) break; }
  // 4 · kalan veri nitelikleri: imzalı/şifreli değer taşıyabilecek her şey
  html = html.replace(/\sdata-[a-z-]*(jeton|token|imza|signature|csrf)[a-z-]*="[^"]*"/gi, '');
  // 5 · URL'lerde şifreli durum parametreleri (ör. sayfalama ?akis=eyJpdiI6…)
  html = html.replace(/(\?|&amp;|&)[a-z_]+=eyJ[A-Za-z0-9%_=-]+/g, (t, ayrac) => (ayrac === '?' ? '?' : ''))
             .replace(/\?&amp;/g, '?').replace(/\?"/g, '"');
  return html;
}

/** Temizlik sonrası kalan şüpheli izleri döndürür (kapı ve CLI için). */
export function tokenTaramasi(html, { tarif = false } = {}) {
  const bulgu = [];
  // Kaynak gösteren HTML yorumları (<!-- donör: http://127.0.0.1:8960/… -->) bilerek yerel adresi taşır; tarama işaretlemeye bakar.
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  const kontrol = [
    ['csrf/kimlik meta', /<meta name="(csrf-token|dada-kimlik|dada-kalkan)"/],
    ['_token alanı', /name="_token"/],
    ['csrf değeri', /csrf[^a-z]{0,12}[:=][^,}]{0,12}[A-Za-z0-9]{24,}/i],
    ['Laravel şifreli yük', /eyJpdiI6/],
    ['JWT', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}/],
    ['oturum çerezi adı', /(laravel_session|XSRF-TOKEN)/],
    ['jeton/token niteliği', /data-[a-z-]*(jeton|token|imza|signature)[a-z-]*="[^"]+"/i],
    ['Görüş Bildir formu', /id="fbModal"|class="feedback-tab"/],
    ['hesap menüsü', /class="acct-menu"|class="[^"]*acct-wrap|class="drawer-acct"|d-acct-block|data-cikis/],
    ['bildirim rozeti', /class="hb-badge"|head-bell/],
    ['gizli tarif paneli', tarif ? /id="rdActbar"/ : /id="cookmode"|id="rdActbar"|id="rdSharePop"/],
    ['yerel sunucu adresi', /(https?:)?\/\/(127\.0\.0\.1|localhost):89\d\d/],
    ['yerel sunucu adresi (JSON kaçışlı)', /\\\/\\\/(127\.0\.0\.1|localhost):89\d\d/],
    ['yerel sunucu adresi (URL kodlu)', /(127\.0\.0\.1|localhost)%3A89\d\d/i],
    ['kullanıcı eylem formu', /<form\b[^>]*action="[^"]*(kayit\/toggle|takip-et|alisveris)[^"]*"/],
  ];
  for (const [ad, re] of kontrol) if (re.test(html)) bulgu.push(ad);
  return bulgu;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const f of process.argv.slice(2)) {
    const once = await readFile(f, 'utf8');
    const sonra = kabukTemizle(once);
    await writeFile(f, sonra);
    const kalan = tokenTaramasi(sonra);
    console.log(`${kalan.length ? '✗' : '✓'} ${f}  ${(once.length / 1024).toFixed(0)}→${(sonra.length / 1024).toFixed(0)} KB${kalan.length ? '  kalan: ' + kalan.join(', ') : ''}`);
  }
}
