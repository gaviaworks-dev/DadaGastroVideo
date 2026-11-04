/* Video Mutfağı prototipi · "Reklamlı görünüm" (reklam ajanı). Sözleşme: tasks/reklam-durum.md
 *
 * ?reklam=1 → html.vd-reklamli: modül CSS'i yüklenir, her [data-vd-reklam] kabının <template>'i açılır ve kap görünür.
 * Kapalıyken kaplar `hidden` ve boştur (modül işaretlemesi DOM'da yok). Anahtar (button[data-vd-reklam-anahtari]) adresi
 * history.replaceState ile değiştirir; reklamlı görünümde sayfadaki bütün iç bağlar (*.html) reklam=1 taşır. Tarayıcı deposuna HİÇBİR ŞEY yazılmaz.
 *
 * Modülün JS'i (public/reklam/reklam.js, standart.js) yüklenmez — sayım ve sıklık için sunucuya POST eder ve oturum deposuna yazar.
 * Aynı kurallar burada (standart.js'ten, karar 149.2 · Y5):
 *   · side çifti: yalnız ≥1280 px; >1366'da iki yan, değilse yalnız sağ; 120 px, kenardan 8 px; üst = başlık altı + 24; yükseklik eski alt kenara
 *     kadar (≥360); hero (main [data-rk-hero]) başlık çizgisini geçmeden ve altbilgi görünürken gizli (sideLayout · sidePairGeometry)
 *   · alt sabit bar: içerik kolonu hizasında; mobilde .bottom-nav'ın 12 px üstünde (alignAltbar); sabit eylem şeridi (.rd-actbar, #actbar) varsa yok
 *   · ikisi aynı anda (karar 149.2 "independent"); kapat düğmesi o sayfada kapatır; tam ekran katman açıkken (pişirme modu, kısa video, tam ekran
 *     oynatıcı) hepsi gizli — modülün #cookmode kuralı
 *   · videolu banner: sessiz, posterli, döngü; görünürken (≥%50) oynar, değilken durur; reduced-motion'da kendiliğinden oynamaz; oynat/ses düğmeleri
 * Prototip ekleri: sabit öğeler içerik örtmesin diye gövdeye alt boşluk; eşlik kartının "Listeye ekle"si bellekte; "Sipariş Et" penceresi. */
(() => {
  const d = document, w = window, kok = d.documentElement;
  const MODUL_CSS = ['varlik/gastro/reklam/reklam.css', 'varlik/gastro/reklam/standart.css', 'varlik/gastro/reklam/yayilim.css', 'varlik/video/reklam/kreatif.css'];
  const PARAM = 'reklam';
  let acik = false, iptal = null, gozcu = null, cssSozu = null;

  /* ---------- adres ---------- */
  const icBagMi = (href) => !!href && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href) && /^[^?#]*\.html(?:[?#]|$)/i.test(href);
  function bagCevir(a, ac) {
    const ham = a.getAttribute('href'); if (!icBagMi(ham)) return;
    const [onu, hash = ''] = ham.split('#'); const [yol, sorgu = ''] = onu.split('?');
    const q = new URLSearchParams(sorgu); if (ac) q.set(PARAM, '1'); else q.delete(PARAM);
    const s = q.toString(); const yeni = yol + (s ? '?' + s : '') + (hash ? '#' + hash : '');
    if (yeni !== ham) a.setAttribute('href', yeni);
  }
  const baglariCevir = (kapsam, ac) => kapsam.querySelectorAll?.('a[href], area[href]').forEach((a) => bagCevir(a, ac));
  function adresYaz(ac) {
    const u = new URL(w.location.href); if (ac) u.searchParams.set(PARAM, '1'); else u.searchParams.delete(PARAM);
    w.history.replaceState(w.history.state, '', u.pathname + u.search + u.hash);
  }

  /* ---------- modül CSS (yalnız reklamlı görünümde) ---------- */
  function cssYukle() {
    if (cssSozu) return cssSozu;
    cssSozu = Promise.all(MODUL_CSS.map((h) => new Promise((tamam) => {
      const l = d.createElement('link'); l.rel = 'stylesheet'; l.href = h; l.dataset.vdReklamCss = '';
      l.onload = l.onerror = () => tamam(); d.head.appendChild(l);
    })));
    return cssSozu;
  }

  /* ---------- kaplar ---------- */
  const kaplar = () => [...d.querySelectorAll('[data-vd-reklam]')];
  function doldur(k) {
    const t = k.querySelector(':scope > template');
    if (t && !k.querySelector(':scope > :not(template)')) k.appendChild(t.content.cloneNode(true));
    baglariCevir(k, true);
    k.hidden = false;
  }
  function bosalt(k) {
    if (k.querySelector(':scope > template')) k.querySelectorAll(':scope > :not(template)').forEach((n) => n.remove());
    k.hidden = true;
  }

  /* ---------- kelime sınırında kırpma (Revize 1: kelime ortasından kesme yok) ----------
     Modülün CSS'i bu öğelerde text-overflow: ellipsis / -webkit-line-clamp kullanır (harf ortasından keser). Her öğeye o genişlikteki
     kipine göre data-vd-kirp yazılır (nowrap → 1 satır, line-clamp N → N satır, kısıt yoksa 9 = tam metin) ve hub'ın kırpıcısı
     (video.js VD.kirp) kelime sınırında kısaltır; genişlik değişince (kip değişebilir: masaüstü tek satır, mobil iki satır) yeniden. */
  const KIRP = '.rk-kart .r-body h4, .rk-kart-metin, .rk-serit-metin > b, .rk-serit-metin > span, .rk-std-yazi > b, .rk-std-yazi > p, .eslik-kart-ad, .eslik-kart-bilgi > span > span';
  function kirpAyarla(kok) {
    if (!acik || !w.VD || typeof w.VD.kirp !== 'function') return;
    (kok || d).querySelectorAll(`[data-vd-reklam] :is(${KIRP})`).forEach((el) => {
      if (!el.getClientRects().length) return;
      const cs = getComputedStyle(el); const clamp = parseInt(cs.webkitLineClamp || cs.getPropertyValue('-webkit-line-clamp'), 10);
      const n = cs.whiteSpace === 'nowrap' ? 1 : clamp > 0 ? clamp : 9;
      if (el.getAttribute('data-vd-kirp') !== String(n)) el.setAttribute('data-vd-kirp', String(n));
    });
    w.VD.kirp(kok || d);
  }

  /* ---------- standart katman ---------- */
  const gorunur = (n) => !!n && !n.closest('[hidden]') && (n.checkVisibility ? n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : n.getClientRects().length > 0);
  const kapatilan = new Set();
  function tamEkranAcik() {
    return [...d.querySelectorAll('#cookmode, #vdPisirme, .vd-pisirme, .vd-dikey--katman, .vd-oyn--tam')].some((n) => !n.hidden && gorunur(n) && n.getBoundingClientRect().height > w.innerHeight * 0.6)
      || !!d.fullscreenElement;
  }
  function baslikAlti() {
    let alt = 0;
    d.querySelectorAll('header.header, .topbar, .vd-ust').forEach((n) => { const r = n.getBoundingClientRect(); if (r.height && r.top < 200 && r.bottom > 0) alt = Math.max(alt, r.bottom); });
    return alt;
  }
  function icerikKolonu() {
    let sol = w.innerWidth, sag = 0;
    d.querySelectorAll('main .wrap, main > .container').forEach((n) => { const r = n.getBoundingClientRect(), s = getComputedStyle(n); if (r.width > 600) { sol = Math.min(sol, r.left + parseFloat(s.paddingLeft || 0)); sag = Math.max(sag, r.right - parseFloat(s.paddingRight || 0)); } });
    return { sol, sag };
  }
  function sideYerlesim(cift) {
    const ret = (neden) => { cift.dataset.rkSideReason = neden; cift.dataset.rkSideVariant = 'yok'; return false; };
    if (w.innerWidth < 1280) return ret('120 px side için içerik dışında yeterli yan alan yok');
    const { sag } = icerikKolonu(); if (sag === 0) return ret('içerik kolonu ölçülemedi');
    const ust = baslikAlti();
    // visibleFooterTop: sabit (perde) altbilgide görünür üst kenar içeriğin bittiği yerdir
    const altbilgi = d.querySelector('footer.footer, body > footer'); let ft = altbilgi ? altbilgi.getBoundingClientRect().top : Infinity;
    if (altbilgi && getComputedStyle(altbilgi).position === 'fixed') ft = Math.max(ft, d.querySelector('main')?.getBoundingClientRect().bottom ?? Infinity);
    if (ft < w.innerHeight) return ret('footer görünür');
    const hero = d.querySelector('main [data-rk-hero]');
    if (hero) { const hb = hero.getBoundingClientRect().bottom; if (w.scrollY === 0 || hb > ust) return ret('hero header çizgisini geçmedi'); }
    const top = ust + 24, eskiAlt = ust + (w.innerHeight - ust - 600) / 2 + 600, yuk = Math.round(eskiAlt - top);
    if (yuk < 360) return ret('side için dikey alan yok');
    const iki = w.innerWidth > 1366 && cift.querySelectorAll('.rk-std-side').length > 1;
    cift.style.setProperty('--rk-side-inset', '8px'); cift.style.setProperty('--rk-side-top', top + 'px');
    cift.style.setProperty('--rk-side-width', '120px'); cift.style.setProperty('--rk-side-height', yuk + 'px');
    cift.dataset.rkSideCount = iki ? '2' : '1'; cift.dataset.rkSideVariant = iki ? `iki taraf 120×${yuk}` : `sağ 120×${yuk}`; cift.dataset.rkSideReason = cift.dataset.rkSideVariant;
    return true;
  }
  function altbarHizala(bar) {
    const wrap = d.querySelector('header .h-top .wrap') || [...d.querySelectorAll('main .wrap')].filter((n) => n.getBoundingClientRect().width > 250).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    if (wrap) { const r = wrap.getBoundingClientRect(), s = getComputedStyle(wrap); bar.style.setProperty('--rk-alt-left', r.left + parseFloat(s.paddingLeft) + 'px'); bar.style.setProperty('--rk-alt-width', r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) + 'px'); }
    const nav = d.querySelector('.bottom-nav'); let bosluk = 12;
    if (nav && getComputedStyle(nav).display !== 'none') { const ust = Math.min(...[nav, ...nav.querySelectorAll('*')].map((n) => n.getBoundingClientRect()).filter((r) => r.width && r.height).map((r) => r.top)); if (Number.isFinite(ust)) bosluk = Math.max(12, w.innerHeight - ust + 12); }
    bar.style.bottom = bosluk + 'px';
    return bosluk;
  }
  function standartGuncelle() {
    const katman = d.querySelector('[data-vd-reklam="STD"] [data-rk-standart]'); if (!katman) { kok.style.removeProperty('--vd-rk-alt-bosluk'); return; }
    const engel = tamEkranAcik() || d.visibilityState !== 'visible';
    const cift = katman.querySelector('[data-rk-side-pair]');
    if (cift) {
      const sideAcik = !engel && !kapatilan.has('side') && sideYerlesim(cift);
      const yanlar = [...cift.querySelectorAll('.rk-std-side')];
      yanlar.forEach((n, i) => { n.hidden = !sideAcik || (cift.dataset.rkSideCount === '1' && i < yanlar.length - 1); });
    }
    const bar = katman.querySelector('.rk-std-altbar');
    if (bar) {
      // prototip eki: sabit (perde) altbilgi göründüğünde bar onu örtmesin diye gizlenir — side'ın "footer görünür" kuralı (karar R10)
      const ftr = d.querySelector('footer.footer, body > footer'); let ft = ftr ? ftr.getBoundingClientRect().top : Infinity;
      if (ftr && getComputedStyle(ftr).position === 'fixed') ft = Math.max(ft, d.querySelector('main')?.getBoundingClientRect().bottom ?? Infinity);
      // prototip eki (R15): ilk ekranda hero/oynatıcının üstüne binmesin — side'ın hero kapısıyla aynı (hero başlık çizgisini geçince)
      const hero = d.querySelector('main [data-rk-hero]');
      const heroGecti = !hero || (w.scrollY > 0 && hero.getBoundingClientRect().bottom <= baslikAlti());
      const izin = !engel && !kapatilan.has('altbar') && !d.querySelector('.rd-actbar, #actbar') && ft >= w.innerHeight - 1 && heroGecti;
      bar.hidden = !izin;
      if (izin) { const b = altbarHizala(bar); kok.style.setProperty('--vd-rk-alt-bosluk', Math.ceil(bar.getBoundingClientRect().height + b + 12) + 'px'); }
      else kok.style.removeProperty('--vd-rk-alt-bosluk');
    }
  }

  /* ---------- videolu banner ---------- */
  function videoKur(sar, sinyal) {
    const v = sar.querySelector('video'); if (!v) return;
    const oynat = sar.querySelector('.rk-std-oynat'), ses = sar.querySelector('.rk-std-ses'), yedek = sar.querySelector('.rk-video-baslat');
    const azHareket = w.matchMedia('(prefers-reduced-motion: reduce)');
    let gorusde = false, kullaniciDurdurdu = false, acikca = false;
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true;
    const uygun = () => acik && !sar.closest('[hidden]') && d.visibilityState === 'visible' && !tamEkranAcik();
    const baslat = async (elle = false) => {
      if (!uygun() || !v.paused) return;
      if (!elle && (kullaniciDurdurdu || (azHareket.matches && !acikca))) return;
      if (elle) { kullaniciDurdurdu = false; acikca = true; }
      if (!v.getAttribute('src')) v.src = v.dataset.rkSrc || v.dataset.vdRkSrc;
      try { await v.play(); sar.dataset.rkVideoBlocked = '0'; if (yedek) yedek.hidden = true; } catch (h) { if (h.name !== 'AbortError') { sar.dataset.rkVideoBlocked = '1'; if (yedek) yedek.hidden = false; } }
    };
    const esitle = () => { if (!uygun() || !gorusde) { v.pause(); return; } baslat(); };
    oynat?.addEventListener('click', () => { if (v.paused) baslat(true); else { kullaniciDurdurdu = true; v.pause(); } }, { signal: sinyal });
    yedek?.addEventListener('click', () => baslat(true), { signal: sinyal });
    v.addEventListener('play', () => { if (oynat) { oynat.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>'; oynat.setAttribute('aria-label', 'Videoyu duraklat'); } }, { signal: sinyal });
    v.addEventListener('pause', () => { if (oynat) { oynat.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>'; oynat.setAttribute('aria-label', 'Videoyu oynat'); } }, { signal: sinyal });
    ses?.addEventListener('click', () => { v.muted = !v.muted; ses.innerHTML = `<i class="fa-solid ${v.muted ? 'fa-volume-xmark' : 'fa-volume-high'}" aria-hidden="true"></i>`; ses.setAttribute('aria-label', v.muted ? 'Sesi aç' : 'Sesi kapat'); ses.setAttribute('aria-pressed', String(!v.muted)); }, { signal: sinyal });
    const g = new IntersectionObserver((e) => { for (const x of e) gorusde = x.isIntersecting && x.intersectionRatio >= 0.5; esitle(); }, { threshold: [0, 0.5] });
    g.observe(sar); sinyal.addEventListener('abort', () => { g.disconnect(); v.pause(); v.removeAttribute('src'); v.load(); });
    d.addEventListener('visibilitychange', esitle, { signal: sinyal });
  }

  /* ---------- kısa bildirim (Gastro'nun .toast'u varsa o; yoksa canlı bölge) ---------- */
  function bildir(metin) {
    let b = d.querySelector('[data-vd-rk-bildirim]');
    if (!b) { b = d.createElement('div'); b.className = 'vd-rk-bildirim'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); b.dataset.vdRkBildirim = ''; d.body.appendChild(b); }
    b.textContent = metin; b.hidden = false; clearTimeout(b._z); b._z = setTimeout(() => { b.hidden = true; }, 2600);
  }

  /* ---------- etkileşimler (yalnız açıkken) ---------- */
  function etkilesimKur(sinyal) {
    // videolu banner (modül) + kısa video akışındaki sponsorlu öğe (aynı kural: sessiz, posterli, görünürken)
    d.querySelectorAll('[data-vd-reklam] [data-rk-video], [data-vd-reklam] [data-native-sponsor]').forEach((s) => videoKur(s, sinyal));
    d.addEventListener('click', (e) => {
      const kapat = e.target.closest('[data-vd-reklam="STD"] .rk-std-kapat');
      if (kapat) { const n = kapat.closest('[data-rk-bicim]'); kapatilan.add(n.dataset.rkBicim); standartGuncelle(); return; }
      const liste = e.target.closest('[data-vd-rk-liste]');
      if (liste) { e.preventDefault(); const eklendi = liste.getAttribute('aria-pressed') !== 'true'; liste.setAttribute('aria-pressed', String(eklendi)); liste.classList.toggle('vd-rk-eklendi', eklendi); bildir(eklendi ? `${liste.dataset.vdRkListe} alışveriş listesine eklendi (prototip örneği · sayfa açıkken)` : `${liste.dataset.vdRkListe} listeden çıkarıldı`); return; }
      const sip = e.target.closest('[data-vd-reklam] [data-rk-siparis-ac]');
      if (sip) { const dl = d.getElementById(sip.getAttribute('aria-controls')); if (dl?.showModal) { dl.showModal(); sip.setAttribute('aria-expanded', 'true'); dl.addEventListener('close', () => sip.setAttribute('aria-expanded', 'false'), { once: true }); } return; }
      const sk = e.target.closest('[data-vd-reklam] [data-rk-siparis-kapat]');
      if (sk) { sk.closest('dialog')?.close(); return; }
      const dlg = e.target.closest('[data-vd-reklam] dialog.rk-siparis-kart');
      if (dlg && e.target === dlg) dlg.close();
    }, { signal: sinyal });
    d.querySelectorAll('[data-vd-reklam] form[data-vd-rk-form]').forEach((f) => f.addEventListener('submit', (e) => e.preventDefault(), { signal: sinyal }));
    let bekle = 0; const plan = () => { cancelAnimationFrame(bekle); bekle = requestAnimationFrame(() => { const once = kaplar().map((k) => k.querySelectorAll('[hidden]').length).join(); standartGuncelle(); if (kaplar().map((k) => k.querySelectorAll('[hidden]').length).join() !== once) kirpAyarla(); }); };
    let kz = 0; w.addEventListener('resize', () => { clearTimeout(kz); kz = setTimeout(() => kirpAyarla(), 120); }, { signal: sinyal });
    w.addEventListener('scroll', plan, { passive: true, signal: sinyal }); w.addEventListener('resize', plan, { signal: sinyal });
    d.addEventListener('visibilitychange', plan, { signal: sinyal }); d.addEventListener('fullscreenchange', plan, { signal: sinyal });
    d.addEventListener('transitionend', plan, { signal: sinyal }); // .bottom-nav ve başlık kaydırmada kayarak gizlenip açılır (modül: transitionend)
    const izle = new MutationObserver(plan); // tam ekran katmanlar (pişirme modu, kısa video, oynatıcı) hidden/class değiştirir
    d.querySelectorAll('#cookmode, #vdPisirme, .vd-pisirme, .vd-dikey--katman, .vd-oyn').forEach((n) => izle.observe(n, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] }));
    sinyal.addEventListener('abort', () => izle.disconnect());
    // altbilgi / hero geçişleri için (modül: observeSideVisibility)
    if (w.IntersectionObserver) { const io = new IntersectionObserver(plan); [d.querySelector('main [data-rk-hero]'), d.querySelector('footer.footer, body > footer')].filter(Boolean).forEach((n) => io.observe(n)); sinyal.addEventListener('abort', () => io.disconnect()); }
    standartGuncelle(); setTimeout(standartGuncelle, 400);
  }

  /* ---------- aç / kapat ---------- */
  async function ac() {
    acik = true; kok.classList.add('vd-reklamli-yukleniyor');
    await cssYukle(); if (!acik) return;
    kok.classList.remove('vd-reklamli-yukleniyor'); kok.classList.add('vd-reklamli');
    kaplar().forEach(doldur);
    baglariCevir(d, true);
    requestAnimationFrame(() => kirpAyarla()); (d.fonts?.ready || Promise.resolve()).then(() => kirpAyarla());
    gozcu = new MutationObserver((ml) => { for (const m of ml) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches('a[href]')) bagCevir(n, true); baglariCevir(n, true); } });
    gozcu.observe(d.body, { childList: true, subtree: true });
    iptal = new AbortController(); kapatilan.clear(); etkilesimKur(iptal.signal);
    anahtarYaz(); w.dispatchEvent(new CustomEvent('vd:reklam', { detail: { acik: true } }));
  }
  function kapat() {
    acik = false; iptal?.abort(); iptal = null; gozcu?.disconnect(); gozcu = null;
    kaplar().forEach(bosalt); baglariCevir(d, false);
    kok.classList.remove('vd-reklamli', 'vd-reklamli-yukleniyor'); kok.style.removeProperty('--vd-rk-alt-bosluk');
    d.querySelector('[data-vd-rk-bildirim]')?.setAttribute('hidden', '');
    anahtarYaz(); w.dispatchEvent(new CustomEvent('vd:reklam', { detail: { acik: false } }));
  }
  function anahtarYaz() {
    d.querySelectorAll('[data-vd-reklam-anahtari]').forEach((b) => { b.setAttribute('aria-pressed', String(acik)); b.classList.toggle('active', acik); });
  }
  d.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vd-reklam-anahtari]'); if (!b) return;
    e.preventDefault(); const yeni = !acik; adresYaz(yeni); if (yeni) ac(); else kapat();
  });

  w.vdReklam = { acik: () => acik, guncelle: () => { if (acik) { standartGuncelle(); kirpAyarla(); } } };
  const basla = () => { kaplar().forEach((k) => { k.hidden = true; }); if (new URLSearchParams(w.location.search).get(PARAM) === '1') ac(); else anahtarYaz(); };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', basla); else basla();
})();
