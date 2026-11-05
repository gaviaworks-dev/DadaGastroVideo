/* `/bugun-ne-pisirsem` — donörün gömülü `window.bnpConfig`ini bizim sunucumuza
 * bağlar ve henüz bağlanmamış yüzeyi gizler.
 *
 * ── NEDEN VAR (ölçüldü 2026-09-11, gerçek tarayıcı, 1440 ve 390) ─────────
 * Sayfanın bütün uçları donörün gömülü betiğinden geliyor:
 *     public/kanon/gomulu/j-03dc4d45f93b.js  →  window.bnpConfig
 * ve o dosya KANON, değiştirilemez. İçindeki 17 anahtarın 15'i ÜRETİM alan
 * adına (`https://dadagastro.com/...`) bakıyordu; misafirin tarayıcısı oraya
 * istek atıyor, istek `net::ERR_FAILED` ile düşüyordu. Türetilmiş markup'a
 * `<script>` sokmak da yasak. Meşru yer kabuğun ekran betiği yuvası:
 * `KabukKimligi::ekranBetigi()` rota adından (`tarif.ne-pisirsem`) bu dosyayı
 * türetir ve `<head>`e `defer` ile koyar.
 *
 * ── SIRALAMA ÖLÇÜLDÜ, VARSAYILMADI ──────────────────────────────────────
 * `bnpConfig` gövdede SENKRON basılıyor (ayrıştırma sırasında), bu dosya ise
 * `<head>`te `defer` — yani ayrıştırma bittikten sonra, `bnpConfig` VARKEN
 * ve sayfanın kendi `bugun-ne-pisirsem.js`inden ÖNCE (belge sırası) koşar.
 *
 * ── YOLLAR ARTIK EŞLENMİYOR, ÇÜNKÜ ROTALAR AYNI YOLA KURULDU ────────────
 * Revize P2'ye kadar 15 ucun hiçbirinin karşılığı yoktu ve bu dosya
 * "Sıfırdan Kur" bloğunu tamamen gizliyordu. Artık hepsinin karşılığı var
 * (`routes/uye/u2-bnp-menu.php` · `routes/site/p1-tarif.php`) ve rotalar
 * KANONUN YOLLARININ AYNISINA kuruldu (`/menuler`,
 * `/bugun-ne-pisirsem/menu/{menu}/kaplar`, …). Bu yüzden burada yol eşlemesi
 * YOK: aşağıdaki köken çevrimi tek başına yetiyor. Yolları burada elle
 * yazmak adres için İKİNCİ bir kaynak açardı ve rota değiştiği gün bu dosya
 * sessizce eski adrese bakmaya devam ederdi.
 *
 * Kancasını bulamadığı sayfada HİÇBİR ŞEY yapmaz.
 */
(function () {
    'use strict';

    if (!window.bnpConfig || typeof window.bnpConfig.searchUrl !== 'string') {
        return;
    }

    /* ── 1) searchUrl — kurulu kalıp, DEĞİŞTİRİLMEDİ ────────────────────── */
    var yol = null;
    var m = document.querySelector('meta[name="dada-yollar"]');
    if (m) {
        try {
            var h = JSON.parse(m.getAttribute('content'));
            yol = (h && h.ad && h.ad['bugun-ne-pisirsem.html']) || null;
        } catch (e) { yol = null; }
    }
    if (yol) {
        window.bnpConfig.searchUrl = new URL(yol.replace(/\/$/, '') + '/sonuclar', window.location.origin).toString();
    }

    /* ── 2) kalan uçlar — üretim köküne asla çıkmasın ────────────────────
       Yalnız KÖKEN değişir, yol aynı kalır: yol zaten bizim rotamızın yolu.
       Genel ve tek seferlik — kanona yeni bir anahtar eklense bile bu döngü
       onu da aynı-köken'e çeker. */
    var DEGISMEYEN = { searchUrl: true, activeMode: true };
    Object.keys(window.bnpConfig).forEach(function (anahtar) {
        if (DEGISMEYEN[anahtar]) {
            return;
        }
        var deger = window.bnpConfig[anahtar];
        if (typeof deger !== 'string') {
            return;
        }
        try {
            var ayristirilmis = new URL(deger);
            window.bnpConfig[anahtar] = window.location.origin
                + ayristirilmis.pathname + ayristirilmis.search + ayristirilmis.hash;
        } catch (e) {
            /* zaten göreli ya da bozuk bir değer — dokunma */
        }
    });

    /* ── 3) profileMenusUrl — TEK yol düzeltmesi ─────────────────────────
       Kanonun `/mutfak-defterim`i bizde BAŞKA bir ekran (`uye.mutfak-defterim`,
       ayrı veri). "Menülerime Git" düğmesinin gitmesi gereken yer üyenin menü
       ekranıdır. Adres kabuğun yol köprüsünden okunur; bulunamazsa anahtar
       OLDUĞU GİBİ bırakılır — yanlış bir ekrana götürmektense donörün kendi
       davranışı kalsın. */
    if (m) {
        try {
            var yollar = JSON.parse(m.getAttribute('content'));
            var menulerim = (yollar && yollar.ad && yollar.ad['g-menulerim.html']) || null;
            if (menulerim) {
                window.bnpConfig.profileMenusUrl = new URL(menulerim, window.location.origin).toString();
            }
        } catch (e) { /* köprü okunamadı — dokunma */ }
    }

    /* ── 4) activeMode — SUNUCUNUN bastığı etkin moddan ──────────────────
       Kanonun gömülüsü `activeMode`u SABİT yazıyor (`gunluk-pratik`). Sayfa
       `?mod=` ile başka bir modla açıldığında ızgara o modu gösterirken
       istemcinin havuz durumu hâlâ sabitin modunu taşırdı: kategoriye ilk
       tıklamada ızgara SESSİZCE başka bir modun tariflerine atlardı. Doğru
       kaynak sunucunun `active` işaretlediği çiptir. */
    var etkinCip = document.querySelector('.mode-chip.active[data-mode]')
        || document.querySelector('.mode-chip[data-mode]');
    if (etkinCip && etkinCip.dataset.mode) {
        window.bnpConfig.activeMode = etkinCip.dataset.mode;
    }

    /* ── 5) BU DOSYADAN KALKAN İKİ İŞ ────────────────────────────────────
       Tepsinin varsayılan adı (k5) ve "Deftere Kaydet"in gerçek ucu bir süre
       BURADA duruyordu — donörün betiği o zaman bu kulvarın dosya kümesinde
       değildi ve tek çare yanına yazmaktı. Dosya artık bizim
       (`public/varliklar/reference/bugun-ne-pisirsem/bugun-ne-pisirsem.js`)
       ve ikisi de kaynağında düzeltildi: k5 `setDefaultTrayName()`te, kaydet
       ucu `mdSave` dinleyicisinde. Aynı işi iki dosyada yapmak, birinin
       sessizce eskimesinin yoluydu. */
}());
