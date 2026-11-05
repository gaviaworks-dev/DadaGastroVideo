/* Video Mutfağı · oynatıcı + senkron malzeme paneli (izle ajanı)
   D1: gerçek video yok — simüle zaman çizgisi gerçek saniyeyle ilerler (requestAnimationFrame, performance.now).
   Sayfada birden çok örnek çalışır; biri oynarken öbürleri durur.
   Durum yalnız bellekte (kaydet, dolap işaretleri, liste): localStorage/sessionStorage YOK.
   API: window.vdOynatici.al(el|seçici) → { oynat, duraklat, git(sn, {oynat}), sn(), bolum(), sure, kok }
        window.vdOynatici.kur(kok?) — dinamik eklenen örnekler için · window.vdOynatici.hepsiniDurdur()
        window.vdBildir(baslik, alt?, tur?) — Gastro'nun kanonik toast'ı (.dm-toast, dm-p4.css) — sayfada başka tanım yoksa.
   Olaylar (oynatıcı kökünde, kabarcıklı): vd:zaman {sn, bolum} · vd:bolum {bolum} · vd:durum {oynuyor} · vd:bitti */
(function () {
  'use strict';
  if (window.vdOynatici) return;

  var iki = function (n) { return (n < 10 ? '0' : '') + n; };
  function sureMetni(sn) {
    sn = Math.max(0, Math.floor(sn));
    var s = Math.floor(sn / 3600), d = Math.floor((sn % 3600) / 60), k = sn % 60;
    return s ? s + ':' + iki(d) + ':' + iki(k) : iki(d) + ':' + iki(k);
  }
  var azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Bildirim (Gastro .dm-toast anatomisi) ---------- */
  if (!window.vdBildir) {
    window.vdBildir = function (baslik, alt, tur) {
      if (window.VD && typeof window.VD.bildirim === 'function') return window.VD.bildirim(alt ? baslik + ' · ' + alt : baslik, { ikon: tur === 'hata' ? 'fa-circle-info' : 'fa-circle-check' });
      var kap = document.querySelector('.dm-toast-kap[data-vd-bildirim]');
      if (!kap) {
        kap = document.createElement('div');
        kap.className = 'dm-toast-kap';
        kap.setAttribute('data-vd-bildirim', '');
        kap.setAttribute('aria-live', 'polite');
        document.body.appendChild(kap);
      }
      var t = document.createElement('div');
      t.className = 'dm-toast ' + (tur === 'hata' ? 'hata' : 'basarili');
      t.setAttribute('role', 'status');
      var i = document.createElement('i');
      i.className = 'fa-solid ' + (tur === 'hata' ? 'fa-circle-info' : 'fa-circle-check');
      i.setAttribute('aria-hidden', 'true');
      var g = document.createElement('div');
      g.className = 'dm-toast-govde';
      var b = document.createElement('b'); b.textContent = baslik; g.appendChild(b);
      if (alt) { var s = document.createElement('span'); s.textContent = alt; g.appendChild(s); }
      t.appendChild(i); t.appendChild(g);
      kap.appendChild(t);
      while (kap.children.length > 3) kap.removeChild(kap.firstChild);
      setTimeout(function () { t.classList.add('cikis'); setTimeout(function () { t.remove(); }, 200); }, 3200);
      return t;
    };
  }

  /* Kaydet (Mutfak Defteri, E.1b): `[data-vd-kaydet="<slug>"]` tıklamasını hub'ın ortak video.js'i yönetir (aria-pressed + bildirim);
     oynatıcıdaki düğmenin yazısı/simgesi CSS ile aria-pressed'e bağlı (oynatici.css). Burada ikinci bir dinleyici YOK (çift çevirme olur). */

  /* ---------- Oynatıcı ---------- */
  var ornekler = [];
  function Oynatici(kok) {
    var sure = Number(kok.getAttribute('data-sure')) || 0;
    var bolumler = [];
    try { bolumler = JSON.parse(kok.getAttribute('data-bolumler') || '[]'); } catch (_) { bolumler = []; }
    var blok = kok.closest('[data-vd-blok]') || kok.parentNode;
    var kilitli = kok.classList.contains('vd-oyn--kilitli');
    var sahne = kok.querySelector('[data-vd-sahne]');
    var iz = kok.querySelector('[data-vd-iz]');
    var parcalar = Array.prototype.slice.call(kok.querySelectorAll('[data-vd-parca]'));
    var simdiEl = kok.querySelector('[data-vd-simdi]');
    var bolumAd = kok.querySelector('[data-vd-bolum-ad]');
    var onizle = kok.querySelector('[data-vd-onizle]');
    var oynatDugmeleri = kok.querySelectorAll('[data-vd-oynat]');
    var sn = 0, oynuyor = false, son = 0, raf = 0, etkinBolum = -1, sakinZaman = 0;

    function bolumAt(t) {
      var b = 0;
      for (var i = 0; i < bolumler.length; i++) if (t >= bolumler[i].sn) b = i;
      return b;
    }
    function yay(ad, detay) { kok.dispatchEvent(new CustomEvent(ad, { bubbles: true, detail: detay })); }

    function ciz() {
      var o = sure ? sn / sure : 0;
      parcalar.forEach(function (p, i) {
        var b = bolumler[i]; if (!b) return;
        var f = b.son > b.sn ? (sn - b.sn) / (b.son - b.sn) : 0;
        p.style.setProperty('--o', Math.max(0, Math.min(1, f)).toFixed(4));
      });
      if (iz) {
        iz.style.setProperty('--x', (o * 100).toFixed(3) + '%');
        iz.setAttribute('aria-valuenow', String(Math.floor(sn)));
        var bb = bolumler[bolumAt(sn)];
        iz.setAttribute('aria-valuetext', sureMetni(sn) + ' / ' + sureMetni(sure) + (bb ? ' · ' + bb.baslik : ''));
      }
      if (simdiEl) simdiEl.textContent = sureMetni(sn);
      var yeni = bolumAt(sn);
      if (yeni !== etkinBolum) {
        etkinBolum = yeni;
        if (bolumAd && bolumler[yeni]) bolumAd.textContent = bolumler[yeni].baslik;
        panelBoya(true);
        yay('vd:bolum', { bolum: yeni, sn: sn });
      }
      yay('vd:zaman', { sn: sn, bolum: etkinBolum });
    }

    function dugmeBoya() {
      kok.classList.toggle('vd-oyn--oynuyor', oynuyor);
      kok.classList.toggle('vd-oyn--basladi', sn > 0 || oynuyor);
      kok.classList.toggle('vd-oyn--bitti', !oynuyor && sure > 0 && sn >= sure);
      oynatDugmeleri.forEach(function (d) {
        var i = d.querySelector('i');
        var bitti = !oynuyor && sure > 0 && sn >= sure;
        if (i) i.className = 'fa-solid ' + (oynuyor ? 'fa-pause' : (bitti ? 'fa-rotate-right' : 'fa-play'));
        d.setAttribute('aria-label', oynuyor ? 'Duraklat' : (bitti ? 'Baştan oynat' : 'Oynat'));
      });
    }

    function adim(simdi) {
      if (!oynuyor) return;
      sn = Math.min(sure, sn + (simdi - son) / 1000);
      son = simdi;
      if (sakinZaman && simdi - sakinZaman > 2600) kok.classList.add('vd-oyn--sakin');
      ciz();
      if (sn >= sure) { oynuyor = false; dugmeBoya(); yay('vd:durum', { oynuyor: false }); yay('vd:bitti', {}); return; }
      raf = requestAnimationFrame(adim);
    }

    var api = {
      kok: kok, sure: sure, bolumler: bolumler,
      sn: function () { return sn; },
      bolum: function () { return etkinBolum; },
      oynuyor: function () { return oynuyor; },
      oynat: function () {
        if (kilitli || oynuyor) return;
        if (sn >= sure) sn = 0;
        ornekler.forEach(function (o) { if (o !== api) o.duraklat(); });
        oynuyor = true; son = performance.now(); sakinZaman = son;
        kok.classList.remove('vd-oyn--sakin');
        dugmeBoya(); yay('vd:durum', { oynuyor: true });
        raf = requestAnimationFrame(adim);
      },
      duraklat: function () {
        if (!oynuyor) return;
        oynuyor = false; cancelAnimationFrame(raf);
        kok.classList.remove('vd-oyn--sakin');
        dugmeBoya(); yay('vd:durum', { oynuyor: false });
      },
      git: function (t, sec) {
        if (kilitli) return;
        sn = Math.max(0, Math.min(sure, Number(t) || 0));
        son = performance.now();
        ciz(); dugmeBoya();
        if (sec && sec.oynat) api.oynat();
      }
    };

    /* sahneye dokun → oynat/duraklat (kontrollerin, kaydetin ve kilidin dışında) */
    sahne.addEventListener('click', function (e) {
      if (kilitli) return;
      if (e.target.closest('.vd-oyn__alt, [data-vd-kaydet], a, .vd-oyn__buyuk')) return;
      oynuyor ? api.duraklat() : api.oynat();
    });
    oynatDugmeleri.forEach(function (d) {
      d.addEventListener('click', function (e) { e.stopPropagation(); oynuyor ? api.duraklat() : api.oynat(); });
    });
    kok.addEventListener('pointermove', function () { if (oynuyor) { kok.classList.remove('vd-oyn--sakin'); sakinZaman = performance.now(); } });

    /* zaman çizgisi: tıkla / sürükle / klavye; üstünde gezinirken bölüm önizlemesi */
    if (iz) {
      var oranAt = function (e) { var r = iz.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
      var surukle = false, surukleOncesi = false;
      iz.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        surukle = true; surukleOncesi = oynuyor;
        iz.setPointerCapture && iz.setPointerCapture(e.pointerId);
        kok.classList.add('vd-oyn--surukle');
        api.duraklat();
        api.git(oranAt(e) * sure);
        e.preventDefault();
      });
      iz.addEventListener('pointermove', function (e) {
        var o = oranAt(e), t = o * sure;
        if (surukle) api.git(t);
        if (onizle) {
          var b = bolumler[bolumAt(t)];
          onizle.innerHTML = '';
          var bb = document.createElement('b'); bb.textContent = sureMetni(t); onizle.appendChild(bb);
          if (b) onizle.appendChild(document.createTextNode(b.baslik));
          onizle.hidden = false;
          var r = iz.getBoundingClientRect(), w = onizle.offsetWidth / 2;
          var x = Math.max(w, Math.min(r.width - w, o * r.width));
          onizle.style.setProperty('--x', x.toFixed(1) + 'px');
          parcalar.forEach(function (p, i) { p.classList.toggle('is-uzerinde', i === bolumAt(t)); });
        }
      });
      var birak = function () {
        if (!surukle) return;
        surukle = false; kok.classList.remove('vd-oyn--surukle');
        if (surukleOncesi) api.oynat();
      };
      iz.addEventListener('pointerup', birak);
      iz.addEventListener('pointercancel', birak);
      iz.addEventListener('pointerleave', function () { if (onizle) onizle.hidden = true; parcalar.forEach(function (p) { p.classList.remove('is-uzerinde'); }); });
      iz.addEventListener('keydown', function (e) {
        var t = null;
        if (e.key === 'ArrowRight') t = sn + 5;
        else if (e.key === 'ArrowLeft') t = sn - 5;
        else if (e.key === 'Home') t = 0;
        else if (e.key === 'End') t = sure;
        else if (e.key === 'PageDown') { var n = bolumler[etkinBolum + 1]; t = n ? n.sn : sure; }
        else if (e.key === 'PageUp') { var bas = (bolumler[etkinBolum] || { sn: 0 }).sn; var o = bolumler[Math.max(0, sn - bas > 2 ? etkinBolum : etkinBolum - 1)]; t = o ? o.sn : 0; }
        else if (e.key === ' ' || e.key === 'Enter' || e.key === 'k') { e.preventDefault(); oynuyor ? api.duraklat() : api.oynat(); return; }
        if (t === null) return;
        e.preventDefault(); api.git(t);
      });
    }

    /* ses: prototipte ses yok — simge durum değiştirir ve dürüst bilgi verir */
    var ses = kok.querySelector('[data-vd-ses]');
    if (ses) ses.addEventListener('click', function (e) {
      e.stopPropagation();
      var acik = ses.getAttribute('aria-pressed') !== 'true';
      ses.setAttribute('aria-pressed', acik ? 'true' : 'false');
      var i = ses.querySelector('i'); if (i) i.className = 'fa-solid ' + (acik ? 'fa-volume-high' : 'fa-volume-xmark');
      window.vdBildir(acik ? 'Ses açıldı' : 'Ses kapatıldı', 'Prototipte ses yok · görüntü temsilîdir');
    });

    /* tam ekran: Fullscreen API; desteklemeyen tarayıcıda (iPhone Safari) sabit katman */
    var tam = kok.querySelector('[data-vd-tamekran]');
    function tamBoya() {
      var on = document.fullscreenElement === kok || kok.classList.contains('vd-oyn--tam');
      if (!tam) return;
      tam.setAttribute('aria-label', on ? 'Tam ekrandan çık' : 'Tam ekran');
      var i = tam.querySelector('i'); if (i) i.className = 'fa-solid ' + (on ? 'fa-compress' : 'fa-expand');
    }
    // Fullscreen API yoksa (iPhone Safari) sabit katman: oynatıcı geçici olarak gövdeye taşınır (main'in yığın bağlamından çıkar)
    var yerTutucu = null;
    function katmanAc() {
      yerTutucu = document.createComment('vd-oyn');
      kok.parentNode.insertBefore(yerTutucu, kok);
      document.body.appendChild(kok);
      kok.classList.add('vd-oyn--tam'); document.documentElement.classList.add('vd-oyn-tam-acik'); tamBoya();
    }
    function katmanKapat() {
      kok.classList.remove('vd-oyn--tam'); document.documentElement.classList.remove('vd-oyn-tam-acik');
      if (yerTutucu && yerTutucu.parentNode) { yerTutucu.parentNode.insertBefore(kok, yerTutucu); yerTutucu.remove(); }
      yerTutucu = null; tamBoya();
    }
    if (tam) tam.addEventListener('click', function (e) {
      e.stopPropagation();
      if (document.fullscreenElement === kok) { document.exitFullscreen(); return; }
      if (kok.classList.contains('vd-oyn--tam')) { katmanKapat(); return; }
      if (kok.requestFullscreen) kok.requestFullscreen().catch(katmanAc);
      else katmanAc();
    });
    document.addEventListener('fullscreenchange', tamBoya);
    kok.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && kok.classList.contains('vd-oyn--tam')) katmanKapat();
    });

    /* ---------- Senkron panel ---------- */
    var panel = blok.querySelector('[data-vd-panel]');
    var gruplar = panel ? Array.prototype.slice.call(panel.querySelectorAll('[data-vd-grup]')) : [];
    var liste = panel && panel.querySelector('[data-vd-mz-liste]');
    var acilmis = {};
    function panelBoya(kaydir) {
      if (!panel || panel.hasAttribute('data-vd-kilitli')) return;
      var simdi = null, siradaki = -1;
      gruplar.forEach(function (g) { var i = Number(g.getAttribute('data-vd-grup')); if (i > etkinBolum && (siradaki < 0 || i < siradaki)) siradaki = i; });
      gruplar.forEach(function (g) {
        var i = Number(g.getAttribute('data-vd-grup'));
        var durum = i < etkinBolum ? 'acik' : (i === etkinBolum ? 'simdi' : 'bekliyor');
        g.classList.toggle('is-siradaki', i === siradaki);
        // "simdi" grubu yoksa (o bölümde yeni malzeme yok) son açılan grup "acik" kalır
        g.classList.toggle('is-acik', durum === 'acik');
        g.classList.toggle('is-simdi', durum === 'simdi');
        g.classList.toggle('is-bekliyor', durum === 'bekliyor');
        if (durum !== 'bekliyor' && !acilmis[i]) {
          acilmis[i] = true;
          if (sn > 0) { g.classList.add('is-yeni'); setTimeout(function () { g.classList.remove('is-yeni'); }, 600); }
        }
        if (durum === 'simdi') simdi = g;
      });
      if (kaydir && liste && simdi && sn > 0) {
        // yalnız listenin kendisi kayar (sayfa yerinden oynamaz)
        var hedef = simdi.offsetTop - liste.offsetTop - 8;
        if (liste.scrollTo) liste.scrollTo({ top: hedef, behavior: azHareket ? 'auto' : 'smooth' }); else liste.scrollTop = hedef;
      }
    }
    if (panel) {
      panel.querySelectorAll('[data-vd-git]').forEach(function (d) {
        d.addEventListener('click', function () { api.git(Number(d.getAttribute('data-vd-git')), { oynat: true }); });
      });
      var kutular = Array.prototype.slice.call(panel.querySelectorAll('[data-vd-dolap]'));
      var eksik = panel.querySelector('[data-vd-eksik]');
      var eksikSayi = panel.querySelector('[data-vd-eksik-sayi]');
      var eksikYazi = panel.querySelector('[data-vd-eksik-yazi]');
      var dolapBag = panel.querySelector('[data-vd-dolap-bag]');
      var dolapYazi = panel.querySelector('[data-vd-dolap-yazi]');
      var ipucu = panel.querySelector('[data-vd-ipucu]');
      var ekliKume = null; // son eklenen eksik kümesi (işaretler değişirse düğme yeniden etkinleşir)
      var eksikler = function () { return kutular.filter(function (k) { return !k.checked; }); };
      var anahtar = function () { return eksikler().map(function (k) { return k.id; }).join('|'); };
      function ayakBoya() {
        var ek = eksikler(), var_ = kutular.length - ek.length;
        if (eksikSayi) eksikSayi.textContent = String(ek.length);
        if (eksik) {
          var eklendi = ekliKume !== null && ekliKume === anahtar();
          eksik.disabled = ek.length === 0 || eklendi;
          eksik.classList.toggle('is-eklendi', eklendi);
          if (eksikYazi) eksikYazi.textContent = ek.length === 0 ? 'Eksik malzeme yok' : (eklendi ? 'Eksikler listene eklendi' : 'Eksikleri Alışveriş Listesine Ekle');
          if (eksikSayi) eksikSayi.hidden = ek.length === 0;
        }
        if (dolapBag) {
          var u = new URL(dolapBag.getAttribute('data-taban'));
          kutular.forEach(function (k) {
            var li = k.closest('[data-malzeme-id]');
            if (k.checked && li) u.searchParams.append('malzeme[]', li.getAttribute('data-malzeme-id'));
          });
          dolapBag.href = u.toString();
          if (dolapYazi) dolapYazi.textContent = var_ ? 'Dolabımdaki ' + var_ + ' malzemeyle tarif bul' : 'Dolabımdakilerle tarif bul';
        }
        if (ipucu) ipucu.textContent = var_ ? var_ + ' malzeme dolabında · ' + ek.length + ' eksik' : 'Dolabında olanları işaretle; eksikler listene gider.';
      }
      kutular.forEach(function (k) { k.addEventListener('change', ayakBoya); });
      if (eksik) eksik.addEventListener('click', function () {
        var n = eksikler().length;
        if (!n) return;
        ekliKume = anahtar();
        ayakBoya();
        window.vdBildir(n + ' eksik malzeme listene eklendi', 'Prototip örneği · Dada Gastro alışveriş listesi');
      });
      ayakBoya();
    }
    /* spotlight: tüm malzemeleri listeye kaydet (1.1c) */
    var tum = blok.querySelector('[data-vd-tum-liste]');
    if (tum) tum.addEventListener('click', function () {
      var n = Number(tum.getAttribute('data-vd-tum-liste')) || 0;
      var on = tum.getAttribute('aria-pressed') !== 'true';
      tum.setAttribute('aria-pressed', on ? 'true' : 'false');
      var y = tum.querySelector('[data-vd-tum-liste-yazi]');
      if (y) y.textContent = on ? 'Listene kaydedildi' : 'Malzemeleri Listeme Kaydet';
      var i = tum.querySelector('i'); if (i) i.className = 'fa-solid ' + (on ? 'fa-check' : 'fa-cart-plus');
      window.vdBildir(on ? n + ' malzeme alışveriş listene kaydedildi' : 'Malzemeler listeden çıkarıldı', 'Prototip örneği');
    });

    ciz(); dugmeBoya();
    kok.vdOynatici = api;
    ornekler.push(api);
    return api;
  }

  function kur(kok) {
    (kok || document).querySelectorAll('[data-vd-oyn]').forEach(function (el) { if (!el.vdOynatici) Oynatici(el); });
  }
  window.vdOynatici = {
    kur: kur,
    al: function (x) { var el = typeof x === 'string' ? document.querySelector(x) : x; if (el && !el.vdOynatici && el.matches && el.matches('[data-vd-oyn]')) Oynatici(el); return el && el.vdOynatici; },
    hepsiniDurdur: function () { ornekler.forEach(function (o) { o.duraklat(); }); },
    sureMetni: sureMetni
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) window.vdOynatici.hepsiniDurdur(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { kur(); }); else kur();
})();
