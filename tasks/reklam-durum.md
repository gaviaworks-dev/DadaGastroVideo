# ▶ V2 · PATRON REVİZESİ (5 Kas, K6) — reklam ajanı
**Durum:** reklam tarafı hazır; hub "SUZGEC HAZIR" ve izle "SEFLER HAZIR" bekleniyor → sonra süzgeç senaryoları kapıya + ölçüm. V1'e dokunulmadı.
**1) video-sefler.html — karar (modülden):** full-stack'te şef DİZİNİ için tanımlı plan VAR: `sef-liste` (config/reklam-yayilim.php:19) —
`SF-L1` üst şerit (native_strip 120/96 px, reklam-slotlari.php:88; sefler.blade.php:210), `SF-N2` dizinde 3. karttan sonra sponsorlu şef kartı
(native_module "organik kartla aynı", slotlari:102; sefler.blade.php:250 → partials/kart/sef sponsor dalı), `SF-L1-END` alt şerit (slotlari:124; :302),
+ standart katman (/sefler `StandartReklamlar::uygunYol`'da). Şef profili kuralı (SF-P1) profil sayfası içindir; dizin için modülün kendi planı var →
o kullanıldı. Kreatifler canlı demo: SF-L1 **Karaca** 89 (sahne; profil kapısı LK2) · SF-N2 **Tat** 108 (profil kapısı) · SF-L1-END **Pınar** 128.
İşaretleme yine render: `araclar/reklam-render.php v2` → `node araclar/reklam-varlik.mjs --v2` → `src/v2/reklam-donor.json` (+3 parça; eski 14 parça bayt bayt aynı).
V1 dokunulmadı: yeni görseller `varlik/v2/reklam/`, yeni renkler `varlik/v2/reklam/kreatif-v2.css` (reklam.js yükler), marka simgeleri
`varlik/gastro/reklam/secki/{karaca,tat}/` YENİ dosya (modül varlığı, aynı alt yol); `git status -- varlik/video src/video` önce/sonra aynı; DB sayımı aynı.
**R17** Marka profili / seçki kapısı bağları (`/markalar/<m>`, MarkaSayfalari) prototipte sayfa olmadığı için kreatifin `hedef_url`'si (karaca.com, tat.com.tr) — R13'ün uzantısı.
**2) Süzgeç hâlleri (reklam.js'te, varlik/v2/js/reklam.js):**
- Akış içi yuva (VD-N1 hub ızgarası · SF-N2 şefler ızgarası · kısa akış öğesi): görünür organik ≥ 3 → 3.'nün ardı; 1–2 → sonuncunun ardı; 0 → `data-vd-suzgec-gizli`.
  Kartların görünürlüğünü süzgeç (sayfa JS'i) değiştirir; reklam.js gözcüyle (ve `vd:suzgec` olayıyla) kabı yerleştirir, `vd:reklam-yer` yayar.
  Elle sınama (hub, kartlar JS ile gizlendi): başlangıç 3/11 · 2 görünür → 2/2 · 0 → gizli · 6 görünür → 3/6 · hepsi → 3/12.
- 390 süzgeç çekmecesi (Gastro `.sheet`, position:fixed) açıkken yan kart + alt bar gizli (tam ekran katman kuralı; `cekmeceAcik()`).
- hub'a: VD-N1'e artık `data-vd-suzgec-gizli` YAZMASIN (V1 entegrasyonu), reklam kartı sayılara girmesin. izle'ye: kisa.js `vd:reklam-yer`'de akışı yeniden tarasın; video-sefler yuva satırları.
**R18** V2'de içerik panelin `.bnp-body > .wrap`ı içinde; modülün şeridi kendi `.wrap`ını taşıdığı için iç içe çift boşlukla içerik kolonundan 32 px (390: 16 px) daralıyordu (izle'nin notu; ölçüldü: şerit 164–1276, kolon 132–1308) → panel içindeyken şeridin yan boşluğu/genişlik sınırı kalkar (varlik/v2/css/reklam.css); şimdi 132–1308 / 16–374, sapma 0. Kapı denetimi + BOZ=wrap kırmızı.
**izle:** video-sefler yuvaları yerinde (üst: section.sef-sec'ten önce · SF-N2 #sefGrid 3. .sef-card'ın ardı · alt sonda), kisa.js `vd:reklam-yer`de yeniden tarıyor.
**Kabuk'un bulgusu (gezinti kapısı):** Gastro'nun kanon şef kartı (`.sef-card` / `.chef-card`) bağ değil `onclick="location.href='…'"` kabı → reklam=1 düşüyordu (video-sefler → video-sef-sahnur-sezek.html). reklam.js (V2) artık iç `*.html` adresli `onclick` kaplarını da çeviriyor (açık/kapalı/taşıma kipi; dış dadagastro.com adresleri dokunulmaz). Gezinti kapısı (8798) kırmızı 0; reklam kapısının iç bağ denetimi onclick adreslerini de sayıyor (sefler 26/26), BOZ=bag kırmızı.
**Ara ölçüm (8798, süzgeçsiz, sefler dahil 7 tip × 1440/390 × reklamsız/reklamlı):** reklam-kapisi-v2 **yeşil 700 · kırmızı 0**.
**3) Kapı:** reklam-kapisi-v2'ye `sefler` tipi (SF-L1 · SF-N2 · SF-L1-END · STD) + akış içi yuva konumu (süzgeçsiz: 3. öğeden sonra). Süzgeç senaryoları (seç → yuva yeri/gizli, çekmece açıkken sabit reklam 0) hub'ın seçicileri gelince.

---

# ▶ V2 (5 Kas) — reklam ajanı
**Durum:** reklam tarafı hazır, `build-v2.mjs` (kabuk) bekleniyor. V1'e dokunulmadı (V1 dosyalarım `src/video/reklam*`, `varlik/video/{css,js}/reklam.*`, `araclar/reklam-kapisi.mjs` aynı).
**V2 dosyalarım:** `src/v2/reklam.mjs`, `src/v2/reklam-donor.json` (V1 kopyası; görsel yolları kök göreli `varlik/video/reklam/…`, paylaşılan), `varlik/v2/css/reklam.css`, `varlik/v2/js/reklam.js`, `araclar/reklam-kapisi-v2.mjs`.
**Değişenler (V1 kopyasına göre):**
- `reklam.js`: modül CSS'i + `kreatif.css` adresi betiğin kendi `src`'sinden (`…/varlik/v2/js/reklam.js` → `…/varlik/`) — v2/ derinliğinden bağımsız. Hero kapısı birden çok hero'yu okur (banner + spotlight/sahne): yan kart ve alt bar EN ALTTAKİ hero başlık çizgisini geçince (R15). Taşıma kipi ve R16 aynen.
- `reklam.mjs`: `reklamAnahtari({ yer: 'banner' })` → koyu banner chip'i + "Prototip" ibaresi (kısa video görüntüleyicide `reklamAnahtari()` V1 gibi).
- `reklam.css`: banner chip'i = Gastro koyu zemin chip değerleri (portal `.hero-v .chip` / `:hover`); açıkken domates zemin; 390'da ikon + "Prototip" görünür.
- `reklam-kapisi-v2.mjs` (TABAN …/v2/): V1 denetimlerinin hepsi + anahtar koyu banner'da kırıntı satırının sağında ve "Prototip" görünür · açılışta (hero'lar görünürken) yan kart / alt bar 0 · yan kartın üstü başlık altından 24 px.
**▶ V2 SON KOŞUM (hub + izle hero'ları geri geldikten sonra, 8798):** reklam-kapisi-v2 **yeşil 582 · kırmızı 0** (⚪ hub'daki kapalı kısa katmanındaki yuva — kisa'da ölçüldü) · yukari 46/0 · gezinti 0 kırmızı · kirpma 6 sayfa × 2 = 282 kırp (39 kısalan), 0 kırmızı. Sunucu 8798 PID 30476 ile kapatıldı. **V2 REKLAM BİTTİ.**
Bu turda kapı düzeltmesi: standart katman sabit %42 kaydırmada ölçülüyordu; kısa şef sayfasında (2426 px) o nokta perde altbilgiye düşüyor ve modül kuralıyla yan kart/alt bar doğru biçimde gizleniyordu → "görünür değil" yanlış kırmızısı. Ölçüm konumu artık "en alttaki hero başlık çizgisini 60 px geçmiş"; o noktada altbilgi görünürse ⚪ ölçülmedi (bu koşumda yok). BOZ=yanust ve BOZ=hero hâlâ kırmızı.
Anahtar konumu kırmızıları (izle'nin raporu): kusur iki yerdeydi — kapı kırıntının kutusunu ölçüyordu (blok, satır boyu) → çocukların en sağı; 390 izle'de gerçek çakışma → kırıntıya sağ boşluk (benim CSS'im). Kabuk CSS'ine istek yok.

**Ölçüm (build-v2, 8798, 6 tip × 1440/390 × reklamsız/reklamlı):** reklam-kapisi-v2 yeşil 578 / 0 → oynatıcı denetimi eklenince hub 1440/390 + izle 1440/390 **4 kırmızı**: V2 hub spotlight'ı (`section.vd-spot`, hub.mjs:60) ve izleme sahnesi (`section.vd-izle__sinema`, izle.mjs:35) `data-rk-hero`yu kaybetti → banner geçilince yan kart/alt bar oynatıcı ekrandayken açılıyor (hub 1440: 3 öğe). hub ve izle'ye yazıldı (dosyalar onların).
Kabuk kapıları 8798'de: rozet 0 kırmızı · yukari 50/0 · gezinti 0 kırmızı (reklamlı kaldı) · kirpma 6 sayfa × 2 = 282 kırp, 0 kırmızı.
Düzeltme (benim CSS'im): anahtar mutlak konumda olduğu için 390 izle'de uzun kırıntının ("Akıllı Ekipman & Test > Bölüm 1") üstüne biniyordu → kırıntıya anahtar genişliği kadar sağ boşluk (240 / 390'da 100 px), kırıntı yeni satıra kırılır.
BOZ kırmızıları (V2 denetimleri): hero (alt bar açılışta → "açılışta hero görünürken 1 öğe" + oynatıcı örtme) · kirinti (boşluk kaldırıldı → "sağında değil") · yanust (top 60 px → "-53 px").
Görüntüler: scratchpad `reklam/v2/<tip>-<gen>-reklam{siz,li}-ilk.png`, `-reklamli-yuva.png`.
**kabuk'tan istenen (build-v2 / iskelet) — HEPSİ YAPILDI:** banner kırıntı satırının sağına `reklamAnahtari({ yer: 'banner' })` · `section.bnp-top`'a `data-rk-hero=""` · video sayfalarına css/js `reklam`, index/tarif'e yalnız js (taşıma kipi) · `</body>` öncesi `reklamKatmani(ortak, { sayfa: modul })` · `varlik/` → `../varlik/` çevirisi `<template>` içinde de (`src`, `poster`, `data-rk-src`, `data-vd-rk-src`) · rozet/yukarı/gezinti kapılarına TABAN …/v2/.

---

# reklam ajanı — durum (REVİZE 1 · madde 7)

## ▶ ŞU AN (5 Kas, ikinci tur — R14 düzeltmesi)
- ✅ c805485 (lead commit). Bu tur: **R14 düzeltildi** (390 alt bar notu ikinci satır), **bütün reklam yuvalarında kelime ortası kesme kaldırıldı**
  (modülün ellipsis/line-clamp'li öğelerine genişliğe göre `data-vd-kirp` yazılır, hub'ın kırpıcısı `VD.kirp` kelime sınırında kısaltır),
  **R15** (alt bar ilk ekranda oynatıcıyı örtüyordu → hero geçince), kapıya "CSS kesmesi" denetimi + çoklu anahtar + kapalı katman ⚪.
- Gerçek sayfalar (kabuk/hub/izle entegrasyonu derlenmiş hâliyle, sunucum 8798): **yeşil 481 · kırmızı 0** (R15'ten önce 9 kırmızı: hub oynatıcısı
  alt bar altında, şef 390 alt bar–bottom-nav, hub'daki kapalı kısa katman). Kısa: görüntüleyicideki anahtar artık tıklanıyor ama
  **kisa.js `adresYaz` adresi `video-kisa.html?v=` diye sıfırdan yazıp `reklam=1`'i siliyor** → `kisa` 2 kırmızı; izle'ye yazıldı (dosyası onun).
- ⏳ "REKLAM ENTEGRE" (hub-durum / izle-durum) bekleniyor → gerçek sayfalarda reklam-kapisi + kirpma-kapisi. Derlenmiş sayfalar eski
  `reklam-donor.json`la (not ayracı ayrı span değil) — kabuk tam derlemesinden sonra 390 alt barın ikinci satırı "prototip örneği" (başta "·" yok).
- Commit yok (lead). Sunucum: `PORT=8798 node araclar/sunucu.mjs` (PID scratchpad `reklam/sunucu.pid`).

### Üçüncü tur (5 Kas) — REKLAM SON
- **Eşlik kartı çakışması (izle notu) giderildi:** dar panelde logo + "Sponsorlu" hapı kırılınca modülün sabit 30/34 px üst satırı ürün adının
  üstüne biniyordu → yalnız `.vd-reklam` içinde `grid-template-rows: auto auto auto` (kolonlar/alanlar/boşluklar modülün). Ölçüm (izle menemen +
  airfryer, 1440 kart 306 px · 390 kart 288 px): etiket↔ad, etiket↔sepet, logo↔sepet, logo↔ad çakışması 0; etiket ad'ın 8 px üstünde.
  Görüntü: scratchpad `reklam/ss/eslik2-*-1440/390.png`.
- **Kısa video adresi:** izle'nin kisa.js düzeltmesi (`kisaAdresi` sorguyu korur) kapıyla doğrulandı — kısa sayfada öğe değişince `reklam=1`
  kalır; hub'da kısa kartla katman açılınca `video-kisa.html?reklam=1&v=…`, kapanınca `video-mutfagi.html?reklam=1`.
- Kapıya eklenen: eşlik kartı üst üste binme (BOZ=eslik → "etiket↔ürün adı" kırmızı) · kısa adres (BOZ=kisaadres → hub "reklam=1 yok",
  kısa "reklam=1 düştü" kırmızı). hub + kisa + izle: yeşil 278 · kırmızı 0.

### SON KOŞUM (5 Kas, kabuk tam derlemesinden sonra — 72 sayfa)
- `node araclar/reklam-kapisi.mjs` (6 tip × 1440/390 × reklamsız/reklamlı, gerçek sayfalar): **yeşil 533 · kırmızı 0** (⚪ hub'daki kapalı kısa katmanındaki yuva — kısa sayfasında ölçüldü).
- `kirpma-kapisi.mjs` aynı 6 sayfa × 1440/390: `[data-vd-kirp]` 292 (kısalan 36) · **0 kırmızı** (reklamsız görünüm; reklamlı görünümde kelime ortası kesme reklam kapısının "CSS kesmesi" denetiminde, 0).
- Derlenmiş sayfalarda yeni donör var (not ayracı ayrı span). Sunucum 8798 PID'iyle kapatıldı. **REKLAM İŞİ BİTTİ.**

## Dosyalarım
| dosya | ne |
|---|---|
| `araclar/reklam-render.php` | full-stack reklam modülünün Blade bileşenlerini **gerçek kodla** render eder (dev MySQL yalnız SELECT; önbellek/oturum bellekte) |
| `araclar/reklam-varlik.mjs` | render → `src/video/reklam-donor.json`; modül CSS → `varlik/gastro/reklam/` (aynı alt yol, değişmez; yalnız kök-mutlak `@import` göreli); sahne → `varlik/gastro/reklam/sahne/`; kreatif görselleri → `varlik/video/reklam/` (cwebp); marka renkleri + eşlik görselleri → `varlik/video/reklam/kreatif.css` |
| `src/video/reklam-donor.json` | üretilir, elle düzenlenmez (render edilmiş işaretleme + kreatif künyesi) |
| `src/video/reklam.mjs` | API (aşağıda) |
| `varlik/video/css/reklam.css` | yalnız göster/gizle, sarmalayıcı, anahtar; reklam görünümü modülün CSS'inden |
| `varlik/video/js/reklam.js` | `?reklam=1`, anahtar, iç bağlar, modül CSS yükleme, standart katman (side · alt bar) ve video kuralları |
| `araclar/reklam-kapisi.mjs` | kapı |
| `varlik/gastro/reklam/**`, `varlik/video/reklam/**` | varlıklar (3,2 MB; 2,2 MB'ı KRUPS videolu kreatifi mp4) |

Yeniden üretim: `node araclar/reklam-varlik.mjs` (DB sayımı önce/sonra **aynı**: 32 tablo, reklam_sayim_izleri 102 · gunluk_metrik 627 · konum_metrik 837 · cache 24 · sessions 320 — iki koşumda da fark 0).

## 1. Keşif — full-stack reklam modülü (gastro-video `fda37161c5`, canlı kod)

### Video için tanımlı slot VAR
`config/reklam-slotlari.php` + `config/reklam-yayilim.php` + `config/reklam.php` (tek bayrak `REKLAM_ENABLED`; standart biçimler `REKLAM_SIDE/POPUP/ALTBAR/VIDEO`; `scripts/deploy/deploy6/yerel-prova.sh`'de dördü de `true`).

| kod | tip (format_type) | masaüstü / mobil | davranış | hangi sayfa | kaynak |
|---|---|---|---|---|---|
| **VD-B1** | native_strip (İnce banner, `x-reklam.slot bicim=serit`) | Kolon × 120 px / Kolon × 96 px | yayılım "ust": hero'dan sonra, `.rk-yayilim-alan.wrap.rk-yayilim-bant` | /video-mutfagi (video-liste) | reklam-slotlari.php:90 · reklam-yayilim.php:21 · video-mutfagi.blade.php:214 |
| **VD-B1-END** | native_strip | Kolon genişliği | yayılım "son": sayfa sonu | /video-mutfagi | slotlari:126 · video-mutfagi.blade.php:571 |
| **VD-N1** | native_module (organik kartla aynı) | Organik kart ile aynı | liste arası: arşiv ızgarasında **3. karttan sonra** bir kart (`partials/kart/video` sponsor dalı) | /video-mutfagi | slotlari:103 · yayilim.php:21 (`native_kaynak` STD-VIDEO) · video-mutfagi.blade.php:536–538 |
| **VS-B1** / **VS-B1-END** | native_strip | 120/96 px · kolon | üst / son | /video-mutfagi/seriler | slotlari:91,127 · seriler.blade.php:292,298 |
| **VD-S1** / **VD-S1-END** | native_strip | 120/96 px · kolon | üst / son (seri sayfası; bölüm `?bolum=` aynı sayfa) | /video-mutfagi/seri/{slug} | slotlari:92,128 · seri…blade.php:238,335 |
| **SF-P1** / **SF-P1-END** | native_strip | 120/96 px · kolon | üst / son | /sefler/{kullanıcı} | slotlari:89,125 · sefler__burcu.oymen.blade.php:271,589 |
| **STD-VIDEO** | video (Videolu kreatif) | 4:3 / kolon × 120 px · mobil 96 px (`--rk-video-kenar` 180/128) | **karar 151**: sayfanın İLK yayılım yuvasının YERİNE, sayfa başına bir; sessiz, posterli, görünürken oynar; yuvanın kendi kreatifi `data-rk-review-static hidden` | yayılım planındaki her sayfa | slotlari:9 · VideoYerlesimi.php · slot.blade.php:52 · reklam-yogunluk.php:29 |
| **STD-SIDE** + **STD-SIDE-LEFT** | side (Dikey sticky) | 120 px × başlık altından eski alt kenara / **mobilde yok** | ≥1280 px; >1366'da iki yan, değilse yalnız sağ; hero başlık çizgisini geçmeden ve altbilgi görünürken gizli | standart katman: `uygunYol` /video-mutfagi*, /sefler… | slotlari:5–6 · StandartReklamlar.php:15–19 · standart.js `sideLayout`/`sidePairGeometry` |
| **STD-ALTBAR** | altbar (Alt sabit bar) | Kolon × 72 px / Kolon × 64 px | içerik kolonu hizası; mobilde `.bottom-nav`ın 12 px üstü; sabit eylem şeridi (`.rd-actbar`, `#actbar`) varsa yok; side ile aynı anda (karar 149.2) | standart katman | slotlari:8 · standart.js `alignAltbar` · StandartReklamlar.php:62 |
| STD-POPUP | popup | 480 px / alttan kart | en erken 2. sayfa, 9 sn ya da %50 kaydırma, oturumda 1; sayfada video varsa yok | standart katman | slotlari:7 · reklam-yogunluk.php:27 |
| **TD-ESLIK** (eşlik kartı) | ingredient_sponsor ("Yanında ne iyi gider?") | kapsayıcı genişliği | malzeme listesinin EN ALTINDA kendi `ul.ing-list[data-eslik-kutusu]`ı, "3 · Zarif satır" | tarif detayı | slotlari:31 · components/reklam/eslik-karti.blade.php · parcalar/tarif-detay/malzemeler.blade.php:121–126 |
| Seri sponsor etiketi | `.rk-native-hap` "Sponsorlu · X" | — | yalnız etkin sponsor (`VideoServisi::seriSponsoru`, 3 Kas kararı) | hub ray adı · seriler · seri bandı (eyebrow ile h1 arası) | VideoServisi.php:424 · seri…blade.php:213–214 · lang/tr/arayuz_video.php:50 |
| (bilgi) AS-VID, HD-WEEK, CM-TOP | native_video (ana sayfa video rayı) · native_week (mega menü) · cook_strip (pişirme modu) | — | kilitli/onaylı yüzeyler (ana sayfa, header) — Video sayfalarında kullanılmadı | slotlari:16,73 · reklam-yogunluk.php `kilitli_slotlar` |

`/reklam-ver` → bugün `/marka-is-birlikleri` (301), satış vitrini `config/reklam-satis-vitrini.php`: sayfa sekmeleri arasında `video-liste`, `video-seriler`, `video-seri`, `sef-profil` (satır 29); biçimler `native_video` "Video kartı · Komşu video kartı" (54) ve `video` "Videolu banner · Banner 120 / 96 px · 4:3 video" (73); paket kalemi `urun-video` "Videolu banner ve Video mutfağı listesinde kart" (108). Yani satılan Video yerleşimleri = yukarıdaki VD/VS/STD-VIDEO.

**Video için tanımlı olmayan:** tekil izleme sayfası (full-stack'te YOK — videolar seri sayfasında `?bolum=` ile açılır) ve kısa video görüntüleyici (Dada Akış'ta slot YOK).

### Örnek kreatifler (dev `gastro_v2_video`; hepsi `demo=1` = canlıdaki demo kayıtları, panelde kayıtlı)
| yuva | marka · kreatif | kampanya · rezervasyon |
|---|---|---|
| VD-B1 (videolu banner kapalıyken) | Arzum OKKA Master Grind · 91 (sahne) | 23 · 312/88 |
| VD-B1 yerinde STD-VIDEO | **KRUPS Coffee Crush** · 101 (mp4 + poster) | 42 · 128 |
| VD-N1 | KRUPS "Kahve hazırlama teknikleri" · 109 | 42 · 129 |
| VS-B1 · VD-S1 | Tefal Ingenio · 92 · 93 (Tefal sahnesi) | 15 · 18 · 19 |
| SF-P1 | Söke Geleneksel Un · 90 (Söke sahnesi) | 13 · 4/311 |
| *-END (dördü) | Pınar Süt 1 L · 130/131/132/129 (Pınar sahnesi) | 19 |
| STD-SIDE / STD-SIDE-LEFT | Uber Eats · 98 / Migros Market · 137 | 39 · 125 / 43 · 338 |
| STD-ALTBAR | Namet Antrikot · 100 | 41 · 315 |
| TD-ESLIK | **PIN Cool Lime** · 188 (canlı panel kaydı; dev tabanda yok → `RAPOR-td-eslik.md §5` değerleri, görseller gastro-reklam-eslesme `rapor/reklam/canli-gorseller/`); sipariş kanalları Yemeksepeti Market 139 · Migros Hemen 142 | 47 · 348 |
| Seri sponsoru | Tefal (veren 28) → "Akıllı Ekipman & Test" | prototip seçimi (karar R2) |

## 2. Yerleşim planı (sayfa × yuva)
| sayfa | yuvalar | gerekçe (modülün kuralı) |
|---|---|---|
| **hub** `video-mutfagi.html` | spotlight'tan sonra **VD-B1 yerinde STD-VIDEO** (KRUPS videolu banner) · "Tüm videolar" ızgarasında 3. karttan sonra **VD-N1** · `.vd-hub` sonunda **VD-B1-END** · "Akıllı Ekipman & Test" rayında ve spotlight "Sponsorlu Şef" sekmesinde **Sponsorlu · Tefal** · standart katman | yayılım planı `video-liste` + karar 151 (ilk yuva videolu) + liste arası native (blade:536) + seri sponsoru |
| **seriler** `video-seriler.html` | sade hero'dan sonra **VS-B1** (Tefal) · sonda **VS-B1-END** (Pınar) · Akıllı Ekipman afişinin görselinde **Sponsorlu · Tefal** · standart | plan `video-seriler` |
| **seri** `video-seri-<slug>.html` | seri hero'dan sonra **VD-S1** (Tefal) · sonda **VD-S1-END** (Pınar) · eyebrow ile h1 arasında **Sponsorlu · Tefal** (yalnız Akıllı Ekipman) · yer tutucu "Sponsor alanı" reklamlıda gizli · standart | plan `video-seri` + seri…blade.php:213 |
| **izle** `video-izle-<slug>.html` | izleme bloğundan (`.vd-izle__govde`) sonra **VD-S1** · benzerlerden sonra **VD-S1-END** · malzeme panelinin listesinin sonunda **TD-ESLIK** eşlik kartı (tarifli videolarda) · seri satırında **Sponsorlu · Tefal** · standart | full-stack'te izleme = seri sayfasının bölüm görünümü → `video-seri` planı; eşlik kartı tarif malzeme listesinin altı kuralı (malzemeler.blade:121) |
| **şef** `video-sef-<k>.html` | kanal başlığından sonra **SF-P1** (Söke) · sonda **SF-P1-END** (Pınar) · standart | plan `sef-profil` |
| **kısa** `video-kisa.html` | akışta 3. öğeden sonra **sponsorlu kısa öğe** (VD-N1 kuralı, KRUPS videolu kreatifi) · **standart katman YOK** | native_module "organik kartla aynı" + 3. öğe kuralı; tam ekran görüntüleyici = modülün pişirme modu kuralı (#cookmode açıkken standart biçimler gizli) |

Standart katman (tüm video sayfaları, kısa hariç): 1440'ta Migros (sol) + Uber Eats (sağ) side çifti hero geçince; alt sabit bar Namet (1440 + 390). 390'da side yok (modül: `viewport<1280 → null`), alt bar `.bottom-nav`ın üstünde.

## 3. API (src/video/reklam.mjs) — kullanım sözleşmesi
```js
import { reklamSlotu, sponsorEtiketi, reklamKatmani, reklamAnahtari } from '../reklam.mjs';
reklamSlotu('ust' | 'alt' | 'native' | 'eslik', o, { sayfa: 'hub'|'seriler'|'seri'|'izle'|'sef'|'kisa' })  // → HTML
sponsorEtiketi(seriVeyaSlug)                 // satır: <span class="rk-native-satir-sag vh-sponsor …">; sponsorsuz seride ''
sponsorEtiketi(seriVeyaSlug, { medya: true })// kart görselinin sağ üstü (konumlu kap içinde; kart boyu değişmez)
reklamKatmani(o, { sayfa })                  // standart katman; kısa'da ''
reklamAnahtari()                             // alt menü anahtarı (Gastro .chip)
```
- Her yuva `<div class="vd-reklam" data-vd-reklam="<KOD>" hidden><template>…modülün işaretlemesi…</template></div>`. Reklamsız görünümde
  modül işaretlemesi DOM'da **yok** (şablonda), kap `hidden` → yer kaplamaz, içeriği itmez, modül CSS'i yüklenmez.
- `ust`/`alt`: kendi `.wrap`ı vardır → **bölüm (section) düzeyinde** konur, bir `.wrap`ın içine değil.
- `native` (hub): kap `display: contents` → ızgarada komşu kartla aynı hücre. Süzgeç açıkken hub.js kaba `data-vd-suzgec-gizli` yazar.
- Sayfadaki yer tutucular (ör. "Sponsor alanı · prototip örneği") `data-vd-reklamsiz` alırsa reklamlı görünümde gizlenir.
- `?reklam=1` → `html.vd-reklamli`; `window` üzerinde `vd:reklam` olayı (`detail.acik`), `window.vdReklam.acik()`.
- Sabit konumlu hero'lar `data-rk-hero=""` taşır (side çifti hero başlık çizgisini geçince görünür — modülün kuralı).
- Tarayıcı deposu YOK; anahtar `history.replaceState`; açıkken bütün iç `*.html` bağları `reklam=1` taşır (sonradan eklenen bağlar da: MutationObserver).

## 4. ENTEGRASYON (yazılacak satırlar — dosya sahipleri ekler)
**kabuk · `araclar/build.mjs`**
1. üstte: `import { reklamKatmani, reklamAnahtari } from '../src/video/reklam.mjs';`
2. `altMenu()` (satır ~103): `+ \`<div class="vd-ust__menu">${bag}</div>\`` satırının ARDINA `+ reklamAnahtari()` (anahtar `.wrap` flex'inde sağa yaslanır; CSS bende).
3. `videoSayfasi()` (satır ~109): `kabukEkle(html, { css, js, video: true })` → `kabukEkle(html, { css: [...css, 'reklam'], js: [...js, 'reklam'], video: true })` ve
   `</body>`'den önce `reklamKatmani(ortak, { sayfa: modul })` (modül adı = sayfa tipi: hub · seriler · seri · izle · sef · kisa; kisa için '' döner).
   (index.html ve tarif-*.html'e EKLENMEZ: Video sayfası değiller; oralara giden bağ `reklam=1` taşır ama sayfa reklamsız kalır.)

**hub · `src/video/sayfalar/hub.mjs`** (`import { reklamSlotu, sponsorEtiketi } from '../reklam.mjs';`)
1. satır 56: `<section class="vd-spot" aria-labelledby="vd-h1">` → `<section class="vd-spot" aria-labelledby="vd-h1" data-rk-hero="">`
2. satır 47 (Sponsorlu Şef sekmesi): `<span class="vd-ornek vd-ornek--koyu" data-vd-reklamsiz>…Sponsor alanı · prototip örneği</span>${x.sponsor && s ? sponsorEtiketi(s.slug) : ''}`
3. satır 116: `<aside class="vd-sponsor"` → `<aside class="vd-sponsor" data-vd-reklamsiz`
4. satır 126 `</h3>`'ün ARDINA: `${sponsorEtiketi(s.slug)}` (başlığın altında kendi satırı)
5. `main` birleştirme: `${spot}` ile `${suzgec}` arasına `${reklamSlotu('ust', o, { sayfa: 'hub' })}`; `${tum}`'dan sonra (`.vd-hub` kapanmadan) `${reklamSlotu('alt', o, { sayfa: 'hub' })}`
6. satır 180: ilk partide 3. karttan sonra: `[...karisik.slice(0, 3).map(kart), reklamSlotu('native', o, { sayfa: 'hub' }), ...karisik.slice(3, ILK).map(kart)].join('\n   ')`
7. **hub.js:** (a) süzgeç açıkken native kaba `data-vd-suzgec-gizli` yaz, temizlenince kaldır; `[data-vd-reklam]`in `hidden`ına dokunma (reklam.js'in);
   (b) sayım/sonsuz yüklemede native hücreyi video sayma; (c) **yarım satır**: reklamlı ve süzgeçsiz görünümde ilk parti 12+1 hücre olur →
   `vd:reklam` olayında (`detail.acik`) ilk partinin SON organik kartını devam kuyruğuna geri al / kapatınca geri koy (ya da eşdeğeri); 1440/390 son satır tam.
8. **kart.mjs** `seriAfisi` satır 211: `<div class="vd-seri-afis__medya">${kolaj}` → `…${kolaj}${sponsorEtiketi(s.slug, { medya: true })}` (seriler + hub "diğer seriler")
9. **seriler.mjs** satır 13: `<section class="vd-sade-hero" …>` + ` data-rk-hero=""`; bu section'dan sonra `${reklamSlotu('ust', o, { sayfa: 'seriler' })}`; `main`in sonuna `${reklamSlotu('alt', o, { sayfa: 'seriler' })}`
10. **seri.mjs** satır 26 hero'ya ` data-rk-hero=""`; satır 31 eyebrow'un ARDINA `${sponsorEtiketi(s.slug)}`; satır 57 `<aside class="vd-sponsor"` → `… data-vd-reklamsiz`; hero section'dan sonra `${reklamSlotu('ust', o, { sayfa: 'seri' })}`; `main`in sonuna `${reklamSlotu('alt', o, { sayfa: 'seri' })}`

**izle · `src/video/sayfalar/izle.mjs`** (`import { reklamSlotu, sponsorEtiketi } from '../reklam.mjs';`)
1. satır 31: `<section class="vd-izle__sinema" aria-label="Video">` → `… data-rk-hero="">`
2. satır 44: `<a class="vd-izle__seri" …>…</a>` ARDINA `${sponsorEtiketi(s.slug)}`
3. `.vd-izle__govde` kapanışından SONRA, `vd-izle__benzer`den ÖNCE: `${reklamSlotu('ust', o, { sayfa: 'izle' })}`; benzer section'ının ARDINA: `${reklamSlotu('alt', o, { sayfa: 'izle' })}` (pişirme diyaloğundan önce)
4. malzeme paneli `<div class="vd-panel__liste" data-vd-mz-liste>` içinde son `section.vd-panel__grup`'tan SONRA: `${t ? reklamSlotu('eslik', o, { sayfa: 'izle' }) : ''}`
5. **sef.mjs** satır 44: `<section class="vd-kanal__bas">` → `… data-rk-hero=""`; ardına `${reklamSlotu('ust', o, { sayfa: 'sef' })}`; `main`in sonuna `${reklamSlotu('alt', o, { sayfa: 'sef' })}`
6. **kisa.mjs** satır 52: `${kisalar.map(oge).join('')}` → 3. öğeden sonra `reklamSlotu('native', o, { sayfa: 'kisa' })` (hub katmanında da aynı fonksiyon)
7. **kisa.js:** öğe listesi `vd:reklam` olayında yeniden taranır (reklamlıda 10 öğe, segment/sayaç "n / 10"); sponsorlu öğe
   `[data-vd-dikey-oge="reklam"]`: oynatma reklam.js'te (sessiz video, görünürken), kisa.js simülasyonu bu öğede çalışmaz; "Tarife git/Kaydet/Ses" yok.
   (Anahtar kısa sayfada tam ekran görüntüleyicinin altında kalır → istenirse `.vd-dikey__ust-satir`'a `reklamAnahtari()`; yoksa sayfa `?reklam=1` bağıyla açılır.)

## 5. Kapı ve kanıt
`TABAN=http://localhost:8798/DadaGastroVideo/ node araclar/reklam-kapisi.mjs [--sinama] [tip…]` — 6 tip × 1440/390 × (reklamsız, reklamlı).
- Geçici sınama sayfaları (derlenmiş sayfaların kopyası + yukarıdaki ENTEGRASYON satırları, scratchpad `sinama-uret.mjs`): **yeşil 457 · kırmızı 0**
  (⚪ kısa: anahtar görüntüleyicinin altında → tıklama ölçülmedi, yazıldı).
- BOZ kırmızıları (hepsi çıkış 1): `gorunur` (reklamsızda kaplar doldu → "dolu kap 4") · `depo` (localStorage yazımı) · `bag` (iç bağ 0/130, 24/154) ·
  `gorsel` (ürün webp 404 → kırık görsel + 404) · `ortu` (alt bar oynatıcının üstüne → "div.vd-oyn @160,367 ← rk-std-mesaj") · `anahtar` (tıklama yutuldu → adres değişmedi).
  İkinci tur ekleri: reklam yuvasında CSS'in metin sakladığı (ellipsis/line-clamp) görünür öğe → kırmızı (BOZ=kesme: kırpıcı çağrısı silinince "Söke ile mutfağında kendi lezzetini hazı" yakalandı, çıkış 1); sayfada birden çok anahtar varsa
  isabet edilebilen ilki; kapalı katmandaki yuva (hub'daki kısa katmanı) ⚪ ölçülmedi.
  Kapının kendi kusurları bu turda bulundu ve düzeltildi: `scroll-behavior:smooth` yüzünden kaydırma bitmeden ölçüyordu (→ `behavior:'instant'`);
  örtme denetimi 2 noktaydı, ince şerit aradan kaçtı (→ 24 px adımlı ızgara); gizli sekmedeki yuva "görünmüyor" sayılıyordu (→ sekmesi açılıp ölçülür).
- Görüntüler (sınama sayfaları): scratchpad `reklam/ss/` — `rk-sinama-<tip>-<gen>[-r]-<kaydırma>.png`, `eslik-1440/390.png`, `kisa-reklam-*.png`.

## 6. Kararlar (önerimle verdim)
- **R1** Modülün JS'i kopyalanmadı (reklam.js · standart.js sayım/sıklık için sunucuya POST eder, oturum deposuna yazar; standart.js içe aktarılınca kendini başlatır). Aynı kurallar reklam.js'te: sideLayout/sidePairGeometry (≥1280, >1366 iki yan, 120 px, inset 8, üst = başlık+24, ≥360 yükseklik, hero/altbilgi kapısı), alignAltbar, karar 149.2 (side + bar birlikte), video oynatma kuralı. Başlık ölçüsüne Video alt menüsü (`.vd-ust`) dahil; genel `header` değil `header.header` (izleme sayfasındaki `header.vd-izle__bas` başlık sanılmasın).
- **R2** Seri sponsoru prototip örneği: "Akıllı Ekipman & Test" → **Tefal** (Modül B "B2B sponsorluğa hazır"; canlı demodaki Tefal Ingenio kreatifleri airfryer/döküm/düdüklü bölümleriyle örtüşür). Spotlight "Sponsorlu Şef" sekmesi aynı seri → aynı etiket.
- **R3** STD-POPUP prototipte yok: modülün sıklığı (en erken 2. sayfa, oturumda 1, sunucu oturumu) depolamasız statik sayfada uygulanamaz; her sayfada 9 sn sonra açılan pencere olurdu. Ayrıca modül sayfada video varken pop-up basmaz.
- **R4** Videolu banner yalnız hub'da (VD-B1 yerinde). Modül kuralı her sayfanın ilk yuvasını videolu yapar; prototipte seriler/seri/izle/şef'te yuvanın kendi kreatifi (Tefal/Söke) gösterildi — izleme sayfasında asıl oynatıcının yanında ikinci oynayan video olmasın ve şerit kreatifleri de görünsün diye.
- **R5** İzleme sayfası = full-stack seri sayfasının bölüm görünümü → `video-seri` planı (VD-S1/-END); "üst" şerit oynatıcı ile başlık arasına değil izleme bloğunun ardına (oynatıcı + başlık + yazılı tarif ilk ekranda bölünmesin).
- **R6** Modülün `main:has(.rk-yayilim-alan){background:#fff}` kuralı prototipte nötr (zemin Gastro açık zemini kalır): reklam açılınca sayfanın geri kalanı değişmesin.
- **R7** (düzeltildi) Native kart metni flex kabında daralabilir; kısaltma CSS ellipsis değil, kelime sınırında `VD.kirp` (aşağıda "kırpma").
- **R8** Eşlik kartı dar panelde (390'da ~300 px): logo + hap satırı kırılabilir (sepet düğmesinin altına girmesin). "Prototip örneği" notu hapın içinde değil bilgi satırının altında.
- **R9** Seri sponsor hapı başlığın altında sola hizalı (modülün `.rk-native-satir-sag` sağ hizası satır içi kalıp içindir).
- **R10** Alt sabit bar, sabit (perde) altbilgi göründüğünde gizlenir (side'ın "footer görünür" kuralı) — yoksa altbilginin son 90 px'ini örtüyordu; gövdeye bar kadar alt boşluk.
- **R11** Kısa video sayfasında standart katman yok (tam ekran = pişirme modu kuralı); hub'daki kısa video katmanı, pişirme modu, tam ekran oynatıcı açıkken de side/bar gizli.
- **R12** Satır içi stil yasağı: modülün `<style>` (marka rengi) ve eşlik kartının satır içi `background-image`'ı üretilmiş `varlik/video/reklam/kreatif.css`'e taşındı (aynı değerler; eşlik kuralları `[data-rk-slot="TD-ESLIK"]` seçicisiyle). Eşlik kartının üye formu (POST /hesabim/…) → aynı düğme bellekte "listeye eklendi" + kısa bildirim; "Sipariş Et" penceresi `<dialog>` (dış bağlar yeni sekme).
- **R13** Tıklama adresi (`/reklam/t/<jeton>`) yerine kreatifin `hedef_url`'si (rel="sponsored nofollow noopener", yeni sekme); jetonlar basılmaz.
- **R14** (düzeltildi) "Prototip örneği" notu modülün "Sponsorlu" etiketinin içinde (`Sponsorlu<span class="vd-rk-not"><span class="vd-rk-not__ayrac"> · </span>prototip örneği</span>`); 390 alt barda not etiketin ikinci satırı (ayraç gizli), bar 64 px kalır, kesme yok.
- **R15** Alt sabit bar, sayfanın hero'su (`data-rk-hero`: spotlight, izleme sahnesi, seri bandı, kanal başlığı) başlık çizgisini geçince görünür — ilk ekranda oynatıcının alt kısmını örtüyordu (kapı yakaladı). Side'ın modüldeki kapısıyla aynı kural.
- **R16** (lead, 5 Kas, Pages denetimi) Sağ yan kart Gastro'nun "Başa dön" düğmesini (#toTop) örtüyordu: alt bar açıkken modül düğmeyi 100 px'e kaldırıyor, kartın 600 px'lik yüksekliği ise o noktaya kadar iniyor (≥1280 her genişlikte, tıklama karta gidiyordu). Kart düğmenin 12 px üstünde biter (reklam.js sideYerlesim); genişlik/kenar/üst modülün. Kapı `araclar/yukari-kapisi.mjs` (eski Pages 50 ölçümde 32 kırmızı → 0). Not: full-stack modülde de aynı kesişme var (kanıt: modül side geometrisi + standart.css:63), bu prototip dışı.
- **Kapı notu (lead, 5 Kas):** GitHub Pages KRUPS mp4'üne 206 Partial Content döner (tarayıcı Range ister) → reklam kapısı video varlıklarında 206'yı başarı sayar; yerel sunucu 200.
- **Kırpma** Modülün CSS'te kestiği öğeler (`.rk-kart h4`, `.rk-kart-metin`, `.rk-serit-metin > b/span`, `.rk-std-yazi > b/p`, eşlik adı/bilgisi): reklam.js o genişlikteki kipe göre `data-vd-kirp` yazar (nowrap → 1, line-clamp N → N, kısıt yoksa 9) ve `VD.kirp` çağırır; genişlik değişince yeniden. Kısa öğe başlığı `data-vd-kirp="2"`.

## 7. Açık kalanlar
- kisa.js `adresYaz` / hub katmanı `pushState` / kapanışta `girisAdresi` → `reklam=1` korunmalı (izle'ye iletildi).
- 1440'ta side ile içerik kolonu arası 4 px (prototip `.wrap` 1176 px; modülün `reklam-yogunluk.side.gaps` 16 px'i standart.js'te uygulanmıyor — canlıyla aynı davranış).
- Kısa akış öğesi kisa.js entegrasyonuna bağlı (sayaç "n / 9" kalır, simülasyon reklam öğesine de uygulanabilir) — izle'nin işi.
- Kapı son kez kabuk tam derlemesinden sonra (reklam-kapisi + kirpma-kapisi); sınama sayfaları silindi (yeniden: scratchpad `reklam/sinama-uret.mjs`).
