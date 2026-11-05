/* Video Mutfağı hub (video-mutfagi.html) — hub ajanı.
   1.1 vitrin sekmeleri (ARIA tabs; gizlenen paneldeki oynatıcı durdurulur)
   1.2 süzgeç: ?konsept=<kod>&sure=<15-alti|15-30|30-ustu> → history.replaceState; açılışta adresten okunur; "Tüm videolar"
       ızgarası gerçekten süzülür, sayı ve boş durum; süzgeç açıkken keşif bölümleri çekilir (sonuç kipi)
   E.2b kaydırdıkça yükleme: ilk 12 kart statik HTML'de, kalanı <template>'ten IntersectionObserver ile 12'şer; sonda "Hepsi bu kadar"
       kutusu satırın kalanını doldurur (yarım satır yok). Depoya hiçbir şey yazılmaz. */
(function () {
  'use strict';
  var hub = document.querySelector('[data-vd-hub]');
  if (!hub) return;
  var azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ADIM = 12;

  /* ---------- 1.1 vitrin sekmeleri ---------- */
  var sekmeler = Array.prototype.slice.call(hub.querySelectorAll('[data-vd-sekme]'));
  function sekmeSec(i, odakla) {
    sekmeler.forEach(function (s, j) {
      var acik = i === j;
      s.setAttribute('aria-selected', acik ? 'true' : 'false');
      s.tabIndex = acik ? 0 : -1;
      var p = document.getElementById(s.getAttribute('aria-controls'));
      if (!p) return;
      if (!acik && !p.hidden) {
        var oyn = p.querySelector('[data-vd-oyn]');
        try { if (oyn && window.vdOynatici && window.vdOynatici.al) { var o = window.vdOynatici.al(oyn); if (o && o.duraklat) o.duraklat(); } } catch (_) {}
      }
      p.hidden = !acik;
    });
    if (odakla) sekmeler[i].focus();
  }
  sekmeler.forEach(function (s, i) {
    s.addEventListener('click', function () { sekmeSec(i, false); });
    s.addEventListener('keydown', function (e) {
      var n = sekmeler.length, h = null;
      if (e.key === 'ArrowRight') h = (i + 1) % n; else if (e.key === 'ArrowLeft') h = (i - 1 + n) % n; else if (e.key === 'Home') h = 0; else if (e.key === 'End') h = n - 1;
      if (h !== null) { e.preventDefault(); sekmeSec(h, true); }
    });
  });

  /* ---------- E.2b ızgara + kaydırdıkça yükleme ---------- */
  var izgara = hub.querySelector('[data-vd-izgara]');
  var son = hub.querySelector('[data-vd-son]');
  var tpl = hub.querySelector('template[data-vd-devam]');
  var gozcu = hub.querySelector('[data-vd-gozcu]');
  var bos = hub.querySelector('[data-vd-bos]');
  function kalan() { return tpl ? tpl.content.children.length : 0; }
  function yukle(adet) {
    if (!tpl) return 0;
    var n = 0;
    while (tpl.content.firstElementChild && (adet === Infinity || n < adet)) { var y = tpl.content.firstElementChild; bagTemizle(y); izgara.insertBefore(y, son); n++; }
    if (n && window.VD && VD.kirp) VD.kirp(izgara); // sonradan eklenen kart başlıkları da kelime sınırında kırpılır
    return n;
  }
  function kartlar() { return Array.prototype.slice.call(izgara.querySelectorAll('[data-vd-video]')); }
  function sutun() { var c = getComputedStyle(izgara).gridTemplateColumns; return c && c !== 'none' ? c.split(' ').filter(Boolean).length : 1; }
  /* REVİZE 1 madde 7 — reklam: ızgaradaki native kap (.vd-reklam--kart, display:contents) reklamlı görünümde bir HÜCRE kaplar.
     Video sayımına girmez; yarım satır hesabına girer. */
  var native = izgara.querySelector('[data-vd-reklam]');
  function reklamli() { return document.documentElement.classList.contains('vd-reklamli'); }
  function hucre() { // ızgarada gerçekten yer kaplayan hücre sayısı (son kutusu hariç)
    var n = 0;
    Array.prototype.forEach.call(izgara.children, function (c) {
      if (c === son) return;
      var d = getComputedStyle(c).display;
      if (d === 'none') return;
      if (d === 'contents') { Array.prototype.forEach.call(c.children, function (x) { if (getComputedStyle(x).display !== 'none') n++; }); return; }
      n++;
    });
    return n;
  }
  /* Yarım satır kuralı (reklamlı + süzgeçsiz, arşiv henüz tam yüklenmemişken): yüklü hücre sayısı ADIM'ın katı kalsın.
     Reklamlıda native bir hücre aldığı için son organik kart devam kuyruğunun başına geri alınır; reklam kapanınca geri gelir. */
  function dengele() {
    if (!tpl || !kalan() && !geriAlinan.length) return;
    var acikSuzgec = !!(durum.konsept || durum.sure);
    if (acikSuzgec) return;
    var hedefNative = reklamli() && native ? 1 : 0;
    var org = kartlar().length;
    if (!kalan()) return; // hepsi yüklendi: son kutusu satırı tamamlar
    while ((org + hedefNative) % ADIM !== 0 && org > 0) {
      if (hedefNative) { var k = kartlar()[org - 1]; tpl.content.insertBefore(k, tpl.content.firstChild); geriAlinan.push(k); org--; }
      else { if (!kalan()) break; var y = tpl.content.firstElementChild; bagTemizle(y); izgara.insertBefore(y, son); org++; }
    }
  }
  var geriAlinan = [];
  /* Kuyruktan ızgaraya dönen kart, kuyruktayken reklam anahtarı kapandıysa bağlarında eski ?reklam=1'i taşır
     (reklam.js belgedeki bağları temizler, <template> içini görmez) → reklamsızda dönüşte temizlenir. */
  function bagTemizle(el) {
    if (reklamli()) return;
    el.querySelectorAll('a[href*="reklam=1"]').forEach(function (a) {
      var h = a.getAttribute('href'); var i = h.indexOf('?'); if (i < 0) return;
      var yol = h.slice(0, i), kalanQ = h.slice(i + 1).split('#'), q = new URLSearchParams(kalanQ[0]); q.delete('reklam');
      a.setAttribute('href', yol + (q.toString() ? '?' + q.toString() : '') + (kalanQ[1] !== undefined ? '#' + kalanQ[1] : ''));
    });
  }
  function sonDuzen() {
    var gorunen = hucre();
    var bitti = !kalan();
    son.hidden = !(bitti && gorunen > 0);
    if (gozcu) gozcu.hidden = bitti;
    if (son.hidden) return;
    var c = sutun(), r = gorunen % c, span = r ? c - r : c;
    son.style.setProperty('--vd-son-span', String(span));
    son.setAttribute('data-span', String(span));
  }
  var gozlemci = null;
  if (gozcu && 'IntersectionObserver' in window) {
    gozlemci = new IntersectionObserver(function (g) {
      if (!g.some(function (x) { return x.isIntersecting; })) return;
      if (yukle(ADIM)) { dengele(); suz(false); }
      if (!kalan()) { gozlemci.disconnect(); }
      else { gozlemci.unobserve(gozcu); gozlemci.observe(gozcu); } // gözcü hâlâ yükleme payındaysa yeni olay gelmez → yeniden gözle (ilk bildirim anlık durumu verir)
      sonDuzen();
    }, { rootMargin: '0px 0px 480px 0px' });
    gozlemci.observe(gozcu);
  } else if (gozcu) {
    yukle(Infinity);
  }
  addEventListener('resize', sonDuzen);

  /* ---------- 1.2 süzgeç ---------- */
  var cipKonsept = Array.prototype.slice.call(hub.querySelectorAll('[data-vd-konsept]'));
  var cipSure = Array.prototype.slice.call(hub.querySelectorAll('[data-vd-sure]'));
  var cipTumu = hub.querySelector('[data-vd-tumu]');
  var sayi = hub.querySelector('[data-vd-sonuc-sayi]');
  var baslik = hub.querySelector('[data-vd-tum-baslik]');
  var alt = hub.querySelector('[data-vd-tum-alt]');
  var bolumTum = hub.querySelector('#tum-videolar');
  var bar = hub.querySelector('[data-vd-suzgec]');
  var ilkBaslik = baslik ? baslik.textContent : '';
  var ilkAlt = alt ? alt.textContent : '';
  var toplam = Number(hub.getAttribute('data-vd-toplam')) || 0;
  var KONSEPT = {}; cipKonsept.forEach(function (c) { KONSEPT[c.getAttribute('data-vd-konsept')] = c.textContent.trim(); });
  var SURE = {}; cipSure.forEach(function (c) { SURE[c.getAttribute('data-vd-sure')] = c.textContent.trim(); });
  var durum = { konsept: null, sure: null };

  function adrestenOku() {
    var q = new URLSearchParams(location.search);
    var k = q.get('konsept'), s = q.get('sure');
    durum.konsept = k && KONSEPT[k] ? k : null;
    durum.sure = s && SURE[s] ? s : null;
  }
  function adreseYaz() {
    var u = new URL(location.href);
    if (durum.konsept) u.searchParams.set('konsept', durum.konsept); else u.searchParams.delete('konsept');
    if (durum.sure) u.searchParams.set('sure', durum.sure); else u.searchParams.delete('sure');
    history.replaceState(history.state, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '') + u.hash);
  }
  function uyar(k) {
    if (durum.konsept) {
      if (durum.konsept === 'fit-tarifler') { if (k.getAttribute('data-fit') !== '1') return false; }
      else if (k.getAttribute('data-konsept') !== durum.konsept) return false;
    }
    if (durum.sure && k.getAttribute('data-sure') !== durum.sure) return false;
    return true;
  }
  function suz(kaydir) {
    var acik = !!(durum.konsept || durum.sure);
    if (acik) yukle(Infinity); // süzgeç bütün arşive bakar
    cipKonsept.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-vd-konsept') === durum.konsept ? 'true' : 'false'); });
    cipSure.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-vd-sure') === durum.sure ? 'true' : 'false'); });
    if (cipTumu) cipTumu.setAttribute('aria-pressed', acik ? 'false' : 'true');
    var n = 0;
    kartlar().forEach(function (k) { var g = !acik || uyar(k); k.hidden = !g; if (g) n++; });
    if (native) { if (acik) native.setAttribute('data-vd-suzgec-gizli', ''); else native.removeAttribute('data-vd-suzgec-gizli'); } // reklam: süzgeç sonucunda native kart yok (hidden'ı reklam.js'in)
    var gercek = acik ? n : toplam;
    if (sayi) sayi.textContent = String(gercek);
    if (acik) hub.setAttribute('data-vd-suzuluyor', ''); else hub.removeAttribute('data-vd-suzuluyor');
    var etiket = [durum.konsept && KONSEPT[durum.konsept], durum.sure && SURE[durum.sure]].filter(Boolean).join(' · ');
    if (baslik) baslik.textContent = acik ? 'Süzülen videolar' : ilkBaslik;
    if (alt) alt.textContent = acik ? (n + ' video · ' + etiket) : ilkAlt;
    if (bos) bos.hidden = !(acik && n === 0);
    var bosAlt = bos && bos.querySelector('[data-vd-bos-alt]');
    if (bosAlt && acik && n === 0) bosAlt.textContent = '“' + etiket + '” için video yok. Süreyi genişletmeyi ya da başka bir konsept seçmeyi dene.';
    hub.querySelectorAll('[data-vd-son-seri]').forEach(function (b) { b.hidden = acik; });
    hub.querySelectorAll('.vd-son [data-vd-temizle]').forEach(function (b) { b.hidden = !acik; });
    var sonAlt = son && son.querySelector('[data-vd-son-alt]');
    if (sonAlt) sonAlt.textContent = acik ? ('Bu süzgece uyan ' + n + ' videonun hepsi bu.') : 'Yeni bölümler serilerin yayın ritmine göre eklenir.';
    sonDuzen();
    if (kaydir && bolumTum) {
      var hedef = bolumTum.getBoundingClientRect().top;
      var esik = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
      if (acik ? Math.abs(hedef - esik) > 4 : hedef < esik) bolumTum.scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth', block: 'start' });
    }
  }
  function degistir(alan, deger) {
    durum[alan] = durum[alan] === deger ? null : deger;
    adreseYaz(); suz(true);
  }
  cipKonsept.forEach(function (c) { c.addEventListener('click', function () { degistir('konsept', c.getAttribute('data-vd-konsept')); }); });
  cipSure.forEach(function (c) { c.addEventListener('click', function () { degistir('sure', c.getAttribute('data-vd-sure')); }); });
  function temizle() { durum.konsept = null; durum.sure = null; adreseYaz(); suz(true); }
  if (cipTumu) cipTumu.addEventListener('click', temizle);
  hub.querySelectorAll('[data-vd-temizle]').forEach(function (b) { b.addEventListener('click', temizle); });

  /* yapışkanlık göstergesi (gölge) */
  if (bar) {
    var golge = function () {
      var ust = parseFloat(getComputedStyle(bar).top) || 0;
      bar.classList.toggle('is-yapisik', bar.getBoundingClientRect().top <= ust + 0.5 && scrollY > 0);
    };
    addEventListener('scroll', golge, { passive: true });
    golge();
  }

  addEventListener('vd:reklam', function () { dengele(); sonDuzen(); });
  adrestenOku();
  dengele();
  suz(false);
  // adresten süzgeçle açıldıysa sonuçlar ekranın üstüne gelsin
  if ((durum.konsept || durum.sure) && bolumTum) {
    requestAnimationFrame(function () { bolumTum.scrollIntoView({ behavior: 'auto', block: 'start' }); });
  }
})();
