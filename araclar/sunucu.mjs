// Yerel önizleme: GitHub Pages alt yolunu taklit eder → http://localhost:8795/DadaGastroVideo/
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ON = '/DadaGastroVideo';
const TUR = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', json: 'application/json', mjs: 'text/javascript', mp4: 'video/mp4', webm: 'video/webm', txt: 'text/plain; charset=utf-8', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', webp: 'image/webp', avif: 'image/avif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', ico: 'image/x-icon', gif: 'image/gif' };
const PORT = Number(process.env.PORT || 8795);
http.createServer(async (istek, yanit) => {
  let yol = decodeURIComponent(new URL(istek.url, 'http://x').pathname);
  if (!yol.startsWith(ON)) { yanit.writeHead(404); return yanit.end('404'); }
  yol = yol.slice(ON.length) || '/';
  if (yol.endsWith('/')) yol += 'index.html';
  const dosya = path.join(KOK, yol);
  if (!dosya.startsWith(KOK)) { yanit.writeHead(403); return yanit.end(); }
  try {
    await stat(dosya);
    yanit.writeHead(200, { 'Content-Type': TUR[path.extname(dosya).slice(1)] || 'application/octet-stream' });
    yanit.end(await readFile(dosya));
  } catch { yanit.writeHead(404); yanit.end('404'); }
}).listen(PORT, () => console.log(`http://localhost:${PORT}${ON}/`));
