/* Revize P1 · kulvar dosyası — sahibi: tarif-pisirme. Tarif detay (/tarif/{slug}) dışında yüklenmez. */

/* ── Kalem 5 · alt aksiyon çubuğu açılışta görünür ──────────────────────────
   Revize 5 · madde 53: kural `public/gastro/alt-eylem-cubugu.js`e taşındı; püf detayı da aynı dosyayı
   yükler (tek kaynak). Tarif davranışı değişmedi. */

/* ── Kalem 6 · pişirme modu adım değişince sahne başa döner ─────────────────
   app-*.js adım değişince `cm-inner`in scrollTop'unu sıfırlıyor, ama kaydırma
   kabı `cm-stage` (tokens.css `overflow-y:auto`). Tam genişlik görselle adım
   görüntü alanını aşabildiği için bir sonraki adım önceki adımın kaydırma
   konumunda açılıyordu; içerik değişince sahne başa alınır. */
(function () {
  var cm = document.getElementById('cookmode');
  if (!cm) return;
  var sahne = cm.querySelector('.cm-stage');
  var ic = cm.querySelector('[data-cm-inner]');
  if (!sahne || !ic) return;
  new MutationObserver(function () { sahne.scrollTop = 0; }).observe(ic, { childList: true });
})();

/* ── Kalem 9 · paylaş menüsü yalnız GİZLİ kanalları listeler ───────────────
   Aç/kapa ve konum tarif-detay.js'te (`[data-share-toggle]` ve çubuktaki
   `[data-act="share"]` aynı `#rdSharePop`u açar; tıklama + üstüne gelme).
   Burada TEKRAR bağlanmaz. Yakalama evresinde, o işleyiciden ÖNCE, menüdeki
   her kanal satır içindeki eşinin görünürlüğüne göre `hidden` alır — konum
   hesabı (`offsetWidth`) daralmış menüyle yapılsın diye önce.
   Çubuktaki Paylaş'ta satır içi kanal yok: menü hepsini gösterir.
   eklendi: klavyeyle (Enter/Space) açılınca odak menünün ilk kanalına geçer,
   Escape menüyü kapatıp odağı açan düğmeye geri verir, odak menüden çıkınca
   menü kapanır. Donörde üçü de yok; menü DOM'da sayfanın sonunda durduğu için
   klavyeyle ulaşılamıyordu. */
(function () {
  var pop = document.getElementById('rdSharePop');
  if (!pop) return;
  var KANALLAR = ['fb', 'xx', 'wa', 'tg', 'pin', 'em', 'cp'];
  var acan = null;

  function gorunur(el) {
    if (!el) return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  }
  function kanalOf(el) {
    for (var i = 0; i < KANALLAR.length; i++) if (el.classList.contains(KANALLAR[i])) return KANALLAR[i];
    return null;
  }
  function suz(tetik) {
    var serit = tetik.closest('.ts-share');
    pop.querySelectorAll('.share-btn').forEach(function (b) {
      var k = kanalOf(b);
      b.hidden = !!(serit && k && gorunur(serit.querySelector('.share-btn.' + k)));
    });
  }
  var ustundeAcildi = false;
  function hazirla(e) {
    var tetik = e.target && e.target.closest ? e.target.closest('[data-share-toggle], [data-act="share"]') : null;
    if (!tetik) return;
    if (e.type === 'mouseenter' && (e.target !== tetik || pop.classList.contains('show'))) return;
    if (e.type === 'click' && pop.classList.contains('show')) {
      // Fare düğmeye tıklamak için ÜSTÜNE gelir; üstüne gelme menüyü zaten
      // açmıştır. Donör işleyicisi tıklamayı aç/kapa sayar ve az önce açılan
      // menüyü kapatırdı (ölçüldü). O ilk tıklama menüyü açık tutar.
      if (ustundeAcildi && tetik === acan) { ustundeAcildi = false; e.stopPropagation(); }
      return;
    }
    suz(tetik);
    acan = tetik;
    ustundeAcildi = e.type === 'mouseenter';
    if (e.type === 'click' && e.detail === 0) {
      // Menü `visibility` geçişiyle açılıyor; geçişin ilk karesinde hâlâ
      // `hidden` sayılır ve focus() yutulur (ölçüldü: aynı turda odak düğmede
      // kaldı). İki kare sonra dene, tutmazsa geçiş bitince bir kez daha.
      var odakla = function () {
        if (!pop.classList.contains('show')) return true;
        var ilk = [].find.call(pop.querySelectorAll('.share-btn'), function (b) { return !b.hidden; });
        if (ilk) ilk.focus();
        return !ilk || document.activeElement === ilk;
      };
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!odakla()) pop.addEventListener('transitionend', odakla, { once: true });
        });
      });
    }
  }
  document.addEventListener('click', hazirla, true);
  document.addEventListener('mouseenter', hazirla, true);

  function kapat(odagiGeriVer) {
    pop.classList.remove('show');
    document.querySelectorAll('[data-share-toggle], [data-act="share"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (odagiGeriVer && acan) acan.focus();
  }
  pop.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); kapat(true); }
  });
  pop.addEventListener('focusout', function (e) {
    if (!pop.classList.contains('show')) return;
    // relatedTarget yoksa odak bir tıklamayla düştü; dış tıklamayı donör kapatır.
    if (!e.relatedTarget || pop.contains(e.relatedTarget) || e.relatedTarget === acan) return;
    kapat(false);
  });
})();

/* A/D — başlık ve bağlı görseller aynı adımda; tarif videosu tek oynatıcıdır. */
(function () {
  var cm = document.getElementById('cookmode');
  if (!cm) return;
  var ic = cm.querySelector('[data-cm-inner]');
  if (!ic) return;
  function adimiTamamla() {
    var no = ic.querySelector('.cm-num__n');
    if (!no || ic.querySelector('[data-cm-alanlar-hazir]')) return;
    var kart = document.querySelectorAll('.step-card')[Number(no.textContent) - 1];
    if (!kart) return;
    var isaret = document.createElement('div');
    isaret.setAttribute('data-cm-alanlar-hazir', '');
    var baslik = kart.querySelector('.sc-top h3');
    if (baslik && baslik.textContent.trim()) {
      var h = document.createElement('h3'); h.textContent = baslik.textContent; isaret.appendChild(h);
    }
    no.parentNode.insertAdjacentElement('afterend', isaret);
    var kaynaklar = kart.querySelectorAll('[data-tarif-medya] img');
    if (kaynaklar.length) {
      var galeri = document.createElement('div'); galeri.className = 'cm-figs gastro-cm-gorseller';
      kaynaklar.forEach(function (kaynak) {
        var fig = document.createElement('figure'); fig.className = 'gastro-cm-gorsel';
        var resim = kaynak.cloneNode(false); resim.removeAttribute('data-tam-src'); fig.appendChild(resim);
        var aciklama = kaynak.closest('figure').querySelector('figcaption');
        if (aciklama) fig.appendChild(aciklama.cloneNode(true));
        galeri.appendChild(fig);
      });
      ic.appendChild(galeri);
    }
  }
  new MutationObserver(adimiTamamla).observe(ic, { childList: true });
  adimiTamamla();
  var video = document.querySelector('[data-tarif-ana-video]');
  var yuva = cm.querySelector('[data-cm-video-yuva]');
  if (!video || !yuva) return;
  var yer = document.createComment('tarif videosu özgün konum');
  video.before(yer);
  function videoKonumu() {
    if (!cm.hidden && video.parentNode !== yuva) yuva.appendChild(video);
    else if (cm.hidden && video.parentNode === yuva) {
      yer.parentNode.insertBefore(video, yer.nextSibling);
      var detay = cm.querySelector('[data-cm-video]'); if (detay) detay.open = false;
    }
  }
  new MutationObserver(videoKonumu).observe(cm, { attributes: true, attributeFilter: ['hidden'] });
  videoKonumu();
})();
