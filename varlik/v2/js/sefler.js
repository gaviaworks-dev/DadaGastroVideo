/* Video Mutfağı V2 · Şefler dizini (izle ajanı) — "İsme göre ara" (donör /sefler form.sef-search) + hub'ın ortak süzgeci.
   Süzgeç (suzgec.js) mutfak/uzmanlık/sıralamayı uygular ve 'vd:suzgec' yayar; bu betik o sonucun ÜSTÜNE ada göre daraltır,
   sayı satırını ("N şef bulundu") ve boş durumu ona göre düzeltir. Arama adrese ?q= olarak yazılır (replaceState; tarayıcıya kayıt yok).
   "Temizle" düğmeleri aramayı da boşaltır. */
(function () {
  'use strict';
  var kok = document.querySelector('[data-vd-sefler]');
  if (!kok) return;
  var girdi = kok.querySelector('[data-vd-sef-ara] input[type=search]');
  var szKok = kok.querySelector('[data-vd-suzgec]');
  if (!girdi || !szKok) return;
  var kucuk = function (s) { return String(s || '').toLocaleLowerCase('tr-TR'); };
  var sayiEl = szKok.querySelector('[data-sz-sayi]');
  var bos = szKok.querySelector('[data-sz-bos]');
  var birim = szKok.getAttribute('data-birim') || 'şef';

  function adreseYaz() {
    var u = new URL(location.href), q = girdi.value.trim();
    if (q) u.searchParams.set('q', q); else u.searchParams.delete('q');
    var s = u.searchParams.toString().replace(/%2C/g, ',');
    history.replaceState(history.state, '', u.pathname + (s ? '?' + s : '') + u.hash);
  }
  // süzgecin sonucunun üstüne ada göre daralt (süzgeç her çizimde öğeleri yeniden açar; bu dinleyici ardından koşar)
  szKok.addEventListener('vd:suzgec', function () {
    var q = kucuk(girdi.value.trim()), n = 0;
    szKok.querySelectorAll('[data-sz-oge]').forEach(function (k) {
      if (k.hidden) return;
      var e = !q || kucuk(k.getAttribute('data-ad')).indexOf(q) !== -1;
      if (!e) k.hidden = true; else n++;
    });
    if (sayiEl) sayiEl.textContent = n.toLocaleString('tr-TR') + ' ' + birim;
    if (bos) bos.hidden = n !== 0;
  });
  function uygula() { adreseYaz(); var a = window.vdSuzgec && window.vdSuzgec.al(szKok); if (a) a.uygula(); }
  girdi.addEventListener('input', uygula);
  // Temizle: aramayı da boşalt (yakalama evresinde, süzgecin kendi temizlemesinden önce)
  kok.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-sz-temizle]')) { girdi.value = ''; adreseYaz(); } }, true);
  var ilk = new URLSearchParams(location.search).get('q');
  if (ilk) girdi.value = ilk; // süzgeç DOMContentLoaded'da ilk çizimi yapar; dinleyici o zaman aramayı da uygular
})();
