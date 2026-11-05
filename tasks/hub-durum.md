# hub ajanı — durum

## Ortak bileşen imzaları (src/video/kart.mjs) — izle ve kabuk kullanabilir
Hepsi HTML dizesi döndürür; `o` = build'in sayfa modülüne verdiği ortak nesne (`esc`, `TARIF`, `SEF`, `KATALOG`, adres yardımcıları).

- `videoKarti(v, o, { boyut = 'izgara' | 'ray' | 'kompakt', baslikSeviye = 'h4', sefGoster = true, ilerleme = true })`
  16:9 kart = Gastro `.r-card` (`.r-media-wrap > .r-media` + `.r-body > h4 · .r-facts · .r-foot .r-author`) + `vd-kart` uzantıları:
  kapak `<img>`, sol üst `.r-chip` "Seri · Bölüm N", sağ üst `.r-save` (Mutfak Defterine kaydet, `data-vd-kaydet="<slug>"`),
  sağ alt süre, Pro kilit etiketi, `ornek_ilerleme` varsa kırmızı çubuk, hover önizleme katmanı. `kompakt` = yatay (İzlemeye devam et).
  Kart `data-vd-video`, `data-konsept`, `data-sure` (15-alti|15-30|30-ustu), `data-fit` taşır (süzgeç için).
- `kisaKarti(k, o)` 9:16 → `<a class="vd-kisa" href="video-kisa.html?v=<slug>" data-vd-kisa="<slug>">`.
- `bolumKarti(v, o, { sira })` binge satırı (büyük numara, kapak, başlık, süre, özet, meta, ilerleme, kaydet).
- `seriAfisi(s, o, { boyut = 'kart' | 'ray' })` → `video-seri-<slug>.html` bağlı afiş kartı (kolaj kapak, format, süre aralığı, bölüm sayısı, ritim, şef).
- `sefRozeti(kullanici_adi, o, { boyut = 'kucuk' | 'kart' })` avatar/baş harf + ad (+ unvan) → `video-sef-<…>.html`.
- `metaRozetleri(v, o)` → `.r-facts` (hazırlık dk · Kolay/Orta/İleri · kcal/porsiyon yalnız veri varsa).
- Yardımcılar: `seriBul(slug, o)`, `kapakBul(v, o)` → `{ src, alt } | null` (tarifsizde katalog `poster_tarif`), `zorlukUc(z)`, `seriBolumleri(slug, o)`, `konseptKodu(ad)`, `sureAraligi(s)`, `suzgecVerisi(v, o)`. Süre kodu ortak.mjs'in `sureKodu`su (kart dışa sureDk/sureKodu vermez → build birleşiminde çakışma yok).

## Ortak JS (varlik/video/video.js) — `window.VD`
- `VD.bildirim(metin, { ikon })` — Gastro `.ke-toast` ile kısa bildirim.
- `[data-vd-kaydet="<slug>"]` tıklayınca aynı slug'lı tüm düğmeler `aria-pressed` + `.saved` çevirir, bildirim "Mutfak Defterine kaydedildi · prototip örneği: kayıt yapılmaz". Yalnız bellek.
- `[data-vd-liste]` (malzemeleri listeme kaydet) → durum + bildirim "Alışveriş listene eklendi · prototip örneği".
- Ray: `[data-vd-ray]` kabı; içinde `[data-vd-ray-iz]` (kaydırılan iz), `[data-vd-ray-onceki]` / `[data-vd-ray-sonraki]` düğmeleri; fare ile sürükleme.
- Hover önizleme: `.vd-kart` üzerinde (yalnız `hover:hover` + `pointer:fine`, reduced-motion değilse) `.is-onizleme`.

## Durum (5 Kas)
- [x] kart.mjs + video.css + video.js TESLİM
- [x] hub.mjs → video-mutfagi.html · seriler.mjs → video-seriler.html · seri.mjs → video-seri-<slug>.html ×6 (taşma 0, JS hatası 0, 404 0, satır içi style 0 — 1440 + 390)
- [x] araclar/davranis-hub.mjs: 32 yeşil / 0 kırmızı; BOZ=1 → 12 kırmızı (çıkış 1)
- Ekran görüntüleri: tasks/ss/hub/{hub,seriler,seri-<slug>}-{1440,390}.png + hub-onizleme-1440.png
- Not (izle için): yer imini `.r-media` içine koyma — hover'daki transform yığın bağlamı kurar, düğme kart bağ örtüsünün altında kalır (ölçüldü; kart.mjs'te dışarı alındı). video.js tıklamayı yakalama evresinde dinler.
- [x] (5 Kas, ek) Hub'a izle'nin kısa video katmanı bağlandı: `kisaGoruntuleyici(o, {katman:true})` + css/js 'kisa'. Raydaki kısa karta gerçek tıklama → katman açılır (adres pushState ile video-kisa.html?v=…), Esc → kapanır, adres hub'a döner, JS hatası 0. SS: tasks/ss/hub/hub-kisa-katman-1440.png. Kapı yeniden: 32/0.
- [x] kart.mjs `kapakBul`: ortak.mjs `posterGorsel(v, boyut)` gelince onu kullanır (dize ya da {src|k640|k1600}); gelene dek aynı kural (`tarif` → `poster_tarif`) yerelde.

## REVİZE 1 (5 Kas) — METİN KIRPICI (ZORUNLU, bütün ajanlar)
`varlik/video/video.js` her video sayfasında yüklü (tarif sayfaları ve index'te de). Kullanım yalnız öznitelik:
- `data-vd-kirp="N"` → öğe en fazla N satır. Taşarsa sondan BÜTÜN KELİME atılır, "…" eklenir; sondaki yalnız-noktalama parçası (`·` `:` `—` …) da atılır. Kelime ortasından kesme yok.
- Özniteliği METNİ TAŞIYAN BLOK öğeye koy (kart başlığı `h3`/`h4`, özet `p`, ya da blok/flex-öğesi `span`). İçinde `a`/`button` varsa metin onun içinde değişir ve tam metin o bağın `aria-label`ı olur; yoksa görünen kısa metin `aria-hidden`, tam metin `.vd-gizli` span'da. Her iki durumda öğeye `title` = tam metin.
- Kart başlığı: `<h3 data-vd-kirp="2"><a href="…">Başlık</a></h3>` (Gastro .r-card h4 aynı: `<h4 data-vd-kirp="2">`).
- Tek satır (`data-vd-kirp="1"`): öğe `white-space: nowrap` + `overflow: hidden` ölçülür (scrollWidth ≤ clientWidth); flex içindeyse `min-width: 0` ver. Seri çipi/üst satır böyle: `<span class="vd-kart__seri-ad" data-vd-kirp="1">Seri adı</span>` + ayrı `Bölüm N` öğesi (numara hiç kırpılmaz).
- CSS'te o öğeye `text-overflow: ellipsis` ya da kendi `-webkit-line-clamp`ını YAZMA; JS kapalı yedeği video.css verir (`[data-vd-kirp]` overflow hidden + N satır clamp). video.css yüklemeyen sayfada kendi clamp'in kalabilir; kırpıcı ölçerken onu geçici kaldırır.
- Yeniden hesap kendiliğinden: genişlik değişince (ResizeObserver + resize), font yüklenince, gizli öğe görünür olunca. Sonradan DOM'a eklenen içerikte: `VD.kirp(kapsayan)` çağır (hub.js ızgara yüklemesi böyle).
- Kapı: `node araclar/kirpma-kapisi.mjs` (K1 satır/taşma · K2 kelime sınırı · K3 kart içi taşma / CSS kesmesi · K4 kart başlığında data-vd-kirp). BOZ=1 → kırmızı.

## REVİZE 1 — panel düzeni
Hero/sahne ve bölüm panelleri kutu: `.vd-alan` (beyaz) · `.vd-alan--krem` · `.vd-alan--duz` (zeminsiz, yalnız ızgara) · `.vd-spot` · `.vd-seri-hero` · `.vd-sade-hero` → genişlik container içi, `--vd-kart-r`, `--vd-ic`; aralar `--vd-bolum-ara` / `--vd-ara`. Kartlar (`vd-kart`, `vd-kisa`, `vd-bolum`, `vd-seri-afis`, `vd-sef-kart`) `--vd-kart-r` + `--vd-ic`. Yapışkan süzgeç barı tam genişlik kaldı (gezinme çubuğu, Gastro header gibi).

## REKLAM ENTEGRE (Revize 1 madde 7, 5 Kas)
- reklam-durum.md §4 hub 1–10 uygulandı: data-rk-hero (spotlight · seri hero · seriler hero), sponsorEtiketi (spotlight "Sponsorlu Şef" sekmesi · Akıllı Ekipman ray başlığı · seri eyebrow ardı · seriAfisi görseli `{medya:true}`), data-vd-reklamsiz (iki "Sponsor alanı" yer tutucusu + spotlight etiketi), reklamSlotu ust/alt (hub · seriler · seri) ve native (hub ızgarası, 3. karttan sonra).
- hub.js: native hücre `hucre()` ile yarım satır hesabına girer, video sayımına girmez; süzgeç açıkken `data-vd-suzgec-gizli` (CSS hub.css); reklamlı + süzgeçsiz ve arşiv tam yüklenmemişken yüklü hücre 12'nin katı kalır (`dengele()`: son organik kart kuyruğa geri / reklam kapanınca geri gelir, bağlarındaki eski ?reklam=1 temizlenir); gözcü yükleme payında kaldıkça yeniden gözlenir (reklamlıda 23'te takılıyordu — düzeltildi).
- video.css: reklamlıda yayılım şeridinin dikey payı --vd-ara, ardından gelen kutu/bar ek pay almaz (reklamsız düzen değişmedi: spot→bar 24 px ölçüldü).
- Kapılar (8796): reklam-kapisi hub seriler seri → 271 yeşil / 0 kırmızı · davranis-hub 32/0 · kirpma-kapisi (8 sayfa) 0 · reklamlı ızgara 1440: 11+1 → 12 hücre, dibe inince 26+1+yayılım 1 = 28 (tam); 390: tam.
- SS: tasks/ss/hub/{hub,seriler,seri-akilli-ekipman-test}-reklam-{1440,390}.png (+ reklamsız aynı adlar).

## V2 (5 Kas) — hub ajanı
Dosyalar: src/v2/kart.mjs · src/v2/sayfalar/{hub,seriler,seri}.mjs · varlik/v2/video.css · varlik/v2/css/{hub,seri}.css · varlik/v2/js/hub.js (V1'den) · araclar/meta-kapisi.mjs (yeni) · araclar/davranis-hub.mjs (#seriler yoksa ilk seri bölümü — V1 aynı sonuç).
- İskelet: üç sayfa `iskelet` verir (kırıntı · eyebrow · başlık + vurgu · açıklama · gerçek katalog sayaçları; seri sayfasında `gorsel` = ilk bölüm kapağı). Hub: 26 video / 6 seri / 9 kısa · seriler: 6 / 26 / 9 · seri: bölüm sayısı / toplam süre. `aktif` açılır menü öğesi.
- Panel: hub = koyu oynatıcı sahnesi (V1 AYNEN; başlık/giriş banner'a çıktı, sahne "Vitrin" eyebrow + sekmelerle başlar) · reklam üst · süzgeç barı · İzlemeye devam et · 30 Saniyede Tat · her seri ayrı Gastro bölümü · şefler · tüm videolar · reklam alt.
- Gastro kalıpları (donör: http://127.0.0.1:8960/ render DOM; hepsi portal-*.css'te tanımlı): `section.sec > .sec-head` (eyebrow · h2 · .lead · .sec-tools .see-all .row-nav), `.row-track`, `.feat-side` (yatay .r-card: "İzlemeye devam et", seri bölüm listesi), `.grid-4` (arşiv · seriler 3'lü), `.r-card` (video + seri kartı), `.m-types .mt` (süre), `.vlock-badge` (Pro), `.chef-row` (izle'nin sef-kart.mjs `sefRayi`).
- V1'in icat ettiği ve V2'de kalkanlar: vd-alan kutuları, seri rayı başlık kalıbı (ikon kutusu + künye), vd-bolum binge satırı (büyük numara), vd-seri-afis kolaj kartı, vd-sef-kart, vd-sure, vd-pro.
- Kalan video bileşenleri (Gastro'da yok): koyu sahne, vd-kisa 9:16 kart, hover önizleme, izleme çubuğu, süzgeç barı, "Hepsi bu kadar" kutusu.
- Kart meta satırı tek satır: `.vd-kart .r-body > .r-facts` nowrap + yatay kaydırma (çubuk gizli); kart başlıkları 2 satır yer → eşit boy.
- kart.mjs API (izle için): videoKarti boyut 'izgara' | 'ray' | 'yatay' | 'bolum' ('yatay'/'bolum' bir `.feat-side` kabının içinde); bolumKarti = videoKarti boyut 'bolum' (kap `.feat-side.vd-bolum-liste`); seriAfisi artık Gastro `.r-card` (ornekler/kolaj yok). Dışa verilen adlar değişmedi.
- Kapılar (8796): meta-kapisi 8 sayfa × 1440/390 × reklamsız/reklamlı → kart 468 · meta 456 · karşılaştırılan satır 64 · 0 kırmızı; BOZ=1 → M1×90 + M2×34 kırmızı (çıkış 1) · davranis-hub V2 32/0 (V1 de 32/0) · kirpma 8 sayfa 0 · reklam-kapisi-v2 hub/seriler/seri 318 yeşil / 6 kırmızı (hepsi "anahtar kırıntı satırının sağında değil" — anahtar yuvası kabuk/reklam'ın).
- SS: tasks/ss/hub-v2/{hub,seriler,seri-<slug>}-{1440,390}.png + *-reklam-*.png
- **VD.takip hazır (V2 video.js):** `[data-vd-takip]` tıklaması yakalama evresinde (kart formunun stopPropagation'ı ve kart onclick'i yutmasın); yalnız bellek; aynı şefin bütün düğmeleri birlikte: aria-pressed, Gastro `.on` (+ `.takipte`), metin `data-etiket-acik`/`-kapali`, bildirim "<ad> takip ediliyor · prototip örneği". `window.VD.takip(k, ad)` · `VD.takipteMi(k)`. Gastro `.sef-follow.on` görünümü `.chef-follow`a da (video.css, "eklendi:"). Kapı: davranis-hub V2 6b (36/0; BOZ → takip satırları kırmızı; V1 32/0 değişmedi).
- Şefler bölümü `sefRayi` ('usta', ana sayfa "Tarifin ustaları" `.chef-row > .chef-card`): hub bir keşif sayfası ve Gastro'nun ana sayfasındaki şef rayı kalıbı; 'dizin' kartı /sefler dizin sayfasının kalıbı (şef sayfası/ızgarası için).
