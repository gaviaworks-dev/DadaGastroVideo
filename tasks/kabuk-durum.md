# kabuk ajanı — durum

## Adımlar
- [x] 1 Araçlar: package.json (playwright), araclar/temizle.mjs, araclar/sunucu.mjs (PORT, /DadaGastroVideo/)
- [x] 2 Anlık görüntü: araclar/snapshot.mjs → src/donor/{ana,kabuk,tarif-<30 slug>}.html + varlik/gastro/** (240 varlık, hatalı 0)
- [x] 3 Veri: araclar/veri-hazirla.py → veri/tarifler.json (31: 30 sayfalı + 1 yalnız poster), veri/sefler.json (29), varlik/video/tarif/*-640/-1600.webp
- [x] 4 Derleme: araclar/build.mjs + src/video/ortak.mjs + varlik/video/kabuk.{css,js} — `BOS_MODUL=1 node araclar/build.mjs sinama` → video-sinama.html (1440/390: 404 0 · JS 0 · taşma 0)
- [x] 5b mega menü önizlemesi (tüm sayfalar) · [x] 6 tarif köprüsü (30 tarif)
- [x] 5c ana sayfa video bölümü: #vidTrack donör kartları → hub videoKarti(ray, ilerleme:false), 6 video (index video.css/js yükler)
- [x] 7 kapılar: varlik-kapisi · bag-kapisi · parite-kapisi · yapiskan-kapisi (dördü de BOZ=1 ile kırmızı gösterildi)
- [x] 8 README
- [x] tarif sayfalarında pişirme modu (#cookmode), görsel önizleme, paylaşım menüsü KORUNUR (önceden Health temizliği siliyordu → "Pişirme Moduna Geç" ölüydü)
- [x] "Tarif videosu" bölümü (section.gastro-tarif-medya) tarif sayfalarından çıkarılır — genel kural, 3 Kas karar 6 (çıkan: 1, menemen)
- [x] VİDEO rozeti kırmızı: `a[href="video-mutfagi.html"] > .soon` → --tomato-dark zemin + beyaz (kontrast 5,85:1 AA; header + çekmece, tüm sayfalar)
- [x] Şef verisi `tarifler.sef_kullanici_adi`'dan (lead notu); Berkan ornek_tarifler 6 (pilot kapaklar içerik hattının yayin/ klasöründen)
- [x] bolumler(v) lead kuralıyla (4–7 bölüm, Giriş … Sunum, kısa → []); posterGorsel(v, boyut), videoMalzemeleri(v) eklendi

## Boyut (ara commit için)
- `varlik/gastro`: 16 MB · 235 dosya (snapshot 240 yol; 5'i Gastro'da da olmayan yedek font biçimi, indirilmez)
- `varlik/video/tarif`: 4,4 MB · 98 webp

## ✅ SÖZLEŞME HAZIR (4 Kas)
- `node araclar/build.mjs [modül…]` · modül `src/video/sayfalar/<ad>.mjs` → `export default async (o) => [{ dosya, baslik, aciklama, main, css:[…], js:[…], govdeSinifi?, altMenu?, gorsel? }]`
  - build `<main>` içini `<div class="vd-sayfa">` + Video alt menüsü (`nav.vd-ust`, `altMenu` → `aria-current`) + `main` ile değiştirir; body sınıfı `pg-video <govdeSinifi>` (tarif detayının `pg-tarif-detay`ı kaldırılır).
  - Yüklenen: `varlik/video/kabuk.css` + `video.css` + `css/<ad>.css` (varsa; yoksa uyarı) · `kabuk.js` + `video.js` + `js/<ad>.js`.
  - `gorsel` → og:image (`varlik/...` yolu). `video-izle-*` sayfalarında og:type `video.other`.
  - Aynı dosyayı iki modül üretirse ya da modül index/tarif-* üretirse derleme durur.
- `o` = `src/video/ortak.mjs` + `src/video/kart.mjs` (kart üstte). ortak dışa aktarımları: `esc · ui(ikon, sinif?) · sureMetni(sn) · sureIso(sn) · sureDkMetni(sn) · KATALOG · TARIF · SEF · SERI · VIDEO (uzun+kısa, tur alanlı) · videoAdresi · seriAdresi · sefAdresi · sefDosyaAdi · sefGastroAdresi · tarifAdresi · videoSerisi · videoTarifi · videoSefi · videoPosteri(v) → {k640,k1600,alt} · vitrinVideosu(ad?) · bolumler(v) · sureDk · sureKodu · PROTOTIP_ORNEGI · TEMSILI · GASTRO · YAYIN`.
  - `ui('play')` → `<i class="fa-solid fa-play" aria-hidden="true">` (satır içi stil YOK; boyutu CSS'te ver).
  - `sefAdresi('berkan.gunes')` → `video-sef-berkan-gunes.html` (noktalar tire).
  - `bolumler(v)` → `[{sn, baslik, adim}]` (lead kuralı): kısa video → `[]`; katalogda `bolumler` varsa aynen (adim null); yoksa 4–7 bölüm:
    00:00 "Giriş" · (adım < 3 ise) "Malzemelerin hazırlığı" · adımlar (adım < 2 ise cümlelere bölünür, > 5 ise birleştirilir) · "Sunum" (≤ süre − 20 sn).
    **`adim` 1-TABANLI tarif adım numarası** → `TARIF[slug].adimlar[adim - 1]`; Giriş/hazırlık için `null`; "Sunum" tarifin son adımı "Sunum" ise o adımın numarasını taşır, değilse null. Başlıklar ≤ 28 karakter.
  - `posterGorsel(v, 640|1600)` → kapak yolu (tarif → poster_tarif) ya da null · `videoMalzemeleri(v)` → tarif malzemeleri; tarifsizde katalog `malzemeler` metinleri aynı biçimde (`serbest: true`, malzeme_id null).
  - `tarifAdresi(null)` → null; `TARIF[null]` çağıran yardımcılar null döner (patlamaz).
  - `TARIF[slug].malzemeler[].malzeme_id` (serbest metinse null). `TARIF[slug].sef` = `tarifler.sef_kullanici_adi`.
  - `videoSefi(v)` = serinin şefi (katalog), yoksa tarifin şefi.
- CSS değişkenleri (kabuk.css): `--vd-bar-alt` (sayfa yapışkan barları `top: var(--vd-bar-alt)`), `--vd-ust-bosluk`, `--vd-bar-h`, `--vd-font-kalin` (GilroyBd 700), `--vd-font-ekstra` (GilroyXB 800). Gilroy yalnız 500 ağırlıkta; kalın için bu aileler.
- Yapışkan davranış: aşağı kayınca `html.vd-ust-gizli` (yalnız Gastro header.header gizlenir), `window.VDKabuk.gizliMi()`.
- Sunucu: `PORT=879x node araclar/sunucu.mjs` → `http://localhost:879x/DadaGastroVideo/`. Kapı: `node araclar/varlik-kapisi.mjs <sayfa…>` (TABAN=… ile kendi portun).

## Veri notları (diğer ajanlar için)
- `TARIF[slug].sayfa === false` → yalnız poster kaynağı (katalogdaki `poster_tarif`); tarif sayfası YOK, `tarifAdresi()` dadagastro.com'a döner.
- `tarifler.sef_id` = `uye_profilleri.id` (brifteki "hesap_id" değil; ölçüldü: 7003 tarifin 7002'sinde sef_kullanici_adi ile tutarlı).
- `SEF[k].avatar` yalnız berkan.gunes (yerel kopya `varlik/gastro/storage/medya/…`); diğerleri `bas_harf`.
- `SEF[k].ornek_tarifler` (yalnız seri şefleri, en çok 6): {slug, baslik, kapak640, sure_dk, zorluk} — bağ dadagastro.com/tarif/<slug>.
- Kalori yalnız `hesaplanabildi=1` ve `porsiyon_basi=1` ise (20/31), yoksa null → rozet gizlenir.

## REVİZE 1 (5 Kas) — yapıldı
- Logo "video" rozeti (::after) TÜM sayfalardan kaldırıldı; logo bağı her sayfada donördeki gibi index.html. Kırmızı VİDEO menü rozeti kaldı.
- Alt menü: ev ikonu yok → Keşfet · Seriler · 30 Saniyede Tat · Şefler (grup ortada). Yapışkan durumda solda sade metin "Video Mutfağı" (ikon yok, mürekkep rengi; 390'da gizli).
- Ortak token'lar (kabuk.css :root, ADLAR SABİT): `--vd-kart-r` = var(--radius-lg) 16px (Gastro .r-card ölçüldü: 16px) · `--vd-ic` 24/16 · `--vd-ara` 24/16 · `--vd-bolum-ara` 64/48 (≤767) · `--vd-kenar` 32 / 24 (≤1024) / 16 (≤640) = Gastro içerik .wrap padding-inline (ölçüldü 1440/1024/390; header .wrap'ı kendi kuralıyla hep 32).
- video.js tarif-*.html'e de yüklenir (köprü kartı başlığı `data-vd-kirp="2"`); index zaten yüklüyordu.
- parite-kapisi: `DONOR=yerel` seçeneği (8960 kapalıyken src/donor kopyasıyla ölçer).

## REVİZE 1 madde 7 — reklam entegrasyonu (build.mjs) — yapıldı
- `import { reklamKatmani, reklamAnahtari } from '../src/video/reklam.mjs'`; alt menüde `reklamAnahtari()` menünün ardında; video sayfalarına css/js `reklam` + `</body>` öncesi `reklamKatmani(ortak, { sayfa: <modül> })`. index/tarif-*'e eklenmez (ölçüldü: reklam.css/js 0).
- Kök dizindeki `rk-sinama-*.html` (6, takipsiz sınama artığı) mutlak yol + realpath ile silindi.
- Reklamsız geometri önce/sonra (82 ölçüm = video sayfaları × 1440/390): sayfa boyu ve `.vd-sayfa` içindeki her görünür öğe AYNI;
  tek fark 390'da alt menü bağlarının 25px sola kayması (anahtar 44px yer kaplar; menü taşmaz, sw=cw). 1440'ta bağ grubu ortada sabit (kabuk.css ≥1025 kuralı).
- bag-kapisi: reklam veren hedefleri (src/video/reklam-donor.json'daki tıklama adresleri, yalnız <a href>) ayrı sayılır.
