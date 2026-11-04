// tarif-detay.js — tarif-detay-v1.html kaynak-transfer (W2-A), yalnız SALT-UI
// etkileşimler (veri bağımlı olmayan, gerçek backend gerektirmeyen davranışlar).
// TAŞINMADI (rapor'da gerekçeli): login-state mock, audio player, video modal,
// ing-sponsor "Sipariş Et" popover'ı, satır-bazlı localStorage alışveriş listesi —
// bunların gerçek backend karşılığı yok. Yorum beğen/bildir/düzenle-sil/gönder/
// yanıtla + client-filtre GERÇEK backend'e bağlandı (Topluluk/Yorumlar dilimi,
// kararlar.md §4.4 FB4, dosya sonu): beğen ui.js data-engagement-toggle kontratı
// (JSON, sayfa yenilenmez), diğerleri gerçek <form> POST/redirect. Kaydet/favori/
// alkışla/denedim, porsiyon ölçekleme, takip zaten ui.js veya gerçek <form>
// POST'ları üzerinden çalışıyor, burada TEKRAR bağlanmadı (çift-dinleyici tuzağı).

(function () {
  // Gastro porsiyonu: tarifin gerçek bazından birer birer; kanon sürücüsünden ayrı hedef.
  document.querySelectorAll('[data-gastro-portion]').forEach(function (panel) {
    if (panel.dataset.gastroPortionBound) return;
    panel.dataset.gastroPortionBound = '1';
    var base = Number(panel.dataset.portionBase), servings = base;
    var down = panel.querySelector('[data-portion-dec]'), up = panel.querySelector('[data-portion-inc]');
    if (!Number.isSafeInteger(base) || base < 1) {
      if (down) down.disabled = true;
      if (up) up.disabled = true;
      return;
    }
    /* Revize 5 · madde 4: birime göre yuvarlama `GastroPorsiyon` (public/gastro/porsiyon-yuvarlama.js)
       ve sayfanın `data-porsiyon-kurallari` tablosuyla; sunucudaki eşi aynı tabloyu kullanır.
       Görünen metin, `data-current-amount` (liste ekleme bunu okur) ve birim etiketi birlikte yazılır. */
    var kuralKaynagi = document.querySelector('[data-porsiyon-kurallari]'), kurallar = null;
    try { kurallar = kuralKaynagi ? JSON.parse(kuralKaynagi.textContent) : null; } catch (e) { kurallar = null; }
    var yuvarla = window.GastroPorsiyon && kurallar ? window.GastroPorsiyon : null;
    /* Üç çekimli birim (RU, 26 Eki): `[bir, az, çok]` listesinden Slav çoğul kuralıyla seçim (1 · 21 → bir; 2–4 · 22–24 → az;
       0 · 5–20 · 25… → çok). Yalnız sunucunun üç biçim verdiği dilde kullanılır (`ArayuzSozlugu::birimBicimleri`). */
    function ucBicim(liste, n) {
      var on = n % 10, yuz = n % 100;
      return liste[on === 1 && yuz !== 11 ? 0 : (on >= 2 && on <= 4 && (yuz < 12 || yuz > 14) ? 1 : 2)];
    }
    function renderPortion() {
      panel.querySelectorAll('[data-portion-servings]').forEach(function (node) {
        /* C1: EN'de 1 porsiyonda tekil birim (`data-portion-unit-tekil` yalnız çevrilmiş sayfada basılır). */
        var birimAdi = servings === 1 && node.dataset.portionUnitTekil ? node.dataset.portionUnitTekil : node.dataset.portionUnit;
        var bicimler = null;
        try { bicimler = node.dataset.portionUnitBicimler ? JSON.parse(node.dataset.portionUnitBicimler) : null; } catch (e) { bicimler = null; }
        if (bicimler && bicimler.length === 3) birimAdi = ucBicim(bicimler, servings);
        node.textContent = String(servings) + (birimAdi ? ' ' + birimAdi : '');
        /* `#ingServEcho`dan sonraki birim düz metin düğümüdür; `data-birim-sonra` = [tekil, çoğul] (yalnız çevrilmiş sayfada). */
        var sonra = null;
        try { sonra = node.dataset.birimSonra ? JSON.parse(node.dataset.birimSonra) : null; } catch (e) { sonra = null; }
        var metin = node.nextSibling;
        if (sonra && sonra[0] && sonra[1] && metin && metin.nodeType === 3) {
          var bas = Math.max(0, metin.nodeValue.search(/\S/)), govde = metin.nodeValue.slice(bas);
          /* En uzun biçim önce denenir («ломтиков» «ломтик»le de başlar). */
          var eski = sonra.slice().sort(function (a, b) { return b.length - a.length; }).filter(function (b) { return b && govde.indexOf(b) === 0; })[0] || null;
          var yeni = sonra.length === 3 ? ucBicim(sonra, servings) : (servings === 1 ? sonra[0] : sonra[1]);
          if (eski !== null) metin.nodeValue = metin.nodeValue.slice(0, bas) + yeni + govde.slice(eski.length);
        }
      });
      panel.querySelectorAll('[data-amount][data-base-amount]').forEach(function (node) {
        var miktar = Number(String(node.dataset.baseAmount).replace(',', '.'));
        if (!Number.isFinite(miktar)) return;
        var iq = node.closest('.iq'), birim = iq ? iq.getAttribute('data-u') : null, birimDugumu = iq && iq.querySelector('[data-unit]');
        if (!yuvarla) {
          var ham = miktar * servings / base;
          node.dataset.currentAmount = String(Number(ham.toFixed(6)));
          /* 4. tur: yedek dal (yuvarlama betiği yoksa) ondalığı sayfa diline göre yazar — TR virgül, öbür diller nokta. */
          node.textContent = String(Number(ham.toFixed(6))).replace('.', document.documentElement.lang === 'tr' ? ',' : '.');
          return;
        }
        var r = yuvarla.hesapla(kurallar, miktar, birim, base, servings, !node.hasAttribute('data-olceklenmez'), iq && iq.getAttribute('data-a'));
        node.dataset.currentAmount = String(r.deger);
        node.textContent = r.metin;
        if (birimDugumu) {
          if (birimDugumu.dataset.ilkEtiket === undefined) birimDugumu.dataset.ilkEtiket = birimDugumu.textContent;
          /* C1 2. tur: EN'de sayılabilir birim yeni miktara göre tekil/çoğul (`data-unit-tekil/-cogul` yalnız çevrilmiş sayfada). */
          var ayniBirim = r.birim === (birim || null), tc = birimDugumu.dataset.unitTekil !== undefined;
          /* RU (20 Eki · E4): üç biçimli dilde `data-unit-cok` da basılır (`OlcuBirimi::miktarBicimi` ile aynı kural):
             kesir → az; tamsayıda Intl one → tekil, few → az, gerisi → çok. Öznitelik yoksa iki biçimli kural aynen. */
          var ucBicim = function (n) {
            if (n !== Math.floor(n)) return birimDugumu.dataset.unitCogul;
            var k = new Intl.PluralRules(document.documentElement.lang || 'ru').select(n);
            return k === 'one' ? birimDugumu.dataset.unitTekil : (k === 'few' ? birimDugumu.dataset.unitCogul : birimDugumu.dataset.unitCok);
          };
          birimDugumu.textContent = ayniBirim ? (tc ? (birimDugumu.dataset.unitCok !== undefined ? ucBicim(r.deger) : (r.deger <= 1 ? birimDugumu.dataset.unitTekil : birimDugumu.dataset.unitCogul)) : birimDugumu.dataset.ilkEtiket) : (kurallar.etiketler[r.birim] || r.birim);
        }
      });
      if (down) down.disabled = servings <= 1;
      if (up) up.disabled = !Number.isSafeInteger(servings + 1);
    }
    if (down) down.addEventListener('click', function () { if (servings > 1) { servings--; renderPortion(); } });
    if (up) up.addEventListener('click', function () { if (Number.isSafeInteger(servings + 1)) { servings++; renderPortion(); } });
    renderPortion();
  });

  // ---- R7: YAZI ÖLÇEĞİ (A− / A+) — tarif metni + malzemeler ----
  (function () {
    var scales = [0.9, 1, 1.1, 1.2], si = 1;
    var cols = document.querySelector('.rd-cols');
    var dn = document.getElementById('rdFontDown'), up = document.getElementById('rdFontUp');
    if (!cols || !dn || !up) return;
    function apply() {
      cols.style.setProperty('--ts', scales[si]);
      dn.disabled = si === 0; up.disabled = si === scales.length - 1;
    }
    dn.addEventListener('click', function () { if (si > 0) { si--; apply(); } });
    up.addEventListener('click', function () { if (si < scales.length - 1) { si++; apply(); } });
    apply();
  })();

  // ---- ÇİP ŞERİDİ (revize 5 · madde 3): Mutfak/Özellikler tek satır, elle kaydırılır ----
  // Klon yok, kendiliğinden kayma yok. Dokunmatikte yerel kaydırma; farede sürükleme.
  // Taşan kenarda solma sınıfı (`sol-solma` / `sag-solma`) kaydırma konumundan hesaplanır.
  (function () {
    document.querySelectorAll('[data-cip-kaydir]').forEach(function (row) {
      function kenarlar() {
        var tasar = row.scrollWidth > row.clientWidth + 1;
        row.classList.toggle('tasar', tasar);
        row.classList.toggle('sol-solma', tasar && row.scrollLeft > 1);
        row.classList.toggle('sag-solma', tasar && row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
      }
      var basla = null, surukledi = false;
      row.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0 || !row.classList.contains('tasar')) return;
        basla = { x: e.clientX, sol: row.scrollLeft }; surukledi = false;
      });
      row.addEventListener('pointermove', function (e) {
        if (!basla) return;
        var dx = e.clientX - basla.x;
        if (!surukledi && Math.abs(dx) > 4) { surukledi = true; row.classList.add('surukleniyor'); }
        if (surukledi) row.scrollLeft = basla.sol - dx;
      });
      function birak() { basla = null; row.classList.remove('surukleniyor'); }
      row.addEventListener('pointerup', birak);
      row.addEventListener('pointerleave', birak);
      // Sürükleme sonunda altta kalan çipin bağı açılmaz; tek tıklama bağı açar.
      row.addEventListener('click', function (e) { if (surukledi) { e.preventDefault(); surukledi = false; } }, true);
      row.addEventListener('dragstart', function (e) { e.preventDefault(); });
      row.addEventListener('scroll', kenarlar, { passive: true });
      window.addEventListener('resize', kenarlar);
      kenarlar();
    });
  })();

  // ---- CHIP MARQUEE: alternatif tarifler yavaşça oto-kayar ----
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.kc-chips .chip-row:not([data-cip-kaydir]), .alt-links').forEach(function (row) {
      if (row.scrollWidth <= row.clientWidth + 4) return;
      [].slice.call(row.children).forEach(function (c) {
        var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; row.appendChild(k);
      });
      var half = row.scrollWidth / 2, paused = false, idleT = null, x = row.scrollLeft;
      function hold(ms) { paused = true; clearTimeout(idleT); idleT = setTimeout(function () { paused = false; x = row.scrollLeft; }, ms); }
      row.addEventListener('mouseenter', function () { paused = true; clearTimeout(idleT); });
      row.addEventListener('mouseleave', function () { clearTimeout(idleT); paused = false; x = row.scrollLeft; });
      row.addEventListener('wheel', function () { hold(2000); }, { passive: true });
      row.addEventListener('touchstart', function () { hold(2500); }, { passive: true });
      row.addEventListener('pointerdown', function () { hold(2500); });
      window.addEventListener('resize', function () { half = row.scrollWidth / 2; });
      (function tick() {
        if (!paused) { x += 0.3; if (x >= half) x -= half; row.scrollLeft = x; }
        requestAnimationFrame(tick);
      })();
    });
  })();

  // ---- MALZEME: işaretle (üstü çizili) + ikame popover ----
  document.querySelectorAll('.ing-row input[type=checkbox]').forEach(function (c) {
    c.addEventListener('change', function () { c.closest('.ing-row').classList.toggle('checked', c.checked); });
  });
  document.querySelectorAll('.ing-swap').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var row = b.closest('.ing-row');
      var wasOpen = row.classList.contains('swap-open');
      document.querySelectorAll('.ing-row.swap-open').forEach(function (o) { o.classList.remove('swap-open'); });
      document.querySelectorAll('.ing-row.conv-open').forEach(function (o) { o.classList.remove('conv-open'); });
      if (!wasOpen) row.classList.add('swap-open');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.ing-row')) document.querySelectorAll('.ing-row.swap-open').forEach(function (o) { o.classList.remove('swap-open'); });
  });

  // ---- ÖLÇÜ BİRİMİ DÖNÜŞÜM POPOVER'I — miktara tıkla (yalnız gerçek birim
  //      anahtarları için; gastro.units slug'larına göre — sahte birim yok) ----
  (function () {
    /* Revize P1 · Kalem 14 — pencere dizeleri `#ingList[data-l-olcu]`dan (JSON, TR → etkin dil).
       Tarif detayı özniteliği YALNIZ kaynak dil dışında basar; yoksa aşağıdaki Türkçe metin kalır.
       UNITS'in ml/g değerleri buradan beslenmez. */
    var L = {};
    try { L = JSON.parse((document.getElementById('ingList') || { getAttribute: function () { return null; } }).getAttribute('data-l-olcu') || '{}'); } catch (e) { L = {}; }
    var t = function (s) { return L[s] || s; };
    var h = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var UNITS = {};
    try { UNITS = JSON.parse((document.getElementById('ingList') || { getAttribute: function () { return null; } }).getAttribute('data-olcu-balon') || '{}'); } catch (e) { UNITS = {}; }
    var MALZEME = {};
    try { MALZEME = JSON.parse((document.getElementById('ingList') || { getAttribute: function () { return null; } }).getAttribute('data-olcu-malzeme') || '{}'); } catch (e) { MALZEME = {}; }
    document.querySelectorAll('#ingList .iq[data-u]').forEach(function (q) {
      var u = q.getAttribute('data-u');
      var satir = q.closest('.ing-row');
      if (!satir.querySelector('.conv-pop')) {
        if (!UNITS[u]) return;
        q.classList.add('has-conv');
        var pop = document.createElement('div');
        pop.className = 'conv-pop';
        pop.innerHTML = '<span class="cp-title"><i class="fa-solid fa-scale-balanced"></i> ' + (window.__i18nOlcuKarsiligi || t('Ölçü karşılığı')) + '</span>' +
          UNITS[u].concat((MALZEME[satir.getAttribute('data-malzeme-id')] || {})[u] || []).map(function (r) { return '<div class="cp-row"><i class="fa-solid fa-circle"></i><span><b>' + h(t(r[0])) + '</b> ' + h(r[1]) + '</span></div>'; }).join('') +
          '<div class="cp-foot">' + (window.__i18nOlcuKaynak || t('Kaynak: DadaGastro Ölçü Birimleri rehberi')) + '</div>';
        satir.appendChild(pop);
      }
      q.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var row = q.closest('.ing-row');
        var was = row.classList.contains('conv-open');
        document.querySelectorAll('.ing-row.conv-open').forEach(function (o) { o.classList.remove('conv-open'); });
        document.querySelectorAll('.ing-row.swap-open').forEach(function (o) { o.classList.remove('swap-open'); });
        if (!was) row.classList.add('conv-open');
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.ing-row')) document.querySelectorAll('.ing-row.conv-open').forEach(function (o) { o.classList.remove('conv-open'); });
    });
  })();

  // ---- ADIM KARTLARI: numara rozetine tıkla → tamamlandı (yalnız görsel durum) ----
  document.querySelectorAll('.step-card .sc-num').forEach(function (n) {
    n.setAttribute('role', 'button');
    n.addEventListener('click', function () { n.closest('.step-card').classList.toggle('done'); });
  });

  // ---- LIGHTBOX: galeri sahnesi + adım görselleri + "ben de yaptım" + yorum fotoları ----
  (function () {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var img = document.getElementById('lbImg');
    var cap = document.getElementById('lbCap');
    var count = document.getElementById('lbCount');
    var group = [], idx = 0, opener = null;
    function bgUrl(el) {
      var m = (el.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
      return m ? m[1] : null;
    }
    function render() {
      img.src = group[idx].src;
      cap.textContent = group[idx].cap || '';
      count.textContent = (idx + 1) + ' / ' + group.length;
      lb.classList.toggle('single', group.length < 2);
    }
    function open(g, i) { if (!g.length) return; opener = document.activeElement; group = g; idx = i; render(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; document.getElementById('lbClose').focus(); }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; if (opener && opener.isConnected) opener.focus(); }
    window.openLightbox = open;
    document.getElementById('lbClose').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.getElementById('lbPrev').addEventListener('click', function () { idx = (idx - 1 + group.length) % group.length; render(); });
    document.getElementById('lbNext').addEventListener('click', function () { idx = (idx + 1) % group.length; render(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { idx = (idx + 1) % group.length; render(); }
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + group.length) % group.length; render(); }
    });
    var stage = document.getElementById('rdStage');
    if (stage) {
      stage.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        var cap = stage.getAttribute('data-cap') || '';
        // Galeri grubu (Task #4, Beyar kararı 2026-07-14): kapak + galeri görselleri
        // data-gallery'de (JSON URL listesi, admin'de yönetilen sırayla). Galeri
        // boşsa/öznitelik yoksa sahnenin KENDİ arka plan görseline düşer (tek görsel,
        // eski davranış — regresyon yok).
        var galleryAttr = stage.getAttribute('data-gallery');
        var urls = null;
        if (galleryAttr) { try { urls = JSON.parse(galleryAttr); } catch (err) { urls = null; } }
        if (urls && urls.length) {
          open(urls.map(function (src) { return { src: src, cap: cap }; }), 0);
          return;
        }
        var m = (stage.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
        if (!m) return;
        open([{ src: m[1], cap: cap }], 0);
      });
    }
    document.querySelectorAll('[data-tarif-galeri-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        var buttons = [].slice.call(document.querySelectorAll('[data-tarif-galeri-index]'));
        var g = buttons.map(function (b) {
          var picture = b.querySelector('img');
          return { src: picture.dataset.tamSrc || picture.src, cap: picture.alt };
        });
        open(g, buttons.indexOf(button));
      });
    });
    document.querySelectorAll('[data-tarif-medya-buyut]').forEach(function (button) {
      button.addEventListener('click', function () {
        var picture = button.querySelector('img');
        open([{ src: picture.dataset.tamSrc || picture.src, cap: picture.alt }], 0);
      });
    });
    document.querySelectorAll('.step-card').forEach(function (card) {
      var figs = [].slice.call(card.querySelectorAll('.step-img'));
      if (!figs.length) return;
      var numEl = card.querySelector('.sc-num');
      var cap = numEl ? numEl.getAttribute('data-step-label') || '' : '';
      figs.forEach(function (f, i) {
        f.addEventListener('click', function () {
          var g = figs.map(function (x) { return { src: bgUrl(x), cap: cap }; });
          open(g, i);
        });
      });
    });
    var mwGrid = document.getElementById('mwGrid');
    if (mwGrid) {
      mwGrid.querySelectorAll('.mw-item').forEach(function (it) {
        it.addEventListener('click', function (e) {
          e.preventDefault();
          var items = [].slice.call(mwGrid.querySelectorAll('.mw-item'));
          var g = items.map(function (x) { return { src: bgUrl(x), cap: x.getAttribute('data-cap') || '' }; });
          open(g, items.indexOf(it));
        });
      });
    }
    document.querySelectorAll('.c-photos').forEach(function (box) {
      var phs = [].slice.call(box.querySelectorAll('.c-ph'));
      phs.forEach(function (p, i) {
        p.addEventListener('click', function () {
          var g = phs.map(function (x) { return { src: bgUrl(x), cap: x.getAttribute('data-cap') || '' }; });
          open(g, i);
        });
      });
    });
  })();

  // ---- STICKY AKSİYON BARI: başlık bandı geçilince görünür (kaydet/denedim/
  //      alkışla gerçek data-engagement-toggle — ui.js zaten bağlıyor, burada
  //      yalnız görünürlük + yorumlar/paylaş kısayolları) ----
  (function () {
    var bar = document.getElementById('rdActbar');
    var head = document.querySelector('.rd-head');
    if (!bar || !head) return;
    function onScroll() {
      var past = head.getBoundingClientRect().bottom < 0;
      var nearEnd = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 220;
      bar.classList.toggle('show', past && !nearEnd);
      // Birincil liste eylemi sabit araç çubuğunun altında kalmasın.
      var primary = document.getElementById('addAllBtn');
      var rect = primary && primary.getBoundingClientRect();
      var barBottom = window.innerHeight - (parseFloat(getComputedStyle(bar).bottom) || 0);
      var covered = !!(rect && rect.width && rect.bottom > barBottom - bar.offsetHeight && rect.top < barBottom);
      bar.classList.toggle('primary-action-visible', covered);
      bar.inert = covered;

    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    var commentsBtn = bar.querySelector('[data-act="comments"]');
    if (commentsBtn) commentsBtn.addEventListener('click', function () {
      var y = document.getElementById('yorumlar');
      if (y) y.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Paylaş: TEK hedef #rdSharePop popover'ı (Beyar 2026-08-11). Native
    // paylaşım sayfası (navigator.share) dalı KALDIRILDI — masaüstünde
    // işletim sisteminin kendi listesini açıyordu ve düğme üstüne gelince
    // uygulamanın kanal setini, tıklayınca bambaşka bir listeyi gösteriyordu.
    // (M3-a/r1 turlarının navigator.share reddi + mikrotask tuzağı kaydı git
    // geçmişinde.) Popover da yoksa
    // #paylas bölümüne kaydırma eski fallback. RV1 (2026-07-26, Beyar kararı):
    // tek tetikleyici (#rdActbar içindeki [data-act="share"]) yerine BİRDEN
    // FAZLA tetikleyici desteklenir — _tagshare.blade.php'nin ≤640px'te
    // .ts-tags'i sıkışmaktan kurtaran tek "Paylaş" düğmesi (data-share-toggle)
    // de AYNI popover'ı açar. Konumlandırma tıklanan butona göre hesaplanır
    // (kapalı closure değişkeni değil).
    var shareTriggers = document.querySelectorAll('[data-act="share"], [data-share-toggle]');
    var sharePop = document.getElementById('rdSharePop');
    function closeSharePop() {
      if (sharePop) { sharePop.classList.remove('show'); shareTriggers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
    }
    function openSharePopFallback(btn, e) {
      if (!sharePop) { var t = document.getElementById('paylas'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (e) e.stopPropagation();
      var willOpen = !sharePop.classList.contains('show');
      if (willOpen) {
        var r = btn.getBoundingClientRect();
        sharePop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - sharePop.offsetWidth - 8)) + 'px';
        sharePop.style.bottom = (window.innerHeight - r.top + 10) + 'px';
      }
      sharePop.classList.toggle('show', willOpen);
      shareTriggers.forEach(function (b) { b.setAttribute('aria-expanded', willOpen ? 'true' : 'false'); });
    }
    // Beyar 2026-08-11 — TIKLAMA ARTIK NATIVE SHEET AÇMAZ.
    // Eskiden `navigator.share` varsa işletim sisteminin kendi paylaşım
    // sayfası açılıyordu (macOS'ta "AirDrop / Mail / Mesajlar / Okuma
    // Listesi…") — yani üstüne gelince uygulamanın kendi kanal seti,
    // tıklayınca bambaşka bir liste çıkıyordu. Aynı düğme iki farklı şey
    // yapmaz: her iki etkileşim de #rdSharePop'u açar, kanal seti tek.
    // (navigator.share dalı tamamen kaldırıldı; ona bağlı mikrotask/
    // stopPropagation tuzağının kaydı git geçmişinde duruyor.)
    shareTriggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        openSharePopFallback(btn, e);
      });
      // Üstüne gelince de AYNI popover — tıklamayla birebir aynı içerik.
      btn.addEventListener('mouseenter', function (e) {
        if (sharePop.classList.contains('show')) return;
        openSharePopFallback(btn, e);
      });
    });
    if (sharePop) {
      document.addEventListener('click', function (e) { if (!e.target.closest('#rdSharePop')) closeSharePop(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSharePop(); });
      window.addEventListener('scroll', closeSharePop, { passive: true });
    }
  })();

  // ---- BAĞLANTI KOPYALA (paylaşım rayı + sticky bar paylaş popover'ı —
  //      aynı davranış, birden fazla kopyalama tetikleyicisi olabilir) ----
  document.querySelectorAll('#shareCopy, [data-share-copy]').forEach(function (b) {
    var icon = b.innerHTML;
    b.addEventListener('click', function () {
      try { navigator.clipboard.writeText(location.href); } catch (e) {}
      b.classList.add('ok'); b.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(function () { b.classList.remove('ok'); b.innerHTML = icon; }, 1600);
    });
  });

  // ---- YORUM FORMU: kapalı başlar, tıkla/odaklan → genişler (gerçek <form>,
  //      submit engellenmez) ----
  (function () {
    var rform = document.getElementById('revForm');
    if (!rform) return;
    rform.addEventListener('click', function () { rform.classList.add('open'); });
    rform.addEventListener('focusin', function () { rform.classList.add('open'); });
  })();

  // ---- YANITLA: gerçek yanıt formunu aç/kapa (form kendisi gerçek POST) ----
  document.querySelectorAll('[data-reply-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('.c-main').querySelector('.c-reply-form');
      if (!f) return;
      f.hidden = !f.hidden;
      if (!f.hidden) { var ta = f.querySelector('textarea'); if (ta) ta.focus(); }
    });
  });
  document.querySelectorAll('[data-reply-cancel]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('.c-reply-form').hidden = true; });
  });

  // ---- YORUM FORMU: yıldız girişi (ZORUNLU) + fotoğraf yükleme (gerçek AJAX
  //      media.store — admin galeri widget'ıyla aynı kontrat) + kendi yorumunu
  //      düzenle (aynı form, farklı hedef — Topluluk/Yorumlar dilimi) ----
  (function () {
    var form = document.getElementById('revForm');
    if (!form) return;
    var starsWrap = document.getElementById('rfStars');
    var hint = document.getElementById('rfHint');
    var ratingInput = document.getElementById('rfRatingInput');
    var textarea = form.querySelector('.rf-text');
    var chips = document.getElementById('rfChips');
    var fileInput = document.getElementById('rfFile');
    var photoBtn = document.getElementById('rfPhotoBtn');
    var uploadUrl = form.getAttribute('data-upload-url');
    var rating = parseInt(ratingInput.value, 10) || 0;
    var btns = [].slice.call(starsWrap.querySelectorAll('button'));

    function paint(n) { btns.forEach(function (b, i) { b.classList.toggle('on', i < n); }); }
    function csrfToken() {
      var meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.content : '';
    }

    btns.forEach(function (b, i) {
      b.addEventListener('mouseenter', function () { paint(i + 1); });
      b.addEventListener('click', function () {
        rating = i + 1; ratingInput.value = rating; paint(rating);
        hint.textContent = (hint.getAttribute('data-l-puanin') || 'Puanın: :n/5').replace(':n', String(rating));
        hint.classList.remove('err'); hint.classList.add('ok');
      });
    });
    starsWrap.addEventListener('mouseleave', function () { paint(rating); });

    if (photoBtn && fileInput && chips) {
      photoBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var files = [].slice.call(fileInput.files).slice(0, Math.max(0, 3 - chips.children.length));
        files.forEach(function (f) {
          var fd = new FormData();
          fd.append('file', f);
          fetch(uploadUrl, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken(), Accept: 'application/json' }, body: fd })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
              if (!data) return;
              var d = document.createElement('span');
              d.className = 'rf-ph';
              d.style.backgroundImage = "url('" + data.thumb_url + "')";
              d.innerHTML = '<button type="button" aria-label="Fotoğrafı kaldır"><i class="fa-solid fa-xmark"></i></button>' +
                '<input type="hidden" name="media_ids[]" value="' + data.id + '">';
              /* Aşama 2: çevrilmiş sayfada etiket `#revForm[data-l-foto-kaldir]`dan (TR'de öznitelik yok, metin aynı). */
              var kaldirEtiketi = (document.getElementById('revForm') || d).getAttribute('data-l-foto-kaldir');
              if (kaldirEtiketi) d.querySelector('button').setAttribute('aria-label', kaldirEtiketi);
              d.querySelector('button').addEventListener('click', function () { d.remove(); });
              chips.appendChild(d);
            });
        });
        fileInput.value = '';
      });
    }

    form.addEventListener('submit', function (e) {
      if (!rating) {
        e.preventDefault();
        hint.textContent = hint.getAttribute('data-l-puan-zorunlu') || 'Puan vermeden yorum gönderilemez';
        hint.classList.remove('ok'); hint.classList.add('err');
        starsWrap.classList.add('shake');
        setTimeout(function () { starsWrap.classList.remove('shake'); }, 450);
      }
    });

    document.querySelectorAll('[data-review-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rating = parseInt(btn.getAttribute('data-rating'), 10) || 0;
        ratingInput.value = rating; paint(rating);
        textarea.value = btn.getAttribute('data-body') || '';
        form.action = btn.getAttribute('data-update-url');
        var methodInput = form.querySelector('input[name="_method"]');
        if (!methodInput) {
          methodInput = document.createElement('input');
          methodInput.type = 'hidden';
          methodInput.name = '_method';
          form.appendChild(methodInput);
        }
        methodInput.value = 'PATCH';
        form.classList.add('open');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
      });
    });
  })();

  // ---- YORUM FİLTRE ÇİPLERİ (yalnız ilk sayfada yüklenen yorumlar üzerinde,
  //      referans deseni birebir — gerçek sayfalama bu dilimin kapsamı dışı) ----
  (function () {
    var chips = document.querySelectorAll('#revFilter .chip');
    if (!chips.length) return;
    var items = document.querySelectorAll('#revList > .c-item');
    var empty = document.getElementById('revEmpty');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        var k = c.getAttribute('data-f'), visible = 0;
        items.forEach(function (it) {
          var s = it.getAttribute('data-stars');
          var show = k === 'all' || (k === 'photo' && it.hasAttribute('data-photo')) || k === s || (k === 'low' && parseInt(s, 10) <= 3);
          it.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (empty) empty.hidden = visible > 0;
      });
    });
  })();
})();
