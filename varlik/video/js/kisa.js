/* Video Mutfağı · kısa video görüntüleyici (1.3) — izle ajanı
   Sayfa kipi (video-kisa.html?v=<slug>): açılışta o videoya gider; kaydırdıkça adres ?v= ile güncellenir (history.replaceState).
   Katman kipi (hub): `a[data-vd-kisa]` tıklaması ya da window.vdKisa.ac(slug) katmanı açar; adres video-kisa.html?v=<slug> olur
   (pushState), kapatınca geri döner. Simüle oynatma yalnız etkin videoda; bitince başa sarar (Reels gibi döngü).
   Kaydet düğmelerini hub'ın video.js'i yönetir. Durum yalnız bellekte.
   Reklamlı görünüm (?reklam=1, reklam.js `vd:reklam`): 3. öğeden sonra sponsorlu öğe ([data-vd-dikey-oge="reklam"]) belirir;
   öğe listesi, segmentler ve sayaç ("n / 10") yeniden taranır. Sponsorlu öğede simülasyon çalışmaz (videosunu reklam.js oynatır),
   adres ?v= yazılmaz; ilerleme parçası o öğenin <video>'sundan okunur. */
(function () {
  'use strict';
  var kok = document.querySelector('[data-vd-dikey]');
  if (!kok) return;
  var katman = kok.hasAttribute('data-katman');
  // <main> kendi yığın bağlamını kuruyor (Gastro altbilgi perdesi); sabit katman başlığın altında kalmasın diye gövdeye taşınır
  if (kok.parentNode !== document.body) document.body.appendChild(kok);
  var akis = kok.querySelector('[data-vd-dikey-akis]');
  var ogeler = [], segmentler = [];
  var segKap = kok.querySelector('.vd-dikey__segmentler');
  var reklamMi = function (o) { return !!o && o.getAttribute('data-vd-dikey-oge') === 'reklam'; };
  /** Öğe listesini DOM'dan yeniden kurar (reklam kabı açılınca/kapanınca); segment sayısı öğe sayısına eşitlenir. */
  function tara() {
    ogeler = Array.prototype.slice.call(kok.querySelectorAll('[data-vd-dikey-oge]')).filter(function (o) { return !o.closest('[hidden]'); });
    if (segKap && segKap.children.length !== ogeler.length) {
      segKap.innerHTML = '';
      ogeler.forEach(function (_, i) { var d = document.createElement('span'); d.setAttribute('data-vd-dikey-segment', String(i)); d.appendChild(document.createElement('span')); segKap.appendChild(d); });
    }
    segmentler = Array.prototype.slice.call(kok.querySelectorAll('[data-vd-dikey-segment] > span'));
    ogeler.forEach(baglaOge);
  }
  var siraEl = kok.querySelector('[data-vd-dikey-sira]');
  var zemin = kok.querySelector('[data-vd-dikey-zemin]');
  var onceki = kok.querySelector('[data-vd-dikey-onceki]');
  var sonraki = kok.querySelector('[data-vd-dikey-sonraki]');
  var azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bildir = function (a, b, t) {
    if (window.vdBildir) return window.vdBildir(a, b, t);
    if (window.VD && window.VD.bildirim) return window.VD.bildirim(b ? a + ' · ' + b : a);
  };
  var etkin = -1, sn = 0, oynuyor = false, son = 0, raf = 0, acik = !katman, girisAdresi = null, itildi = false;

  function segmentBoya() {
    var vid = reklamMi(ogeler[etkin]) ? ogeler[etkin].querySelector('video') : null;
    segmentler.forEach(function (s, i) {
      var o = i < etkin ? 1 : (i > etkin ? 0 : (vid ? (vid.duration ? vid.currentTime / vid.duration : 0) : sn / (Number(ogeler[i].getAttribute('data-sure')) || 1)));
      s.style.setProperty('--o', Math.max(0, Math.min(1, o)).toFixed(4));
    });
  }
  function dongu(simdi) {
    if (!oynuyor) return;
    var sure = Number(ogeler[etkin].getAttribute('data-sure')) || 30;
    if (!reklamMi(ogeler[etkin])) { sn += (simdi - son) / 1000; if (sn >= sure) sn = 0; } // döngü; sponsorlu öğede yalnız parça boyanır
    son = simdi;
    segmentBoya();
    raf = requestAnimationFrame(dongu);
  }
  function oynat() {
    if (etkin < 0 || !acik) return;
    oynuyor = true; son = performance.now();
    ogeler.forEach(function (o, i) { o.classList.toggle('is-oynuyor', i === etkin && !reklamMi(o)); o.classList.remove('is-durdu'); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(dongu);
  }
  function duraklat() {
    oynuyor = false; cancelAnimationFrame(raf);
    if (ogeler[etkin] && !reklamMi(ogeler[etkin])) { ogeler[etkin].classList.remove('is-oynuyor'); ogeler[etkin].classList.add('is-durdu'); }
  }
  /** Adres: video-kisa.html?v=<slug>; diğer parametreler (ör. reklam=1) korunur. */
  function kisaAdresi(slug) {
    var q = new URLSearchParams(location.pathname.slice(-15) === 'video-kisa.html' ? location.search : '');
    if (!q.has('reklam') && document.documentElement.classList.contains('vd-reklamli')) q.set('reklam', '1');
    q.set('v', slug);
    return 'video-kisa.html?' + q.toString().replace(/%5B/g, '[').replace(/%5D/g, ']');
  }
  function adresYaz(slug) {
    try { history.replaceState(history.state, '', kisaAdresi(slug)); } catch (_) { /* file:// vb. */ }
  }
  function etkinYap(i) {
    if (i === etkin || i < 0 || i >= ogeler.length) return;
    etkin = i; sn = 0;
    ogeler.forEach(function (o, j) { o.classList.toggle('is-etkin', j === i); if (j !== i) o.classList.remove('is-oynuyor', 'is-durdu'); });
    if (siraEl) siraEl.textContent = (i + 1) + ' / ' + ogeler.length;
    if (onceki) onceki.disabled = i === 0;
    if (sonraki) sonraki.disabled = i === ogeler.length - 1;
    var img = ogeler[i].querySelector('img.vd-dikey__poster'), vposter = ogeler[i].querySelector('video[poster]');
    if (zemin && (img || vposter)) zemin.src = img ? (img.currentSrc || img.src) : vposter.getAttribute('poster');
    segmentBoya();
    if (acik) { if (!reklamMi(ogeler[i])) adresYaz(ogeler[i].getAttribute('data-vd-dikey-oge')); oynat(); }
  }
  function git(i, anlik) {
    i = Math.max(0, Math.min(ogeler.length - 1, i));
    akis.scrollTo({ top: ogeler[i].offsetTop, behavior: anlik || azHareket ? 'auto' : 'smooth' });
    etkinYap(i);
  }

  /* hangi video ekranda: kaydırma bitince en yakın öğe (scroll-snap ile tam hizalı) */
  var kaydirZaman = 0;
  akis.addEventListener('scroll', function () {
    clearTimeout(kaydirZaman);
    kaydirZaman = setTimeout(function () {
      var i = Math.round(akis.scrollTop / Math.max(1, akis.clientHeight));
      etkinYap(i);
    }, 90);
  }, { passive: true });

  /* tekerlek: bir hareket = bir video (dokunmatik yüzeyde çoklu atlamayı önler) */
  var tekerKilit = 0;
  akis.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    var simdi = Date.now();
    if (simdi < tekerKilit) return;
    tekerKilit = simdi + 650;
    git(etkin + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  /* klavye */
  document.addEventListener('keydown', function (e) {
    if (!acik || e.altKey || e.ctrlKey || e.metaKey) return;
    var hedef = e.target;
    if (hedef && /^(INPUT|TEXTAREA|SELECT)$/.test(hedef.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') { e.preventDefault(); git(etkin + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') { e.preventDefault(); git(etkin - 1); }
    else if (e.key === ' ' && !(hedef && hedef.closest && hedef.closest('button, a'))) { e.preventDefault(); oynuyor ? duraklat() : oynat(); }
    else if (e.key === 'Escape' && katman) { e.preventDefault(); kapat(); }
  });
  if (onceki) onceki.addEventListener('click', function () { git(etkin - 1); });
  if (sonraki) sonraki.addEventListener('click', function () { git(etkin + 1); });

  /* öğe başına dinleyiciler (bir kez): sahneye dokun → oynat/duraklat · ses · paylaş. Sponsorlu öğede ses/paylaş/kaydet yok. */
  function sesTikla(d) {
    var on = d.getAttribute('aria-pressed') !== 'true';
    kok.querySelectorAll('[data-vd-dikey-ses]').forEach(function (x) {
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
      var ik = x.querySelector('i'); if (ik) ik.className = 'fa-solid ' + (on ? 'fa-volume-high' : 'fa-volume-xmark');
    });
    bildir(on ? 'Ses açıldı' : 'Ses kapatıldı', 'Prototipte ses yok · görüntü temsilîdir');
  }
  function paylasTikla(d) {
    var slug = d.closest('[data-vd-dikey-oge]').getAttribute('data-vd-dikey-oge');
    var url = new URL('video-kisa.html?v=' + encodeURIComponent(slug), location.href).toString();
    var baslik = d.getAttribute('data-baslik') || document.title;
    var kopyala = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { bildir('Bağlantı kopyalandı', baslik); }, function () { bildir('Bağlantı kopyalanamadı', url, 'hata'); });
      else bildir('Bu tarayıcı kopyalamayı desteklemiyor', url, 'hata');
    };
    if (navigator.share) navigator.share({ title: baslik, url: url }).catch(function (err) { if (!err || err.name !== 'AbortError') kopyala(); });
    else kopyala();
  }
  function baglaOge(o) {
    if (o.__vdBagli) return; o.__vdBagli = true;
    var sahne = o.querySelector('[data-vd-dikey-sahne]');
    if (sahne) sahne.addEventListener('click', function (e) {
      if (e.target.closest('button, a, video[controls]')) return;
      var i = ogeler.indexOf(o);
      if (i !== etkin) { git(i); return; }
      if (reklamMi(o)) return; // sponsorlu öğenin videosu reklam.js'te
      oynuyor ? duraklat() : oynat();
    });
    o.querySelectorAll('[data-vd-dikey-ses]').forEach(function (d) { d.addEventListener('click', function () { sesTikla(d); }); });
    o.querySelectorAll('[data-vd-dikey-paylas]').forEach(function (d) { d.addEventListener('click', function () { paylasTikla(d); }); });
  }
  tara();
  /* reklamlı görünüm açılıp kapanınca liste yeniden taranır; ekrandaki öğe yerinde kalır */
  window.addEventListener('vd:reklam', function () {
    var simdiki = ogeler[etkin];
    tara();
    var i = Math.max(0, ogeler.indexOf(simdiki));
    etkin = -1;
    if (acik) git(i, true); else { akis.scrollTop = ogeler[i] ? ogeler[i].offsetTop : 0; etkinYap(i); }
  });

  /* ---------- aç / kapat ---------- */
  function slugSirasi(slug) { for (var i = 0; i < ogeler.length; i++) if (ogeler[i].getAttribute('data-vd-dikey-oge') === slug) return i; return -1; }
  function ac(slug) {
    var i = Math.max(0, slugSirasi(slug));
    if (katman) {
      if (window.vdOynatici) window.vdOynatici.hepsiniDurdur();
      girisAdresi = location.href;
      kok.hidden = false;
      try { history.pushState({ vdKisa: 1 }, '', kisaAdresi(ogeler[i].getAttribute('data-vd-dikey-oge'))); itildi = true; } catch (_) { itildi = false; }
    }
    acik = true;
    document.documentElement.classList.add('vd-dikey-acik');
    etkin = -1;
    git(i, true);
    akis.focus({ preventScroll: true });
  }
  function kapat(gecmistenGeldi) {
    if (!katman || !acik) return;
    duraklat(); acik = false;
    kok.hidden = true;
    document.documentElement.classList.remove('vd-dikey-acik');
    if (itildi && !gecmistenGeldi) { itildi = false; history.back(); return; }
    itildi = false;
    if (girisAdresi && location.href !== girisAdresi) try { history.replaceState(null, '', girisAdresi); } catch (_) {}
    if (sonOdak && sonOdak.focus) sonOdak.focus({ preventScroll: true });
  }
  var sonOdak = null;
  if (katman) {
    var kapatDugme = kok.querySelector('[data-vd-dikey-kapat]');
    if (kapatDugme) kapatDugme.addEventListener('click', function () { kapat(); });
    window.addEventListener('popstate', function () { if (acik) kapat(true); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-vd-kisa]');
      if (!a || acik || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      sonOdak = a;
      ac(a.getAttribute('data-vd-kisa'));
    });
  } else {
    var v = new URLSearchParams(location.search).get('v');
    document.documentElement.classList.add('vd-dikey-acik');
    var bas = function () { etkin = -1; git(Math.max(0, slugSirasi(v)), true); akis.focus({ preventScroll: true }); };
    if (document.readyState === 'complete') bas(); else window.addEventListener('load', bas);
    // sayfa kipinde de ilk boyamada doğru öğe görünsün (load'u beklemeden)
    var i0 = Math.max(0, slugSirasi(v)); akis.scrollTop = ogeler[i0].offsetTop;
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) duraklat(); else if (acik) oynat(); });

  window.vdKisa = {
    ac: ac,
    kapat: function () { kapat(); },
    git: function (i) { git(i); },
    etkin: function () { return etkin; },
    sn: function () { return sn; },
    acikMi: function () { return acik; }
  };
})();
