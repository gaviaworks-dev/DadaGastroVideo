# Dada Gastro Video Mutfağı — prototip

Dada Gastro'nun **Video Mutfağı** alanının yeniden tasarlanmış statik prototipi: keşif sayfası, seriler, seri, video izleme,
şef, 30 Saniyede Tat kısa videoları ve yazılı tarif köprüsü.
Kaynak: "Dada Gastro Video Mutfağı Ürün Geliştirme ve İcra İş Listesi" (DADA-VID-2026/Q4 · REV 1.2). Yöntem Dada Gastro Kids ve Health prototipleriyle aynı.
Yayın: GitHub Pages (`noindex`) → https://gaviaworks-dev.github.io/DadaGastroVideo/

> **Videolar örnektir; oynatıcı görüntüsü temsilîdir.** Oynatıcı, gerçek tarif kapağı üzerinde simüle edilen bir zaman çizgisidir.
> İzlenme, puan, takipçi, yorum ya da abone sayısı gösterilmez. Örnek etkileşimler (izleme ilerlemesi, sponsor yuvası, şef tanıtım metni)
> "Prototip örneği" olarak etiketlidir. Kaydet, listeye ekle, dolabımda var gibi durumlar yalnız sayfa açıkken bellekte tutulur; hiçbir
> kullanıcı verisi tarayıcıya ya da bir sunucuya yazılmaz.

## Sayfalar
| Sayfa | Ne |
|---|---|
| `index.html` | Gastro ana sayfası (yerel kopya): üst menüde **Video Mutfağı · VİDEO**, Tarifler mega menüsünde **haftanın serisi** canlı mini önizlemesi, ana sayfa video bölümü |
| `video-mutfagi.html` | Keşfet: vitrin (haftanın serisi · mevsimin tarifi · sponsorlu şef) + senkron malzeme, yapışkan süzgeç (`?konsept=…&sure=…`), izlemeye devam et, 30 Saniyede Tat rayı, seri rayları, şefler, tüm videolar |
| `video-seriler.html` · `video-seri-<seri>.html` | Altı seri ve bölüm dizilimi |
| `video-izle-<video>.html` | Oynatıcı + bölüm damgaları, senkron malzeme paneli (Dolabımda Var · eksikleri listeye), yazılı tarif kartı, şef kartı, seri bağlamı, pişirme modu, benzer videolar, VideoObject JSON-LD |
| `video-kisa.html?v=<kısa>` | 30 Saniyede Tat: tam ekran dikey görüntüleyici |
| `video-sef-<kullanıcı-adı>.html` | Seri şefinin sayfası (ad, unvan ve tarif sayısı gerçek) |
| `tarif-<tarif>.html` | Gastro tarif sayfası (yerel kopya) + yazar satırının altında **"Bu Tarifin Videosunu İzle (mm:ss)"** kartı |

Her sayfada Gastro kabuğu (üst bant, header, mega menü, mobil çekmece, footer) Gastro'nun kendi sunucu HTML'inden alınır; Video sayfalarında
logonun yanında "video" alt marka rozeti ve header'ın altında Video alt menüsü (ev · Keşfet · Seriler · 30 Saniyede Tat · Şefler) vardır.
Aşağı kaydırınca yalnız Gastro header'ı gizlenir; üst siyah bant ve Video menüsü yerinde kalır.

## Nasıl çalışır
Kabuk, tarif sayfaları ve veri **yerel kopyadan** gelir; canlı siteye istek atılmaz.
```bash
npm i                                   # yalnız playwright (kapılar için)
node araclar/snapshot.mjs               # yerel Gastro (127.0.0.1:8960) → src/donor/*.html + varlik/gastro/** (yollar göreli, token/oturum temizliği)
python3 -I araclar/veri-hazirla.py      # gastro_v2_video (yalnız SELECT) → veri/tarifler.json, veri/sefler.json + kapaklar (cwebp)
node araclar/build.mjs                  # src/donor + src/video + veri → kökte statik HTML
node araclar/sunucu.mjs                 # http://localhost:8795/DadaGastroVideo/  (PORT=… ile başka port)
node araclar/varlik-kapisi.mjs          # her sayfa 1440/390: 404 0 · JS hatası 0 · yatay taşma 0 · kırık görsel 0 · izinsiz dış istek 0
node araclar/bag-kapisi.mjs             # her iç bağ depoda bir dosyaya çözülür; # ve javascript: bağı 0; dış bağ yalnız izinli kökenler
node araclar/parite-kapisi.mjs          # üst bant + header + footer = yerel Gastro donörü (1440/390, 4px)
node araclar/yapiskan-kapisi.mjs        # yapışkan kabuk: aşağı kayınca yalnız header gizlenir, Video menüsü yapışır
```
Her kapı `BOZ=1` ile bilerek bozulmuş bir girdide kırmızı verdiğini gösterir.

- Sayfa modülleri: `src/video/sayfalar/<ad>.mjs` → `[{ dosya, baslik, aciklama, main, css, js, govdeSinifi, altMenu }]`; ortak veri ve
  yardımcılar `src/video/ortak.mjs`, kartlar `src/video/kart.mjs`, oynatıcı `src/video/oynatici.mjs`.
- Katalog (seriler, videolar, kısa videolar, bölüm başlıkları ve süreleri): `veri/katalog.json`. Bölüm damgaları verilmemişse bağlı tarifin
  adımlarından, adım süreleriyle orantılı türetilir.
- Stil: Gastro'nun kendi CSS'i (`varlik/gastro/**`, değiştirilmez) + `varlik/video/*.css` (`vd-` önekli). Satır içi stil ve sayfa içi `<style>` yok.

## Kaynaklar ve haklar
- Arayüz kabuğu, tarifler, tarif fotoğrafları, şef adları ve unvanları: **Dada Gastro** (yerel kopya, salt okuma).
- Seri adları ve kavramları iş listesi dokümanından; video başlıkları ve süreleri örnektir.
- Gilroy yazı tipi ve Font Awesome ikonları Gastro'nun kendi varlıkları olarak taşınmıştır.
