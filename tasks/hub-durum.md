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
