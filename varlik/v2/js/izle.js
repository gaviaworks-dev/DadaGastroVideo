/* Video Mutfağı · izleme sayfası (izle ajanı)
   Bölüm damgaları ↔ oynatıcı (C.1), #t=<sn> açılışı (E.2a hasPart url'leri), Paylaş, şef Takip Et (E.1a), video bitince
   5 sn geri sayımlı "Sıradaki bölüm" katmanı. Kaydet düğmelerini hub'ın video.js'i yönetir. Durum yalnız bellekte. */
(function () {
  'use strict';
  var kok = document.querySelector('[data-vd-izle]');
  if (!kok) return;
  var bildir = function (a, b, t) { if (window.vdBildir) window.vdBildir(a, b, t); };
  var oynEl = kok.querySelector('[data-vd-oyn]');
  var oyn = oynEl && window.vdOynatici ? window.vdOynatici.al(oynEl) : null;
  var kilitli = kok.classList.contains('vd-izle--kilitli');

  /* ---------- Bölüm damgaları ---------- */
  var damgalar = Array.prototype.slice.call(kok.querySelectorAll('[data-vd-damga]'));
  var iz = kok.querySelector('.vd-damgalar__iz');
  var bolumler = oyn ? oyn.bolumler : [];
  function damgaBoya(bolum, sn) {
    damgalar.forEach(function (d, i) {
      var etkin = i === bolum;
      if (etkin) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      var b = bolumler[i];
      var f = 0;
      if (b) f = sn >= b.son ? 1 : (sn > b.sn ? (sn - b.sn) / (b.son - b.sn) : 0);
      d.style.setProperty('--ilerleme', f.toFixed(4));
    });
  }
  function damgaGorunur(i) {
    var d = damgalar[i]; if (!d || !iz) return;
    var sol = d.parentNode.offsetLeft - iz.offsetLeft, sag = sol + d.offsetWidth;
    if (sol < iz.scrollLeft || sag > iz.scrollLeft + iz.clientWidth) iz.scrollTo({ left: Math.max(0, sol - 16), behavior: 'smooth' });
  }
  damgalar.forEach(function (d) {
    d.addEventListener('click', function () {
      if (kilitli || !oyn) {
        bildir('Bu bölüm Pro üyelere açık', 'Bölüm başlıkları, yazılı tarif ve malzemeler herkese açık', 'hata');
        return;
      }
      oyn.git(Number(d.getAttribute('data-sn')), { oynat: true });
      var r = oynEl.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) oynEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });
  // damga çubuğu taşıyorsa sağ/sol kenarda solma (kaydırılabildiği görünsün)
  function tasmaBoya() {
    if (!iz) return;
    var t = iz.scrollWidth - iz.clientWidth > 8; // iz 4px iç pay taşıyor (odak halkası için); snap 4px kaydırabilir
    iz.classList.toggle('is-tasiyor-sag', t && iz.scrollLeft < iz.scrollWidth - iz.clientWidth - 8);
    iz.classList.toggle('is-tasiyor-sol', t && iz.scrollLeft > 8);
  }
  if (iz) { iz.addEventListener('scroll', tasmaBoya, { passive: true }); window.addEventListener('resize', tasmaBoya); tasmaBoya(); }
  if (oynEl) {
    oynEl.addEventListener('vd:zaman', function (e) { damgaBoya(e.detail.bolum, e.detail.sn); });
    oynEl.addEventListener('vd:bolum', function (e) { if (e.detail.sn > 0) damgaGorunur(e.detail.bolum); });
  }

  /* ---------- #t=<sn> (VideoObject hasPart Clip url'leri) ---------- */
  function hashZaman() {
    var m = /(?:^#|&)t=(\d+(?:\.\d+)?)/.exec(location.hash || '');
    if (!m || !oyn || kilitli) return;
    oyn.git(Number(m[1]));
  }
  hashZaman();
  window.addEventListener('hashchange', hashZaman);

  /* ---------- Paylaş ---------- */
  var paylas = kok.querySelector('[data-vd-paylas]');
  if (paylas) paylas.addEventListener('click', function () {
    var url = location.href.split('#')[0];
    var sn = oyn ? Math.floor(oyn.sn()) : 0;
    if (sn > 3) url += '#t=' + sn;
    var baslik = paylas.getAttribute('data-baslik') || document.title;
    var kopyala = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          bildir('Bağlantı kopyalandı', sn > 3 ? window.vdOynatici.sureMetni(sn) + ' anından açılır' : baslik);
        }, function () { bildir('Bağlantı kopyalanamadı', url, 'hata'); });
      } else bildir('Bu tarayıcı kopyalamayı desteklemiyor', url, 'hata');
    };
    if (navigator.share) navigator.share({ title: baslik, url: url }).catch(function (err) { if (!err || err.name !== 'AbortError') kopyala(); });
    else kopyala();
  });

  /* Takip Et: hub'ın video.js'indeki ortak dinleyici (VD.takip, yakalama evresi) yönetir — burada dinleyici YOK. */

  /* ---------- Video bitince "Sıradaki bölüm" (5 sn, iptal edilebilir) ---------- */
  var katman = kok.querySelector('[data-vd-sonraki-katman]');
  var sonrakiAdres = kok.getAttribute('data-sonraki');
  if (katman && oynEl && sonrakiAdres) {
    var sahne = oynEl.querySelector('[data-vd-sahne]');
    sahne.appendChild(katman);
    var sayac = katman.querySelector('[data-vd-geri-sayim]');
    var zaman = 0, kalan = 5;
    var kapat = function () { clearInterval(zaman); zaman = 0; katman.hidden = true; };
    oynEl.addEventListener('vd:bitti', function () {
      kalan = 5; sayac.textContent = '5';
      katman.hidden = false;
      // halka animasyonunu baştan başlat
      var h = katman.querySelector('.vd-sonraki__dolu'); if (h) { h.style.animation = 'none'; void h.getBoundingClientRect(); h.style.animation = ''; }
      katman.querySelector('.vd-sonraki__simdi').focus({ preventScroll: true });
      clearInterval(zaman);
      zaman = setInterval(function () {
        kalan -= 1; sayac.textContent = String(Math.max(0, kalan));
        if (kalan <= 0) { clearInterval(zaman); location.href = sonrakiAdres; }
      }, 1000);
    });
    katman.querySelector('[data-vd-sonraki-iptal]').addEventListener('click', function (e) { e.stopPropagation(); kapat(); bildir('Otomatik geçiş iptal edildi', 'Sıradaki bölüm seri listesinde'); });
    katman.addEventListener('click', function (e) { e.stopPropagation(); });
    oynEl.addEventListener('vd:durum', function (e) { if (e.detail.oynuyor) kapat(); });
    window.vdSonraki = { iptal: kapat, acikMi: function () { return !katman.hidden; } };
  }
})();
