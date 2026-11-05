/* V2 · Ortak liste süzgeci davranışı (hub ajanı) — işaretleme src/v2/suzgec.mjs (donör 8960 /tarifler).
   İstemci tarafı: seçim adres sorgusuna yazılır (history.replaceState; ?<grup>=a,b&sirala=<kod>), sayfa açılışında adresten okunur.
   Tarayıcıya (localStorage/sessionStorage) hiçbir şey yazılmaz.
   - Süzme: gruplar arası VE, grup içi VEYA. Öğe: [data-sz-oge] + data-sz-<grup>="d1 d2". Gizlenen öğe `hidden`.
   - Sayılar (DOM + <template data-sz-havuz> içindeki öğeler): her seçeneğin .fcnt'i "öteki grupların seçimi + bu seçenek" ile eşleşen öğe sayısı; .fct-dot/.has-active; .fb-count.
   - Sonuç satırı "<b>N birim</b> bulundu"; 0 ise .bos-durum görünür.
   - Sıralama: .sort-dd menüsü; öğeler data-sz-sira-<alan>'a göre (sayı/metin, artan/azalan) aynı kapta yeniden dizilir;
     varsayılan = doğal sıra (data-sz-dizin). Kabın [data-sz-son] öğesi (ör. "Hepsi bu kadar") hep sonda kalır.
   - 390 çekmece: .btn-filter → .lst-side.open + .sheet-overlay.open + body.bn-lock (donörün sınıfları); kapat: × · örtü · Esc.
   - Akordeon (.fct.open) ve "N seçenek daha" (.fct.more-open) donör sınıflarıyla.
   API: window.vdSuzgec.al(kök|seçici) → { durum(), degistir(grup, deger, {tek}), ayarla(grup, [d…]), temizle(), uygula(), sirala(kod),
        ac(), kapat(), aktifMi() } · olay: kökte 'vd:suzgec' { gorunen, toplam, secim, sira, aktif } (kabarcıklı). */
(function () {
  'use strict';
  var KOKLER = [];
  function Suzgec(kok) {
    var birim = kok.getAttribute('data-birim') || '';
    var varsayilanSira = kok.getAttribute('data-varsayilan-sira') || '';
    var side = kok.querySelector('.lst-side');
    var ortu = kok.querySelector('[data-sz-ortu]');
    var sayiEl = kok.querySelector('[data-sz-sayi]');
    var secimEl = kok.querySelector('[data-sz-secim]');
    var bos = kok.querySelector('[data-sz-bos]');
    var siraKok = kok.querySelector('[data-sz-sira-kok]');
    var siraAd = kok.querySelector('[data-sz-sira-ad]');
    var acDugme = kok.querySelector('[data-sz-ac]');
    var gruplar = Array.prototype.slice.call(kok.querySelectorAll('[data-sz-grup]')).map(function (g) { return g.getAttribute('data-sz-grup'); });
    var secim = {}; gruplar.forEach(function (g) { secim[g] = []; });
    var sira = varsayilanSira;

    function ogeler() { return Array.prototype.slice.call(kok.querySelectorAll('[data-sz-oge]')); }
    // Sayım bütün listeye bakar: henüz DOM'a girmemiş öğeler (kaydırdıkça yüklenen arşiv) <template data-sz-havuz> içinde
    function tumOgeler() {
      var a = ogeler();
      kok.querySelectorAll('template[data-sz-havuz]').forEach(function (t) { a = a.concat(Array.prototype.slice.call(t.content.querySelectorAll('[data-sz-oge]'))); });
      return a;
    }
    function degerler(el, g) { var v = el.getAttribute('data-sz-' + g); return v ? v.split(' ') : []; }
    function uyar(el, haric) {
      for (var i = 0; i < gruplar.length; i++) {
        var g = gruplar[i]; if (g === haric) continue;
        var s = secim[g]; if (!s.length) continue;
        var d = degerler(el, g); var ok = false;
        for (var j = 0; j < s.length; j++) if (d.indexOf(s[j]) >= 0) { ok = true; break; }
        if (!ok) return false;
      }
      return true;
    }
    function aktifMi() { return gruplar.some(function (g) { return secim[g].length > 0; }); }

    /* adres */
    function adrestenOku() {
      var q = new URLSearchParams(location.search);
      gruplar.forEach(function (g) {
        var v = q.get(g); var gecerli = [];
        if (v) v.split(',').forEach(function (d) { if (kok.querySelector('[data-sz-grup="' + g + '"] input[value="' + cssEsc(d) + '"]')) gecerli.push(d); });
        secim[g] = gecerli;
      });
      var s = q.get('sirala');
      sira = s && kok.querySelector('[data-sz-sira="' + cssEsc(s) + '"]') ? s : varsayilanSira;
    }
    function adreseYaz() {
      var u = new URL(location.href);
      gruplar.forEach(function (g) { if (secim[g].length) u.searchParams.set(g, secim[g].join(',')); else u.searchParams.delete(g); });
      if (sira && sira !== varsayilanSira) u.searchParams.set('sirala', sira); else u.searchParams.delete('sirala');
      var q = u.searchParams.toString().replace(/%2C/g, ',');
      history.replaceState(history.state, '', u.pathname + (q ? '?' + q : '') + u.hash);
    }
    function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }

    /* çizim */
    function ciz() {
      var liste = tumOgeler();
      var n = 0;
      liste.forEach(function (el) { var g = uyar(el, null); el.hidden = !g; if (g) n++; });
      // seçenek sayıları + işaretler
      gruplar.forEach(function (g) {
        var grupEl = kok.querySelector('[data-sz-grup="' + g + '"]');
        grupEl.querySelectorAll('input[data-sz-secenek]').forEach(function (inp) {
          var d = inp.value; inp.checked = secim[g].indexOf(d) >= 0;
          var c = 0; liste.forEach(function (el) { if (uyar(el, g) && degerler(el, g).indexOf(d) >= 0) c++; });
          var f = inp.parentNode.querySelector('.fcnt'); if (f) f.textContent = c.toLocaleString('tr-TR');
        });
        var nokta = grupEl.querySelector('[data-sz-nokta]'); if (nokta) nokta.textContent = String(secim[g].length);
        grupEl.classList.toggle('has-active', secim[g].length > 0);
      });
      var toplamSecim = gruplar.reduce(function (t, g) { return t + secim[g].length; }, 0);
      if (secimEl) { secimEl.textContent = String(toplamSecim); secimEl.hidden = toplamSecim === 0; }
      if (sayiEl) sayiEl.textContent = n.toLocaleString('tr-TR') + ' ' + birim;
      if (bos) bos.hidden = n !== 0;
      siralaUygula();
      kok.dispatchEvent(new CustomEvent('vd:suzgec', { bubbles: true, detail: { gorunen: n, toplam: liste.length, secim: JSON.parse(JSON.stringify(secim)), sira: sira, aktif: aktifMi() } }));
    }
    function siralaUygula() {
      var b = siraKok && siraKok.querySelector('[data-sz-sira="' + cssEsc(sira) + '"]');
      if (siraKok) siraKok.querySelectorAll('[data-sz-sira]').forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
      if (b && siraAd) siraAd.textContent = b.textContent.trim();
      var alan = b && b.getAttribute('data-alan');
      var yon = b && b.getAttribute('data-yon') === 'azalan' ? -1 : 1;
      var metin = b && b.getAttribute('data-tur') === 'metin';
      var kaplar = new Map();
      ogeler().forEach(function (el) { var p = el.parentNode; if (!kaplar.has(p)) kaplar.set(p, []); kaplar.get(p).push(el); });
      kaplar.forEach(function (liste, kap) {
        var dizin = function (el) { return Number(el.getAttribute('data-sz-dizin')) || 0; };
        liste.sort(function (a, c) {
          if (!alan) return dizin(a) - dizin(c);
          var x = a.getAttribute('data-sz-sira-' + alan) || '', y = c.getAttribute('data-sz-sira-' + alan) || '';
          var r = metin ? x.localeCompare(y, 'tr') : (Number(x) - Number(y));
          return r * yon || dizin(a) - dizin(c);
        });
        var son = kap.querySelector(':scope > [data-sz-son]');
        liste.forEach(function (el) { kap.insertBefore(el, son); });
      });
    }

    /* olaylar */
    kok.addEventListener('change', function (e) {
      var inp = e.target.closest && e.target.closest('input[data-sz-secenek]'); if (!inp) return;
      var g = inp.name, d = inp.value, s = secim[g]; if (!s) return;
      var i = s.indexOf(d); if (inp.checked && i < 0) s.push(d); if (!inp.checked && i >= 0) s.splice(i, 1);
      adreseYaz(); ciz();
    });
    kok.addEventListener('submit', function (e) { if (e.target.closest('[data-sz-form]')) e.preventDefault(); });
    kok.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : e.target.parentNode;
      var temiz = t.closest('[data-sz-temizle]'); if (temiz) { e.preventDefault(); api.temizle(); return; }
      var ak = t.closest('[data-sz-akordeon]');
      if (ak) { var f = ak.closest('.fct'); var acik = !f.classList.contains('open'); f.classList.toggle('open', acik); ak.setAttribute('aria-expanded', acik ? 'true' : 'false'); return; }
      var daha = t.closest('[data-sz-daha]');
      if (daha) { var fg = daha.closest('.fct'); var m = !fg.classList.contains('more-open'); fg.classList.toggle('more-open', m); daha.setAttribute('aria-expanded', m ? 'true' : 'false'); daha.firstChild.textContent = ' ' + daha.getAttribute(m ? 'data-less' : 'data-more') + ' '; return; }
      if (t.closest('[data-sz-ac]')) { api.ac(); return; }
      if (t.closest('[data-sz-kapat]') || t.closest('[data-sz-ortu]')) { api.kapat(); return; }
      if (siraKok && t.closest('.sort-btn')) { var o = !siraKok.classList.contains('open'); siraKok.classList.toggle('open', o); siraKok.querySelector('.sort-btn').setAttribute('aria-expanded', o ? 'true' : 'false'); return; }
      var sb = t.closest('[data-sz-sira]');
      if (sb) { sira = sb.getAttribute('data-sz-sira'); siraKapat(); adreseYaz(); ciz(); }
    });
    function siraKapat() { if (!siraKok) return; siraKok.classList.remove('open'); siraKok.querySelector('.sort-btn').setAttribute('aria-expanded', 'false'); }
    document.addEventListener('click', function (e) { if (siraKok && siraKok.classList.contains('open') && !siraKok.contains(e.target)) siraKapat(); });
    document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; siraKapat(); if (side && side.classList.contains('open')) api.kapat(); });

    var api = {
      kok: kok,
      durum: function () { return { secim: JSON.parse(JSON.stringify(secim)), sira: sira, aktif: aktifMi() }; },
      aktifMi: aktifMi,
      degistir: function (g, d, ayar) {
        if (!secim[g]) return;
        var i = secim[g].indexOf(d);
        if (ayar && ayar.tek) secim[g] = i >= 0 && secim[g].length === 1 ? [] : [d];
        else if (i >= 0) secim[g].splice(i, 1); else secim[g].push(d);
        adreseYaz(); ciz();
      },
      ayarla: function (g, liste) { if (!secim[g]) return; secim[g] = (liste || []).slice(); adreseYaz(); ciz(); },
      temizle: function () { gruplar.forEach(function (g) { secim[g] = []; }); sira = varsayilanSira; adreseYaz(); ciz(); },
      uygula: function () { ciz(); },
      sirala: function (kod) { sira = kod; adreseYaz(); ciz(); },
      ac: function () {
        if (!side) return;
        side.classList.add('open'); if (ortu) ortu.classList.add('open'); document.body.classList.add('bn-lock');
        if (acDugme) acDugme.setAttribute('aria-expanded', 'true');
        var k = side.querySelector('[data-sz-kapat]'); if (k && k.offsetParent !== null) k.focus({ preventScroll: true });
      },
      kapat: function () {
        if (!side) return;
        side.classList.remove('open'); if (ortu) ortu.classList.remove('open'); document.body.classList.remove('bn-lock');
        if (acDugme) { acDugme.setAttribute('aria-expanded', 'false'); if (acDugme.offsetParent !== null) acDugme.focus({ preventScroll: true }); }
      },
    };
    kok.__vdSuzgec = api;
    adrestenOku();
    return api;
  }

  window.vdSuzgec = {
    al: function (x) { var k = typeof x === 'string' ? document.querySelector(x) : x; return k && k.__vdSuzgec; },
    hepsi: function () { return KOKLER.slice(); },
  };
  function baslat() {
    document.querySelectorAll('[data-vd-suzgec]').forEach(function (kok) { if (!kok.__vdSuzgec) KOKLER.push(Suzgec(kok)); });
    KOKLER.forEach(function (a) { a.uygula(); });
  }
  // DOMContentLoaded'da: sonra yüklenen sayfa betikleri (hub.js …) 'vd:suzgec' dinleyicisini kurmuş olur
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat); else setTimeout(baslat, 0);
})();
