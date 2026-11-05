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
