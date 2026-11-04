/* DadaGastro: ekran kabuğundan ayrı, aynı veriden üretilen baskı belgesi. */
(function (kok) {
  'use strict';
  /* Aşama 2 · baskı belgesinin sabit başlıkları ve dili sayfanın dilinden: sunucu yalnız çevrilmiş dilde
     `[data-l-js]` sözlüğünü basar; yoksa (TR sayfa, modül testi) Türkçe. */
  function L(ad, tr) {
    var d0 = kok && kok.document, kap = d0 && d0.querySelector && d0.querySelector('[data-l-js]'), s0 = null;
    if (kap) { try { s0 = JSON.parse(kap.getAttribute('data-l-js')); } catch (e) { s0 = null; } }
    return (s0 && s0[ad]) || tr;
  }
  /* Parametreli: çevrilmiş metindeki :ad yer tutucularını p doldurur; çeviri yoksa TR yedeği AYNEN döner. */
  function Ls(ad, tr, p) {
    var s = L(ad, null);
    if (typeof s !== 'string') return tr;
    return s.replace(/:([a-z_]+)/g, function (m, a) { return p && Object.prototype.hasOwnProperty.call(p, a) ? String(p[a]) : m; });
  }
  function belgeDili() { return (kok && kok.document && kok.document.documentElement && kok.document.documentElement.lang) || 'tr'; }
  function kacir(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function dosyaAdi(ad, tarih) {
    return 'dadagastro-' + String(ad).toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100) + '-' + tarih;
  }
  function alisverisModeli(depo) {
    var liste = depo.etkinListe();
    if (!liste) return null;
    var kalemler = depo.liste(), gruplar = [];
    (depo.REYONLAR || []).forEach(function (r) {
      var satirlar = kalemler.filter(function (k) { return k.reyon === r.k; }).map(function (k) { return [k.alindi ? '☑' : '☐', k.ad, k.miktar || L("print.unspecified", 'Belirtilmedi')]; });
      if (satirlar.length) gruplar.push({ baslik:r.ad, duzen:'alisveris', kolonlar:[L("print.shop_bought", 'Alındı'), L("print.ingredient", 'Malzeme'), L("print.amount", 'Miktar')], satirlar:satirlar });
    });
    var diger = kalemler.filter(function (k) { return !(depo.REYONLAR || []).some(function (r) { return r.k === k.reyon; }); });
    if (diger.length) gruplar.push({ baslik:L("print.shop_other", 'Diğer'), duzen:'alisveris', kolonlar:[L("print.shop_bought", 'Alındı'), L("print.ingredient", 'Malzeme'), L("print.amount", 'Miktar')], satirlar:diger.map(function (k) { return [k.alindi ? '☑' : '☐', k.ad, k.miktar || L("print.unspecified", 'Belirtilmedi')]; }) });
    var alinan = kalemler.filter(function (k) { return k.alindi; }).length;
    return { baslik:liste.ad, tur:L("print.shop_list", 'Alışveriş listesi'), ozet:Ls("print.shop_summary", kalemler.length + ' malzeme · ' + alinan + ' alındı', { toplam:kalemler.length, alinan:alinan }), bolumler:gruplar };
  }
  function tarifModeli(tarif) {
    var bolumler = [];
    tarif.malzemeler.forEach(function (m) {
      var ad = m.grup || L('print.ingredients', 'Malzemeler'), son = bolumler[bolumler.length - 1];
      if (!son || son.baslik !== ad) { son = { baslik:ad, kolonlar:[L('print.ingredient', 'Malzeme'), L('print.amount', 'Miktar')], satirlar:[] }; bolumler.push(son); }
      son.satirlar.push([m.ad, m.miktar || L('print.unspecified', 'Belirtilmedi')]);
    });
    tarif.adimlar.forEach(function (a, i) { bolumler.push({ baslik:(i+1)+'. '+(a.baslik || L('print.method', 'Hazırlanış'))+(a.sure ? ' · '+a.sure : ''), paragraflar:[a.metin] }); });
    if (tarif.alerjen) bolumler.push({ baslik:L('print.allergen', 'Alerjen notu'), paragraflar:[tarif.alerjen] });
    if (tarif.hatirlatma) bolumler.push({ baslik:L('print.reminder', 'Hatırlatma'), paragraflar:[tarif.hatirlatma] });
    return { baslik:tarif.baslik, tur:L('print.recipe', 'Tarif'), ozet:[tarif.porsiyon].concat(tarif.metalar || []).join(' · ')+(tarif.ozet ? '\n'+tarif.ozet : ''), bolumler:bolumler };
  }
  function faturaModeli(b) {
    var bolumler = [
      { baslik:L("uye_sef.js.belge.bilgiler", 'Belge bilgileri'), kolonlar:[L("uye_sef.js.belge.alan", 'Alan'), L("uye_sef.js.belge.deger", 'Değer')], satirlar:b.kunye.map(function (k) { return [k.etiket, k.deger+(k.alt ? ' — '+k.alt : '')]; }) },
      { baslik:L("uye_sef.js.belge.satici", 'Satıcı'), paragraflar:[b.satici.unvan].concat(b.satici.satirlar) },
      { baslik:L("uye_sef.js.belge.alici", 'Alıcı'), paragraflar:[b.alici.ad].concat(b.alici.satirlar) },
      { baslik:L("uye_sef.js.belge.kalemler", 'Fatura kalemleri'), duzen:'fatura', kolonlar:[L("uye_sef.js.belge.aciklama", 'Açıklama'), L("uye_sef.js.belge.miktar", 'Miktar'), L("uye_sef.js.belge.birim_fiyat", 'Birim fiyat'), L("uye_sef.js.belge.kdv", 'KDV'), L("uye_sef.js.belge.tutar", 'Tutar')], satirlar:b.kalemler.map(function (k) { return [k.aciklama,k.adet,k.birim,Ls("uye_sef.js.belge.kdv_payi", '%'+k.kdvOrani+' ('+k.kdvPayi+')', { oran:k.kdvOrani, pay:k.kdvPayi }),k.tutar]; }) },
      { baslik:L("uye_sef.js.belge.toplam", 'Toplam'), kolonlar:[L("uye_sef.js.belge.aciklama", 'Açıklama'), L("uye_sef.js.belge.tutar", 'Tutar')], satirlar:[[L("uye_sef.js.belge.ara_toplam", 'Ara toplam'),b.toplam.ara],[b.toplam.kdvEtiket,b.toplam.kdv],[L("uye_sef.js.belge.genel_toplam", 'Genel toplam'),b.toplam.genel]] }
    ];
    if (b.ode) bolumler.push({ baslik:L("uye_sef.js.belge.tahsilat", 'Tahsilat'), paragraflar:[b.ode.baslik, b.ode.alt] });
    return {baslik:b.no, tur:L("uye_sef.js.belge.tur", 'Fatura dökümü'), ozet:b.konu, bolumler:bolumler};
  }
  function bagimsizHtml(m, tarih, tokenlar, css, svg) {
    var logo = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    var stil = tokenlar+'\n'+css.replace(/@import[^;]+;/g,'').replace('@media print', '@media all');
    return '<!doctype html><html lang="' + kacir(belgeDili()) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+kacir(dosyaAdi(m.baslik,tarih))+'</title><style>'+stil+'\nhtml{font-family:system-ui,sans-serif} .gastro-belge{box-sizing:border-box;max-width:210mm;padding:var(--bosluk-24)} @media print{.gastro-belge{max-width:none;padding:0}}</style></head><body data-gastro-belge><article class="gastro-belge">'+belgeHtml(m,tarih,logo)+'</article></body></html>';
  }
  function belgeHtml(m, tarih, logo) {
    logo = kacir(logo || '/kanon/varlik/dadagastro-kelime.svg');
    return '<img class="gb-suizi" src="' + logo + '" alt="" aria-hidden="true">' +
      '<header class="gb-baslik"><img src="' + logo + '" alt="DadaGastro"><p>' + kacir(m.tur) + ' · ' + kacir(tarih) + '</p><h1>' + kacir(m.baslik) + '</h1><p>' + kacir(m.ozet) + '</p></header>' +
      m.bolumler.map(function (b) {
        return '<section class="gb-bolum">' + (b.kolonlar ? '<table>' + (b.duzen === 'fatura' ? '<colgroup><col class="gb-fatura-aciklama"><col class="gb-fatura-adet"><col><col><col></colgroup>' : b.duzen === 'alisveris' ? '<colgroup><col class="gb-isaret"><col><col></colgroup>' : '') + '<thead><tr><th class="gb-grup" colspan="' + b.kolonlar.length + '">' + kacir(b.baslik) + '</th></tr><tr>' + b.kolonlar.map(function (c) { return '<th scope="col">'+kacir(c)+'</th>'; }).join('') + '</tr></thead><tbody>' + b.satirlar.map(function (s) { return '<tr>' + s.map(function (c) { return '<td>'+kacir(c)+'</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '<h2>'+kacir(b.baslik)+'</h2>'+ (b.paragraflar || []).map(function (p) { return '<p>'+kacir(p).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')+'</p>'; }).join('')) + '</section>';
      }).join('');
  }
  var api = { faturaModeli:faturaModeli, bagimsizHtml:bagimsizHtml, alisverisModeli:alisverisModeli, tarifModeli:tarifModeli, belgeHtml:belgeHtml, dosyaAdi:dosyaAdi };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!kok || !kok.document) return;
  var d = kok.document, oncekiBaslik = null;
  function metin(el) { return el ? el.textContent.replace(/\u00AD/g,'').replace(/\s+/g,' ').trim() : ''; }
  function tarifOku() {
    var grup = '', malzemeler = [];
    d.querySelectorAll('#ingList > li').forEach(function (e) {
      if (e.classList.contains('ing-group')) { grup=metin(e); return; }
      if (!e.classList.contains('ing-row')) return;
      malzemeler.push({ grup:grup, ad:metin(e.querySelector('.in')), miktar:metin(e.querySelector('.iq')) });
    });
    var birim = d.getElementById('servVal');
    return tarifModeli({ baslik:metin(d.querySelector('.print-head .ph-baslik, .print-head h1')), ozet:Array.from(d.querySelectorAll('.rd-sub')).map(metin).join('\n\n'),
      porsiyon:metin(d.getElementById('ingServEcho'))+' '+(birim ? birim.getAttribute('data-portion-unit') || '' : ''),
      metalar:Array.from(d.querySelectorAll('.ph-meta > span')).slice(1).map(metin), malzemeler:malzemeler,
      adimlar:Array.from(d.querySelectorAll('.steps-flow > .step-card')).map(function (e) { return { baslik:metin(e.querySelector('h3')), sure:metin(e.querySelector('.step-time')), metin:metin(e.querySelector('.step-card__body > p')) }; }),
      alerjen:metin(d.querySelector('[data-tarif-alerjen-notu] .rb-body p')),
      hatirlatma:metin(d.querySelector('.remind-box:not([data-tarif-alerjen-notu]) .rb-body p')) });
  }
  function model() {
    var fatura = api.faturaKaynak ? api.faturaKaynak() : null;
    if (fatura) return faturaModeli(fatura);
    if (d.querySelector('.ing-panel') && d.querySelector('.print-head .ph-baslik, .print-head h1')) return tarifOku();
    var pano = d.getElementById('menulerim-pane-alisveris');
    if (pano && !pano.hidden && kok.dmDepo) return alisverisModeli(kok.dmDepo);
    return null;
  }
  function hazirla() {
    var m = model(); if (!m) return;
    var bugun = new Date(), tarih = bugun.getFullYear()+'-'+String(bugun.getMonth()+1).padStart(2,'0')+'-'+String(bugun.getDate()).padStart(2,'0');
    var belge = d.getElementById('gastroBelge');
    if (!belge) { belge = d.createElement('article'); belge.id='gastroBelge'; belge.className='gastro-belge'; d.body.appendChild(belge); }
    belge.innerHTML = belgeHtml(m, tarih);
    if (oncekiBaslik === null) oncekiBaslik = d.title;
    d.title = dosyaAdi(m.baslik, tarih);
    d.body.setAttribute('data-gastro-belge','');
  }
  function tarih() {
    var b = new Date(); return b.getFullYear()+'-'+String(b.getMonth()+1).padStart(2,'0')+'-'+String(b.getDate()).padStart(2,'0');
  }
  api.indir = async function (m) {
    async function oku(yol) { var r=await kok.fetch(yol); if(!r.ok) throw new Error(L("uye_sef.js.belge.varlik_okunamadi", 'Belge varlığı okunamadı')); return r.text(); }
    var stilBag = d.querySelector('link[href*="/f4/gastro-belge.css"]');
    var varliklar = await Promise.all([oku('/kanon/tokenlar.css'),oku(stilBag ? stilBag.href : '/f4/gastro-belge.css'),oku('/kanon/varlik/dadagastro-kelime.svg')]);
    var ad = dosyaAdi(m.baslik,tarih())+'.html';
    var url = kok.URL.createObjectURL(new Blob([bagimsizHtml(m,tarih(),varliklar[0],varliklar[1],varliklar[2])],{type:'text/html;charset=utf-8'}));
    var a=d.createElement('a'); a.href=url; a.download=ad; d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){kok.URL.revokeObjectURL(url);},4000);
    return ad;
  };
  kok.addEventListener('beforeprint', hazirla);
  kok.addEventListener('afterprint', function () { d.body.removeAttribute('data-gastro-belge'); if (oncekiBaslik !== null) d.title=oncekiBaslik; oncekiBaslik=null; });
  kok.DadaGastroBelge = api;
})(typeof window === 'undefined' ? null : window);
