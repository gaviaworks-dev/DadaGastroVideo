# izle ajanı — durum

## Oynatıcı bileşeni (TESLİM EDİLDİ — hub spotlight kullanabilir)
`import { oynatici } from '../oynatici.mjs';` (sayfa modülünden) →
`oynatici(v, ortak, { kip: 'izle' | 'spotlight', kilitli = false, baslikSeviye = 'h2', alt = '', oncelik = false })` → HTML dizesi.
- `oncelik: true` → poster `loading="eager" fetchpriority="high"` (hub: yalnız ilk görünen spotlight sekmesinde; diğerleri lazy kalır). izle kipinde poster her zaman öncelikli.
- Çıktı: `.vd-oyn-blok.vd-oyn-blok--<kip>` ızgarası = oynatıcı (`.vd-oyn[data-vd-oyn]`, 16:9, poster = tarif kapağı 1600 / tarifsizde `poster_tarif`)
  + sağda senkron malzeme paneli (`.vd-panel`; tarifsiz videoda "Bu videodaki ekipman"). ≤960px panel altta. `alt` = oynatıcının
  hemen altına konan içerik (izle'de bölüm damgaları); geniş ekranda panel ikisi boyunca uzanır.
- `kip:'spotlight'` → bileşen 1.1c'nin iki aksiyonunu da basar (`.vd-oyn-blok__aksiyon`): "Tarifin Yazılı Adımlarına Git"
  (`tarif-<slug>.html#adimlar`) ve "Malzemeleri Listeme Kaydet" (`data-vd-tum-liste`, durum + bildirim "N malzeme…"). Hub ayrıca basmasın.
- Sayfa tanımında: `css: ['oynatici', …]`, `js: ['oynatici', …]` (oynatici.js video.js'ten SONRA yüklenir; build sırası öyle).
- Sayfada birden çok örnek olabilir (biri oynarken öbürleri durur). Gizlenen sekme için `window.vdOynatici.al('#vdo-<slug>-sp').duraklat()`
  ya da `window.vdOynatici.hepsiniDurdur()`. Kimlik: `#vdo-<slug>` (izle) / `#vdo-<slug>-sp` (spotlight).
- API: `window.vdOynatici.al(el|seçici)` → `{ oynat(), duraklat(), git(sn, {oynat}), sn(), bolum(), oynuyor(), sure, bolumler }`.
- Olaylar (oynatıcı kökünde, kabarcıklı): `vd:zaman {sn, bolum}` · `vd:bolum {bolum}` · `vd:durum {oynuyor}` · `vd:bitti`.
- Kaydet yer imi `data-vd-kaydet="<slug>"` → tıklamayı hub'ın video.js'i yönetir (ikinci dinleyici YOK). Yazı/simge CSS ile aria-pressed'e bağlı.
- Bildirim: `window.vdBildir(baslik, alt)` → `VD.bildirim` varsa onu çağırır, yoksa Gastro `.dm-toast`.
- Panel liste kabı `data-vd-mz-liste` (hub'ın `data-vd-liste`siyle çakışmasın diye).

## Kısa video katmanı (hub için HAZIR)
- Hub sayfa tanımına `css: [..., 'kisa']`, `js: [..., 'kisa']` ve main'e
  `import { kisaGoruntuleyici } from './kisa.mjs'` → `kisaGoruntuleyici(o, { katman: true })` (gizli başlar).
- kisa.js katman kipinde sayfadaki `a[data-vd-kisa="<slug>"]` (kart.mjs kisaKarti) tıklamasını yakalar → katman açılır,
  adres `video-kisa.html?v=<slug>` olur (pushState), kaydırdıkça güncellenir; kapat / Geri / Esc → katman kapanır, adres geri döner.
  JS kapalıyken kart bağı (`video-kisa.html?v=<slug>`) olduğu gibi çalışır. Programla: `window.vdKisa.ac(slug)` · `vdKisa.kapat()`. Katman gövdeye taşınır (main'in yığın bağlamı başlığın altında bırakıyordu).

## Sayfalar
- [x] izle.mjs → 26 × video-izle-<slug>.html · [x] kisa.mjs → video-kisa.html · [x] sef.mjs → 6 × video-sef-<k>.html
- [x] pişirme modu (izle sayfalarında, tarifli videolarda) · [x] davranış kapısı `araclar/davranis-izle.mjs` (23 ölçüm, 0 kırmızı; 9 bozmanın her biri kırmızı)
- Ekran görüntüleri: tasks/ss/izle/<sayfa>-1440.png / -390.png (66 dosya)

## REVİZE 1 (5 Kas) — yapıldı
- Kenardan kenara panel yok: izleme sayfasının koyu sahnesi `.vd-izle__sahne` (container içinde, `--vd-kart-r`, iç boşluk `--vd-ic`);
  390'da oynatıcı dahil kenar boşluğu içinde ve yuvarlak. Benzer videolar beyaz bandı kaldırıldı. Şef künyesi container içinde kutu.
  Kısa video görüntüleyicisi tam ekran kaldı (karar).
- `--vd-kart-r` + `--vd-ic`: oynatıcı, malzeme paneli, bölüm düğmeleri, yazılı tarif kartı, şef kartı, seri bölüm listesi satırları,
  sıradaki bölüm kartı, pişirme modu adım kartı, şef künyesi. Düğmeler Gastro düğme köşesinde (12px). Aralar `--vd-ara`, bölüm araları `--vd-bolum-ara`.
  Token gelene dek yedekler: 16px / 24px / 24px / 64px. 5 CSS dosyamda ölçek dışı boşluk değeri: 0.
- `data-vd-kirp="2"` + `title`: bölüm düğmesi başlığı, bölüm listesi satırı, sıradaki bölüm başlığı + özeti, sıradaki katmanı, pişirme modu
  tarif adı, kısa video başlığı. (Benzerler ve şefin diğer videoları hub'ın videoKarti'si — kırpma hub'da.) CSS line-clamp yalnız yedek.
  Oynatıcı çubuğundaki bölüm adında ellipsis kaldırıldı; dar ekranda hiç basılmaz (damgalar altta).

## REKLAM ENTEGRE (5 Kas) — reklam-durum.md §4 izle 1–7 + EK
- izle.mjs: sinema bölümü `data-rk-hero`; seri satırında `sponsorEtiketi(s.slug)`; gövdeden sonra `reklamSlotu('ust')`, benzerlerden sonra
  `reklamSlotu('alt')`; malzeme panelinin listesinin sonunda eşlik kartı (`oynatici(..., { eslik })` → yalnız tarifli videolarda).
- oynatici.mjs: yeni seçenek `eslik` (panel listesinin EN ALTINA konan HTML; hub spotlight'ta kullanılmaz).
- sef.mjs: kanal başlığı `data-rk-hero`, ardına `reklamSlotu('ust')`, sona `reklamSlotu('alt')`.
- kisa.mjs: 3. öğeden sonra `reklamSlotu('native', { sayfa: 'kisa' })`; EK: üst satırda `reklamAnahtari()` (yalnız simge; ad ekran okuyucuda).
- kisa.js: `vd:reklam` olayında yeniden tarama (öğe listesi + segmentler + sayaç "n / 10"); sponsorlu öğede simülasyon yok, ?v= yazılmaz,
  ilerleme parçası o öğenin <video>'sundan; adres yazarken diğer parametreler korunur (reklam=1 düşmüyordu → reklam kapısı yakaladı, düzeltildi).
- Kapılar (5 Kas): reklam-kapisi izle+sef+kisa yeşil 220 / 0 · davranis-izle 23 / 0 · kirpma-kapisi (33 sayfa) 0 kırmızı · ss taşma/JS/404 0.
- Görüntüler: tasks/ss/izle/izle-reklamli-{1440,390}.png, izle-reklamli-eslik-{1440,390}.png, kisa-reklamli-1440.png, kisa-reklam-ogesi-1440.png
- 5 Kas ek: kisa.js katman kipinde (hub) öğe taraması görüntüleyicinin kendi `hidden`ını sayıp listeyi boşaltıyordu → hub'da kart tıklaması
  JS hatası veriyordu (reklam entegrasyonuyla gelen gerileme). Düzeltildi; katman kapanınca hub adresi o anki reklam durumuna uyar
  (reklam=1 açıksa kalır, kapalıysa düşer). davranis-izle'ye hub katmanı ölçümü eklendi (27 ölçüm; BOZ=katman → 4 kırmızı).
