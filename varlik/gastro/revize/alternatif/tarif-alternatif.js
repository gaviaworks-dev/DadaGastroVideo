/* Alternatif revizesi (31 Eki) · sahibi: tarif-alternatif. Yalnız uygulanabilir alternatifi olan tarif detayında yüklenir.

   Mobilin davranışı (dadagastro-mobil-app `ingredients_pane.dart`, `recipe_detail_screen.dart` `_alternatif`; donör V4
   `ld-source.js` `paintAlternative`): ikame balonunda bir seçeneğe "Uygula" denince YALNIZ o malzeme satırı değişir —
   ad ve not alternatifinki olur, altında "Değiştirildi" yazar; miktar, seçenek "aynı miktar"sa asıl (porsiyona göre
   güncel) miktar kalır, değilse "Ölçüyü kontrol et" yazar; ölçü karşılığı balonu o satırda açılmaz. "Geri al" satırı
   eski hâline döndürür. Hazırlanış adımları, pişirme modu, besin değerleri ve alışveriş listesi DEĞİŞMEZ (listeye
   ekleme sunucunun bastığı asıl adı yazar). Seçim kaydedilmez: bellekte tutulur, sayfa yenilenince asıl hâl gelir.

   "Aynı miktar mı" kararı sunucudan gelir (`data-ayni-miktar`, `MalzemeAlternatifi::ayniMiktarlar`); betik kural taşımaz.
   Metinler balonun `data-l-alt-*` özniteliklerinden (sayfanın dilinde). */
(function () {
  var liste = document.getElementById('ingList');
  if (!liste || !liste.querySelector('[data-alternatif-uygula]')) return;

  /* satır → { inHtml, secim, kontrol } (asıl ad düğümünün içeriği, uygulanan seçenek sırası, eklenen miktar düğümü) */
  var durumlar = new Map();

  var duyuru = document.createElement('p');
  duyuru.className = 'sr-only';
  duyuru.setAttribute('role', 'status');
  duyuru.setAttribute('aria-live', 'polite');
  liste.parentNode.insertBefore(duyuru, liste.nextSibling);

  function duyur(metin) {
    duyuru.textContent = '';
    window.setTimeout(function () { duyuru.textContent = metin || ''; }, 50);
  }

  function balonuKapat(satir) {
    satir.classList.remove('swap-open');
    var dugme = satir.querySelector('.ing-swap');
    if (dugme) dugme.focus();
  }

  function geriAlDugmesi(satir, gorunur) {
    var b = satir.querySelector('[data-alternatif-geri-al]');
    if (b) b.hidden = !gorunur;
  }

  function kontrolDugumunuKaldir(durum) {
    if (durum.kontrol && durum.kontrol.parentNode) durum.kontrol.parentNode.removeChild(durum.kontrol);
    durum.kontrol = null;
  }

  function uygula(satir, dugme) {
    var pop = satir.querySelector('.ing-pop');
    var ad = satir.querySelector('label .in');
    if (!pop || !ad) return;
    var durum = durumlar.get(satir);
    if (!durum) {
      durum = { inHtml: ad.innerHTML, secim: null, kontrol: null };
      durumlar.set(satir, durum);
    }
    durum.secim = dugme.getAttribute('data-alternatif-uygula');

    /* ad + not + "Değiştirildi" (donör: `${name}<small>note</small><small class="replacement-label">Değiştirildi</small>`) */
    ad.textContent = dugme.getAttribute('data-ad') || '';
    var not = dugme.getAttribute('data-not');
    if (not) {
      var s = document.createElement('small');
      s.textContent = not;
      ad.appendChild(s);
    }
    var etiket = document.createElement('small');
    etiket.className = 'replacement-label';
    etiket.textContent = pop.getAttribute('data-l-alt-degisti') || '';
    ad.appendChild(etiket);

    /* miktar */
    kontrolDugumunuKaldir(durum);
    var ayni = dugme.getAttribute('data-ayni-miktar') === '1';
    satir.classList.toggle('olcu-kontrol', !ayni);
    if (!ayni) {
      var iq = satir.querySelector('label .iq');
      var k = document.createElement('span');
      k.className = 'iq-kontrol';
      k.textContent = pop.getAttribute('data-l-alt-olcu') || '';
      if (iq) {
        iq.appendChild(k);
      } else {
        /* miktarsız satır ("tuz, karabiber"): mobil gibi miktar sütununa uyarı yazılır */
        k.className = 'iq iq-kontrol';
        ad.parentNode.insertBefore(k, ad);
      }
      durum.kontrol = k;
    }

    satir.classList.add('is-replaced');
    satir.classList.remove('conv-open');
    geriAlDugmesi(satir, true);
    balonuKapat(satir);
    duyur(pop.getAttribute('data-l-alt-uygulandi'));
  }

  function geriAl(satir) {
    var durum = durumlar.get(satir);
    var pop = satir.querySelector('.ing-pop');
    var ad = satir.querySelector('label .in');
    if (!durum || !ad) return;
    ad.innerHTML = durum.inHtml;
    kontrolDugumunuKaldir(durum);
    satir.classList.remove('is-replaced', 'olcu-kontrol');
    durumlar.delete(satir);
    geriAlDugmesi(satir, false);
    balonuKapat(satir);
    duyur(pop && pop.getAttribute('data-l-alt-geri-alindi'));
  }

  liste.addEventListener('click', function (e) {
    var uygulaDugmesi = e.target.closest('[data-alternatif-uygula]');
    if (uygulaDugmesi && liste.contains(uygulaDugmesi)) {
      e.preventDefault();
      e.stopPropagation();
      uygula(uygulaDugmesi.closest('.ing-row'), uygulaDugmesi);
      return;
    }
    var geriAlDugmesiHedef = e.target.closest('[data-alternatif-geri-al]');
    if (geriAlDugmesiHedef && liste.contains(geriAlDugmesiHedef)) {
      e.preventDefault();
      e.stopPropagation();
      geriAl(geriAlDugmesiHedef.closest('.ing-row'));
    }
  });

  /* Değişen satırda ölçü balonu açılmaz: miktara tıklama donör betiğinin (`tarif-detay.js`, miktar düğümünde) balon
     işleyicisine ulaşmadan yakalanır; etiketin varsayılan davranışı (işaretleme kutusu) sürer. */
  liste.addEventListener('click', function (e) {
    var iq = e.target.closest('.iq');
    if (!iq) return;
    var satir = iq.closest('.ing-row');
    if (satir && satir.classList.contains('is-replaced')) e.stopPropagation();
  }, true);
})();
