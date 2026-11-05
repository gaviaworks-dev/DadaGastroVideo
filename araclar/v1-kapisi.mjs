// V1 dokunulmazlık kapısı (V2 sözleşmesi): V1 derlemesi (araclar/build.mjs) yeniden koşulur ve V1 dosyaları git'teki hâlleriyle AYNI kalmalı.
//   · kökteki *.html, varlik/video/**, src/video/** → `git diff --quiet`
//   · varlik/gastro/** → `git diff --quiet` (yeni snapshot yalnız YENİ dosya ekleyebilir; izlenen dosya değişmez)
//   · kökte izlenmeyen yeni *.html yok (V2 çıktısı v2/ altında)
// build.mjs her koşumda `?v=<SURUM>` önbellek damgası basar; kapı damgayı git'teki index.html'den okur ve aynısıyla derler
// (yoksa her derleme 72 dosyayı "değiştirir"). Kapı yalnız OKUR: git'e yazmaz (commit/checkout/stash yok).
// Kullanım: node araclar/v1-kapisi.mjs        BOZ=1 → kökteki index.html'e geçici bir satır eklenir (kapı kırmızı vermeli), sonra
//           dosya ÖNCEKİ İÇERİĞİYLE geri yazılır (git komutu kullanılmaz).
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const git = (...a) => execFileSync('git', ['-C', KOK, ...a], { encoding: 'utf8' });
const temiz = (...yol) => { try { execFileSync('git', ['-C', KOK, 'diff', '--quiet', '--', ...yol]); return true; } catch { return false; } };

const izlenen = git('show', 'HEAD:index.html');
const surum = (izlenen.match(/varlik\/video\/kabuk\.css\?v=([a-z0-9]+)/) || [])[1];
if (!surum) { console.error('✗ git\'teki index.html\'de kabuk.css?v= damgası bulunamadı'); process.exit(2); }
console.log(`V1 derlemesi (SURUM=${surum}, git HEAD'deki damga)…`);
const cikti = execFileSync('node', [path.join(KOK, 'araclar/build.mjs')], { cwd: KOK, env: { ...process.env, SURUM: surum }, encoding: 'utf8' });
console.log('  ' + (cikti.match(/^✓/gm) || []).length + ' sayfa derlendi');

const BOZ = !!process.env.BOZ;
const bozDosya = path.join(KOK, 'index.html');
let once = null;
if (BOZ) { once = await readFile(bozDosya, 'utf8'); await writeFile(bozDosya, once + '\n<!-- kapı sınaması: bilerek bozuldu -->\n'); }

const sonuc = [
  ['kökteki *.html', temiz(':(glob)*.html')],
  ['varlik/video/**', temiz('varlik/video')],
  ['src/video/**', temiz('src/video')],
  ['varlik/gastro/** (izlenen dosyalar)', temiz('varlik/gastro')],
];
const yeniHtml = git('ls-files', '--others', '--exclude-standard', '--', ':(glob)*.html').split('\n').filter(Boolean);
sonuc.push([`kökte izlenmeyen yeni *.html (${yeniHtml.slice(0, 3).join(', ') || 'yok'})`, yeniHtml.length === 0]);
if (BOZ) await writeFile(bozDosya, once);

let kirmizi = 0;
for (const [ad, ok] of sonuc) { if (!ok) kirmizi++; console.log(`${ok ? '✓' : '✗'} ${ad}`); }
if (!sonuc[0][1] || !sonuc[1][1] || !sonuc[2][1]) console.log('  fark: ' + git('diff', '--stat', '--', ':(glob)*.html', 'varlik/video', 'src/video').trim().split('\n').slice(-1)[0]);
if (BOZ) { console.log(kirmizi ? `BOZ sınaması: ${kirmizi} kırmızı → kapı kırmızı verebiliyor ✓ (index.html eski içeriğiyle geri yazıldı)` : 'BOZ sınaması: KAPI KÖR ✗'); process.exit(kirmizi ? 1 : 3); }
console.log(kirmizi ? `\nV1 KAPISI KIRMIZI (${kirmizi})` : '\nV1 KAPISI YEŞİL: V1 derlemesi git\'tekiyle birebir, varlik/gastro izlenen dosyaları değişmedi');
process.exit(kirmizi ? 1 : 0);
