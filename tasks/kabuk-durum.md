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

# ═══ V2 (5–6 Kas) — kabuk ═══
## ✅ BUILD-V2 HAZIR
- `node araclar/build-v2.mjs [modül…]` → `v2/*.html` (V1'e dokunmaz). Modül: `src/v2/sayfalar/<ad>.mjs` → `[{ dosya, baslik, aciklama, iskelet | null, main, css, js, govdeSinifi?, gorsel?, aktif? }]`.
  - `iskelet: { kirinti:[{ad,href}], eyebrow:{ikon,metin}, baslik, vurgu?, aciklama, sayaclar:[{deger,etiket}], gorsel? }` → Gastro "Ne Pişirsem?" banner'ı
    (`section.bnp-top.below-header` > `.wrap` > `nav.rd-crumb` + `.bnp-head` > `.lh-main` + `.bnp-stats`) + beyaz panel (`section.bnp-body > .wrap`) içinde `main`.
    Kırıntının başına ev ikonu (index.html) build ekler. `vurgu` başlıkta geçiyorsa yerinde `span.accent`. Sayılar `toLocaleString('tr-TR')`.
    `gorsel` = tarif slug'ı ya da `varlik/video/tarif/<slug>-1600.webp` (banner arka planı; verilmezse haftanın serisi posteri). Satır içi stil yok (`data-vd-banner` + `varlik/v2/banner.css`).
    Banner'da header donörün koyu-hero hâli (`header.at-top.tepede[data-hero]`, `body.has-dark-hero`), kaydırınca Gastro'nun kendi betiği beyaza çevirir.
  - `iskelet: null` → yalnız `main` (header beyaz, içerik header'ın altından başlar).
  - `aktif` (ya da eski `altMenu`; yoksa modül adından: hub→kesfet, seriler/seri→seriler, kisa→kisa, sef→sefler, izle→yok) → açılır menüde `.active` + `aria-current`.
  - Yüklenen: `varlik/gastro/.../bugun-ne-pisirsem.css` + `varlik/v2/banner.css` (yalnız iskeletli) · `varlik/v2/kabuk.css` · `video.css` · `css/<ad>.css` · `css/reklam.css` / `kabuk.js` · `video.js` · `js/<ad>.js` · `js/reklam.js`.
  - Kaynakta yollar `varlik/...`; çıktıda `../varlik/...` (nitelik, url(), JSON kaçışlı). Kök göreli kalan `varlik/` yolu derlemeyi durdurur.
- "Reklamlı görünüm" yuvası: banner'da `.wrap`ın ilk çocuğu `<div class="vd-v2-arac" data-vd-v2-arac>` (mutlak konum, kırıntı satırının sağı). build, `src/v2/reklam.mjs`'te `reklamAnahtari` varsa `reklamAnahtari({ yer: 'banner' })` çıktısını içine koyar.
- Header: "Video Mutfağı" = Gastro `.nav-item > a + .dropdown` (Keşfet · Seriler · 30 Saniyede Tat · Şefler; ikon + başlık + small, `.nav-div`); çekmecede `.d-item.d-has-sub` + `.d-toggle` + `.d-sub`. VİDEO rozeti kırmızı. `nav.vd-ust` YOK.
- V1/V2 satırı: `main` sonunda `.wrap.vd-v2-surum > p.muted` ("Prototip sürümü: V1 · V2"; V1 → `../<aynı dosya>`).
- CSS token'ları aynı (`--vd-kart-r` 16 · `--vd-ic` · `--vd-ara` · `--vd-bolum-ara` · `--vd-kenar`); V2'de `--vd-bar-alt` = header alt kenarı (113 / 63).
- Snapshot: `V2=1 node araclar/snapshot.mjs` → `src/donor/v2/{bnp,sefler}.html`; KATI kip (var olan varlık değişecekse yazmaz, kırmızı). Eklenen 13 yeni dosya (1,9 MB), değişecek 0.
- Kapılar (hepsi BOZ=1 kırmızı gösterildi): `node araclar/v1-kapisi.mjs` (V1 derle + git diff) · `V2=1 node araclar/varlik-kapisi.mjs` · `V2=1 node araclar/bag-kapisi.mjs` · `TABAN=…/v2/ node araclar/kirpma-kapisi.mjs` · `V2=1 node araclar/yapiskan-kapisi.mjs <sayfa>`.
## V2 ek (6 Kas) — reklam / izle / hub istekleri
- Banner `section.bnp-top` artık `data-rk-hero=""` taşır (reklam R15).
- Reklam anahtarı yuvası: `.vd-v2-arac[data-vd-v2-arac]` — banner `.wrap`ın İLK çocuğu, `position:absolute; top:0; right:var(--vd-kenar)` (kırıntı satırının sağı).
  Sarmalayıcı YOK (bilerek): `.wrap > nav + .bnp-head` sırası Gastro banner-standart.css'in dikey ortalama kuralının koşulu.
- Şef kartı CSS'i (option b): her V2 video sayfasının head'inde `sefler.css → sef-avatar.css → sef-satiri.css → sef-imza.css` (4'ü de 8960 ile birebir; sefler.css yeni eklenen dosya).
- `iskelet.vurgu`: başlıkta geçiyorsa ilk geçtiği yer `span.accent` (A); geçmiyorsa başlığın sonuna eklenir. `main` → `section.bnp-body > .wrap` içine.
- `iskelet.gorsel`: banner arka planı = tarif slug'ı ya da `varlik/video/tarif/<slug>-1600.webp` (yalnız tarif kapakları; banner.css her tarif için kural üretir).
- Kapılar V2: `TABAN=…/v2/ node araclar/{rozet,yukari,gezinti}-kapisi.mjs` (gezinti V2'de Seriler/30 sn/hub'a header açılır menüsünden; 390'da çekmeceden).
  Not: Gastro kanonunda açılır menünün ÜST bağı gezmez, menüyü açar (donörde "Mutfak Sırları" da öyle, ölçüldü) → hub'a "Keşfet"ten gidilir.
## V2 parite kapıları (6 Kas)
- `V2=1 node araclar/parite-kapisi.mjs` — header HARİÇ: üst bant + footer, v2/index + v2/tarif-kuymak ↔ canlı 8960; 8/8 YEŞİL, BOZ kırmızı.
- `node araclar/iskelet-kapisi.mjs [v2 sayfası…]` — banner + panel ↔ 8960 /bugun-ne-pisirsem (yükseklik/mutlak y yok; boyut + ebeveyne göre konum, 4px):
  bölüm x/genişlik · .wrap x/genişlik/üst pay · kırıntı x/y/genişlik · eyebrow x · h1 x · sayaç sağ pay + sol çizgi + sol boşluk (390'da x/genişlik) · .st yüksekliği ·
  panel köşe / binme / üst boşluk / .wrap yatay boşluğu. Varsayılan: her V2 sayfa tipinden bir iskeletli sayfa. 10/10 YEŞİL (1440/390), BOZ kırmızı.
  Sayaç sütununun 1440 genişliği ve .st genişlikleri metne bağlı → yalnız raporlanır (sütun sağa yaslı; sağ kenar ölçülür).
## V2 · Patron revizesi (kabuk payı)
- Snapshot: `V2=1 node araclar/snapshot.mjs` → `src/donor/v2/tarifler.html` (+ bnp, sefler). Katı kip: 67 yeni dosya, değişecek 0 (liste ızgarasının tarif görselleri indirilmez).
- Süzgeç bayrağı: sayfa nesnesinde `suzgec: true` → head'e (donör sırasıyla) tarif-liste.css → dm-p4-f.css → revize/p1/tarifler.css.
  kanon/bilesenler.css YOK (hub ölçümü: global sıfırlama, 1440'ta 1447 öğe değişiyor; .bos-durum hub'ın suzgec.css'inde "eklendi:").
  Tanımlar ölçüldü: .lst-layout/.lst-side/.lst-main · .sheet-head/-body/-foot/-overlay/-close · .btn-filter/.fb-count · .sort-dd/-btn/-menu · .lst-bar/-tools/-sum · .lst-empty · .fct* · .cbx · .fcnt · .fil-clear/-top.
  Gastro'nun süzgeç JS'i (revize/p1/filtre-paneli.js, dm-p4-f.js) yeni dosya olarak duruyor, build eklemez (K1: davranış bizim).
- Açılır menü + çekmece: "Şefler" → `video-sefler.html`, açıklama "6 video şefi" (seri şefi sayısı). `sefler` modülü → etkin öğe 'sefler'.
- Şef bağ kapısı: `node araclar/sef-bag-kapisi.mjs` (statik: .sef-card/.chef-card [onclick dahil], şef adı, "Şefler" metni, şef sayfası kırıntısı; tıklama: 1440 menü, 390 çekmece, Şefler kartı, kırıntı, ana sayfa .chef-card). İzinli: video-sef-*.html · video-sefler.html · dadagastro.com/sefler(/<k>).
- video-sefler.html kapılarda: varlik/bag/kirpma (dizin), iskelet (varsayılan liste), yapiskan (argüman), parite V2 (↔ /sefler), gezinti V2 (menü Şefler → şef kartı; 30 sn adımından önce).
