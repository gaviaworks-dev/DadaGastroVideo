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
