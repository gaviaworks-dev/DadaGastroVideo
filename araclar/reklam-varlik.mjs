// Reklam varlıkları (reklam ajanı). Full-stack reklam modülünün GERÇEK render çıktısını alır ve prototipe taşır:
//   1. araclar/reklam-render.php → modülün Blade bileşenleri (x-reklam.slot · x-reklam.standart · x-reklam.eslik-karti), dev MySQL kreatifleriyle
//   2. modülün CSS'i → varlik/gastro/reklam/ (aynı alt yol; içerik değişmez, yalnız kök-mutlak url()/@import göreliye — snapshot.mjs kuralı)
//      sahne görselleri → varlik/gastro/reklam/sahne/<marka>/ (aynı alt yol, değişmez)
//   3. kreatif görselleri → varlik/video/reklam/ (cwebp, gösterim boyutuna); svg ve mp4 olduğu gibi
//   4. parçalar → src/video/reklam-donor.json (yalnız dinamik kısımlar değişir: adres, tıklama bağı → hedef_url, jeton yok, <style> → renkler.css,
//      satır içi background-image → CSS değişkeni, eşlik kartının üye formu → bellek düğmesi; "prototip örneği" notu etiketin içinde)
// Kullanım: node araclar/reklam-varlik.mjs        (GASTRO=<full-stack kökü> ile değiştirilebilir)
// Modülün JS'i (reklam.js, standart.js) KOPYALANMAZ: ikisi de sayım/sıklık için sunucuya POST eder ve oturum deposuna yazar
// (statik prototipte 404 + depolama kuralı); davranışları varlik/video/js/reklam.js'te aynı kurallarla (sideLayout · alignAltbar · video oynatma).
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile, access, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DM = path.join(os.homedir(), 'Developer/Revenge Projects/DadaMentor');
const GASTRO = process.env.GASTRO || path.join(DM, 'gastro-video');
// Kreatif dosyaları gastro-video'nun storage'ında yok (taban durumu); salt okunur yerel kopyalar (aynı canli-20260923 paketi):
const DEPOLAR = ['gastro-yonetim', 'gastro-parite-ref', 'gastro-izgara', 'gastro-rk-nokta'].map((d) => path.join(DM, d, 'storage/app/public'));
const PIN = path.join(DM, 'gastro-reklam-eslesme/rapor/reklam/canli-gorseller'); // canlı TD-ESLIK kreatifi 188 (PIN) görselleri
const varMi = async (p) => { try { await access(p); return true; } catch { return false; } };
const KOK_URL = 'http://ornek.invalid';

console.log('render: ' + GASTRO);
const ham = JSON.parse(execFileSync('php', [path.join(KOK, 'araclar/reklam-render.php'), GASTRO], { maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'inherit'] }).toString());

/* ---------- 2. modül CSS ---------- */
const CSS = ['reklam.css', 'standart.css', 'yayilim.css', 'dugme.css'];
await mkdir(path.join(KOK, 'varlik/gastro/reklam'), { recursive: true });
for (const ad of CSS) {
  let css = await readFile(path.join(GASTRO, 'public/reklam', ad), 'utf8');
  // kök-mutlak /reklam/... → bu dosyanın klasörüne göre göreli (içerik başka hiçbir yerde değişmez)
  css = css.replace(/url\(\s*(['"]?)\/reklam\/([^'")]+)\1\s*\)/g, (t, q, u) => `url(${q}${u}${q})`)
    .replace(/@import\s+(['"])\/reklam\/([^'"]+)\1/g, (t, q, u) => `@import ${q}${u}${q}`);
  if (/url\(\s*['"]?\//.test(css)) throw new Error(`${ad}: çevrilmemiş kök-mutlak url() kaldı`);
  await writeFile(path.join(KOK, 'varlik/gastro/reklam', ad), css);
}

/* ---------- 3. kreatif görselleri ---------- */
const HEDEF = path.join(KOK, 'varlik/video/reklam');
await mkdir(HEDEF, { recursive: true });
const ceviri = new Map(); // ham adres → prototip yolu
async function kaynak(yol) {
  if (yol.startsWith('reklam/kreatif/pin-')) return path.join(PIN, path.basename(yol));
  for (const d of DEPOLAR) if (await varMi(path.join(d, yol))) return path.join(d, yol);
  throw new Error('kreatif dosyası yerelde yok: ' + yol);
}
// gösterim boyutu (CSS px × 2 DPR): şerit ürün/sahne ≤ 1600 · kare ürün 480 · logo 400 · side 240 (zaten) · altbar ürün 160
function genislik(yol, rol) { return { serit: 1600, urun: 480, logo: 400, side: 240, altbar: 160, kart: 600, eslik: 300 }[rol] || 800; }
async function tasi(adres, rol) {
  if (ceviri.has(adres)) return ceviri.get(adres);
  let yol = adres.replace(KOK_URL, '');
  if (yol.startsWith('/reklam/sahne/')) { // modül varlığı: aynı alt yol, değişmez
    const h = path.join(KOK, 'varlik/gastro', yol); await mkdir(path.dirname(h), { recursive: true });
    await copyFile(path.join(GASTRO, 'public', yol), h); const s = `varlik/gastro${yol}`; ceviri.set(adres, s); return s;
  }
  yol = yol.replace(/^\/storage\//, '');
  const k = await kaynak(yol); const uz = path.extname(k).toLowerCase(); const ad = path.basename(k, uz);
  let cikis;
  if (uz === '.svg' || uz === '.mp4') { cikis = `${ad}${uz}`; await copyFile(k, path.join(HEDEF, cikis)); }
  else {
    cikis = `${ad}-${rol}.webp`;
    const w = genislik(yol, rol);
    const boyut = execFileSync('sips', ['-g', 'pixelWidth', k]).toString().match(/pixelWidth: (\d+)/)[1] * 1;
    execFileSync('cwebp', ['-quiet', '-q', '82', ...(boyut > w ? ['-resize', String(w), '0'] : []), k, '-o', path.join(HEDEF, cikis)]);
  }
  const s = `varlik/video/reklam/${cikis}`; ceviri.set(adres, s); return s;
}

/* ---------- 4. parçalar ---------- */
const hedefAdres = (id) => { const r = ham.kayit[id] || (Number(id) === ham.eslik.kreatif ? { hedef_url: ham.eslik.hedef_url } : null); if (!r?.hedef_url) throw new Error('hedef_url yok: ' + id); return r.hedef_url; };
// rol = öğenin kendi etiketi (+ hemen önü): şerit sahne görseli tam genişlik, ürün paketi kare, logo, side, altbar ürünü, eşlik ürünü
const rolBul = (parca, etiket, onu) => (/rk-serit-urun/.test(etiket) ? (/rk-gorsel-sahne/.test(parca) ? 'serit' : 'urun')
  : /rk-logo|eslik-kart-logo/.test(etiket) ? 'logo' : /rk-side-image">$/.test(onu) ? 'side' : /width="40" height="40"/.test(etiket) ? 'altbar'
  : /eslik-kart-gorsel/.test(etiket) ? 'eslik' : 'kart');
const renkler = new Set(Object.values(ham.renkler));
const parcalar = {};
for (const [ad, html0] of Object.entries(ham.parcalar)) {
  let html = html0;
  html = html.replace(/<style>([^<]*)<\/style>\s*/g, (t, css) => { renkler.add(css.trim()); return ''; });
  html = html.replace(/\s(?:data-rk-jeton|data-rk-standard-token)="[^"]*"/g, '');
  html = html.replace(/href="http:\/\/ornek\.invalid\/reklam\/t\/J(\d+)"/g, (t, id) => `href="${hedefAdres(id)}"`);
  // görseller: src · poster · data-rk-src · satır içi background-image
  const adresler = [...html.matchAll(/(?:src|poster|data-rk-src)="((?:http:\/\/ornek\.invalid)?\/(?:storage|reklam\/sahne)\/[^"]+)"|url\('((?:http:\/\/ornek\.invalid)?\/storage\/[^']+)'\)/g)];
  for (const m of adresler) {
    const adres = m[1] || m[2]; const i = html.indexOf(adres); if (i < 0) continue; // aynı adres önceki turda çevrildi
    const bas = html.lastIndexOf('<', i); const etiket = html.slice(bas, html.indexOf('>', i) + 1);
    const yeni = await tasi(adres, rolBul(html, etiket, html.slice(Math.max(0, bas - 40), bas)));
    html = html.split(adres).join(yeni);
  }
  // satır içi stil yasak → aynı görsel, görsellerle aynı klasördeki üretilmiş CSS'te (varlik/video/reklam/kreatif.css; göreli url doğru çözülür)
  html = html.replace(/<span class="(eslik-kart-gorsel|eslik-kart-logo)"([^>]*?) style="background-image:url\('varlik\/video\/reklam\/([^']+)'\)"/g, (t, sinif, ara, dosya) => {
    const slot = /data-rk-slot="([^"]+)"/.exec(html)[1];
    renkler.add(`[data-rk-slot="${slot}"] .${sinif}{background-image:url('${dosya}')}`);
    return `<span class="${sinif}"${ara}`;
  });
  if (ad.startsWith('eslik-')) {
    // üye formu (POST /hesabim/...) prototipte yok: aynı düğme bellekte "listeye eklendi" durumu + kısa bildirim (varlik/video/js/reklam.js)
    html = html.replace(/<form method="POST" action="[^"]*" onclick="event.stopPropagation\(\)" data-m-bagli="0">/, '<form data-vd-rk-form>')
      .replace(/<input type="hidden"[^>]*>/g, '')
      .replace(/<button class="ing-add " type="submit"[^>]*>/, (t) => '<button class="ing-add " type="button" title="Alışveriş listesine ekle" aria-label="Alışveriş listesine ekle" aria-pressed="false" data-vd-rk-liste="PIN Cool Lime">');
  }
  // görünür "prototip örneği" notu — modülün etiket kalıbının içinde
  // eşlik kartında etiket bir hap (büyük harf, sabit kutu): not hapın İÇİNE değil yanına
  if (ad.startsWith('eslik-')) html = html.replace(/(<p class="eslik-kart-bilgi">[\s\S]*?<\/p>)/, '$1<p class="vd-rk-not vd-rk-not--ayri">Prototip örneği</p>').replace('<span class="rk-etiket">Sponsorlu</span>', '<span class="rk-etiket">Sponsorlu</span><!--not-->');
  html = html.replace(/<span class="rk-etiket">Sponsorlu<\/span>(?!<!--not-->)/g, '<span class="rk-etiket">Sponsorlu<span class="vd-rk-not"><span class="vd-rk-not__ayrac"> · </span>prototip örneği</span></span>')
    .replace(/<span class="r-chip rk-native-recipe-chip">Sponsorlu<\/span>/g, '<span class="r-chip rk-native-recipe-chip">Sponsorlu<span class="vd-rk-not"><span class="vd-rk-not__ayrac"> · </span>prototip örneği</span></span>')
    .replace(/<span class="rk-std-etiket">(<strong>[^<]*<\/strong> · )? Sponsorlu<\/span>/g, (t, m) => `<span class="rk-std-etiket">${m || ''} Sponsorlu<span class="vd-rk-not"><span class="vd-rk-not__ayrac"> · </span>prototip örneği</span></span>`);
  html = html.replace('<!--not-->', '');
  if (/ornek\.invalid|\/storage\/|reklam\/t\/|<style|_token| style="/.test(html)) throw new Error(`${ad}: çevrilmemiş dinamik parça kaldı`);
  parcalar[ad] = html.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
}
await writeFile(path.join(KOK, 'varlik/video/reklam/kreatif.css'), `/* Reklam modülü: marka renkleri (App\\Servisler\\Reklam\\MarkaRengi::css(), modülde satır içi <style>) ve eşlik kartı görselleri (modülde satır içi background-image) — prototipte dosya. full-stack ${ham.kaynak} · araclar/reklam-varlik.mjs üretir, elle düzenlenmez. */\n${[...renkler].sort().join('\n')}\n`);
const cikti = { aciklama: `full-stack reklam modülünün render edilmiş işaretlemesi (gastro-video ${ham.kaynak}, araclar/reklam-render.php); araclar/reklam-varlik.mjs üretir, elle düzenlenmez`, kaynak: ham.kaynak, kreatifler: ham.kreatifler, kayit: ham.kayit, eslik: ham.eslik, sponsor_kalibi: ham.sponsor_kalibi, sponsorlu: ham.sponsorlu, parcalar };
await writeFile(path.join(KOK, 'src/video/reklam-donor.json'), JSON.stringify(cikti, null, 1) + '\n');
let top = 0; for (const s of ceviri.values()) top += (await stat(path.join(KOK, s))).size;
console.log(`parça ${Object.keys(parcalar).length} · görsel ${ceviri.size} (${(top / 1024).toFixed(0)} KB) · renk ${renkler.size} · css ${CSS.length}`);
