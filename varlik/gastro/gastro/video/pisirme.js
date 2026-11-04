/* Video Mutfağı P2 · kulvar dosyası — sahibi: pisirme. Yalnız tarif detayında, pişirme modu parçası
   (`parcalar/tarif-detay/pisirme-modu.blade.php`) tarafından yüklenir.

   Mevcut pişirme modunun (açma/kapama, adım geçişi, ← / → / Escape) sahibi `app-*.js`; bu betik onun
   davranışını DEĞİŞTİRMEZ, yalnız üç şey ekler. Açık/kapalı bilgisini `#cookmode`un `hidden`
   özniteliğinden okur — app-*.js modu yalnız bu öznitelikle açıp kapatıyor (ölçüldü), bu yüzden
   betiğin kendi durum değişkeni yoktur ve ikisi birbirinden kopamaz.

   1) Ekran kilidi (Wake Lock): mod açılınca `navigator.wakeLock.request('screen')`, kapanınca
      bırakılır. Tarayıcı sekme gizlenince kilidi kendisi bırakır; sekme yeniden görünür olduğunda mod
      hâlâ açıksa yeniden istenir. Desteklenmiyorsa ya da istek reddedilirse sessizce hiçbir şey
      olmaz; "Ekran açık kalır" yazısı (`[data-cm-ekran]`) YALNIZ kilit gerçekten alındıysa görünür.
   2) Boşluk tuşu → sonraki adım. Odak bir denetimdeyken (düğme, onay kutusu, video, açılır başlık…)
      boşluğun yerel işi o denetimi etkinleştirmektir; ona karışılmaz.
   3) `#pisirme` çapası: tarif sayfası bu çapayla açılınca (ya da çapa sonradan bu olursa) mod
      kendiliğinden açılır. Mod kapanınca çapa adresten silinir; sayfa yenilenince mod yeniden açılmaz. */
(function () {
  'use strict';

  var cm = document.getElementById('cookmode');
  if (!cm) return;

  var CAPA = '#pisirme';
  var ekran = cm.querySelector('[data-cm-ekran]');
  var kilit = null;
  var istekte = false;

  function acik() { return !cm.hidden; }

  function ekraniGoster(alindi) { if (ekran) ekran.hidden = !alindi; }

  /* ── 1 · Ekran kilidi ─────────────────────────────────────────────────── */
  function kilitIste() {
    if (!('wakeLock' in navigator) || !navigator.wakeLock || typeof navigator.wakeLock.request !== 'function') return;
    if (!acik() || document.visibilityState !== 'visible') return;
    if (istekte || (kilit && !kilit.released)) return;
    istekte = true;
    navigator.wakeLock.request('screen').then(function (s) {
      istekte = false;
      // İstek yoldayken mod kapandıysa alınan kilit hemen bırakılır.
      if (!acik()) { s.release().catch(function () {}); return; }
      kilit = s;
      ekraniGoster(true);
      s.addEventListener('release', function () {
        if (kilit !== s) return;
        kilit = null;
        ekraniGoster(false);
      });
    }).catch(function () {
      istekte = false;
      ekraniGoster(false);
    });
  }

  function kilitBirak() {
    var s = kilit;
    kilit = null;
    ekraniGoster(false);
    if (s && !s.released) s.release().catch(function () {});
  }

  function durumDegisti() {
    if (acik()) {
      kilitIste();
      return;
    }
    kilitBirak();
    if (location.hash === CAPA && window.history && typeof history.replaceState === 'function') {
      history.replaceState(history.state, '', location.pathname + location.search);
    }
  }

  new MutationObserver(durumDegisti).observe(cm, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') kilitIste();
  });

  /* ── 2 · Boşluk tuşu ─────────────────────────────────────────────────── */
  var YEREL = 'button, a[href], input, select, textarea, summary, label, video, audio, iframe, [contenteditable], [tabindex]:not([tabindex="-1"])';

  function gorunur(el) {
    if (!el) return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  }

  document.addEventListener('keydown', function (e) {
    if (!acik() || e.defaultPrevented) return;
    if (e.key !== ' ' && e.code !== 'Space') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var hedef = e.target;
    if (hedef && hedef !== document.body && hedef.closest && hedef.closest(YEREL)) return;
    var sonraki = cm.querySelector('[data-cm-next]');
    // Bitiş ekranında app-*.js "sonraki"yi gizler; o hâlde boşluk hiçbir şey yapmaz (→ ile aynı).
    if (!gorunur(sonraki) || sonraki.disabled) return;
    e.preventDefault();
    if (e.repeat) return;
    sonraki.click();
  });

  /* ── 3 · #pisirme çapası ─────────────────────────────────────────────── */
  function capadanAc() {
    if (location.hash !== CAPA || acik()) return;
    // app-*.js modu yalnız ilk `[data-cook-open]`e bağlıyor; adım yoksa hiç bağlamıyor (`dataset.bound`).
    var ac = document.querySelector('[data-cook-open]');
    if (!ac) return;
    if (cm.dataset.bound !== '1') { bagiBekle(); return; }
    // Analitik olayı aynı düğmeden gider; kaynak bu açılış için "pisirme_capasi" yazılır, sonra geri konur.
    var oznitelik = 'data-analitik-parametreler';
    var eski = ac.getAttribute(oznitelik);
    if (eski) {
      try {
        var p = JSON.parse(eski);
        p.source = 'pisirme_capasi';
        ac.setAttribute(oznitelik, JSON.stringify(p));
      } catch (hata) { /* bozuk parametre: olduğu gibi gider */ }
    }
    ac.click();
    if (eski) ac.setAttribute(oznitelik, eski);
  }

  /* app-*.js modu DOMContentLoaded'da bağlar ve bağlayınca `#cookmode`a `data-bound="1"` yazar. Bu betik
     `defer`; çalıştığında belge `interactive`tir ve DOMContentLoaded'ın henüz gelip gelmediği bilinemez —
     `setTimeout(0)` ile beklemek yarışı kaybediyordu (ölçüldü: iki koşumun birinde mod açılmadı). Bu yüzden
     zamana değil olaya bakılır: bağ yoksa `data-bound` yazılana kadar beklenir. Adımı olmayan tarifte
     app-*.js hiç bağlamaz; o zaman gözlemci boşta bekler ve mod açılmaz (doğru davranış). */
  var bekleyen = null;
  function bagiBekle() {
    if (bekleyen) return;
    bekleyen = new MutationObserver(function () {
      if (cm.dataset.bound !== '1') return;
      bekleyen.disconnect();
      bekleyen = null;
      capadanAc();
    });
    bekleyen.observe(cm, { attributes: true, attributeFilter: ['data-bound'] });
  }
  window.addEventListener('hashchange', capadanAc);
  capadanAc();
})();
