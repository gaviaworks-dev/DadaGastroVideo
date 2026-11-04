/* Video Mutfağı — ortak davranış (hub ajanı). Bütün video sayfalarında yüklenir.
   - VD.bildirim: Gastro .ke-toast ile kısa bildirim.
   - Mutfak Defterine kaydet ([data-vd-kaydet]) ve "Malzemeleri listeme kaydet" ([data-vd-liste]): yalnız bellek (sayfa açıkken);
     depoya (localStorage/sessionStorage) hiçbir şey yazılmaz. Bildirim "prototip örneği: kayıt yapılmaz" der.
   - Ray: [data-vd-ray] > [data-vd-ray-iz] + [data-vd-ray-onceki]/[data-vd-ray-sonraki]; fareyle sürükleme.
   - Hover önizleme (E.2c): .vd-kart, yalnız (hover:hover) and (pointer:fine) ve reduced-motion değilken. */
(function () {
  'use strict';
  var VD = window.VD = window.VD || {};

  /* ---------- bildirim ---------- */
  var toast, toastZaman;
  VD.bildirim = function (metin, secenek) {
    secenek = secenek || {};
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'ke-toast vd-bildirim';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.innerHTML = '';
    var i = document.createElement('i');
    i.className = 'fa-solid ' + (secenek.ikon || 'fa-circle-check');
    i.setAttribute('aria-hidden', 'true');
    var s = document.createElement('span');
    s.textContent = metin;
    toast.appendChild(i); toast.appendChild(s);
    toast.classList.add('show');
    clearTimeout(toastZaman);
    toastZaman = setTimeout(function () { toast.classList.remove('show'); }, secenek.sure || 3200);
  };

  /* ---------- Mutfak Defterine kaydet (bellek) ---------- */
  var kayitli = Object.create(null);
  VD.kayitliMi = function (slug) { return !!kayitli[slug]; };
  function kaydetCiz(slug) {
    var acik = !!kayitli[slug];
    document.querySelectorAll('[data-vd-kaydet]').forEach(function (b) {
      if (b.getAttribute('data-vd-kaydet') !== slug) return;
      b.setAttribute('aria-pressed', acik ? 'true' : 'false');
      b.classList.toggle('saved', acik);
      if (b.__vdAd === undefined) b.__vdAd = (b.getAttribute('aria-label') || '').replace(/^(Mutfak Defterine kaydet|Mutfak Defterinden çıkar):?\s*/, '');
      b.setAttribute('aria-label', (acik ? 'Mutfak Defterinden çıkar' : 'Mutfak Defterine kaydet') + (b.__vdAd ? ': ' + b.__vdAd : ''));
      b.setAttribute('title', acik ? 'Mutfak Defterinde kayıtlı' : 'Mutfak Defterine kaydet');
      var et = b.querySelector('[data-vd-kaydet-metin]');
      if (et) et.textContent = acik ? 'Defterde' : 'Kaydet';
    });
  }
  VD.kaydet = function (slug) {
    kayitli[slug] = !kayitli[slug];
    kaydetCiz(slug);
    VD.bildirim(kayitli[slug] ? 'Mutfak Defterine kaydedildi · prototip örneği: kayıt yapılmaz' : 'Mutfak Defterinden çıkarıldı · prototip örneği', { ikon: kayitli[slug] ? 'fa-bookmark' : 'fa-circle-minus' });
    return kayitli[slug];
  };

  /* ---------- Malzemeleri listeme kaydet (bellek) ---------- */
  var listede = Object.create(null);
  VD.listeyeEkle = function (slug, dugme) {
    listede[slug] = !listede[slug];
    document.querySelectorAll('[data-vd-liste]').forEach(function (b) {
      if (b.getAttribute('data-vd-liste') !== slug) return;
      b.setAttribute('aria-pressed', listede[slug] ? 'true' : 'false');
      var et = b.querySelector('[data-vd-liste-metin]');
      if (et) et.textContent = listede[slug] ? 'Listende' : (b.getAttribute('data-vd-liste-ilk') || 'Malzemeleri Listeme Kaydet');
      var ik = b.querySelector('i');
      if (ik) ik.className = 'fa-solid ' + (listede[slug] ? 'fa-check' : 'fa-cart-plus');
    });
    VD.bildirim(listede[slug] ? 'Alışveriş listene eklendi · prototip örneği' : 'Alışveriş listesinden çıkarıldı · prototip örneği', { ikon: listede[slug] ? 'fa-cart-shopping' : 'fa-circle-minus' });
  };

  document.addEventListener('click', function (ev) {
    var k = ev.target.closest('[data-vd-kaydet]');
    if (k) { ev.preventDefault(); ev.stopImmediatePropagation(); VD.kaydet(k.getAttribute('data-vd-kaydet')); return; }
    var l = ev.target.closest('[data-vd-liste]');
    if (l) { ev.preventDefault(); VD.listeyeEkle(l.getAttribute('data-vd-liste'), l); }
  }, true); // yakalama evresi: Gastro'nun kart tıklaması (.r-card → tarif bağı) ve .r-save giriş kapısı yer imini yutmasın

  /* ---------- Ray (ok + sürükle) ---------- */
  function rayKur(ray) {
    if (ray.__vd) return; ray.__vd = 1;
    var iz = ray.querySelector('[data-vd-ray-iz]');
    if (!iz) return;
    var geri = ray.querySelector('[data-vd-ray-onceki]');
    var ileri = ray.querySelector('[data-vd-ray-sonraki]');
    function adim() { var c = iz.firstElementChild; var g = c ? c.getBoundingClientRect().width : 280; var gap = parseFloat(getComputedStyle(iz).columnGap) || 16; return Math.max(g + gap, Math.floor(iz.clientWidth / (g + gap)) * (g + gap)); }
    function durum() {
      var max = iz.scrollWidth - iz.clientWidth - 2;
      if (geri) geri.disabled = iz.scrollLeft <= 2;
      if (ileri) ileri.disabled = iz.scrollLeft >= max;
    }
    var hizli = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (geri) geri.addEventListener('click', function () { iz.scrollBy({ left: -adim(), behavior: hizli }); });
    if (ileri) ileri.addEventListener('click', function () { iz.scrollBy({ left: adim(), behavior: hizli }); });
    iz.addEventListener('scroll', durum, { passive: true });
    addEventListener('resize', durum);
    durum();
    // fareyle sürükleme (dokunmatik zaten yerel kaydırır)
    var basla = null, solBas = 0, oynadi = false;
    iz.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
      if (ev.target.closest('button')) return;
      basla = ev.clientX; solBas = iz.scrollLeft; oynadi = false;
    });
    addEventListener('pointermove', function (ev) {
      if (basla === null) return;
      var d = ev.clientX - basla;
      if (!oynadi && Math.abs(d) > 6) { oynadi = true; iz.classList.add('is-surukle'); }
      if (oynadi) iz.scrollLeft = solBas - d;
    });
    addEventListener('pointerup', function () {
      if (basla === null) return;
      basla = null;
      if (oynadi) {
        // sürüklemeden sonraki tıklama bağı açmasın
        var yut = function (e) { e.preventDefault(); e.stopPropagation(); iz.removeEventListener('click', yut, true); };
        iz.addEventListener('click', yut, true);
        setTimeout(function () { iz.removeEventListener('click', yut, true); }, 0);
        setTimeout(function () { iz.classList.remove('is-surukle'); }, 0);
      }
    });
    iz.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  VD.raylariKur = function (kok) { (kok || document).querySelectorAll('[data-vd-ray]').forEach(rayKur); };

  /* ---------- Hover önizleme ---------- */
  var inceIsaret = matchMedia('(hover: hover) and (pointer: fine)');
  var azHareket = matchMedia('(prefers-reduced-motion: reduce)');
  VD.onizlemeAcik = function () { return inceIsaret.matches && !azHareket.matches; };
  var aktif = null, bekle = null, bitir = null;
  function onizlemeKapat() {
    clearTimeout(bekle); clearTimeout(bitir);
    if (aktif) aktif.classList.remove('is-onizleme', 'is-onizleme-bitti');
    aktif = null;
  }
  document.addEventListener('pointerover', function (ev) {
    if (ev.pointerType && ev.pointerType !== 'mouse') return;
    if (!VD.onizlemeAcik()) return;
    var kart = ev.target.closest && ev.target.closest('.vd-kart');
    if (kart === aktif) return;
    onizlemeKapat();
    if (!kart || !kart.querySelector('.vd-kart__kapak')) return;
    aktif = kart;
    bekle = setTimeout(function () {
      kart.classList.add('is-onizleme');
      bitir = setTimeout(function () { kart.classList.add('is-onizleme-bitti'); }, 3000);
    }, 350);
  });
  document.addEventListener('pointerout', function (ev) {
    if (!aktif) return;
    if (ev.relatedTarget && aktif.contains(ev.relatedTarget)) return;
    onizlemeKapat();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { VD.raylariKur(); });
  else VD.raylariKur();
})();
