/* DadaGastro · Revize 5 madde 26 — görsel, forma girmeden tarayıcıda hazırlanır.
   iPhone fotoğrafı (HEIC) JPEG'e çevrilir; sunucu sınırını (16 MP · 8000 px)
   aşan görselin uzun kenarı 4096 px'e indirilir; 10 MB üstü yeniden sıkıştırılır.
   Dosya girdisinin `change` olayı yakalama evresinde durdurulur, hazırlanan
   dosyalar `input.files`e yazılıp olay yeniden tetiklenir: ekle.js önizlemeyi,
   genişlik uyarısını ve yüklemeyi dönüştürülmüş dosyayla yapar. Sunucu sınırı
   yedektir; hazırlanamayan dosyanın hatası seçim anında görselin yanında çıkar.
   HEIC çözücü (libheif, LGPL-3.0) yalnız tarayıcı HEIC'i kendisi çözemezse,
   ilk HEIC seçiminde yüklenir.
   Madde 43: kabuk da yükler; `[data-gorsel-hazirla]` taşıyan girdi (Görüş
   Bildir ekran görüntüsü) kendi bayt sınırını `data-azami-bayt` ile verir ve
   hatayı `gorsel-hazirla` olayıyla alıp kendisi basar.
   Revize 7 madde 83: tarif kapak/galeri, tarif adım, püf kapak ve püf görsel bloğu
   hazırlandıktan SONRA ve ekle.js'e düşmeden ÖNCE kırpma penceresinden geçer
   (`gorsel-kirp.js`, Cropper.js çentikli kutu). Oran alanın kapsayıcısından okunur ve
   pencerede kilitlidir. Kesimi Cropper yapar (`getCroppedCanvas`), burada özgün biçimde
   kodlanır (JPEG q 0,92). Madde 93: "Kırpmadan kullan"da hazırlanan dosya yeniden kodlanmadan
   forma girer. Vazgeçilen
   görsel forma girmez; önceki onaylı görseller yerinde kalır. GIF'te pencere açılmaz
   (kırpma animasyonu düşürür). Görüş Bildir, yorum ve seri kapağı kırpılmaz. */
(function () {
  'use strict';
  /* Aşama 2 · B (ajan-b4): EN sayfada kabuk sözlüğü (`KabukSozlugu`, <script type="application/json" data-l-js-kabuk>) ve
     sayfanın kendi sözlüğü (<main data-l-js>) basılı; ikisi de okunur. TR'de sözlük yok → TR yedek AYNEN döner. */
  var dmLk = window.dmLk = window.dmLk || function (k, tr, p) {
    var s = null, els = document.querySelectorAll('[data-l-js-kabuk], [data-l-js]');
    for (var i = 0; i < els.length && s === null; i++) {
      try { var a = els[i].getAttribute('data-l-js'); var o = JSON.parse(a ? a : els[i].textContent); if (o && typeof o[k] === 'string') s = o[k]; } catch (e) { /* bozuk sözlük → TR yedek */ }
    }
    var kayitli = s !== null;
    if (s === null) s = tr;
    /* Çoğul (EN): sözlük değeri 'tekil|çoğul' — sayı p.sayi, yoksa p.toplam, yoksa p.n; 1 → ilk biçim, gerisi son biçim; RU (üç kategorili dil, 20 Eki): 'bir|az|çok', kesir → az. */
    if (kayitli && s.indexOf('|') >= 0) { var cn = p ? [p.sayi, p.toplam, p.n].filter(function (x) { return x !== undefined && x !== null && x !== ''; })[0] : undefined; var cb = s.split('|'); var cbi = (function (x) { if (cb.length < 3 || typeof document === 'undefined' || typeof Intl === 'undefined') return -1; var pr = new Intl.PluralRules(document.documentElement.lang || 'tr'); if (pr.resolvedOptions().pluralCategories.indexOf('few') < 0) return -1; x = Math.abs(Number(x)) || 0; if (x !== Math.floor(x)) return 1; var k = pr.select(x); return k === 'one' ? 0 : (k === 'few' ? 1 : 2); })(cn); s = cbi >= 0 ? cb[cbi] : (Number(cn) === 1 ? cb[0] : cb[cb.length - 1]); }
    if (!p) return s;
    /* Laravel'in kuralı: adlar uzundan kısaya, doğrudan değiştirilir (`:minpx` içinde `:min` dolar). */
    Object.keys(p).sort(function (a, b) { return b.length - a.length; }).forEach(function (n) { s = s.split(':' + n).join(String(p[n])); });
    return s;
  };
  /* Aşama 2 · sayfa geneli metin: sunucu yalnız çevrilmiş dilde `[data-l-js]` sözlüğünü basar; yoksa
     Türkçe varsayılan. `:ad`/`:n`/`:mb` yer tutucu; "tekil|çoğul" sayfanın diline göre seçilir. */
  function sayfaMetni(ad, varsayilan, degerler, sayi) {
    var kap = document.querySelector('[data-l-js]'), s = null;
    if (kap) { try { s = JSON.parse(kap.getAttribute('data-l-js')); } catch (e) { s = null; } }
    var m = (s && s[ad]) || dmLk('tarif.' + ad, varsayilan);
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
  // Kabuk da yükler (Görüş Bildir), form sayfası da: iki dinleyici aynı seçimi iki kez işlemesin.
  if (window.__gorselHazirla) return;
  window.__gorselHazirla = true;
  var d = document;
  var betik = d.currentScript;
  var kok = betik ? betik.src.replace(/[?#].*$/, '').replace(/[^/]*$/, '') : '/gastro/';
  // Sınırlar sunucunun sabitleridir; sayfa onları betik etiketine basar.
  function sinir(ad, varsayilan) { var v = betik && Number(betik.getAttribute('data-' + ad)); return v > 0 ? v : varsayilan; }
  var AZAMI_BAYT = sinir('azami-bayt', 10485760);
  var AZAMI_PIKSEL = sinir('azami-piksel', 16000000);
  var AZAMI_KENAR = sinir('azami-kenar', 8000);
  var HEDEF_KENAR = 4096;
  var HEIC_MARKALARI = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'];
  var HAZIR = new WeakSet();
  var cozucu = null;
  var KIRP_SURUM = '20261005-1'; /* B (lead, 5 Eki): gorsel-kirp.js sözlük + çoğul — önbellekteki eski sürüm EN pencerede TR basardı */
  var kirpYuklemesi = null;

  function heicMi(dosya) {
    if (/^image\/hei[cf]/i.test(dosya.type) || /\.hei[cf]$/i.test(dosya.name)) return Promise.resolve(true);
    if (dosya.type && dosya.type !== 'application/octet-stream') return Promise.resolve(false);
    return dosya.slice(4, 12).arrayBuffer().then(function (b) {
      var s = String.fromCharCode.apply(null, new Uint8Array(b));
      return s.slice(0, 4) === 'ftyp' && HEIC_MARKALARI.indexOf(s.slice(4)) !== -1;
    }, function () { return false; });
  }

  function heifYukle() {
    if (cozucu) return cozucu;
    var betikYuklendi = new Promise(function (coz, reddet) {
      var s = d.createElement('script');
      s.src = kok + 'vendor/libheif/libheif.js';
      s.onload = coz; s.onerror = reddet;
      d.head.appendChild(s);
    });
    // Bu derleme wasm'ı eşzamanlı XHR ile ister ve ana iş parçacığında düşer;
    // ikili önceden alınıp `wasmBinary` olarak verilir.
    var ikili = fetch(kok + 'vendor/libheif/libheif.wasm').then(function (r) {
      if (!r.ok) throw new Error('libheif.wasm ' + r.status);
      return r.arrayBuffer();
    });
    cozucu = Promise.all([betikYuklendi, ikili]).then(function (s) {
      return new Promise(function (coz, reddet) {
        if (typeof window.libheif !== 'function') { reddet(new Error('libheif')); return; }
        var hazir = false, modul = null;
        try {
          // Başlatma eşzamanlı da bitebilir: `modul` atanmadan geri çağrı gelirse dönüşte çözülür.
          modul = window.libheif({ wasmBinary: s[1], onRuntimeInitialized: function () { hazir = true; if (modul) coz(modul); } });
        } catch (e) { reddet(e); return; }
        if (hazir) coz(modul);
      });
    });
    cozucu.catch(function () { cozucu = null; });
    return cozucu;
  }

  // Safari HEIC'i kendisi çözer; Chrome ve Firefox libheif'e düşer.
  function heicCoz(dosya) {
    return createImageBitmap(dosya).catch(function () {
      return Promise.all([heifYukle(), dosya.arrayBuffer()]).then(function (s) {
        var lib = s[0], cozum = new lib.HeifDecoder();
        var resimler = cozum.decode(new Uint8Array(s[1]));
        var resim = resimler.filter(function (r) { return r.is_primary(); })[0] || resimler[0];
        if (!resim) throw new Error('heic');
        var w = resim.get_width(), h = resim.get_height();
        var veri = new ImageData(w, h);
        return new Promise(function (coz, reddet) {
          resim.display(veri, function (sonuc) { if (sonuc) coz(sonuc); else reddet(new Error('heic')); });
        }).then(function (sonuc) {
          return createImageBitmap(sonuc);
        }).finally(function () {
          resimler.forEach(function (r) { r.free(); });
          if (cozum.decoder) { lib.heif_context_free(cozum.decoder); cozum.decoder = null; }
        });
      });
    });
  }

  function kodla(kaynak, w, h, tip, kalite) {
    var tuval = d.createElement('canvas');
    tuval.width = w; tuval.height = h;
    var c = tuval.getContext('2d');
    // JPEG saydamlık taşımaz: saydam pikseller siyaha değil beyaza düşsün.
    if (tip === 'image/jpeg') { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); }
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(kaynak, 0, 0, w, h);
    return new Promise(function (coz) { tuval.toBlob(coz, tip, kalite); }).then(function (blob) {
      tuval.width = tuval.height = 0;
      return blob;
    });
  }

  // Saydamlık taşıyabilen kaynak WebP'ye, fotoğraf JPEG'e kodlanır; sıra
  // 10 MB altına inen ilk sonuçta durur. WebP kodlayamayan tarayıcı PNG döndürür.
  function kodlamaSirasi(fotograf) {
    var jpeg = [['image/jpeg', 0.9], ['image/jpeg', 0.8], ['image/jpeg', 0.7]];
    return fotograf ? jpeg : [['image/webp', 0.9], ['image/webp', 0.8]].concat(jpeg);
  }

  function uzanti(tip) { return tip === 'image/jpeg' ? '.jpg' : tip === 'image/webp' ? '.webp' : '.png'; }

  /** Bir dosyayı sunucunun kabul edeceği biçime getirir: {dosya, hata}. */
  function hazirla(dosya, azamiBayt) {
    return heicMi(dosya).then(function (heic) {
      return (heic ? heicCoz(dosya) : createImageBitmap(dosya)).then(function (bmp) {
        var w = bmp.width, h = bmp.height;
        var buyuk = w * h > AZAMI_PIKSEL || Math.max(w, h) > AZAMI_KENAR;
        if (!heic && !buyuk && dosya.size <= azamiBayt) { bmp.close(); return { dosya: dosya }; }
        var oran = buyuk ? HEDEF_KENAR / Math.max(w, h) : 1;
        var hw = Math.max(1, Math.round(w * oran)), hh = Math.max(1, Math.round(h * oran));
        var fotograf = heic || /^image\/jpe?g$/i.test(dosya.type);
        var sira = kodlamaSirasi(fotograf);
        var dene = function (i) {
          return kodla(bmp, hw, hh, sira[i][0], sira[i][1]).then(function (blob) {
            if (blob && blob.size <= azamiBayt) return blob;
            if (i + 1 < sira.length) return dene(i + 1);
            return null;
          });
        };
        return dene(0).then(function (blob) {
          bmp.close();
          if (!blob) return { dosya: dosya, hata: sayfaMetni('js.image_too_large', 'Görsel dosyası en fazla :mb MB olabilir. Daha küçük bir dosya seç.', { mb: Math.floor(azamiBayt / 1048576) }) };
          var ad = dosya.name.replace(/\.[^.]*$/, '') || 'gorsel';
          return { dosya: new File([blob], ad + uzanti(blob.type), { type: blob.type, lastModified: dosya.lastModified }) };
        });
      }, function () {
        // Çözülemeyen dosya olduğu gibi geçer; sunucu yine denetler.
        if (heic) return { dosya: dosya, hata: sayfaMetni('js.heic_failed', 'HEIC/HEIF görsel bu tarayıcıda dönüştürülemedi. Görseli JPG, PNG veya WebP olarak dışa aktarıp yeniden seç.') };
        if (dosya.size > azamiBayt) return { dosya: dosya, hata: sayfaMetni('js.image_too_large', 'Görsel dosyası en fazla :mb MB olabilir. Daha küçük bir dosya seç.', { mb: Math.floor(azamiBayt / 1048576) }) };
        return { dosya: dosya };
      });
    });
  }

  /* ── Madde 83 · kırpma ──────────────────────────────────────────── */
  // Oran "detay kutusuna göre" (Beyar): tarif kapak/galeri, püf kapak ve püf görsel bloğu 16:9 (madde 97: püf formundaki
  // her `blok` ızgarası), tarif adımı 4:3.
  function kirpmaAyari(girdi, adet) {
    var alan = girdi.closest('[data-ek-birak]');
    var izgara = alan && alan.parentNode.querySelector('[data-ek-gorseller]');
    var tur = izgara && izgara.getAttribute('data-ek-gorseller');
    if (tur === 'tarif') return { oran: [16, 9], etiket: dmLk('kabuk_js.gastro.kirp.etiket_tarif', 'Kapak ve galeri görselleri') };
    if (tur === 'kapak') return { oran: [16, 9], etiket: dmLk('kabuk_js.gastro.kirp.etiket_puf', 'Püf kapağı') };
    // Adım alanı tek görsel alır; çoklu seçimi ekle.js kendi hatasıyla geri çevirir, pencere açılmaz.
    if (tur === 'blok' && adet === 1) {
      /* KÜTÜK (ajan-b4b): bu satır `tests/Feature/Revize/Tur7/K/KirpmaSozlesmesiTest.php:61`de KAYNAĞIYLA aranıyor; iki etiket o
         kapı anahtara bakacak şekilde güncellenince `kabuk_js.gastro.kirp.etiket_blok` / `etiket_adim`e taşınır (sözlükte hazır). */
      return izgara.closest('form[data-ek-form="puf"]') ? { oran: [16, 9], etiket: dmLk('kabuk_js.gastro.kirp.etiket_blok', 'Görsel bloğu') } : { oran: [4, 3], etiket: dmLk('kabuk_js.gastro.kirp.etiket_adim', 'Adım görseli') };
    }
    return null;
  }

  function kirpYukle() {
    if (kirpYuklemesi) return kirpYuklemesi;
    kirpYuklemesi = new Promise(function (coz, reddet) {
      var s = d.createElement('script');
      s.src = kok + 'gorsel-kirp.js?v=' + KIRP_SURUM;
      s.onload = function () { window.GorselKirp ? window.GorselKirp.hazir.then(coz, reddet) : reddet(new Error('GorselKirp')); };
      s.onerror = reddet;
      d.head.appendChild(s);
    });
    kirpYuklemesi.catch(function () { kirpYuklemesi = null; });
    return kirpYuklemesi;
  }

  function gifMi(dosya) {
    if (/^image\/gif$/i.test(dosya.type)) return Promise.resolve(true);
    return dosya.slice(0, 4).arrayBuffer().then(function (b) {
      return String.fromCharCode.apply(null, new Uint8Array(b)) === 'GIF8';
    }, function () { return false; });
  }

  // Kırpılan alan kaynak çözünürlüğündedir (getCroppedCanvas); sunucunun genişlik eşiği uyarısı ekle.js'te aynen çalışır.
  function kirpKodla(dosya, sonuc, azamiBayt) {
    var tuval = sonuc.tuval, w = tuval.width, h = tuval.height;
    // Kutu görselin tamamıysa yeniden kodlanmaz.
    if (w === sonuc.kaynak[0] && h === sonuc.kaynak[1]) return Promise.resolve({ dosya: dosya });
    var tip = /^image\/(jpeg|png|webp)$/i.test(dosya.type) ? dosya.type.toLowerCase() : 'image/jpeg';
    var sira = [[tip, tip === 'image/png' ? undefined : 0.92]].concat(kodlamaSirasi(tip === 'image/jpeg'));
    var dene = function (i) {
      return kodla(tuval, w, h, sira[i][0], sira[i][1]).then(function (blob) {
        if (blob && blob.size <= azamiBayt) return blob;
        if (i + 1 < sira.length) return dene(i + 1);
        return null;
      });
    };
    return dene(0).then(function (blob) {
      tuval.width = tuval.height = 0;
      if (!blob) return { dosya: dosya, hata: sayfaMetni('js.image_too_large', 'Görsel dosyası en fazla :mb MB olabilir. Daha küçük bir dosya seç.', { mb: Math.floor(azamiBayt / 1048576) }) };
      var ad = blob.type === dosya.type ? dosya.name : (dosya.name.replace(/\.[^.]*$/, '') || 'gorsel') + uzanti(blob.type);
      return { dosya: new File([blob], ad, { type: blob.type, lastModified: Date.now() }) };
    });
  }

  // Sırayla: her görsel kendi penceresinde. Vazgeçilen görsel listeden düşer.
  function kirp(girdi, sonuclar, bayt) {
    var ayar = kirpmaAyari(girdi, sonuclar.length);
    if (!ayar) return Promise.resolve(sonuclar);
    var adaylar = sonuclar.filter(function (s) { return !s.hata; });
    if (!adaylar.length) return Promise.resolve(sonuclar);
    return kirpYukle().then(function () {
      var sira = 0;
      return sonuclar.reduce(function (zincir, s) {
        return zincir.then(function (kalan) {
          if (s.hata) return kalan.concat([s]);
          return gifMi(s.dosya).then(function (gif) {
            if (gif) return kalan.concat([s]);
            sira += 1;
            return window.GorselKirp.ac(s.dosya, { oran: ayar.oran, etiket: ayar.etiket, sira: sira, toplam: adaylar.length }).then(function (sonuc) {
              if (sonuc === null) return kalan;
              // 'ham' (kırpmadan kullan) ve 'atla': hazırlanan dosya olduğu gibi.
              if (sonuc === 'ham' || sonuc === 'atla') return kalan.concat([s]);
              return kirpKodla(s.dosya, sonuc, bayt).catch(function () { return s; }).then(function (k) { return kalan.concat([k]); });
            });
          });
        });
      }, Promise.resolve([]));
    }, function () { return sonuclar; });
  }

  function hataYaz(girdi, izgara, oncekiler, sonuclar) {
    var yeni = izgara ? Array.prototype.filter.call(izgara.querySelectorAll('.ek-gorsel'), function (k) { return oncekiler.indexOf(k) === -1; }) : [];
    sonuclar.forEach(function (s, i) {
      if (!s.hata) return;
      var kutu = izgara ? yeni[i] : girdi;
      if (!kutu) return;
      var not = kutu.tagName === 'INPUT' ? kutu.parentNode.querySelector('[data-ek-gorsel-not]') : kutu.querySelector('[data-ek-gorsel-not]');
      if (!not) {
        not = d.createElement('span');
        not.setAttribute('data-ek-gorsel-not', ''); not.setAttribute('role', 'status');
        if (kutu.tagName === 'INPUT') kutu.insertAdjacentElement('afterend', not); else kutu.appendChild(not);
      }
      not.className = 'ek-gorsel-not yetersiz';
      not.textContent = '';
      var ikon = d.createElement('i');
      ikon.className = 'fa-solid fa-triangle-exclamation'; ikon.setAttribute('aria-hidden', 'true');
      not.append(ikon, d.createTextNode(s.hata));
      if (kutu.tagName !== 'INPUT') kutu.classList.add('ek-gorsel-yetersiz');
    });
  }

  function mesgul(girdi, acik) {
    var alan = girdi.closest('[data-ek-birak]');
    var form = girdi.closest('form');
    if (alan) {
      alan.classList.toggle('uzerinde', acik);
      if (acik) alan.setAttribute('aria-busy', 'true'); else alan.removeAttribute('aria-busy');
    }
    if (!form) return;
    // Hazırlık sürerken kaydedilen taslak görseli kaçırırdı.
    Array.prototype.forEach.call(form.querySelectorAll('[data-ek-gonder],[data-ek-taslak]'), function (b) {
      if (acik) { if (!b.disabled) { b.disabled = true; b.setAttribute('data-gh-kilit', ''); } }
      else if (b.hasAttribute('data-gh-kilit')) { b.disabled = false; b.removeAttribute('data-gh-kilit'); }
    });
  }

  function isle(girdi, dosyalar) {
    var liste = Array.prototype.slice.call(dosyalar);
    var alan = girdi.closest('[data-ek-birak]');
    var izgara = alan && alan.parentNode.querySelector('[data-ek-gorseller]');
    // Girdi kendi sınırını taşıyabilir (Görüş Bildir ekran görüntüsü 5 MB).
    var bayt = Number(girdi.getAttribute('data-azami-bayt')) || AZAMI_BAYT;
    mesgul(girdi, true);
    // Sırayla: 24 MP'lik iki görsel aynı anda çözülürse bellek iki katına çıkar.
    return liste.reduce(function (zincir, f) {
      return zincir.then(function (sonuclar) {
        return hazirla(f, bayt).catch(function () { return { dosya: f }; }).then(function (s) { return sonuclar.concat([s]); });
      });
    }, Promise.resolve([])).then(function (sonuclar) {
      return kirp(girdi, sonuclar, bayt);
    }).then(function (sonuclar) {
      mesgul(girdi, false);
      if (!girdi.isConnected) return;
      // Hepsinden vazgeçildi: forma yeni görsel girmez, öncekiler yerinde kalır.
      if (!sonuclar.length) { girdi.value = ''; return; }
      var aktarim = new DataTransfer();
      sonuclar.forEach(function (s) { aktarim.items.add(s.dosya); });
      var oncekiler = izgara ? Array.prototype.slice.call(izgara.querySelectorAll('.ek-gorsel')) : [];
      girdi.files = aktarim.files;
      // Kendi yüzeyini kuran girdi (Görüş Bildir) hatayı olayla alır ve kendisi basar.
      var kendisi = girdi.hasAttribute('data-gorsel-hazirla');
      if (kendisi) {
        girdi.dispatchEvent(new CustomEvent('gorsel-hazirla', { detail: { hatalar: sonuclar.map(function (s) { return s.hata || null; }) } }));
      }
      HAZIR.add(girdi);
      try { girdi.dispatchEvent(new Event('change', { bubbles: true })); } finally { HAZIR.delete(girdi); }
      if (!kendisi) hataYaz(girdi, izgara, oncekiler, sonuclar);
    });
  }

  function gorselGirdisi(el) {
    return el && el.tagName === 'INPUT' && el.type === 'file' &&
      (el.closest('[data-ek-birak]') || el.hasAttribute('data-video-kapak-dosya') || el.hasAttribute('data-gorsel-hazirla'));
  }

  d.addEventListener('change', function (e) {
    var girdi = e.target;
    if (!gorselGirdisi(girdi) || HAZIR.has(girdi) || !girdi.files || !girdi.files.length) return;
    e.stopImmediatePropagation();
    isle(girdi, girdi.files);
  }, true);

  // Sürükle-bırak da aynı yoldan geçer: dosyalar girdiye yazılıp `change` tetiklenir.
  d.addEventListener('drop', function (e) {
    var alan = e.target.closest && e.target.closest('[data-ek-birak]');
    var girdi = alan && alan.querySelector('input[type="file"]');
    if (!girdi || girdi.disabled || !e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    alan.classList.remove('uzerinde');
    isle(girdi, e.dataTransfer.files);
  }, true);
})();
