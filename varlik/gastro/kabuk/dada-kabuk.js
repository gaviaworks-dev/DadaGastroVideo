/* KABUK OTURUM KÖPRÜSÜ — sunucu oturumunu prototipin kendi sözleşmesine yazar.
 *
 * Ölçülmüş sözleşme (`varliklar/reference/shared/maket-auth.js`):
 *   `body.is-auth` + `body[data-roles]`  → kabuk CSS'inin tanıdığı 9 kural
 *   `<html data-uye-govde="1">`          → `g-*` ailesinde MARKUPA DONMUŞ
 *   `?auth=1`                            → maketin adres bayrağı
 *
 * 🔴 İKİ YÖNE DE ÇALIŞIR. `g-*` sayfalarında `is-auth` markupta duruyor;
 * oturumsuz ziyaretçiye o sayfa basılırsa üye arayüzü görünürdü (giriş düğmesi
 * gizli, hesap menüsü açık). Köprü bu yüzden yalnız EKLEMEZ, SÖKER de.
 * "Bağlanamayan şey gizlenir, sahte gösterilmez" kuralının kabuk karşılığı bu.
 *
 * ⚠ Gövde SINIFI dışında hiçbir şeye dokunulmaz: parite kapısı `body *` ölçer,
 * sınıfın kendisi ölçüye girmez ama ONUN AÇTIĞI/KAPATTIĞI yüzeyler girer —
 * yani doğru oturum durumu paritenin ön şartıdır.
 */
(function () {
  var m = document.querySelector('meta[name="dada-kimlik"]');
  if (!m) return;
  var K;
  try { K = JSON.parse(m.getAttribute('content')); } catch (e) { return; }

  function uygula() {
    var b = document.body;
    if (!b) return;

    if (K.auth) {
      b.classList.add('is-auth');
      b.setAttribute('data-roles', (K.roles || ['kullanici']).join(' '));
      document.documentElement.setAttribute('data-uye-govde', '1');
    } else {
      b.classList.remove('is-auth');
      b.removeAttribute('data-roles');
      document.documentElement.removeAttribute('data-uye-govde');
    }

    /* 🔴 HESAP MENÜSÜ DONÖRÜN KİMLİĞİNİ BASIYORDU. Türetilmiş markup 58
       ekranda prototipin donmuş değerlerini taşıyor: ad "Selin Aydın",
       kullanıcı adı "@selinaydin", avatar baş harfi "D" (üst bant) ve "S"
       (çekmece). Ölçüldü — `yonetici` hesabıyla girilince menü yine
       "Selin Aydın / @selinaydin" diyordu. Giren kullanıcıya BAŞKASININ
       kimliğini göstermek yalan yüzeydir; sunucu doğrusunu zaten yayınlıyor.

       ⚠ Yalnız METİN yazılır: düğüm eklenmez, silinmez, sınıf değişmez.
       Parite geometri ölçer ve baş harf kutusunun ölçüsü kendi CSS'inden
       gelir (`docs/ekran-envanteri.md §7`: sayaç/veri değerleri prototiple
       aynı olmak zorunda değil).

       🔴 Baş harf `toLocaleUpperCase('tr')` ile alınır: `i` → `İ`. Türkçe
       olmayan büyütme "Irmak"ı "Irmak" yerine yanlış harfle basardı. */
    if (K.auth) {
      var bas = (K.ad || '').trim().charAt(0).toLocaleUpperCase('tr');
      if (bas) {
        b.querySelectorAll('.acct-ava, .da-ava').forEach(function (a) {
          if (!a.style.backgroundImage) a.textContent = bas;
        });
      }
      if (K.ad) {
        b.querySelectorAll('.acct-id-txt > b, .drawer-acct .da-info > b').forEach(function (e) {
          e.textContent = K.ad;
        });
      }
      /* Kullanıcı adı yoksa satır BOŞALTILIR — başkasınınkini bırakmaktansa. */
      b.querySelectorAll('.acct-id-txt > small').forEach(function (e) {
        e.textContent = K.kullaniciAdi ? '@' + K.kullaniciAdi : '';
      });
    }

    // Yönetim kabuğu da aynı gerçek oturum kimliğini kullanır.
    var panelAdi = K.auth ? (K.ad || '') : '';
    var panelRol = K.auth && (K.roles || []).indexOf('yonetici') !== -1 ? 'Yönetici'
      : K.auth && (K.roles || []).indexOf('editor') !== -1 ? 'Editör' : '';
    b.querySelectorAll('.panel-ust-ben .ad, #hesapAcilir .acilir-bas').forEach(function (e) { e.textContent = panelAdi; });
    b.querySelectorAll('.panel-ust-ben .rol').forEach(function (e) { e.textContent = panelRol; });
    b.querySelectorAll('.panel-ust-ben .kisi-avatar').forEach(function (e) {
      e.textContent = panelAdi.trim().split(/\s+/).filter(Boolean).map(function (parca) { return parca.charAt(0); }).slice(0, 2).join('').toLocaleUpperCase('tr');
    });

    /* 🔴 KİMLİK BAYRAĞI EN SON. `kabuk-kimlik.css` kimlik alanlarını
       VARSAYILAN OLARAK gizli tutuyor; bu nitelik konana kadar donörün adı
       ve baş harfi ekrana hiç çıkmıyor. Bayrak burada, doğrular yazıldıktan
       SONRA konur — oturumsuz durumda da konur, çünkü o dalda `is-auth`
       sökülmüş ve menü zaten kapalıdır. Betik hiç koşmazsa nitelik hiç
       konmaz ve alanlar gizli kalır: arıza yönü dürüsttür. */
    document.documentElement.setAttribute('data-kabuk-kimlik', 'yazildi');

    /* Çıkış: prototipin çıkış bağları `#` ya da `.html`; gerçek çıkış POST'tur
       (CSRF). Bağ bir forma bağlanır — ölü düğme bırakılmaz.

       🔴 PANELİN HESAP MENÜSÜ BU SEÇİCİYE HİÇ UYMUYORDU (4 Eki, canlıda ölçüldü):
       92 türetilmiş panel ekranında "Çıkış yap" donörün düz `href="#"` bağı —
       ne `data-cikis` ne `#cikis`. Tıklama adrese `#` yazıyor, oturum açık
       kalıyordu; 3 Eki öncesi sürüm dahil hiç çalışmamıştı. Blade'lere dokunulmaz
       (`PanelVarlikSurumu`nun gerekçesi: 92 dosyalık birleştirme çakışması); kalem
       donörün kendi işaretiyle, menüdeki çıkış ikonuyla tanınır. Panelde `K.cikis`
       panelin çıkışıdır (`KabukKimligi::cikisAdresi`). */
    var cikislar = [].slice.call(document.querySelectorAll('[data-cikis], a[href$="#cikis"]'));
    document.querySelectorAll('#hesapAcilir a.acilir-kalem').forEach(function (a) {
      if (a.querySelector('.fa-right-from-bracket') && cikislar.indexOf(a) === -1) cikislar.push(a);
    });
    /* PANEL HESAP MENÜSÜNÜN ÖBÜR İKİ KALEMİ (Beyar kararı A, 4 Eki): ikisi de 92 ekranda donörün ölü
       `href="#"`ı. "Profilim" (`fa-user`) aynı Dada hesabının ayarlarına gider (`K.profil`, panelde ayrı
       profil ekranı yok); "Panel tercihleri" (`fa-sliders`) karşılığı olan bir ekran olmadığı için menüden
       KALKAR — tıklayınca hiçbir şey olmayan kalem yalan yüzeydir. Blade'lere dokunulmaz (yukarıdaki şerh). */
    document.querySelectorAll('#hesapAcilir a.acilir-kalem').forEach(function (a) {
      if (a.querySelector('.fa-user') && K.auth && K.profil) a.setAttribute('href', K.profil);
      else if (a.querySelector('.fa-sliders')) a.parentNode.removeChild(a);
    });

    cikislar.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var f = document.createElement('form');
        f.method = 'post'; f.action = K.cikis;
        f.innerHTML = '<input type="hidden" name="_token" value="' + K.csrf + '">';
        document.body.appendChild(f); f.submit();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uygula);
  else uygula();
})();
