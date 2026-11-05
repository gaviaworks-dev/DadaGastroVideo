# izle ajanı — V2 durum

## ✅ SEF-KART HAZIR (5 Kas) — `src/v2/sef-kart.mjs`
```js
import { sefKarti, sefIzgarasi, sefRayi } from '../sef-kart.mjs';
sefKarti(k, o, { tur: 'dizin' | 'usta' })  // k = SEF kullanıcı adı
sefIzgarasi([k…], o)   // <div class="sef-grid"> + 'dizin' kartları   (donör /sefler #sefGrid)
sefRayi([k…], o)       // <div class="chef-row drag-scroll"> + 'usta' kartları (donör / "Tarifin ustaları")
```
- `'dizin'` = /sefler `article.sef-card` (avatar `.sef-ava`, ad `.sef-name`, editör şefte `.sef-unvan` + doğrulama rozeti, öbürlerinde
  topluluk kademesi `.sef-rank` (sira ≥ 6 → `r-high` + kupa, değilse madalya; kademeler tablosundan), `.sef-meta` yalnız "N tarif",
  `.sef-foot` Takip Et). Şef ızgarası ve izleme sayfasındaki seri sunucusu kartında.
- `'usta'` = ana sayfa `div.chef-card` (`.chef-av.gastro-sef-avatar`, `<b>` ad, `<span>N tarif</span>`, `.chef-follow`). Kaydırmalı raylarda.
- İki kart farklı; ikisi de donörün sınıf/sıra/metniyle. Çıkarılan: takipçi sayısı, POST formunun action/csrf'i.
- Kart tıklaması donördeki gibi `onclick="location.href='video-sef-<k>.html'"`; Takip düğmesi `data-vd-takip="<k>"` taşır,
  form `onclick="event.stopPropagation()"` (donörde aynı).
- CSS gereği (kabuk'tan istendi): `/varliklar/reference/sefler/sefler.css`, `/gastro/sef-imza.css`, `/gastro/sef-avatar.css` V2 başlığında.
- Takip davranışı: tek yerde olmalı (hub'ın video.js'i bütün V2 sayfalarında yükleniyor) — hub'dan istendi: delegated `[data-vd-takip]`
  → aria-pressed, `takipte` sınıfı, metin data-etiket-acik/kapali, bildirim, stopPropagation. `window.VD.takip` tanımlıysa izle.js/sef.js
  kendi dinleyicisini koymaz (çift çevirme olmaz).

## ✅ izle / kisa / sef V2 BİTTİ (5 Kas)
- izle: `iskelet` (kırıntı Video Mutfağı › Seri › Bölüm N · eyebrow seri · Bölüm N/M · başlık · özet · sayaçlar GERÇEK: video süresi /
  bölüm / hazırlık+pişirme (tarifsizde ekipman) · gorsel = video posteri). Panelde koyu oynatıcı sahnesi AYNEN; başlık/özet/seri satırı
  banner'a taşındı (gövdede tekrar yok). Yazılı tarif = Gastro `.r-card` (donör / ana sayfa) + "Yazılı tarife git"; seri sunucusu =
  `sefKarti(k,o,{tur:'dizin'})` + tanıtım + şefin diğer videoları (hub videoKarti); seri bağlamı, benzerler, pişirme modu, reklam yuvaları V1 yerlerinde.
  `data-rk-hero` artık banner'da (kabuk) — sahnedeki kaldırıldı.
- sef: `iskelet` (sayaçlar: video · seri · yazılı tarif). Panel: Gastro `.sef-card` + "Şef hakkında" (prototip örneği) + Dada Gastro profili;
  sekmeler Gastro `.bnp-tabwrap > .pf-tabs > button.dt(.active) + .cnt` (sef.js `.active` da çevirir). Profil sayfası (pf-top) iskelet
  olarak alınmadı (karar, sef.mjs başında gerekçe).
- kisa: `iskelet: null`; görüntüleyici V1'den aynen; çıkış kapat düğmesi.
- Kapılar (TABAN …/v2/): davranis-izle 27/0 · kirpma-kapisi 33 sayfa 0 · reklam-kapisi-v2 izle+sef+kisa 250 yeşil / 4 kırmızı (hepsi
  "anahtar kırıntı satırının sağında değil" — hub ve seri'de de aynı 4: kabuk.css `.vd-v2-arac` konumu, benim dosyam değil) ·
  ss 33 sayfa × 1440/390 taşma/kırık/JS/404 0 · reklamlı izle: eşlik kartı panelde taşan 0, alt bar oynatıcıyla kesişmiyor.
- Görüntüler: tasks/ss/izle-v2/
- 5 Kas ek (hub kart.mjs değişikliği): sef.mjs Seriler sekmesi bölüm listesi `<div class="feat-side vd-bolum-liste">` + bolumKarti;
  seriAfisi `boyut` seçeneği kaldırıldı. Videolar sekmesi: V1'in 2×2 öne çıkan kartı kalktı (meta-kapisi M2 "kart boyları eşit değil"
  8 kırmızı verdi) → 5 bölümde 5 sütun tek satır, ≤1180 yatay kayan iz, ≤640 tek sütun. meta-kapisi (izle+sef) 0 kırmızı ·
  davranis-izle 27/0 · kirpma 0 · ss taşma/JS/404 0.

## Patron revizesi (5 Kas) — izle tarafı
- YENİ v2/video-sefler.html (src/v2/sayfalar/sefler.mjs · css/sefler.css · js/sefler.js): bnp banner (sayaçlar: 6 video şefi · 35 video ·
  836 yazılı tarif — gerçek) + panel: donör /sefler `.sef-sec .sec-head` + `form.sef-search` ("İsme göre ara...") + hub süzgeci
  (`suzgecDuzeni`: Mutfak = şefin video tariflerinin mutfakları · Uzmanlık = Gastro unvan/kademe · sıralama Ada göre/Video sayısı/Tarif sayısı)
  + `#sefGrid.sef-grid[data-sz-liste]` (Gastro .sef-card; süzgeçli düzende 3 sütun). Arama süzgeç sonucunun üstüne daraltır, ?q= adreste.
  Reklam: SF-L1 üst · SF-N2 3. karttan sonra · SF-L1-END son. aktif 'sefler'.
- Şef detayı: kırıntı Video Mutfağı › Şefler (video-sefler.html) › Ad. Videolar sekmesi süzgeçli (süre + Seri sırası/Kısadan uzuna/
  Uzundan kısaya/Ada göre; seri grubu yalnız >1 seride — bugün gizli), liste Gastro .lst-grid.
- Kısa: görüntüleyici kökü `[data-vd-suzgec="kisa"]`; üst satırda "Süzgeç" (`[data-sz-ac][data-vd-dikey-suzgec]`) → Gastro .lst-side çekmecesi
  (her genişlikte alttan); gruplar `tema` (mikro rozet) + `tarif-sefi` (bağlı tarifin şefi); `[data-sz-sayi]` çekmece başında; boş durum
  sahnede; kisa.js `vd:suzgec` + `vd:reklam-yer`de yeniden tarar (n/N), 0 sonuçta durur.
- Şef bağ taraması (kendi sayfalarım): şefle ilgili hiçbir bağ index/hub'a gitmiyor.
- Kapılar: davranis-izle 30/0 · kirpma 0 · meta 0 · reklam-kapisi-v2 (sefler+sef+kisa+izle) 366/0 · suzgec-kapisi sefler+sef yeşil, kisa'da 4 kırmızı = kapının iki varsayımı (1440'ta
  çekmece açılmadan tıklama; `v` parametresi "kirli adres") → hub'dan istendi · sef-bag-kapisi 1 kırmızı = reklamın sponsorlu şef kartı
  (tat.com.tr, rel=sponsored) → kabuk'tan muafiyet istendi.
- Görüntüler: tasks/ss/izle-v2/sefler-{1440,390}.png · sefler-sidebar-secili-1440.png · sefler-cekmece-acik-390.png ·
  kisa-suzgec-cekmece-{1440,390}.png · kisa-suzgec-sonuc-{1440,390}.png · video-sef-berkan-gunes-{1440,390}.png
- 5 Kas ek: şef videoları süre grubu sabit seçeneklerle (secenekler tum: 0 sayılı seçenek basılır, donör gibi) → S3 artık 5 şef sayfasında ölçülüyor (Polat'ta 3 süre seçeneği de dolu → ⚪). suzgec-kapisi (sefler+sef+kisa) 286 yeşil / 0 kırmızı / 8 ölçülmedi (kisa S6 sıralama yok · polat S3).
- 5 Kas ek (reklam isteği): kisa.js sayaç/segment yalnız video öğelerini sayar (K6; reklam öğesindeyken önceki videonun numarası); yeniden tarama hedefi slug'dan (hedefSlug), programla kaydırmada kaydırma-sonu hesabı 250 ms susar → açılışta reklama atlama 12/12 açılışta yok. davranis-izle 30/0 · suzgec kisa 40/0 · reklam kisa 80/0 · davranis-hub 36/0.
