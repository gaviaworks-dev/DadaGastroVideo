/* Porsiyon ölçeklemesinde birime göre yuvarlama — tarayıcı tarafı.
   Eşi `App\Support\Tarif\PorsiyonYuvarlama` (PHP). Kural tablosu tek:
   `config/porsiyon-yuvarlama.php`; sayfa onu `data-porsiyon-kurallari`
   JSON'u olarak basar, bu dosya yalnız algoritmadır. İki uygulama da
   `tests/Fixtures/porsiyon-yuvarlama.json` tablosuna karşı sınanır. */
(function (kok) {
  var PAY = 1e-9;
  function temiz(sayi) { return Math.round(sayi * 1e6) / 1e6; }
  /* C1 3. tur: `ayrac` kural tablosunun `ondalik`ı (yalnız çevrilmiş sayfada '.'); verilmezse virgül — TR aynen. */
  function bicim(sayi, ayrac) {
    sayi = temiz(sayi);
    var tam = Math.floor(sayi), kesir = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[temiz(sayi - tam)];
    /* 4. tur: noktalı (çevrilmiş) sayfada binlik virgül — "1,500"; TR'de ayırıcısız (eskisi gibi). */
    var binlik = function (t) { return ayrac === '.' ? String(t).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(t); };
    if (kesir) return (tam !== 0 ? binlik(tam) : '') + kesir;
    var s = sayi.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    var nokta = s.indexOf('.');
    s = nokta < 0 ? binlik(s) : binlik(s.slice(0, nokta)) + (ayrac || ',') + s.slice(nokta + 1);
    return s === '' ? '0' : s;
  }
  function kategori(k, birim, aciklama) {
    if (birim === null) {
      var anahtar = String(aciklama || '').trim().toLocaleLowerCase('tr');
      return Object.prototype.hasOwnProperty.call(k.aciklama_birimleri, anahtar) ? k.aciklama_birimleri[anahtar] : k.birimsiz;
    }
    return Object.prototype.hasOwnProperty.call(k.birimler, birim) ? k.birimler[birim] : k.bilinmeyen;
  }
  function adim(adimlar, deger) {
    for (var i = 0; i < adimlar.length; i++) {
      if (adimlar[i][0] === null || deger <= adimlar[i][0] + PAY) return adimlar[i][1];
    }
    return 1;
  }
  function hesapla(k, miktar, birim, baz, hedef, olceklenir, aciklama) {
    birim = birim === undefined || birim === null || String(birim).trim() === '' ? null : birim;
    var sabit = { deger: temiz(miktar), metin: bicim(miktar, k && k.ondalik), birim: birim };
    if (olceklenir === false || !(baz > 0) || !(hedef > 0) || Math.abs(hedef - baz) < PAY) return sabit;
    var kat = kategori(k, birim, aciklama);
    if (kat === 'olceklenmez') return sabit;
    var deger = miktar * hedef / baz, kural = k.kurallar[kat];
    if (kural.alt_sinir !== undefined && deger < kural.alt_sinir && kural.alt_birim && kural.alt_birim[birim]) {
      birim = kural.alt_birim[birim];
      deger *= kural.alt_carpan;
      kural = k.kurallar[k.birimler[birim]];
    }
    var a = adim(kural.adimlar, deger);
    var sonuc = Math.max(kural.en_az, Math.floor(deger / a + 0.5 + PAY) * a);
    return { deger: temiz(sonuc), metin: bicim(sonuc, k.ondalik), birim: birim };
  }
  function olceklenirMi(k, birim, metinler) {
    birim = birim === undefined || birim === null || String(birim).trim() === '' ? null : birim;
    if (kategori(k, birim, null) === 'olceklenmez') return false;
    var metin = (metinler || []).filter(Boolean).join(' ').toLocaleLowerCase('tr');
    return !k.olceklenmez_ifadeler.some(function (ifade) { return metin !== '' && metin.indexOf(ifade.toLocaleLowerCase('tr')) !== -1; });
  }
  kok.GastroPorsiyon = { hesapla: hesapla, bicim: bicim, olceklenirMi: olceklenirMi };
})(typeof window !== 'undefined' ? window : globalThis);
