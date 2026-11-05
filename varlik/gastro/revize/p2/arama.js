/* Revize P2 · T3 · Kalem 2 — /ara ekranının davranışı.
 *
 * 🔴 NEDEN YENİ DOSYA: donörün betiği (`kanon/gomulu/j-18b31e54a399.js`) sonuçları
 * `POOL` adlı SABİT bir diziden üretiyordu (uydurma başlıklar, unsplash görselleri,
 * olmayan adresler) ve son aramaları `localStorage['dm_fit_recent']`a yazıyordu —
 * ikisi de yasak. Sayfadan söküldü (dosyanın kendisine dokunulmadı).
 * `varliklar/reference/arama/arama.js` de kullanılamadı: o betik eski kuşağın
 * `srch*` kimliklerine bağlı ve bu markup `fs*` kimlikleri taşıyor.
 *
 * Burada kalan üç davranış:
 *   1. Sekme geçişi — panolar SUNUCUDAN dolu geldiği için sayfa yenilenmez; adres
 *      `?tab=` ile güncellenir (donörün kendi davranışı, `history.replaceState`).
 *   2. Otomatik tamamlama — gerçek uçtan (`GET /ara/oneriler`, sözleşme
 *      `{groups:[{key,label,items:[{label,url}]}]}`), 150ms debounce, klavye + ARIA.
 *   3. "Son aramaların · Temizle" — `DELETE /ara/gecmis`, yani HESAPTAN siler.
 *
 * Kancası olmayan sayfada hiçbir şey yapmaz.
 */
(function () {
  /* Aşama 2 · sayfa geneli metin: sunucu yalnız çevrilmiş dilde `[data-l-js]` sözlüğünü basar; yoksa
     Türkçe varsayılan. `:ad`/`:n`/`:mb` yer tutucu; "tekil|çoğul" sayfanın diline göre seçilir. */
  function sayfaMetni(ad, varsayilan, degerler, sayi) {
    var kap = document.querySelector('[data-l-js]'), s = null;
    if (kap) { try { s = JSON.parse(kap.getAttribute('data-l-js')); } catch (e) { s = null; } }
    var m = (s && s[ad]) || varsayilan;
    if (m.indexOf('|') !== -1) {
      var bicim = m.split('|');
      var bk = new Intl.PluralRules(document.documentElement.lang || 'tr'), kat = typeof sayi === 'number' ? bk.select(sayi) : 'other';
      /* RU (üç kategorili dil, 20 Eki): 'bir|az|çok' — kesir → az; iki biçimli dilde eski kural aynen. */
      m = bicim.length > 2 && bk.resolvedOptions().pluralCategories.indexOf('few') >= 0
        ? bicim[typeof sayi !== 'number' ? 2 : (sayi !== Math.floor(sayi) ? 1 : (kat === 'one' ? 0 : (kat === 'few' ? 1 : 2)))]
        : (kat === 'one' && typeof sayi === 'number' ? bicim[0] : bicim[bicim.length - 1]);
    }
    Object.keys(degerler || {}).forEach(function (k) { m = m.split(':' + k).join(String(degerler[k])); });

    return m;
  }
  var form = document.getElementById('fsForm');
  var input = document.getElementById('fsInput');


  /* Geri/ileri önbelleği gönderimden önce değişen form kontrollerini saklar.
     Sonuçlar URLye aittir; geri dönünce seçimler de aynı URLyi göstermeli. */
  window.addEventListener('pageshow', function (e) {
    if (!document.querySelector('[data-facet-form]')) return;
    // Tarayıcının form geçmişini geri yüklemesi pageshow sonrasında da olabilir.
    setTimeout(function () {
    var param = new URLSearchParams(location.search);
    if (input) input.value = param.get('q') || '';
    document.querySelectorAll('[data-facet-form] input').forEach(function (alan) {
      if (alan.type === 'checkbox') alan.checked = param.getAll(alan.name).indexOf(alan.value) !== -1;
      else if (alan.name === 'q') alan.value = param.get('q') || '';
    });
    if (form && input) { kapat(); sonSorgu = ''; }
    }, 0);
  });

  if (!form || !input) return;

  /* ---------- 1 · sekme geçişi ---------- */
  var sekmeler = document.querySelectorAll('#fsTabbar .sekme');
  var panolar = document.querySelectorAll('#fsResults .sonuc-pano');
  function sekmeyeGec(ad) {
    sekmeler.forEach(function (s) {
      var etkin = s.getAttribute('data-tab') === ad;
      s.classList.toggle('aktif', etkin);
      s.setAttribute('aria-selected', etkin ? 'true' : 'false');
    });
    panolar.forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== ad; });
    var u = new URLSearchParams(location.search);
    if (ad === 'tumu') u.delete('tab'); else u.set('tab', ad);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u.toString() : ''));
  }
  sekmeler.forEach(function (s) {
    s.addEventListener('click', function () { sekmeyeGec(s.getAttribute('data-tab')); });
  });
  /* "Tamamını Gör" sayfa yenilemeden aynı sekmeye geçer; bağ olarak da çalışır
     (JS kapalıyken sunucu `?tab=` ile aynı panoyu açar). */
  document.querySelectorAll('#fsResults .see-all[href]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var tab = new URL(a.href, location.origin).searchParams.get('tab');
      if (!tab || !document.querySelector('#fsResults .sonuc-pano[data-pane="' + tab + '"]')) return;
      e.preventDefault();
      sekmeyeGec(tab);
      document.getElementById('fsTabbar').scrollIntoView({ block: 'start' });
    });
  });

  /* ---------- 3 · son aramaları temizle ---------- */
  var temizle = document.getElementById('fsRecentClear');
  if (temizle) {
    temizle.addEventListener('click', function () {
      var uc = temizle.getAttribute('data-uc');
      var kimlik = document.querySelector('meta[name="dada-kimlik"]');
      var csrf = '';
      try { csrf = JSON.parse(kimlik ? kimlik.getAttribute('content') : '{}').csrf || ''; } catch (e) { csrf = ''; }
      temizle.disabled = true;
      fetch(uc, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
        credentials: 'same-origin',
      }).then(function (y) {
        if (!y.ok) throw new Error(y.status);
        var kolon = document.getElementById('fsRecentCol');
        if (kolon) kolon.remove();
      }).catch(function () {
        temizle.disabled = false;
        temizle.textContent = sayfaMetni('js.delete_failed', 'Silinemedi');
      });
    });
  }

  /* ---------- 2 · otomatik tamamlama ---------- */
  var kutu = document.getElementById('fsAc');
  var liste = document.getElementById('fsAcList');
  var durum = document.getElementById('fsAcStatus');
  if (!kutu || !liste) return;
  var uc = input.getAttribute('data-suggest-url') || '/ara/oneriler';

  var kalemler = [];
  var etkin = -1;
  var zamanlayici = null;
  var sonSorgu = '';
  var istekSirasi = 0;

  function kapat() {
    istekSirasi++;
    clearTimeout(zamanlayici);
    form.classList.remove('oneri-acik');
    var hero = form.closest('.arama-hero'); if (hero) hero.classList.remove('oneri-acik');
    kutu.classList.remove('acik');
    if (durum) durum.textContent = '';
    liste.querySelectorAll('[role="option"]').forEach(function (d) { d.setAttribute('aria-selected', 'false'); });
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    kalemler = [];
    etkin = -1;
  }

  function isaretle(i) {
    etkin = i;
    var dugumler = liste.querySelectorAll('.oneri-kalem');
    dugumler.forEach(function (d, j) { d.classList.toggle('etkin', j === i); d.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
    if (i >= 0 && dugumler[i]) {
      input.setAttribute('aria-activedescendant', dugumler[i].id);
      dugumler[i].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function kac(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  var GRUP_IKONU = { tarifler: 'fa-utensils', puflar: 'fa-lightbulb', videolar: 'fa-play', sefler: 'fa-user-tie' };

  function ciz(gruplar) {
    kalemler = [];
    etkin = -1;
    var html = '';
    gruplar.forEach(function (g) {
      if (!g.items || !g.items.length) return;
      html += '<div class="oneri-grup" aria-hidden="true"><i class="fa-solid ' + (GRUP_IKONU[g.key] || 'fa-magnifying-glass') + '"></i>' + kac(g.label) + '</div>';
      g.items.forEach(function (k) {
        var i = kalemler.length;
        kalemler.push(k);
        html += '<a class="oneri-kalem" id="fsAcK' + i + '" role="option" aria-selected="false" tabindex="-1" href="' + kac(k.url) + '">'
          + '<span class="oneri-ad">' + kac(k.label) + '</span></a>';
      });
    });
    liste.innerHTML = html;
    if (!kalemler.length) { kapat(); if (durum) durum.textContent = ''; return; }
    form.classList.add('oneri-acik');
    var hero = form.closest('.arama-hero'); if (hero) hero.classList.add('oneri-acik');
    kutu.classList.add('acik');
    input.setAttribute('aria-expanded', 'true');
    if (durum) durum.textContent = sayfaMetni('js.suggestion_count', ':n öneri', { n: kalemler.length }, kalemler.length);
  }

  function sor(q) {
    if (q.length < 2) { kapat(); return; }
    var sira = ++istekSirasi;
    var adres = new URL(uc, location.origin);
    adres.searchParams.set('q', q);
    fetch(adres.href, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (y) { return y.ok ? y.json() : { groups: [] }; })
      .then(function (d) { if (sira === istekSirasi && input.value.trim() === q) ciz(d.groups || []); })
      .catch(function () { if (sira === istekSirasi) kapat(); });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim();
    if (q === sonSorgu) return;
    sonSorgu = q;
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(function () { sor(q); }, 150);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { kapat(); return; }
    if (!kalemler.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); isaretle((etkin + 1) % kalemler.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); isaretle((etkin - 1 + kalemler.length) % kalemler.length); }
    else if (e.key === 'Home') { e.preventDefault(); isaretle(0); }
    else if (e.key === 'End') { e.preventDefault(); isaretle(kalemler.length - 1); }
    else if (e.key === 'Enter' && etkin >= 0) { e.preventDefault(); location.href = kalemler[etkin].url; }
  });

  document.addEventListener('click', function (e) {
    if (!form.contains(e.target)) kapat();
  });
})();
