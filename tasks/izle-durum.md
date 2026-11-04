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
