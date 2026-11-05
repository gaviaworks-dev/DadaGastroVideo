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

  /* ---------- Şef takibi (V2 · Gastro şef kartı .chef-follow / .sef-follow · [data-vd-takip]) ----------
     Yalnız bellek (sayfa açıkken); tarayıcı deposuna yazılmaz. Aynı şefin bütün düğmeleri birlikte çevrilir.
     Durum: aria-pressed + Gastro'nun "açık" sınıfı .on (sefler.css .sef-follow.on) + .takipte; metin data-etiket-acik/kapali.
     Yakalama evresi: şef kartının formu (onclick stopPropagation) ve kartın kendi onclick yönlendirmesi tıklamayı yutmasın.
     izle.js/sef.js `window.VD.takip` varsa kendi dinleyicisini KURMAZ. */
  var takipte = Object.create(null);
  function takipCiz(k) {
    var acik = !!takipte[k];
    document.querySelectorAll('[data-vd-takip]').forEach(function (b) {
      if (b.getAttribute('data-vd-takip') !== k) return;
      b.setAttribute('aria-pressed', acik ? 'true' : 'false');
      b.classList.toggle('on', acik); b.classList.toggle('takipte', acik);
      var m = b.getAttribute(acik ? 'data-etiket-acik' : 'data-etiket-kapali');
      if (m) b.textContent = m;
    });
  }
  VD.takip = function (k, ad) {
    takipte[k] = !takipte[k];
    takipCiz(k);
    VD.bildirim((ad || 'Şef') + (takipte[k] ? ' takip ediliyor · prototip örneği' : ' takipten çıkarıldı · prototip örneği'), { ikon: takipte[k] ? 'fa-user-check' : 'fa-circle-minus' });
    return takipte[k];
  };
  VD.takipteMi = function (k) { return !!takipte[k]; };
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-vd-takip]');
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    VD.takip(b.getAttribute('data-vd-takip'), b.getAttribute('data-ad'));
  }, true);

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

  /* ---------- Metin kırpıcı (Revize 1, 5 Kas): [data-vd-kirp="N"] ----------
     Öğe en fazla N satır. Taşarsa sondan BÜTÜN KELİME atılır ve "…" eklenir (kelime ortasından kesme yok); sondaki yalnız
     noktalama parçası ("·", ":", "—") da atılır. Tam metin `title` + erişilebilir ad olarak korunur:
       - metni taşıyan öğe bağ/düğmeyse aria-label = tam metin;
       - değilse görünen kısa metin aria-hidden, tam metin .vd-gizli span'da.
     Metni taşıyan öğe: [data-vd-kirp] içindeki ilk a/button, yoksa öğenin kendisi.
     N=1: genişlik ölçülür (scrollWidth ≤ clientWidth; öğe nowrap + overflow:hidden olmalı).
     N≥2: satır sayısı ölçülür (CSS yedeği line-clamp ölçüm sırasında .vd-kirp-olc ile kaldırılır).
     Yeniden hesap: genişlik değişince (ResizeObserver), font yüklenince, VD.kirp(kok) çağrılınca (sonradan eklenen içerik). */
  var KIRP_SON = /[\s·:;,.\-–—|/]+$/;
  function kirpKaynak(el) { return el.querySelector('a, button') || el; }
  function kirpTam(el) {
    if (el.__vdTam === undefined) {
      var k = kirpKaynak(el);
      el.__vdTam = (k.textContent || '').replace(/\s+/g, ' ').trim();
    }
    return el.__vdTam;
  }
  function satirSay(el) {
    var cs = getComputedStyle(el);
    var lh = parseFloat(cs.lineHeight);
    if (!lh) lh = parseFloat(cs.fontSize) * 1.2;
    // ölçüm sırasında CSS yedeğini (line-clamp/max-height) kaldır — sınıfa değil öğenin kendi stiline yazılır ki
    // video.css'i yüklemeyen sayfada (tarif sayfaları) da doğru ölçülsün; ölçümden sonra eski hâline döner
    var eski = el.getAttribute('style');
    ['display:block', '-webkit-line-clamp:none', 'max-height:none', 'min-height:0', 'overflow:visible'].forEach(function (d) { var i = d.indexOf(':'); el.style.setProperty(d.slice(0, i), d.slice(i + 1), 'important'); });
    var h = el.getBoundingClientRect().height - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    if (eski === null) el.removeAttribute('style'); else el.setAttribute('style', eski);
    return Math.round(h / lh);
  }
  function sigar(el, n) {
    if (n <= 1) return el.scrollWidth <= el.clientWidth + 1;
    return satirSay(el) <= n;
  }
  function yaz(el, metin, kisaldi) {
    var k = kirpKaynak(el), tam = kirpTam(el);
    if (k.tagName === 'A' || k.tagName === 'BUTTON') {
      k.textContent = metin;
      if (kisaldi) k.setAttribute('aria-label', tam); else k.removeAttribute('aria-label');
    } else if (kisaldi) {
      k.innerHTML = '';
      var g = document.createElement('span'); g.setAttribute('aria-hidden', 'true'); g.textContent = metin;
      var t = document.createElement('span'); t.className = 'vd-gizli'; t.textContent = tam;
      k.appendChild(g); k.appendChild(t);
    } else {
      k.textContent = metin;
    }
    if (kisaldi) el.setAttribute('title', tam); else el.removeAttribute('title');
    el.setAttribute('data-vd-kirpildi', kisaldi ? '1' : '0');
  }
  function kirpEl(el) {
    if (!el.getClientRects().length) return; // görünmüyor: görünür olunca ResizeObserver yeniden çağırır
    var n = parseInt(el.getAttribute('data-vd-kirp'), 10) || 1;
    var tam = kirpTam(el);
    el.__vdGen = el.clientWidth;
    yaz(el, tam, false);
    if (sigar(el, n)) return;
    var kel = tam.split(' ');
    var alt = 1, ust = kel.length - 1, en = 1;
    var aday = function (i) { return kel.slice(0, i).join(' ').replace(KIRP_SON, '') + '…'; };
    while (alt <= ust) {
      var orta = (alt + ust) >> 1;
      yaz(el, aday(orta), true);
      if (sigar(el, n)) { en = orta; alt = orta + 1; } else ust = orta - 1;
    }
    yaz(el, aday(en), true);
  }
  var kirpGozcu = 'ResizeObserver' in window ? new ResizeObserver(function (girdi) {
    girdi.forEach(function (g) { var el = g.target; if (el.clientWidth !== el.__vdGen) kirpEl(el); });
  }) : null;
  VD.kirp = function (kok) {
    var liste = (kok || document).querySelectorAll('[data-vd-kirp]');
    for (var i = 0; i < liste.length; i++) {
      var el = liste[i];
      if (!el.__vdGoz && kirpGozcu) { kirpGozcu.observe(el); el.__vdGoz = 1; }
      kirpEl(el);
    }
  };
  var kirpZaman = 0;
  addEventListener('resize', function () { cancelAnimationFrame(kirpZaman); kirpZaman = requestAnimationFrame(function () { document.querySelectorAll('[data-vd-kirp]').forEach(kirpEl); }); });
  function kirpBaslat() {
    VD.kirp();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { document.querySelectorAll('[data-vd-kirp]').forEach(kirpEl); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { VD.raylariKur(); kirpBaslat(); });
  else { VD.raylariKur(); kirpBaslat(); }
})();
