/* Dada Video Oynatıcı — sağlayıcıdan bağımsız oynatıcı modülü (Video Mutfağı · P0-1).

   ── KULLANIM SÖZLEŞMESİ ─────────────────────────────────────────────────────────────────────────────────────
   Sunucu, erişim kapısından geçen her video için bir OynatmaTanimi JSON'u basar
   (`App\Servisler\Video\OynatmaTanimiSunumu::json`, öznitelik `data-video-tanim`). Erişemeyen okuyucuya ya da
   kaynağı olmayan kayda tanım basılmaz; tanım yoksa sayfa oynatma yüzeyini hiç basmaz (yalan yüzey yok).

   Tanım alanları (PHP `App\Servisler\Video\Kaynak\OynatmaTanimi::dizi`):
     tur                 'dosya' (<video>, mp4) · 'gomme' (sağlayıcı iframe'i) · 'akis' (HLS manifest)
     saglayici           'yukleme' · 'youtube' · 'vimeo' · (ileride başka kod)
     adres               sitenin kapılı oynatma ucu (dosya: mp4 akışı · gomme: ?embed=1 302'si · akis: manifest)
     gomme_adresi        gomme'de sağlayıcının gömme adresi, köprü parametreleriyle (YouTube enablejsapi/playsinline/
                         origin, Vimeo api/player_id). Sunucu iframe src'ini bununla basarsa modül src'e DOKUNMAZ
     zaman_kontrolu      bölüme atlama / anlık süre okunabilir mi
     onizleme_adresi     üstüne gelince oynayan klip (bugün hep null)
     content_url, embed_url, saglayici_sure_sn, saglayici_kapak_url   JSON-LD / bilgi alanları (modül kullanmaz)
     hls_js              (yalnız akis) hls.js'in sitedeki yerel yolu ya da null

   API (global ad alanı `window.DadaVideoOynatici`):
     DadaVideoOynatici.oku(oge)                 → oge'nin `data-video-tanim` JSON'u (nesne) ya da null
     DadaVideoOynatici.destekler(tanim)         → bu tarayıcıda bu tanım oynatılabilir mi (false → yüzeyi GİZLE)
     DadaVideoOynatici.bagla(kap, tanim?, sec?) → oynatıcı nesnesi ya da null (tanim verilmezse kap'tan okunur)
         kap: oynatıcının kabı. İçinde <video> / <iframe> varsa (donör markup'ı) ONLAR kullanılır, yoksa
              oluşturulur. Etkin olmayan öğe `hidden` yapılır. Aynı kaba ikinci bagla öncekini bırakır.
         sec.baslik: oluşturulan iframe'in `title`ı (erişilebilirlik; dil dosyası `arayuz_video.oynatici`).
     oynatici.tur                               'dosya' | 'gomme' | 'akis'
     oynatici.zamanKontroluVar                  false ise bölüme atla / süre denetimleri GİZLENİR
     oynatici.oynat() · oynatici.duraklat()     uygulandıysa true
     oynatici.atla(saniye)                      uygulandıysa true (hazır değilse sıraya alınır, hazır olunca uygulanır)
     oynatici.anlikSureyeAbone(function (saniye, toplamSaniyeYaDaNull) {})  → aboneliği bitiren işlev
     oynatici.birak()                           durdurur, kaynağı boşaltır, dinleyicileri kaldırır (pencere kapanışı)

   Sürücüler:
     dosya         HTML5 <video preload="none">; `adres`ten akar (Range destekli uç).
     gomme/youtube iframe `enablejsapi=1`; komutlar ve süre postMessage köprüsüyle. YouTube IFrame API betiği
                   DIŞARIDAN YÜKLENMEZ. Kaptaki iframe aynı video + `enablejsapi=1` + `origin`=sayfa kökeni taşıyorsa
                   src yazılmaz (tek belge isteği), yalnız el sıkışma başlar; taşımıyorsa src yazılır (geri uyum).
     gomme/vimeo   postMessage (`setCurrentTime`, `play`, `pause`, `timeupdate` olayı). Aynı koruma: aynı video +
                   `api=1` ise src yazılmaz.
     gomme/başka   düz iframe; zaman kontrolü yok (zamanKontroluVar = false).
     akis          yalnız tarayıcının yerel HLS desteği (`canPlayType('application/vnd.apple.mpegurl')`). Desteklemeyen
                   tarayıcı için kanca: tanımda `hls_js` (config `video.hls_js_yolu`) varsa hls.js o YEREL yoldan tembel
                   yüklenir. Bugün o dosya YOK ve `hls_js` null → akış dalı bu tarayıcılarda DEVRE DIŞI
                   (`destekler` false döner). Bugün `akis` döndüren sağlayıcı da yok.

   Bu modül bugün hiçbir sayfaya bağlı değildir; hub ve izle kulvarları bağlar.
   ──────────────────────────────────────────────────────────────────────────────────────────────────────────── */
(function (kok) {
  'use strict';

  var YT_KOKENLERI = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];
  var VIMEO_KOKENI = 'https://player.vimeo.com';
  var HLS_TURU = 'application/vnd.apple.mpegurl';
  var HAZIR_DENEME_ARALIGI = 250;
  var HAZIR_DENEME_SAYISI = 40;
  var sayac = 0;
  var etkinler = typeof WeakMap === 'function' ? new WeakMap() : null;

  function oku(oge) {
    var ham = oge && oge.getAttribute ? oge.getAttribute('data-video-tanim') : null;
    if (!ham) return null;
    try {
      var tanim = JSON.parse(ham);
      return tanim && typeof tanim === 'object' && typeof tanim.tur === 'string' && typeof tanim.adres === 'string' ? tanim : null;
    } catch (e) {
      return null;
    }
  }

  function yerelHlsVar() {
    var v = document.createElement('video');
    return !!(v.canPlayType && v.canPlayType(HLS_TURU));
  }

  /* hls.js yalnız aynı kökenden (CDN yok); sunucu da aynı kuralı uygular (`OynatmaTanimiSunumu::hlsJsYolu`). */
  function hlsYolu(tanim) {
    var yol = tanim && tanim.hls_js;
    return typeof yol === 'string' && yol.charAt(0) === '/' && yol.charAt(1) !== '/' ? yol : null;
  }

  function guvenliAdres(ham) {
    try {
      var adres = new URL(ham, kok.location.href);
      return adres.protocol === 'https:' ? adres : null;
    } catch (e) {
      return null;
    }
  }

  function destekler(tanim) {
    if (!tanim || typeof tanim.adres !== 'string' || tanim.adres === '') return false;
    if (tanim.tur === 'dosya') return true;
    if (tanim.tur === 'gomme') {
      var adres = guvenliAdres(tanim.gomme_adresi);
      if (!adres) return false;
      if (tanim.saglayici === 'youtube') return YT_KOKENLERI.indexOf(adres.origin) >= 0;
      if (tanim.saglayici === 'vimeo') return adres.origin === VIMEO_KOKENI;
      return true;
    }
    if (tanim.tur === 'akis') return yerelHlsVar() || hlsYolu(tanim) !== null;
    return false;
  }

  function videoOgesi(kap) {
    var v = kap.querySelector('video');
    if (!v) {
      v = document.createElement('video');
      v.setAttribute('controls', '');
      v.setAttribute('playsinline', '');
      kap.appendChild(v);
    }
    v.setAttribute('preload', 'none');
    return v;
  }

  function iframeOgesi(kap, sec) {
    var f = kap.querySelector('iframe');
    if (!f) {
      f = document.createElement('iframe');
      f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      if (sec && sec.baslik) f.setAttribute('title', sec.baslik);
      kap.appendChild(f);
    }
    /* Revize 7 · madde 94 — YouTube gömmesi referrer'sız isteği "Hata 153" ile reddediyor (ölçüldü). `origin`
       sağlayıcıya yalnız sitenin kökenini verir, tam sayfa adresini vermez — çalışan en dar değer. Donör
       markup'ında yazılı bir değer varsa (Video Mutfağı penceresi: `origin`) ona DOKUNULMAZ. */
    if (!f.hasAttribute('referrerpolicy')) f.setAttribute('referrerpolicy', 'origin');
    return f;
  }

  /* Kaptaki etkin olmayan öğe türünü durdurup gizler. */
  function digeriniGizle(kap, etkin) {
    var ogeler = kap.querySelectorAll('video, iframe');
    for (var i = 0; i < ogeler.length; i++) {
      var o = ogeler[i];
      if (o === etkin) continue;
      if (o.tagName === 'VIDEO') {
        o.pause();
        if (o.hasAttribute('src')) {
          o.removeAttribute('src');
          o.load();
        }
      } else if (o.getAttribute('src') && o.getAttribute('src') !== 'about:blank') {
        o.src = 'about:blank';
      }
      o.hidden = true;
    }
    etkin.hidden = false;
  }

  function mesajVerisi(e) {
    var veri = e.data;
    if (typeof veri === 'string') {
      try { veri = JSON.parse(veri); } catch (x) { return null; }
    }
    return veri && typeof veri === 'object' ? veri : null;
  }

  /* ── Sürücüler: her biri { oynat, duraklat, atla, birak, zaman } döndürür ── */

  function medyaSurucusu(o, v) {
    var bekleyen = null;
    function sure() { o._yayinla(v.currentTime, isFinite(v.duration) ? v.duration : null); }
    function metaGeldi() {
      if (bekleyen !== null) { v.currentTime = bekleyen; bekleyen = null; }
    }
    v.addEventListener('timeupdate', sure);
    v.addEventListener('loadedmetadata', metaGeldi);
    return {
      zaman: true,
      oynat: function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); return true; },
      duraklat: function () { v.pause(); return true; },
      /* preload="none": üst veri gelmeden atama tarayıcıya göre yutulabilir; o yüzden üst veri gelince uygulanır. */
      atla: function (sn) {
        if (v.readyState >= 1) v.currentTime = sn; else bekleyen = sn;
        return true;
      },
      birak: function () {
        v.removeEventListener('timeupdate', sure);
        v.removeEventListener('loadedmetadata', metaGeldi);
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    };
  }

  function dosyaSurucusu(o, kap, tanim) {
    var v = videoOgesi(kap);
    digeriniGizle(kap, v);
    var s = medyaSurucusu(o, v);
    v.src = tanim.adres;
    return s;
  }

  var hlsBekleyenler = null;
  function hlsYukle(yol, bitti) {
    if (kok.Hls) { bitti(kok.Hls); return; }
    if (hlsBekleyenler) { hlsBekleyenler.push(bitti); return; }
    hlsBekleyenler = [bitti];
    var betik = document.createElement('script');
    betik.src = yol;
    betik.async = true;
    function sonuc() {
      var hepsi = hlsBekleyenler; hlsBekleyenler = null;
      for (var i = 0; i < hepsi.length; i++) hepsi[i](kok.Hls || null);
    }
    betik.onload = sonuc;
    betik.onerror = sonuc;
    document.head.appendChild(betik);
  }

  function akisSurucusu(o, kap, tanim) {
    var v = videoOgesi(kap);
    digeriniGizle(kap, v);
    var s = medyaSurucusu(o, v);
    var hls = null;
    if (v.canPlayType(HLS_TURU)) {
      v.src = tanim.adres;
    } else {
      hlsYukle(hlsYolu(tanim), function (Hls) {
        if (o._birakildi || !Hls || !Hls.isSupported()) return;
        hls = new Hls();
        hls.loadSource(tanim.adres);
        hls.attachMedia(v);
      });
    }
    var birak = s.birak;
    s.birak = function () { if (hls) hls.destroy(); birak(); };
    return s;
  }

  /* Kaptaki iframe zaten aynı sağlayıcı + aynı video kimliğini ve köprünün gerekli parametrelerini taşıyor mu?
     Taşıyorsa (sunucu `src`i `gomme_adresi` ile bastı) `src`e DOKUNULMAZ: yeniden yazmak belgeyi ikinci kez yükler.
     Karşılaştırma köken + yol (yol video kimliğini taşır: `/embed/<id>`, `/video/<id>`) ve `gerekli` değerlerle. */
  function ayniGomme(f, istenen, gerekli) {
    var ham = f.getAttribute('src');
    if (!ham || ham === 'about:blank') return false;
    var mevcut = guvenliAdres(ham);
    if (!mevcut || mevcut.origin !== istenen.origin
      || mevcut.pathname.replace(/\/+$/, '') !== istenen.pathname.replace(/\/+$/, '')) return false;
    for (var ad in gerekli) {
      if (Object.prototype.hasOwnProperty.call(gerekli, ad) && mevcut.searchParams.get(ad) !== gerekli[ad]) return false;
    }
    return true;
  }

  /* postMessage köprüsü ortak gövdesi: hazır olana kadar komutlar sıraya alınır, el sıkışma yinelenir.
     `adres` null → iframe zaten doğru belgeyi taşıyor (`ayniGomme`): `src` yazılmaz, el sıkışma HEMEN başlar (belge
     yüklenmiş olabilir, `load` bir daha gelmeyebilir) ve `load` gelirse yinelenir. */
  function kopruSurucusu(o, f, adres, koken, elSikis, cevir, isle) {
    var hazir = false;
    var kuyruk = [];
    var deneme = null;
    var kalan = HAZIR_DENEME_SAYISI;
    function gonder(nesne) {
      if (f.contentWindow) f.contentWindow.postMessage(JSON.stringify(nesne), koken);
    }
    function hazirOl() {
      if (hazir) return;
      hazir = true;
      if (deneme) { clearInterval(deneme); deneme = null; }
      var bekleyen = kuyruk.splice(0);
      for (var i = 0; i < bekleyen.length; i++) gonder(bekleyen[i]);
    }
    function komut(ad, deger) {
      var nesne = cevir(ad, deger);
      if (hazir) gonder(nesne); else kuyruk.push(nesne);
      return true;
    }
    function dinleyici(e) {
      if (e.source !== f.contentWindow || e.origin !== koken) return;
      var veri = mesajVerisi(e);
      if (veri) isle(veri, hazirOl, gonder);
    }
    function yuklendi() {
      if (hazir || deneme) return;
      kalan = HAZIR_DENEME_SAYISI;
      gonder(elSikis);
      deneme = setInterval(function () {
        if (hazir || --kalan <= 0) { clearInterval(deneme); deneme = null; return; }
        gonder(elSikis);
      }, HAZIR_DENEME_ARALIGI);
    }
    kok.addEventListener('message', dinleyici);
    f.addEventListener('load', yuklendi);
    if (adres === null) yuklendi(); else f.src = adres;
    return {
      zaman: true,
      oynat: function () { return komut('oynat'); },
      duraklat: function () { return komut('duraklat'); },
      atla: function (sn) { return komut('atla', sn); },
      birak: function () {
        kok.removeEventListener('message', dinleyici);
        f.removeEventListener('load', yuklendi);
        if (deneme) clearInterval(deneme);
        f.src = 'about:blank';
      }
    };
  }

  function youtubeSurucusu(o, kap, tanim, sec) {
    var f = iframeOgesi(kap, sec);
    digeriniGizle(kap, f);
    var adres = guvenliAdres(tanim.gomme_adresi);
    var kimlik = 'dada-video-' + (++sayac);
    /* Sunucu bu parametreleri `gomme_adresi`nde zaten taşır; `set` aynı değeri yineler. `origin` sayfanın kökeniyle
       aynı olmalı: YouTube yanıtlarını yalnız ona gönderir, uyuşmazsa adres burada yeniden yazılır. */
    adres.searchParams.set('enablejsapi', '1');
    adres.searchParams.set('origin', kok.location.origin);
    adres.searchParams.set('playsinline', '1');
    var koru = ayniGomme(f, adres, { enablejsapi: '1', origin: kok.location.origin });
    var toplam = null;
    var islevler = { oynat: 'playVideo', duraklat: 'pauseVideo', atla: 'seekTo' };
    return kopruSurucusu(o, f, koru ? null : adres.toString(), adres.origin,
      { event: 'listening', id: kimlik, channel: 'widget' },
      function (ad, deger) {
        return { event: 'command', func: islevler[ad], args: ad === 'atla' ? [deger, true] : [], id: kimlik, channel: 'widget' };
      },
      function (veri, hazirOl) {
        if (veri.event === 'onReady' || veri.event === 'initialDelivery' || veri.event === 'infoDelivery') hazirOl();
        var bilgi = veri.info;
        if ((veri.event === 'infoDelivery' || veri.event === 'initialDelivery') && bilgi && typeof bilgi === 'object') {
          if (typeof bilgi.duration === 'number' && bilgi.duration > 0) toplam = bilgi.duration;
          if (typeof bilgi.currentTime === 'number') o._yayinla(bilgi.currentTime, toplam);
        }
      });
  }

  function vimeoSurucusu(o, kap, tanim, sec) {
    var f = iframeOgesi(kap, sec);
    digeriniGizle(kap, f);
    var adres = guvenliAdres(tanim.gomme_adresi);
    adres.searchParams.set('api', '1');
    /* `player_id` sunucudan gelir (`dada-video-<kayıt>`); köprü iletileri onunla değil kaynak pencereyle ayırır. */
    if (!adres.searchParams.get('player_id')) adres.searchParams.set('player_id', 'dada-video-' + (++sayac));
    var koru = ayniGomme(f, adres, { api: '1' });
    var yontemler = { oynat: 'play', duraklat: 'pause', atla: 'setCurrentTime' };
    return kopruSurucusu(o, f, koru ? null : adres.toString(), VIMEO_KOKENI,
      { method: 'ping' },
      function (ad, deger) {
        return ad === 'atla' ? { method: yontemler[ad], value: deger } : { method: yontemler[ad] };
      },
      function (veri, hazirOl, gonder) {
        /* `ready` olayı ya da önceden yüklenmiş oynatıcının `ping` yanıtı. */
        if (veri.event === 'ready' || veri.method === 'ping') {
          gonder({ method: 'addEventListener', value: 'timeupdate' });
          hazirOl();
        }
        if (veri.event === 'timeupdate' && veri.data && typeof veri.data.seconds === 'number') {
          o._yayinla(veri.data.seconds, typeof veri.data.duration === 'number' ? veri.data.duration : null);
        }
      });
  }

  /* Bilinmeyen sağlayıcının gömmesi: kendi denetimleriyle düz iframe; sitenin denetimi yok. */
  function duzGommeSurucusu(o, kap, tanim, sec) {
    var f = iframeOgesi(kap, sec);
    digeriniGizle(kap, f);
    f.src = guvenliAdres(tanim.gomme_adresi).toString();
    return {
      zaman: false,
      oynat: function () { return false; },
      duraklat: function () { return false; },
      atla: function () { return false; },
      birak: function () { f.src = 'about:blank'; }
    };
  }

  function surucuKur(o, kap, tanim, sec) {
    if (tanim.tur === 'dosya') return dosyaSurucusu(o, kap, tanim);
    if (tanim.tur === 'akis') return akisSurucusu(o, kap, tanim);
    if (tanim.saglayici === 'youtube') return youtubeSurucusu(o, kap, tanim, sec);
    if (tanim.saglayici === 'vimeo') return vimeoSurucusu(o, kap, tanim, sec);
    return duzGommeSurucusu(o, kap, tanim, sec);
  }

  /* ── Oynatıcı nesnesi ── */

  function Oynatici(kap, tanim) {
    this.kap = kap;
    this.tanim = tanim;
    this.tur = tanim.tur;
    this.zamanKontroluVar = false;
    this.anlikSaniye = 0;
    this._aboneler = [];
    this._birakildi = false;
    this._surucu = null;
  }

  Oynatici.prototype._yayinla = function (saniye, toplam) {
    if (this._birakildi) return;
    this.anlikSaniye = saniye;
    var aboneler = this._aboneler.slice();
    for (var i = 0; i < aboneler.length; i++) {
      try { aboneler[i](saniye, toplam); } catch (e) { /* bir abonenin hatası ötekileri durdurmaz */ }
    }
  };

  Oynatici.prototype.anlikSureyeAbone = function (geriCagri) {
    var aboneler = this._aboneler;
    if (typeof geriCagri !== 'function') return function () {};
    aboneler.push(geriCagri);
    return function () {
      var i = aboneler.indexOf(geriCagri);
      if (i >= 0) aboneler.splice(i, 1);
    };
  };

  Oynatici.prototype.oynat = function () {
    return !this._birakildi && this._surucu.oynat();
  };

  Oynatici.prototype.duraklat = function () {
    return !this._birakildi && this._surucu.duraklat();
  };

  Oynatici.prototype.atla = function (saniye) {
    if (this._birakildi || !this.zamanKontroluVar) return false;
    var sn = Number(saniye);
    return this._surucu.atla(isFinite(sn) && sn > 0 ? sn : 0);
  };

  Oynatici.prototype.birak = function () {
    if (this._birakildi) return;
    this._birakildi = true;
    this._aboneler.length = 0;
    this._surucu.birak();
    if (etkinler && etkinler.get(this.kap) === this) etkinler.delete(this.kap);
  };

  function bagla(kap, tanim, sec) {
    if (!kap || !kap.querySelector) return null;
    tanim = tanim || oku(kap);
    if (!destekler(tanim)) return null;
    var onceki = etkinler ? etkinler.get(kap) : null;
    if (onceki) onceki.birak();
    var o = new Oynatici(kap, tanim);
    o._surucu = surucuKur(o, kap, tanim, sec || {});
    o.zamanKontroluVar = tanim.zaman_kontrolu === true && o._surucu.zaman === true;
    if (etkinler) etkinler.set(kap, o);
    return o;
  }

  kok.DadaVideoOynatici = { oku: oku, destekler: destekler, bagla: bagla };
})(window);
