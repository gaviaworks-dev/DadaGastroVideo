/* Revize P1 · kulvar dosyası — sahibi: tarif-liste-veri. Tarif detay (/tarif/{slug}) ve — Revize 5 · madde 42 ortak yorum
   bileşeni için — püf detayı (/puf-noktalari/{slug}) yükler; her blok kendi öğesi yoksa sessizce döner. */

/* ── Kalem 3 · "Bunları da seveceksin" ok düğmeleri ─────────────────────────
   Kaydırma kanonun kendi işleyicisinde (`app.js` [data-slider-dir] → scrollBy);
   burada TEKRAR bağlanmaz. Ölçüldü: 1440'ta 4 kart rayı dolduruyor
   (scrollWidth 1178 / clientWidth 1176) ve iki ok tıklanınca hiçbir şey
   olmuyordu (scrollLeft 2→2) — kanonda da aynı. 390'da ray taşıyor ve oklar
   çalışıyor (2→326).
   eklendi: kaydırılacak yer kalmayan yöndeki ok `disabled` olur — kanonun kendi
   kalıbı (`tokens.css` `.row-nav button:disabled{opacity:.35;pointer-events:none}`).
   Ray sığıyorsa ikisi de pasif; tıklanıp hiçbir şey yapmayan düğme kalmaz. */
(function () {
  var ray = document.getElementById('simTrack');
  if (!ray) return;
  var geri = document.querySelector('[data-slider-for="simTrack"][data-slider-dir="prev"]');
  var ileri = document.querySelector('[data-slider-for="simTrack"][data-slider-dir="next"]');
  if (!geri || !ileri) return;

  /* 4 px tolerans: 1440'taki 2 px'lik taşma kaydırılabilir alan sayılmaz. */
  var TOLERANS = 4;

  function esitle() {
    var kalan = ray.scrollWidth - ray.clientWidth;
    geri.disabled = ray.scrollLeft <= TOLERANS;
    ileri.disabled = kalan - ray.scrollLeft <= TOLERANS;
  }

  ray.addEventListener('scroll', esitle, { passive: true });
  window.addEventListener('resize', esitle);
  window.addEventListener('load', esitle);
  esitle();
})();

/* ── Kalem 13 · yorum kartının satır içi formları (Yanıtla · Düzenle) ──────────
   İki form da donörün `.c-reply-form` kalıbında. Kanonun `tarif-detay.js`
   işleyicisi (`[data-reply-toggle]`) formu `closest('.c-main').querySelector('.c-reply-form')`
   ile buluyor: üst yorumun `.c-main`i yanıtları da içerdiği için, üyenin kendi
   yanıtının düzenleme formu DOM'da önce geliyor ve "Yanıtla" YANLIŞ formu açıyordu
   (ölçüldü). Bu yüzden düğme formu adıyla (`data-yorum-form-ac` = form id)
   hedefler; kanon işleyicisinin özniteliği markup'ta yok, iki işleyici çakışmaz.
   Aynı kartta tek form açık kalır; açılan formun textarea'sı odak alır. */
(function () {
  document.addEventListener('click', function (e) {
    var ac = e.target.closest('[data-yorum-form-ac]');
    if (ac) {
      var form = document.getElementById(ac.getAttribute('data-yorum-form-ac'));
      if (!form) return;
      var acilacak = form.hidden;
      var kart = ac.closest('.c-main');
      if (kart && acilacak) {
        kart.querySelectorAll(':scope > .c-reply-form').forEach(function (f) {
          if (f !== form) f.hidden = true;
        });
        kart.querySelectorAll(':scope > .c-acts [data-yorum-form-ac]').forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
        });
      }
      form.hidden = !acilacak;
      ac.setAttribute('aria-expanded', acilacak ? 'true' : 'false');
      if (acilacak) {
        var alan = form.querySelector('textarea');
        if (alan) alan.focus();
      }
      return;
    }
    var kapat = e.target.closest('[data-yorum-form-kapat]');
    if (kapat) {
      var f = kapat.closest('.c-reply-form');
      if (!f) return;
      f.hidden = true;
      var dugme = document.querySelector('[data-yorum-form-ac="' + f.id + '"]');
      if (dugme) dugme.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ── Kalem 15 · puanlı yorum formunun fotoğrafları ────────────────────────────
   Yıldız, "Puan vermeden yorum gönderilemez" engeli ve üst yorumun düzenleme kipi
   kanonun `tarif-detay.js` işleyicisinde (`#revForm` · `[data-review-edit]`).
   Burada yalnız fotoğraf: seçim (`#rfDosya`) → projenin üye yükleme ucu
   (`IcerikMedyaYuklemeServisi` · alan `gorsel` · yanıt `{data:{id,url}}`) →
   önizleme parçası (`.rf-ph` · donör kalıbı) + gizli `medya_idler[]` + tek tek kaldırma.
   En fazla 3: 3 parçada düğme pasif; fazlası seçilirse okunan cümleyle reddedilir.
   Kanonun `#rfFile` işleyicisi `file` alanı ve `thumb_url` bekliyor — bu uçla uyuşmadığı
   için girdinin adı farklı, iki işleyici çakışmaz. */
(function () {
  var form = document.getElementById('revForm');
  var girdi = document.getElementById('rfDosya');
  var dugme = document.getElementById('rfPhotoBtn');
  var kutu = document.getElementById('rfChips');
  var hata = document.getElementById('rfFotoHata');
  if (!form || !girdi || !dugme || !kutu) return;
  var azami = parseInt(form.getAttribute('data-foto-azami'), 10) || 3;
  var uc = form.getAttribute('data-foto-yukle-url');
  var gonder = document.getElementById('rfSubmit');
  var bekleyen = 0;
  /* Revize 5 · madde 50 (D2): girdi `data-gorsel-hazirla` taşır; kabuğun `gorsel-hazirla.js`i
     (tarif formunun hattı) seçimi yakalar, HEIC'i JPEG'e çevirir, büyük görseli küçültür ve
     hazırlanan dosyalarla `change`i yeniden tetikler. Hazırlanamayan dosyanın cümlesi
     `gorsel-hazirla` olayıyla gelir; o dosya yüklenmez. Hazırlık ve yükleme sürerken
     "Yorumu Paylaş" kilitlidir (tarif formunda da öyle), yoksa fotoğraf yorumdan düşerdi. */
  var hazirlaniyor = false;
  var hazirlikHatalari = [];
  /* Revize P1 · Kalem 14 — okunan cümle `#revForm[data-l-*]`dan (Blade yalnız kaynak dil dışında basar);
     öznitelik yoksa bugünkü Türkçe metin. */
  function metin(ad, varsayilan) { return form.getAttribute('data-l-' + ad) || varsayilan; }
  function azamiCumlesi() { return metin('foto-azami', 'En fazla :n fotoğraf ekleyebilirsin.').replace(':n', String(azami)); }

  function jeton() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.content : '';
  }
  function hataYaz(metin) {
    if (!hata) return;
    hata.textContent = metin || '';
    hata.hidden = !metin;
  }
  function sayi() { return kutu.querySelectorAll('.rf-ph').length + bekleyen; }
  function esitle() {
    dugme.disabled = hazirlaniyor || sayi() >= azami;
    if (!gonder) return;
    if (hazirlaniyor || bekleyen > 0) {
      if (!gonder.disabled) { gonder.disabled = true; gonder.setAttribute('data-rf-kilit', ''); }
    } else if (gonder.hasAttribute('data-rf-kilit')) {
      gonder.disabled = false;
      gonder.removeAttribute('data-rf-kilit');
    }
  }

  // Yakalama evresi, `gorsel-hazirla.js`in belge dinleyicisinden önce: seçim anında kilitlenir.
  window.addEventListener('change', function (e) {
    if (e.target !== girdi || !girdi.files || !girdi.files.length) return;
    hazirlaniyor = true;
    esitle();
  }, true);
  girdi.addEventListener('gorsel-hazirla', function (e) {
    hazirlikHatalari = (e.detail && e.detail.hatalar) || [];
  });

  function parcaEkle(id, url) {
    var p = document.createElement('span');
    p.className = 'rf-ph';
    p.style.backgroundImage = "url('" + url + "')";
    var kaldir = document.createElement('button');
    kaldir.type = 'button';
    kaldir.setAttribute('aria-label', metin('foto-kaldir', 'Fotoğrafı kaldır'));
    kaldir.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    kaldir.addEventListener('click', function () { p.remove(); hataYaz(''); esitle(); });
    var gizli = document.createElement('input');
    gizli.type = 'hidden';
    gizli.name = 'medya_idler[]';
    gizli.value = String(id);
    p.appendChild(kaldir);
    p.appendChild(gizli);
    kutu.appendChild(p);
    esitle();
  }
  function kutuyuKur(liste) {
    kutu.innerHTML = '';
    (liste || []).forEach(function (f) { parcaEkle(f.id, f.url); });
    esitle();
  }

  try { kutuyuKur(JSON.parse(kutu.getAttribute('data-fotolar') || '[]')); } catch (e) { kutuyuKur([]); }

  dugme.addEventListener('click', function () {
    if (sayi() >= azami) { hataYaz(azamiCumlesi()); return; }
    girdi.click();
  });

  girdi.addEventListener('change', function () {
    var hatalar = hazirlikHatalari;
    hazirlikHatalari = [];
    hazirlaniyor = false;
    var dosyalar = [].slice.call(girdi.files || []).filter(function (f, i) { return !hatalar[i]; });
    var ilkHata = hatalar.filter(Boolean)[0];
    var yer = azami - sayi();
    if (dosyalar.length > yer) {
      hataYaz(azamiCumlesi());
    } else {
      hataYaz(ilkHata || '');
    }
    esitle();
    dosyalar.slice(0, Math.max(0, yer)).forEach(function (dosya) {
      var veri = new FormData();
      veri.append('gorsel', dosya);
      bekleyen++;
      esitle();
      fetch(uc, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': jeton(), Accept: 'application/json' }, body: veri })
        .then(function (yanit) {
          return yanit.json().then(function (j) { return { ok: yanit.ok, j: j }; }, function () { return { ok: yanit.ok, j: null }; });
        })
        .then(function (r) {
          bekleyen--;
          if (r.ok && r.j && r.j.data) {
            parcaEkle(r.j.data.id, r.j.data.url);
          } else {
            var ilk = r.j && r.j.errors ? r.j.errors[Object.keys(r.j.errors)[0]] : null;
            hataYaz((ilk && ilk[0]) || (r.j && r.j.message) || metin('foto-yuklenemedi', 'Fotoğraf yüklenemedi.'));
            esitle();
          }
        })
        .catch(function () { bekleyen--; hataYaz(metin('foto-yuklenemedi', 'Fotoğraf yüklenemedi.')); esitle(); });
    });
    girdi.value = '';
  });

  /* Üst yorumun düzenleme kipi: kanon işleyicisi puanı/metni/adresi/_method'u kuruyor;
     fotoğraflar ve "hangi yorum" alanı burada. */
  document.querySelectorAll('[data-review-edit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var alan = document.getElementById('rfDuzenlenen');
      if (alan) alan.value = b.getAttribute('data-yorum-id') || '';
      try { kutuyuKur(JSON.parse(b.getAttribute('data-fotolar') || '[]')); } catch (e) { kutuyuKur([]); }
      hataYaz('');
      form.classList.remove('sent');
      var tamam = document.getElementById('rfSuccess');
      if (tamam) tamam.hidden = true;
    });
  });
})();
