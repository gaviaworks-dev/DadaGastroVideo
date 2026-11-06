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
  var sekmeler = Array.prototype.slice.call(document.querySelectorAll('[data-vd-sekme]')); // vitrin panelin üstünde, hub kabının dışında
  var zeminler = Array.prototype.slice.call(document.querySelectorAll('[data-vd-zemin]'));
  function sekmeSec(i, odakla) {
    zeminler.forEach(function (z) { z.classList.toggle('is-acik', z.getAttribute('data-vd-zemin') === String(i)); });
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
    if (durum.aktif || (durum.sira && durum.sira !== (szKok && szKok.getAttribute('data-varsayilan-sira')))) return;
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
      if (yukle(ADIM)) { dengele(); var a = api(); if (a) a.uygula(); }
      if (!kalan()) { gozlemci.disconnect(); }
      else { gozlemci.unobserve(gozcu); gozlemci.observe(gozcu); } // gözcü hâlâ yükleme payındaysa yeni olay gelmez → yeniden gözle (ilk bildirim anlık durumu verir)
      sonDuzen();
    }, { rootMargin: '0px 0px 480px 0px' });
    gozlemci.observe(gozcu);
  } else if (gozcu) {
    yukle(Infinity);
  }
  addEventListener('resize', sonDuzen);

  /* ---------- 1.2 çip barı + "Tüm videolar" süzgeci (V2 · Patron revizesi K1–K3) ----------
     Süzme, sayım, adres, boş durum ve sıralama ortak süzgeçte (suzgec.js, window.vdSuzgec). Çip barı AYNI durumu sürer:
     konsept çipi = süzgeçte "konsept" grubunun o tek seçeneği, süre çipi = "sure" grubunun; "Tümü" = süzgeci temizle.
     Burada yalnız: (a) süzgeç ya da sıralama açılınca arşivin tamamı yüklenir, (b) sonuç kipi (keşif bölümleri çekilir),
     (c) VD-N1 (K6): süzülmüş ızgarada 3. görünür karttan sonra, sonuç < 3 ise sonda, 0 ise gizli, (d) son kutusu satırı tamamlar. */
  var cipKonsept = Array.prototype.slice.call(hub.querySelectorAll('[data-vd-konsept]'));
  var cipSure = Array.prototype.slice.call(hub.querySelectorAll('[data-vd-sure]'));
  var cipTumu = hub.querySelector('[data-vd-tumu]');
  var sayi = hub.querySelector('[data-vd-sonuc-sayi]');
  var baslik = hub.querySelector('[data-vd-tum-baslik]');
  var alt = hub.querySelector('[data-vd-tum-alt]');
  var bolumTum = hub.querySelector('#tum-videolar');
  var bar = hub.querySelector('[data-vd-cipbar]');
  var szKok = hub.querySelector('[data-vd-suzgec]');
  var ilkBaslik = baslik ? baslik.textContent : '';
  var ilkAlt = alt ? alt.textContent : '';
  var toplam = Number(hub.getAttribute('data-vd-toplam')) || 0;
  var durum = { konsept: null, sure: null, aktif: false, sira: '' };
  var api = function () { return window.vdSuzgec && szKok ? window.vdSuzgec.al(szKok) : null; };
  var ilkOlay = true;

  /* VD-N1 yuvası (K6): süzülmüş ızgaradaki yerleştirmesi ve 0 sonuçta gizlenmesi reklam.js'te (reklam ajanı). Burada yalnız
     süzgeçsiz + varsayılan sırada, sıralamanın kartları kabın sonuna dizmesinden sonra yuvayı 3. kartın ardına geri koyuyoruz;
     kabın `hidden`ına ve data-vd-suzgec-gizli'ye DOKUNULMAZ. */
  function nativeYerlestir() {
    if (!native) return;
    var capa = kartlar()[2];
    if (capa && native.previousElementSibling !== capa) izgara.insertBefore(native, capa.nextSibling);
  }
  hub.addEventListener('vd:suzgec', function (e) {
    var d = e.detail;
    var varsayilan = szKok.getAttribute('data-varsayilan-sira');
    var siraliMi = d.sira && d.sira !== varsayilan;
    // (a) süzgeç/sıralama arşivin tamamına bakar
    if ((d.aktif || siraliMi) && kalan()) { yukle(Infinity); var a = api(); if (a) { a.uygula(); return; } }
    var k = d.secim.konsept || [], s = d.secim.sure || [];
    durum.konsept = k.length === 1 ? k[0] : null; durum.sure = s.length === 1 ? s[0] : null; durum.aktif = d.aktif; durum.sira = d.sira;
    cipKonsept.forEach(function (c) { c.setAttribute('aria-pressed', k.indexOf(c.getAttribute('data-vd-konsept')) >= 0 ? 'true' : 'false'); });
    cipSure.forEach(function (c) { c.setAttribute('aria-pressed', s.indexOf(c.getAttribute('data-vd-sure')) >= 0 ? 'true' : 'false'); });
    if (cipTumu) cipTumu.setAttribute('aria-pressed', d.aktif ? 'false' : 'true');
    if (sayi) sayi.textContent = String(d.aktif ? d.gorunen : toplam);
    // (b) sonuç kipi
    if (d.aktif) hub.setAttribute('data-vd-suzuluyor', ''); else hub.removeAttribute('data-vd-suzuluyor');
    var etiket = Array.prototype.slice.call(szKok.querySelectorAll('input[data-sz-secenek]:checked')).map(function (i) { return i.parentNode.querySelector('.ft').textContent.trim(); }).join(' · ');
    if (baslik) baslik.textContent = d.aktif ? 'Süzülen videolar' : ilkBaslik;
    if (alt) alt.textContent = d.aktif ? (d.gorunen + ' video · ' + etiket) : ilkAlt;
    var bosAlt = szKok.querySelector('[data-vd-bos-alt]');
    if (bosAlt && d.aktif && d.gorunen === 0) bosAlt.textContent = '“' + etiket + '” için video yok. Süreyi genişletmeyi ya da başka bir konsept seçmeyi dene.';
    hub.querySelectorAll('[data-vd-son-seri]').forEach(function (b) { b.hidden = d.aktif; });
    hub.querySelectorAll('.vd-son [data-vd-temizle]').forEach(function (b) { b.hidden = !d.aktif; });
    var sonAlt = son && son.querySelector('[data-vd-son-alt]');
    if (sonAlt) sonAlt.textContent = d.aktif ? ('Bu süzgece uyan ' + d.gorunen + ' videonun hepsi bu.') : 'Yeni bölümler serilerin yayın ritmine göre eklenir.';
    // (c) VD-N1 yeri · (d) son kutusu
    if (!d.aktif && !siraliMi) nativeYerlestir();
    if (!d.aktif && !siraliMi) dengele();
    sonDuzen();
    // kullanıcı çip/süzgeç değiştirdiyse sonuçlar barın altına gelsin (açılıştaki ilk olayda adresten geldiyse de)
    if (bolumTum && (d.aktif || !ilkOlay)) {
      var hedef = bolumTum.getBoundingClientRect().top;
      var esik = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
      if (d.aktif ? Math.abs(hedef - esik) > 4 && !(szKok.querySelector('.lst-side.open')) : hedef < esik) bolumTum.scrollIntoView({ behavior: ilkOlay || azHareket ? 'auto' : 'smooth', block: 'start' });
    }
    ilkOlay = false;
  });
  cipKonsept.forEach(function (c) { c.addEventListener('click', function () { var a = api(); if (a) a.degistir('konsept', c.getAttribute('data-vd-konsept'), { tek: true }); }); });
  cipSure.forEach(function (c) { c.addEventListener('click', function () { var a = api(); if (a) a.degistir('sure', c.getAttribute('data-vd-sure'), { tek: true }); }); });
  if (cipTumu) cipTumu.addEventListener('click', function () { var a = api(); if (a) a.temizle(); });
  hub.querySelectorAll('.vd-son [data-vd-temizle]').forEach(function (b) { b.addEventListener('click', function () { var a = api(); if (a) a.temizle(); }); });

  /* yapışkanlık göstergesi (gölge) */
  if (bar) {
    var golge = function () {
      var ust = parseFloat(getComputedStyle(bar).top) || 0;
      bar.classList.toggle('is-yapisik', bar.getBoundingClientRect().top <= ust + 0.5 && scrollY > 0);
    };
    addEventListener('scroll', golge, { passive: true });
    golge();
  }

  addEventListener('vd:reklam', function () { if (!durum.aktif) dengele(); sonDuzen(); });
  dengele();
})();
