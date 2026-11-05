/* Video Mutfağı · Pişirme Modu (C.3, P2) — izle ajanı
   Tam ekran katman; Screen Wake Lock API ile ekran açık tutulur (destek yoksa ya da reddedilirse dürüst bilgi satırı);
   sekme gizlenip geri gelince istek yenilenir. Büyük Önceki/Sonraki (≥64px), klavye okları, kaydırma (dokunma), "Videoda göster". */
(function () {
  'use strict';
  var kat = document.querySelector('[data-vd-pisirme]');
  if (!kat) return;
  if (kat.parentNode !== document.body) document.body.appendChild(kat); // <main>'in yığın bağlamından çıkar (başlığın üstünde açılsın)
  var acDugmeleri = document.querySelectorAll('[data-vd-pisirme-ac]');
  var adimlar = Array.prototype.slice.call(kat.querySelectorAll('[data-vd-pis-adim]'));
  var parcalar = Array.prototype.slice.call(kat.querySelectorAll('[data-vd-pis-parca]'));
  var onceki = kat.querySelector('[data-vd-pis-onceki]');
  var sonraki = kat.querySelector('[data-vd-pis-sonraki]');
  var sonrakiYazi = kat.querySelector('[data-vd-pis-sonraki-yazi]');
  var sayac = kat.querySelector('[data-vd-pis-sayac]');
  var wake = kat.querySelector('[data-vd-wake]');
  var wakeYazi = kat.querySelector('[data-vd-wake-yazi]');
  var n = adimlar.length, i = 0, kilit = null, acik = false, sonOdak = null;

  function wakeDurum(tur, metin) {
    wake.setAttribute('data-durum', tur);
    wakeYazi.textContent = metin;
    var ik = wake.querySelector('i');
    if (ik) ik.className = 'fa-solid ' + (tur === 'acik' ? 'fa-sun' : tur === 'yok' ? 'fa-circle-info' : 'fa-mobile-screen');
  }
  function kilitIste() {
    if (!('wakeLock' in navigator) || !navigator.wakeLock || typeof navigator.wakeLock.request !== 'function') {
      wakeDurum('yok', 'Bu tarayıcı ekranı açık tutmayı desteklemiyor; ekran kendiliğinden kararabilir.');
      return;
    }
    wakeDurum('bekliyor', 'Ekranı açık tutma isteniyor…');
    navigator.wakeLock.request('screen').then(function (k) {
      kilit = k;
      wakeDurum('acik', 'Ekran açık kalacak');
      k.addEventListener && k.addEventListener('release', function () {
        if (kilit === k) kilit = null;
        if (acik && document.visibilityState === 'visible') wakeDurum('yok', 'Ekranı açık tutma bırakıldı; ekran kararabilir.');
      });
    }).catch(function (err) {
      kilit = null;
      wakeDurum('yok', 'Ekran açık tutulamadı' + (err && err.name === 'NotAllowedError' ? ' (tarayıcı izin vermedi)' : '') + '; ekran kendiliğinden kararabilir.');
    });
  }
  function kilitBirak() { if (kilit) { var k = kilit; kilit = null; k.release && k.release().catch(function () {}); } }
  document.addEventListener('visibilitychange', function () {
    if (acik && document.visibilityState === 'visible' && !kilit) kilitIste();
  });

  function goster(yeni) {
    i = Math.max(0, Math.min(n - 1, yeni));
    adimlar.forEach(function (a, j) { a.hidden = j !== i; });
    parcalar.forEach(function (p, j) { p.classList.toggle('is-gecti', j < i); p.classList.toggle('is-simdi', j === i); });
    onceki.disabled = i === 0;
    sayac.textContent = (i + 1) + ' / ' + n;
    var son = i === n - 1;
    sonrakiYazi.textContent = son ? 'Bitir' : 'Sonraki Adım';
    sonraki.classList.toggle('is-bitir', son);
    var ik = sonraki.querySelector('i'); if (ik) ik.className = 'fa-solid ' + (son ? 'fa-check' : 'fa-arrow-right');
  }
  function ac() {
    if (acik) return;
    acik = true; sonOdak = document.activeElement;
    if (window.vdOynatici) window.vdOynatici.hepsiniDurdur();
    kat.hidden = false;
    document.documentElement.classList.add('vd-pisirme-acik');
    goster(i);
    kilitIste();
    sonraki.focus({ preventScroll: true });
  }
  function kapat() {
    if (!acik) return;
    acik = false;
    kat.hidden = true;
    document.documentElement.classList.remove('vd-pisirme-acik');
    kilitBirak();
    if (sonOdak && sonOdak.focus) sonOdak.focus({ preventScroll: true });
  }
  acDugmeleri.forEach(function (d) { d.addEventListener('click', ac); });
  kat.querySelector('[data-vd-pisirme-kapat]').addEventListener('click', kapat);
  onceki.addEventListener('click', function () { goster(i - 1); });
  sonraki.addEventListener('click', function () {
    if (i === n - 1) { kapat(); if (window.vdBildir) window.vdBildir('Afiyet olsun!', 'Tarifin bütün adımları tamam'); return; }
    goster(i + 1);
  });
  kat.querySelectorAll('[data-vd-pis-goster]').forEach(function (d) {
    d.addEventListener('click', function () {
      var sn = Number(d.getAttribute('data-vd-pis-goster')) || 0;
      kapat();
      var el = document.querySelector('[data-vd-izle] [data-vd-oyn]');
      var o = el && window.vdOynatici && window.vdOynatici.al(el);
      if (o) { o.git(sn, { oynat: true }); el.scrollIntoView({ block: 'center' }); }
    });
  });
  kat.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); kapat(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); if (i < n - 1) goster(i + 1); return; }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goster(i - 1); return; }
    if (e.key === 'Tab') {
      var odak = Array.prototype.filter.call(kat.querySelectorAll('button, a[href]'), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!odak.length) return;
      var ilk = odak[0], son = odak[odak.length - 1];
      if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
    }
  });
  // ıslak parmak: yatay kaydırma da adım değiştirir
  var x0 = null, y0 = null;
  var sahne = kat.querySelector('[data-vd-pis-sahne]');
  sahne.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
  sahne.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goster(i + (dx < 0 ? 1 : -1));
  }, { passive: true });
  window.vdPisirme = { ac: ac, kapat: kapat, adim: function () { return i; }, kilitVar: function () { return !!kilit; } };
})();
